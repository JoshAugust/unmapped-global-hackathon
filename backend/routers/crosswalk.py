"""Crosswalk / taxonomy bridge endpoint."""
import json
import sqlite3
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["crosswalk"])

BASE = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE / "data/crosswalks/unified_crosswalk.db"
TASK_COMP_PATH = BASE / "data/crosswalks/task_composition.json"
ESCO_SKILLS_PATH = BASE / "data/crosswalks/isco_esco_skills.json"


def _get_db():
    if not DB_PATH.exists():
        raise HTTPException(status_code=503, detail="Crosswalk database not available")
    return sqlite3.connect(str(DB_PATH))


@router.get("/crosswalk/{isco08}")
def get_crosswalk(isco08: str):
    if not isco08.isdigit() or not (1 <= len(isco08) <= 4):
        raise HTTPException(status_code=400, detail=f"Invalid ISCO-08 code '{isco08}'")

    conn = _get_db()
    conn.row_factory = sqlite3.Row

    # ISCO title
    row = conn.execute(
        "SELECT * FROM isco_occupations WHERE isco08_code = ?", (isco08,)
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"ISCO-08 code '{isco08}' not found in crosswalk")

    isco_info = dict(row)

    # Automation score
    auto_row = conn.execute(
        "SELECT * FROM automation_scores WHERE isco08_code = ?", (isco08,)
    ).fetchone()
    automation = dict(auto_row) if auto_row else None

    # Linked SOC codes
    soc_rows = conn.execute(
        "SELECT soc_code, soc_title, mapping_type FROM soc_isco_map WHERE isco08_code = ?", (isco08,)
    ).fetchall()
    soc_codes = [dict(r) for r in soc_rows]

    # ESCO skills from DB
    esco_rows = conn.execute(
        "SELECT skill_label, skill_type FROM esco_skills WHERE isco08_code = ?", (isco08,)
    ).fetchall()
    esco_skills_db = [dict(r) for r in esco_rows]

    # O*NET tasks
    onet_rows = conn.execute(
        "SELECT task_description, task_type FROM onet_tasks WHERE isco08_code = ?", (isco08,)
    ).fetchall()
    onet_tasks = [dict(r) for r in onet_rows]

    # O*NET skills
    onet_skill_rows = conn.execute(
        "SELECT skill_name, importance, level FROM onet_skills WHERE isco08_code = ?", (isco08,)
    ).fetchall()
    onet_skills = [dict(r) for r in onet_skill_rows]

    conn.close()

    # Task composition from JSON file
    task_composition = None
    if TASK_COMP_PATH.exists():
        with open(TASK_COMP_PATH) as f:
            tc_data = json.load(f)
        if isco08 in tc_data:
            task_composition = tc_data[isco08]

    # ESCO skills from JSON file (richer data)
    esco_skills_json = None
    if ESCO_SKILLS_PATH.exists():
        with open(ESCO_SKILLS_PATH) as f:
            esco_data = json.load(f)
        if isco08 in esco_data:
            esco_skills_json = esco_data[isco08]

    return {
        "isco08": isco08,
        "isco_info": isco_info,
        "automation": automation,
        "soc_codes": soc_codes,
        "esco_skills": esco_skills_json or {"skills": esco_skills_db},
        "onet_tasks": onet_tasks,
        "onet_skills": onet_skills,
        "task_composition": task_composition,
    }
