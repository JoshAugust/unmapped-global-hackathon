"""
UNMAPPED — Job Demand Query Engine
Given a user's ISCO-08 occupation and skills profile,
returns matching job demand signals with salary benchmarks,
AI risk context, and adjacency pathways.

Reads from: data/{country}/seed_jobs.json (or live_jobs.json if available)
Called by: Owner B's frontend via a simple REST API or direct import
"""
import json
from pathlib import Path
from datetime import datetime, timezone

BASE = Path(__file__).parent.parent


def load_demand_data(country_code: str) -> dict:
    """Load live data if available, fall back to seed."""
    live_path = BASE / f"data/{country_code.lower()}/live_jobs.json"
    seed_path = BASE / f"data/{country_code.lower()}/seed_jobs.json"

    if live_path.exists():
        with open(live_path) as f:
            data = json.load(f)
        data["_using"] = "live"
        return data
    elif seed_path.exists():
        with open(seed_path) as f:
            data = json.load(f)
        data["_using"] = "seed"
        return data
    else:
        raise FileNotFoundError(f"No job demand data found for {country_code}")


def load_occupation_lookup(country_code: str) -> list:
    """Load ISCO-automation lookup from pipeline output."""
    path = BASE / f"data/{country_code.lower()}/occupation_lookup.json"
    with open(path) as f:
        return json.load(f)["occupation_lookup"]


# ── Adjacency map: what occupations are reachable from each ISCO-08 code ──
# Source: research brief + informal economy analysis
# Format: from_isco08 -> [candidate occupations with transition cost]
ADJACENCY_MAP = {
    "7422": [  # Phone repair → 
        {"isco08": "3139", "label": "Solar Technician", "gap_level": "small",
         "gap_description": "3-month solar PV installation course (₦30-80k range in Lagos). Electrical fundamentals transfer directly.",
         "wage_uplift_pct": 79},
        {"isco08": "2522", "label": "IT Support Technician", "gap_level": "medium",
         "gap_description": "CompTIA A+ certification (self-study 6 months). Strong hardware knowledge transfers.",
         "wage_uplift_pct": 55},
        {"isco08": "3339", "label": "CCTV / Security Systems Installer", "gap_level": "small",
         "gap_description": "On-the-job training available. Wiring and device configuration skills transfer directly.",
         "wage_uplift_pct": 30},
    ],
    "5221": [  # Market trader / shop salesperson →
        {"isco08": "4215", "label": "POS / Mobile Money Agent", "gap_level": "minimal",
         "gap_description": "Platform registration and basic training (1-2 weeks). Customer trust skills transfer directly.",
         "wage_uplift_pct": 40},
        {"isco08": "2412", "label": "Digital Marketer / Social Commerce", "gap_level": "small",
         "gap_description": "Free/low-cost digital marketing courses (Google, Meta Blueprint). WhatsApp Business skills already present.",
         "wage_uplift_pct": 55},
        {"isco08": "5221", "label": "E-commerce / Platform Sales Agent", "gap_level": "small",
         "gap_description": "Jumia, Konga seller onboarding programme. Inventory management skills transfer.",
         "wage_uplift_pct": 45},
    ],
    "8322": [  # Driver / transport →
        {"isco08": "4323", "label": "Logistics Coordinator", "gap_level": "medium",
         "gap_description": "Route planning and fleet management training (3 months). Local road knowledge is an asset.",
         "wage_uplift_pct": 35},
        {"isco08": "5221", "label": "Delivery Operations Supervisor", "gap_level": "small",
         "gap_description": "Gig platform promotion pathway. Customer service track record transfers.",
         "wage_uplift_pct": 50},
    ],
    "7531": [  # Tailor →
        {"isco08": "7531", "label": "Export Fashion Producer", "gap_level": "medium",
         "gap_description": "Export quality standards training; Afrofashion market access. Sewing skills fully transfer.",
         "wage_uplift_pct": 120},
        {"isco08": "2356", "label": "TVET Tailoring Instructor", "gap_level": "medium",
         "gap_description": "NABTEB instructor certification. Teaching skills needed in addition to trade.",
         "wage_uplift_pct": 45},
    ],
    "9111": [  # Domestic worker / cleaner →
        {"isco08": "2221", "label": "Community Health Aide", "gap_level": "medium",
         "gap_description": "CHEW (Community Health Extension Worker) training (1 year). Care skills transfer.",
         "wage_uplift_pct": 65},
        {"isco08": "5141", "label": "Professional Caregiver (elderly/disability)", "gap_level": "small",
         "gap_description": "Caregiver certification programmes available through NGOs. Growing sector.",
         "wage_uplift_pct": 40},
    ],
    "5120": [  # Cook / food services →
        {"isco08": "5120", "label": "Catering Business Owner", "gap_level": "small",
         "gap_description": "Small business registration and food safety certification. Cooking skills fully transfer.",
         "wage_uplift_pct": 80},
        {"isco08": "5120", "label": "Online Food Delivery Vendor", "gap_level": "minimal",
         "gap_description": "Chowdeck / Glovo vendor onboarding. Existing cooking skills sufficient.",
         "wage_uplift_pct": 50},
    ],
    "4132": [  # Data entry clerk →
        {"isco08": "2412", "label": "Digital Marketing Assistant", "gap_level": "small",
         "gap_description": "Google Digital Skills for Africa (free, 40 hours). Computer literacy already present.",
         "wage_uplift_pct": 35},
        {"isco08": "3339", "label": "IT Support / Helpdesk", "gap_level": "medium",
         "gap_description": "CompTIA A+ certification. Technical upskilling required but admin skills transfer.",
         "wage_uplift_pct": 45},
    ],
}


def query_job_demand(
    isco08: str,
    country_code: str = "NGA",
    informal_skills: list = None,
    experience_years: int = 2,
    user_goal: str = None,
) -> dict:
    """
    Main query function. Given a user's occupation, returns:
    - Direct matches (jobs in this occupation)
    - Adjacency matches (reachable occupations with gap analysis)
    - AI risk context
    - Two visible econometric signals
    """
    demand = load_demand_data(country_code)
    occ_lookup = load_occupation_lookup(country_code)

    # Find automation risk for this occupation
    occ_data = next((o for o in occ_lookup if str(o["isco08"]) == str(isco08)), None)

    # Find direct job demand for this occupation
    direct_demand = next(
        (o for o in demand.get("occupation_level_demand", []) if str(o["isco08"]) == str(isco08)),
        None
    )

    # Find informal demand signal if applicable
    informal_signal = next(
        (o for o in demand.get("informal_demand_signals", {}).get("high_demand_informal_occupations", [])
         if str(o.get("isco08_approx", "")).replace("_approx", "") == str(isco08)),
        None
    )

    # Get adjacency pathways
    adjacency = ADJACENCY_MAP.get(isco08, [])
    adjacency_enriched = []
    for adj in adjacency:
        adj_demand = next(
            (o for o in demand.get("occupation_level_demand", []) if str(o["isco08"]) == str(adj["isco08"])),
            None
        )
        enriched = {**adj}
        if adj_demand:
            enriched["destination_vacancy_count"] = adj_demand.get("estimated_vacancies")
            enriched["destination_median_wage_usd"] = adj_demand.get("median_salary_usd_monthly")
            enriched["destination_demand_trend"] = adj_demand.get("demand_trend")
            enriched["destination_key_skills"] = adj_demand.get("key_skills", [])
            enriched["destination_automation_risk"] = adj_demand.get("automation_risk_tier")
        adjacency_enriched.append(enriched)

    # Econometric Signal 1: sector wage comparison
    user_sector = direct_demand["sector"] if direct_demand else (occ_data["sector"] if occ_data else "Unknown")
    sector_wages = [
        {"sector": s["sector"], "median_wage_usd": s["median_salary_usd_monthly"],
         "vacancy_count": s["vacancy_count"], "growth_signal": s["growth_signal"]}
        for s in demand["demand_summary"]["sectors_ranked_by_demand"]
        if s.get("median_salary_usd_monthly")
    ]
    sector_wages_sorted = sorted(sector_wages, key=lambda x: x["median_wage_usd"], reverse=True)

    # Econometric Signal 2: sector demand ranking
    top_sectors_by_demand = demand["demand_summary"]["sectors_ranked_by_demand"][:5]

    # Build AI risk message (honest, user-friendly)
    ai_risk_message = None
    if occ_data:
        tier = occ_data.get("risk_tier")
        prob = occ_data.get("automation_prob")
        if tier == "high":
            ai_risk_message = {
                "level": "high",
                "headline": "Parts of this work could be automated in the next 5 years",
                "detail": occ_data.get("risk_explanation", ""),
                "what_to_do": "Focus on skills that AI cannot easily replicate: client relationships, judgment calls, managing exceptions, and training others.",
                "source": "ILO GenAI Exposure Index 2025 + Frey-Osborne (2013), calibrated for Nigeria",
            }
        elif tier == "medium":
            ai_risk_message = {
                "level": "medium",
                "headline": "Some routine tasks in this work may change due to AI",
                "detail": occ_data.get("risk_explanation", ""),
                "what_to_do": "Build your digital skills to use AI as a tool, not compete with it. Focus on physical, relational, and judgment-based aspects of your work.",
                "source": "ILO GenAI Exposure Index 2025 + Frey-Osborne (2013), calibrated for Nigeria",
            }
        else:
            ai_risk_message = {
                "level": "low",
                "headline": "This type of work is unlikely to be fully automated soon",
                "detail": occ_data.get("risk_explanation", ""),
                "what_to_do": "Deepen your expertise and consider adjacent roles in growing sectors.",
                "source": "ILO GenAI Exposure Index 2025 + Frey-Osborne (2013), calibrated for Nigeria",
            }

    # Data vintage
    data_using = demand.get("_using", "seed")
    scraped_at = demand.get("_metadata", {}).get("scraped_at", "2025-04-25")

    return {
        "query": {
            "isco08": isco08,
            "country": country_code,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        "data_freshness": {
            "source_type": data_using,
            "scraped_at": scraped_at,
            "note": "Using live data" if data_using == "live" else "Using seed data — run scrape_jobs.py to refresh",
        },

        # ── Core output ──
        "occupation_profile": {
            "isco08": isco08,
            "label": occ_data["title"] if occ_data else "Unknown occupation",
            "sector": user_sector,
            "automation_risk": occ_data.get("risk_tier") if occ_data else None,
            "automation_prob": occ_data.get("automation_prob") if occ_data else None,
        },

        "direct_demand": direct_demand,
        "informal_demand": informal_signal,

        "adjacency_pathways": adjacency_enriched,

        "ai_risk": ai_risk_message,

        # ── Two visible econometric signals ──
        "econometric_signal_1": {
            "name": "Monthly wages by sector — Nigeria (formal sector)",
            "description": "What different sectors pay. Your sector is highlighted.",
            "user_sector": user_sector,
            "data": sector_wages_sorted,
            "source": "NBS Labour Force Survey 2022; LinkedIn Nigeria salary insights",
            "vintage": "2022-2025",
            "caveat": "Formal sector only. Informal sector wages typically 30-60% lower.",
        },

        "econometric_signal_2": {
            "name": "Job vacancies by sector — Nigeria (April 2025)",
            "description": "Where employers are actually hiring right now.",
            "data": [
                {"sector": s["sector"], "vacancies": s["vacancy_count"],
                 "growth_signal": s["growth_signal"]}
                for s in top_sectors_by_demand
            ],
            "source": "Jobberman Nigeria + MyJobMag Job Search Report 2025",
            "vintage": "April 2025",
            "caveat": "Formal job boards only. Informal economy not captured.",
        },

        "data_limits": [
            "Salary data is sparse — most Nigerian job postings omit salary figures",
            "Geographic bias: Lagos and Abuja account for ~65% of formal listings",
            "Informal economy vacancies (POS agents, gig drivers, market traders) not captured",
            "Vacancy counts are estimates from published reports, not precise scrape counts",
        ],
    }


def format_for_user(result: dict) -> str:
    """Plain-language summary for Amara — readable on a phone."""
    occ = result["occupation_profile"]
    direct = result["direct_demand"]
    adj = result["adjacency_pathways"]
    ai = result["ai_risk"]

    lines = []
    lines.append(f"YOUR SKILLS PROFILE")
    lines.append(f"Work: {occ['label']}")
    lines.append(f"Sector: {occ['sector']}")
    lines.append("")

    if direct:
        lines.append(f"JOBS IN DEMAND FOR YOUR SKILLS")
        lines.append(f"Active vacancies (Nigeria): ~{direct.get('estimated_vacancies', '?')}")
        wage = direct.get("median_salary_usd_monthly")
        if wage:
            lines.append(f"Typical monthly pay (formal): ${wage}/month")
        lines.append(f"Trend: {direct.get('demand_trend', '?')}")
        lines.append(f"Source: {direct.get('vacancy_source', '')}")
        lines.append("")

    if ai:
        lines.append(f"AI AND YOUR WORK")
        lines.append(f"Risk level: {ai['level'].upper()}")
        lines.append(ai["headline"])
        lines.append(f"What this means: {ai['what_to_do']}")
        lines.append("")

    if adj:
        lines.append("NEARBY OPPORTUNITIES (ADJACENCY MATCHES)")
        for a in adj[:3]:
            lines.append(f"→ {a['label']}")
            lines.append(f"  Gap to get there: {a['gap_level']} effort")
            lines.append(f"  {a['gap_description']}")
            if a.get("destination_median_wage_usd"):
                lines.append(f"  Pay: ${a['destination_median_wage_usd']}/month (+{a.get('wage_uplift_pct', '?')}%)")
            if a.get("destination_demand_trend"):
                lines.append(f"  Demand: {a['destination_demand_trend']}")
            lines.append("")

    lines.append("DATA SOURCES")
    lines.append(f"  Vacancies: {result['econometric_signal_2']['source']}, {result['econometric_signal_2']['vintage']}")
    lines.append(f"  Wages: {result['econometric_signal_1']['source']}, {result['econometric_signal_1']['vintage']}")
    lines.append(f"  AI risk: ILO GenAI Exposure Index 2025")
    lines.append("")
    lines.append("WHAT THIS TOOL DOESN'T KNOW")
    for limit in result["data_limits"]:
        lines.append(f"  · {limit}")

    return "\n".join(lines)


# ── Test with Amara ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=== UNMAPPED Job Demand Query — Test: Amara (Phone Repair, Nigeria) ===\n")

    result = query_job_demand(
        isco08="7422",      # Electronics Mechanics and Servicers
        country_code="NGA",
        informal_skills=["basic coding", "three languages", "business management"],
        experience_years=5,
        user_goal="understand what jobs pay"
    )

    print(format_for_user(result))
    print("\n" + "="*60)
    print("\n=== Test 2: Data Entry Clerk (HIGH AI RISK — white collar bypass) ===\n")

    result2 = query_job_demand(isco08="4132", country_code="NGA")
    print(format_for_user(result2))

    # Save full JSON for Owner B
    import json
    with open("data/nga/query_result_amara.json", "w") as f:
        json.dump(result, f, indent=2, default=str)
    print("\n✓ Full query result saved: data/nga/query_result_amara.json")
