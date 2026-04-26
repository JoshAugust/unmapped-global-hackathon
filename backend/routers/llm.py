"""
LLM-powered endpoints for skills parsing, follow-up questions, and risk narratives.

Router prefix: /api/skills
"""

import json
import logging
import pathlib
import re
from typing import Any, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.llm_config import (
    MODEL_DEEP,
    MODEL_FAST,
    chat_completion,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/skills", tags=["skills-llm"])

# ---------------------------------------------------------------------------
# ISCO-08 reference table (embedded for prompt + fallback keyword matching)
# ---------------------------------------------------------------------------
ISCO_TABLE: list[dict[str, str]] = [
    {"keywords": "repair phone electronic", "isco08": "7422", "title": "Electronics Mechanics and Servicers"},
    {"keywords": "sell selling goods market shop whatsapp trade", "isco08": "5221", "title": "Shopkeepers and Stall Keepers"},
    {"keywords": "sew sewing tailor tailoring dressmaking fashion clothing", "isco08": "7531", "title": "Tailors, Dressmakers"},
    {"keywords": "drive driving bolt okada taxi commercial transport", "isco08": "8322", "title": "Car, Taxi and Van Drivers"},
    {"keywords": "cook cooking food prep catering restaurant kitchen", "isco08": "5120", "title": "Cooks"},
    {"keywords": "construct construction building bricklayer mason plumbing", "isco08": "7112", "title": "Bricklayers / Construction Workers"},
    {"keywords": "farm farming crop agriculture planting harvest", "isco08": "9211", "title": "Crop Farm Labourers"},
    {"keywords": "teach teaching training tutor instructor education lesson", "isco08": "2356", "title": "Vocational Education Teachers"},
    {"keywords": "office admin administration data entry clerk typing secretary", "isco08": "4132", "title": "Data Entry Clerks"},
    {"keywords": "health healthcare nurse caring nursing medical hospital clinic", "isco08": "2221", "title": "Nursing Professionals"},
    {"keywords": "it tech computer software programming code developer web app", "isco08": "2512", "title": "Software Developers"},
    {"keywords": "fintech mobile money agent banking pos transfer", "isco08": "4215", "title": "Client Information Workers"},
    {"keywords": "creative content design art graphic video photography music", "isco08": "2651", "title": "Creative/Performing Artists"},
]

ISCO_MAP = {row["isco08"]: row["title"] for row in ISCO_TABLE}

# ---------------------------------------------------------------------------
# ESCO skills data (loaded once)
# ---------------------------------------------------------------------------
_esco_skills: dict[str, Any] = {}

def _load_esco_skills() -> dict[str, Any]:
    global _esco_skills
    if _esco_skills:
        return _esco_skills
    esco_path = pathlib.Path(__file__).resolve().parents[2] / "data" / "crosswalks" / "isco_esco_skills.json"
    try:
        with open(esco_path) as f:
            _esco_skills = json.load(f)
        logger.info("Loaded ESCO skills for %d ISCO codes", len(_esco_skills))
    except Exception as exc:
        logger.warning("Could not load ESCO skills: %s", exc)
        _esco_skills = {}
    return _esco_skills


def _match_esco_skill(skill_label: str, isco_code: Optional[str] = None) -> Optional[dict]:
    """Best-effort match a skill label to an ESCO URI."""
    esco = _load_esco_skills()
    skill_lower = skill_label.lower()

    # Search in the primary ISCO code first, then all codes
    search_order = []
    if isco_code and isco_code in esco:
        search_order.append(isco_code)
    search_order.extend(k for k in esco if k != isco_code)

    for code in search_order:
        entry = esco.get(code, {})
        for skill_list_key in ("essential_skills", "optional_skills"):
            for skill in entry.get(skill_list_key, []):
                if skill_lower in skill.get("label", "").lower() or skill.get("label", "").lower() in skill_lower:
                    return {"uri": skill["uri"], "label": skill["label"]}
    return None


# ---------------------------------------------------------------------------
# Fallback keyword matcher
# ---------------------------------------------------------------------------
def _keyword_match(text: str) -> list[dict]:
    """Score each ISCO row by keyword overlap. Returns sorted matches."""
    text_lower = text.lower()
    results = []
    for row in ISCO_TABLE:
        keywords = row["keywords"].split()
        hits = sum(1 for kw in keywords if kw in text_lower)
        if hits > 0:
            confidence = round(min(0.95, 0.3 + 0.15 * hits), 2)
            results.append({
                "isco08": row["isco08"],
                "title": row["title"],
                "confidence": confidence,
                "hits": hits,
            })
    results.sort(key=lambda r: r["confidence"], reverse=True)
    return results


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

# -- Parse --
class ParseRequest(BaseModel):
    text: str = Field(..., min_length=3, max_length=5000)
    country: str = Field(default="NGA", max_length=3)
    language: str = Field(default="en", max_length=5)

class OccupationMatch(BaseModel):
    isco08: str
    title: str
    confidence: float
    reason: Optional[str] = None

class DetectedSkill(BaseModel):
    label: str
    esco_uri: Optional[str] = None
    confidence: float

class ParseResponse(BaseModel):
    primary_occupation: OccupationMatch
    secondary_occupations: list[OccupationMatch] = []
    detected_skills: list[DetectedSkill] = []
    language_detected: str = "en"

# -- Follow-up --
class FollowupRequest(BaseModel):
    isco08: str
    detected_skills: list[str] = []
    country: str = Field(default="NGA", max_length=3)

class FollowupQuestion(BaseModel):
    id: str
    text: str
    purpose: str
    options: list[str]

class FollowupResponse(BaseModel):
    questions: list[FollowupQuestion]

# -- Narrative --
class NarrativeRequest(BaseModel):
    isco08: str
    country: str = Field(default="NGA", max_length=3)
    task_composition: dict[str, float] = {}
    recalibrated_risk: float = 0.5

class NarrativeResponse(BaseModel):
    narrative: str
    tone: str = "warm_direct"
    reading_level: str = "secondary_school"


# ===================================================================
# SYSTEM PROMPTS
# ===================================================================

_ISCO_TABLE_TEXT = "\n".join(
    f"- {row['isco08']} | {row['title']} | keywords: {row['keywords']}"
    for row in ISCO_TABLE
)

PARSE_SYSTEM_PROMPT = f"""You are an occupation-classification engine for the Global South informal economy.

Given a free-text description of someone's work, you MUST:
1. Identify the PRIMARY occupation from the ISCO-08 table below.
2. Identify any SECONDARY occupations (if the text mentions multiple activities).
3. Extract individual SKILLS mentioned or implied.
4. Detect the language of the input text.

ISCO-08 Reference Table:
{_ISCO_TABLE_TEXT}

Respond ONLY with valid JSON matching this schema (no markdown, no explanation):
{{
  "primary_occupation": {{"isco08": "...", "title": "...", "confidence": 0.0-1.0}},
  "secondary_occupations": [{{"isco08": "...", "title": "...", "confidence": 0.0-1.0, "reason": "..."}}],
  "detected_skills": [{{"label": "...", "confidence": 0.0-1.0}}],
  "language_detected": "en"
}}

Rules:
- Confidence ranges: >0.85 strong match, 0.6-0.85 moderate, <0.6 weak.
- If no clear match, pick the closest and lower confidence.
- Skill labels should be short (2-4 words), lowercase.
- language_detected should be an ISO 639-1 code.
"""

FOLLOWUP_SYSTEM_PROMPT = """You generate contextual follow-up questions for workers in the Global South informal economy.

Given an ISCO-08 occupation code, detected skills, and country, produce 2-3 questions that:
1. Distinguish SKILL DEPTH (basic vs advanced proficiency)
2. Discover ADJACENT capabilities the person may not have mentioned
3. Assess DIGITAL LITERACY level

Each question must have structured multiple-choice options for easy frontend rendering.

Respond ONLY with valid JSON (no markdown):
{
  "questions": [
    {
      "id": "q1",
      "text": "...",
      "purpose": "...",
      "options": ["...", "...", "..."]
    }
  ]
}
"""

NARRATIVE_SYSTEM_PROMPT = """You write plain-language risk narratives for workers in the Global South.

Given an occupation, country, task composition breakdown, and recalibrated automation risk score (0-1), write a warm, direct narrative that:
1. Explains in everyday language what parts of their work are AI-resilient and which face pressure.
2. Uses concrete examples from their actual tasks (inferred from the occupation).
3. Is encouraging but honest — never dismissive of real risks.
4. Is written at a secondary-school reading level.
5. Is 3-5 sentences long.
6. Acknowledges the local economic context (infrastructure, adoption rates).

Respond ONLY with valid JSON:
{
  "narrative": "...",
  "tone": "warm_direct",
  "reading_level": "secondary_school"
}
"""


# ===================================================================
# ENDPOINT 1: Parse skills
# ===================================================================
@router.post("/parse", response_model=ParseResponse)
async def parse_skills(req: ParseRequest) -> ParseResponse:
    """Parse free-text skills description into structured ISCO/ESCO mapping."""

    # --- Try LLM first ---
    llm_result = await chat_completion(
        messages=[
            {"role": "system", "content": PARSE_SYSTEM_PROMPT},
            {"role": "user", "content": f"Country: {req.country}\nDescription: {req.text}"},
        ],
        model=MODEL_FAST,
        temperature=0.2,
        response_format={"type": "json_object"},
    )

    if llm_result:
        try:
            data = json.loads(llm_result)
            # Enrich detected skills with ESCO URIs
            primary_code = data.get("primary_occupation", {}).get("isco08")
            enriched_skills = []
            for skill in data.get("detected_skills", []):
                esco_match = _match_esco_skill(skill["label"], primary_code)
                enriched_skills.append(DetectedSkill(
                    label=skill["label"],
                    esco_uri=esco_match["uri"] if esco_match else None,
                    confidence=skill.get("confidence", 0.7),
                ))

            return ParseResponse(
                primary_occupation=OccupationMatch(**data["primary_occupation"]),
                secondary_occupations=[
                    OccupationMatch(**occ) for occ in data.get("secondary_occupations", [])
                ],
                detected_skills=enriched_skills,
                language_detected=data.get("language_detected", req.language),
            )
        except (json.JSONDecodeError, KeyError, TypeError) as exc:
            logger.warning("LLM response parse error: %s", exc)

    # --- Fallback: keyword matching ---
    logger.info("Using keyword fallback for parse")
    matches = _keyword_match(req.text)
    if not matches:
        matches = [{"isco08": "9629", "title": "Elementary Workers Not Elsewhere Classified", "confidence": 0.3}]

    primary = matches[0]
    secondary = [
        OccupationMatch(isco08=m["isco08"], title=m["title"], confidence=m["confidence"], reason="keyword match")
        for m in matches[1:4]
    ]

    # Extract simple skill tokens from text
    words = set(re.findall(r"[a-zA-Z]{3,}", req.text.lower()))
    skill_keywords = words & {
        "repair", "phone", "bookkeeping", "sewing", "cooking", "driving",
        "farming", "teaching", "selling", "building", "coding", "design",
        "nursing", "trading", "tailoring", "catering", "programming",
    }
    fallback_skills = []
    for sk in list(skill_keywords)[:6]:
        esco_match = _match_esco_skill(sk, primary["isco08"])
        fallback_skills.append(DetectedSkill(
            label=sk,
            esco_uri=esco_match["uri"] if esco_match else None,
            confidence=0.6,
        ))

    return ParseResponse(
        primary_occupation=OccupationMatch(
            isco08=primary["isco08"], title=primary["title"], confidence=primary["confidence"]
        ),
        secondary_occupations=secondary,
        detected_skills=fallback_skills,
        language_detected=req.language,
    )


# ===================================================================
# ENDPOINT 2: Follow-up questions
# ===================================================================

# Pre-written fallback questions keyed by ISCO prefix
_FALLBACK_QUESTIONS: dict[str, list[dict]] = {
    "7422": [
        {"id": "q1", "text": "Do you mainly replace screens and batteries, or do you also diagnose circuit-level faults?",
         "purpose": "Distinguish basic repair from electronics diagnostics",
         "options": ["Mostly screen/battery replacement", "I diagnose and fix circuit-level issues", "Both"]},
        {"id": "q2", "text": "Do you use any digital tools to track your repairs or customers?",
         "purpose": "Assess digital literacy",
         "options": ["Pen and paper", "Phone notes/calculator", "Spreadsheet or app"]},
    ],
    "5221": [
        {"id": "q1", "text": "Do you sell in a physical location, online (WhatsApp/Instagram), or both?",
         "purpose": "Assess digital commerce skills",
         "options": ["Physical only", "Online only", "Both physical and online"]},
        {"id": "q2", "text": "How do you keep track of what you buy and sell?",
         "purpose": "Assess record-keeping and digital literacy",
         "options": ["I keep it in my head", "Pen and paper", "Phone app or spreadsheet"]},
    ],
    "7531": [
        {"id": "q1", "text": "Do you work from patterns/designs, create your own designs, or both?",
         "purpose": "Distinguish production sewing from creative design",
         "options": ["I follow patterns", "I create my own designs", "Both"]},
        {"id": "q2", "text": "Do you use any machines, or is your work mostly by hand?",
         "purpose": "Assess equipment and technical skill level",
         "options": ["Mostly hand-sewing", "Basic sewing machine", "Industrial machines"]},
    ],
    "default": [
        {"id": "q1", "text": "How long have you been doing this kind of work?",
         "purpose": "Assess experience level",
         "options": ["Less than 1 year", "1-3 years", "3-5 years", "More than 5 years"]},
        {"id": "q2", "text": "Do you use a smartphone for any part of your work?",
         "purpose": "Assess baseline digital literacy",
         "options": ["No smartphone", "Yes, for calls/WhatsApp only", "Yes, for work apps and the internet"]},
        {"id": "q3", "text": "Have you taught or trained anyone else in your skills?",
         "purpose": "Discover teaching/mentoring capability",
         "options": ["No", "Informally (friends/family)", "Yes, I've trained apprentices or students"]},
    ],
}


@router.post("/followup", response_model=FollowupResponse)
async def generate_followup(req: FollowupRequest) -> FollowupResponse:
    """Generate contextual follow-up questions based on occupation + skills."""

    occupation_title = ISCO_MAP.get(req.isco08, "Unknown occupation")

    llm_result = await chat_completion(
        messages=[
            {"role": "system", "content": FOLLOWUP_SYSTEM_PROMPT},
            {"role": "user", "content": (
                f"Occupation: {req.isco08} — {occupation_title}\n"
                f"Detected skills: {', '.join(req.detected_skills) if req.detected_skills else 'none yet'}\n"
                f"Country: {req.country}"
            )},
        ],
        model=MODEL_FAST,
        temperature=0.5,
        response_format={"type": "json_object"},
    )

    if llm_result:
        try:
            data = json.loads(llm_result)
            return FollowupResponse(
                questions=[FollowupQuestion(**q) for q in data["questions"]]
            )
        except (json.JSONDecodeError, KeyError, TypeError) as exc:
            logger.warning("LLM followup parse error: %s", exc)

    # --- Fallback: pre-written questions ---
    logger.info("Using fallback questions for ISCO %s", req.isco08)
    fallback = _FALLBACK_QUESTIONS.get(req.isco08, _FALLBACK_QUESTIONS["default"])
    return FollowupResponse(questions=[FollowupQuestion(**q) for q in fallback])


# ===================================================================
# ENDPOINT 3: Risk narrative
# ===================================================================
@router.post("/narrative", response_model=NarrativeResponse)
async def generate_narrative(req: NarrativeRequest) -> NarrativeResponse:
    """Generate a plain-language automation-risk narrative for the user."""

    occupation_title = ISCO_MAP.get(req.isco08, "Unknown occupation")
    risk_pct = round(req.recalibrated_risk * 100)

    task_summary = ", ".join(
        f"{k.replace('_', ' ')}: {round(v * 100)}%"
        for k, v in req.task_composition.items()
    ) if req.task_composition else "not available"

    llm_result = await chat_completion(
        messages=[
            {"role": "system", "content": NARRATIVE_SYSTEM_PROMPT},
            {"role": "user", "content": (
                f"Occupation: {req.isco08} — {occupation_title}\n"
                f"Country: {req.country}\n"
                f"Recalibrated automation risk: {req.recalibrated_risk:.2f} ({risk_pct}%)\n"
                f"Task composition: {task_summary}"
            )},
        ],
        model=MODEL_DEEP,
        temperature=0.6,
        response_format={"type": "json_object"},
    )

    if llm_result:
        try:
            data = json.loads(llm_result)
            return NarrativeResponse(
                narrative=data["narrative"],
                tone=data.get("tone", "warm_direct"),
                reading_level=data.get("reading_level", "secondary_school"),
            )
        except (json.JSONDecodeError, KeyError, TypeError) as exc:
            logger.warning("LLM narrative parse error: %s", exc)

    # --- Fallback: template-based narrative ---
    logger.info("Using fallback narrative for ISCO %s", req.isco08)

    if req.recalibrated_risk < 0.3:
        risk_desc = "largely AI-resilient"
        outlook = "Most of what you do every day requires hands-on skill and human judgment that technology can't easily replace in your local context."
    elif req.recalibrated_risk < 0.6:
        risk_desc = "moderately exposed to automation"
        outlook = "Some parts of your work could be affected by new technology over time, but your hands-on and people skills remain valuable."
    else:
        risk_desc = "facing significant automation pressure"
        outlook = "Several parts of your work could be done by technology in the coming years. Building new skills alongside your existing ones will help you stay ahead."

    narrative = (
        f"Your work as a {occupation_title.lower()} is {risk_desc}. "
        f"{outlook} "
        f"In {req.country}, factors like infrastructure and technology adoption rates "
        f"mean these changes happen more gradually than global averages suggest."
    )

    return NarrativeResponse(narrative=narrative)
