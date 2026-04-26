"""
UNMAPPED — Live Job Demand Signal
Scrapes LinkedIn + Indeed for Nigerian job vacancies across key occupation categories.
Maps results to ISCO-08 taxonomy and stores with timestamp for dynamic refresh.

USAGE (run from your own machine during hackathon — not in sandbox):
    pip install python-jobspy
    python scripts/scrape_jobs.py --country NGA --refresh

OUTPUT: data/nga/live_jobs.json (refreshed on each run)

Sources:
  - LinkedIn Nigeria: linkedin.com/jobs filtered to Nigeria
  - Indeed Nigeria: ng.indeed.com
  - Jobberman: aggregated via Google Jobs search
"""
import json
import argparse
from datetime import datetime, timezone
from pathlib import Path
import pandas as pd

try:
    from jobspy import scrape_jobs
    JOBSPY_AVAILABLE = True
except ImportError:
    JOBSPY_AVAILABLE = False
    print("WARNING: python-jobspy not installed. Run: pip install python-jobspy")

BASE = Path(__file__).parent.parent

# ── Occupation search queries mapped to ISCO-08 ──────────────────────────────
# Each query targets a real occupation cluster relevant to Nigerian labour market
# Sources: MyJobMag 2025 top hiring industries + WEF 2025 Nigeria skill demand

OCCUPATION_QUERIES = {
    # Format: isco08_code: { search config }
    "2512": {
        "label": "Software Developers",
        "search_terms": ["software developer", "software engineer", "web developer"],
        "isco08": "2512",
        "sector": "ICT",
        "lmic_relevant": True,
    },
    "2522": {
        "label": "Systems Administrators / IT Support",
        "search_terms": ["IT support", "systems administrator", "network engineer"],
        "isco08": "2522",
        "sector": "ICT",
        "lmic_relevant": True,
    },
    "3339": {
        "label": "Cybersecurity / Network Technicians",
        "search_terms": ["cybersecurity", "network security", "SOC analyst"],
        "isco08": "3339",
        "sector": "ICT",
        "lmic_relevant": True,
    },
    "2411": {
        "label": "Accountants and Finance Officers",
        "search_terms": ["accountant", "finance officer", "financial analyst"],
        "isco08": "2411",
        "sector": "Financial Services",
        "lmic_relevant": True,
    },
    "3311": {
        "label": "Banking and Financial Clerks",
        "search_terms": ["bank teller", "banking officer", "credit officer"],
        "isco08": "3311",
        "sector": "Financial Services",
        "lmic_relevant": True,
    },
    "2221": {
        "label": "Nursing and Health Professionals",
        "search_terms": ["nurse", "community health worker", "health officer"],
        "isco08": "2221",
        "sector": "Health",
        "lmic_relevant": True,
    },
    "2320": {
        "label": "Vocational and Secondary Teachers",
        "search_terms": ["teacher", "TVET instructor", "secondary school teacher"],
        "isco08": "2320",
        "sector": "Education",
        "lmic_relevant": True,
    },
    "4132": {
        "label": "Data Entry Clerks / Admin Assistants",
        "search_terms": ["data entry", "administrative assistant", "office clerk"],
        "isco08": "4132",
        "sector": "Admin",
        "lmic_relevant": True,
    },
    "7422": {
        "label": "Electronics / Phone Repair Technicians",
        "search_terms": ["electronics technician", "phone repair", "device repair"],
        "isco08": "7422",
        "sector": "ICT/Electronics",
        "lmic_relevant": True,
    },
    "3339_solar": {
        "label": "Solar / Energy Technicians",
        "search_terms": ["solar technician", "solar installer", "renewable energy"],
        "isco08": "3139",
        "sector": "Energy",
        "lmic_relevant": True,
    },
    "5221": {
        "label": "Sales Representatives / Trade",
        "search_terms": ["sales representative", "sales officer", "business development"],
        "isco08": "5221",
        "sector": "Trade",
        "lmic_relevant": True,
    },
    "4311": {
        "label": "Accounting / Payroll Clerks",
        "search_terms": ["payroll officer", "accounting clerk", "bookkeeper"],
        "isco08": "4311",
        "sector": "Admin",
        "lmic_relevant": True,
    },
    "1222": {
        "label": "NGO / Project Management Officers",
        "search_terms": ["project officer", "program officer NGO", "monitoring evaluation"],
        "isco08": "1222",
        "sector": "NGO/Development",
        "lmic_relevant": True,
    },
    "7115": {
        "label": "Carpenters and Construction Trades",
        "search_terms": ["carpenter", "construction supervisor", "site engineer"],
        "isco08": "7115",
        "sector": "Construction",
        "lmic_relevant": True,
    },
}

COUNTRY_CONFIG = {
    "NGA": {
        "name": "Nigeria",
        "indeed_country": "Nigeria",
        "linkedin_location": "Nigeria",
        "google_suffix": "Nigeria",
        "data_path": "data/nga/live_jobs.json",
    },
    "GHA": {
        "name": "Ghana",
        "indeed_country": "Ghana",
        "linkedin_location": "Ghana",
        "google_suffix": "Ghana",
        "data_path": "data/gha/live_jobs.json",
    },
}


def scrape_occupation(query_config: dict, country_config: dict, results_per_term: int = 15) -> list:
    """Scrape LinkedIn + Indeed for one occupation category."""
    if not JOBSPY_AVAILABLE:
        return []

    all_jobs = []
    for term in query_config["search_terms"][:2]:  # max 2 terms per occupation
        try:
            jobs = scrape_jobs(
                site_name=["linkedin", "indeed"],
                search_term=term,
                location=country_config["linkedin_location"],
                results_wanted=results_per_term,
                hours_old=168,  # last 7 days
                country_indeed=country_config["indeed_country"],
                description_format="markdown",
                verbose=0,
            )
            if jobs is not None and len(jobs) > 0:
                jobs["search_term"] = term
                jobs["isco08"] = query_config["isco08"]
                jobs["occupation_label"] = query_config["label"]
                jobs["sector"] = query_config["sector"]
                all_jobs.append(jobs)
                print(f"  ✓ '{term}' in {country_config['name']}: {len(jobs)} results")
        except Exception as e:
            print(f"  ✗ '{term}': {e}")

    if all_jobs:
        combined = pd.concat(all_jobs, ignore_index=True)
        # Deduplicate by title+company
        combined = combined.drop_duplicates(subset=["title", "company"])
        return combined.to_dict("records")
    return []


def normalise_job(raw: dict, isco08: str, occupation_label: str, sector: str) -> dict:
    """Normalise a raw scraped job into UNMAPPED schema."""
    # Extract salary if available
    salary_usd = None
    if raw.get("min_amount") and raw.get("currency"):
        # Convert NGN to USD approximately
        if raw["currency"] in ["NGN", "₦"]:
            salary_usd = round(raw["min_amount"] / 1500, 0)  # approx 2025 rate
        elif raw["currency"] in ["USD", "$"]:
            salary_usd = raw["min_amount"]

    return {
        "id": str(hash(f"{raw.get('title','')}{raw.get('company','')}")),
        "title": raw.get("title", ""),
        "company": raw.get("company", ""),
        "location": {
            "city": raw.get("city", ""),
            "country": raw.get("country_code", "NGA"),
        },
        "is_remote": raw.get("is_remote", False),
        "job_type": raw.get("job_type", "fulltime"),
        "date_posted": str(raw.get("date_posted", "")),
        "job_url": raw.get("job_url", ""),
        "source": raw.get("site", "unknown"),
        "isco08": isco08,
        "occupation_label": occupation_label,
        "sector": sector,
        "salary_usd_monthly": salary_usd,
        "salary_raw": {
            "min": raw.get("min_amount"),
            "max": raw.get("max_amount"),
            "currency": raw.get("currency"),
            "interval": raw.get("interval"),
        },
        "description_snippet": str(raw.get("description", ""))[:500] if raw.get("description") else None,
        "scraped_at": datetime.now(timezone.utc).isoformat(),
    }


def build_demand_summary(jobs: list) -> dict:
    """Aggregate job-level data into demand signals."""
    if not jobs:
        return {}

    by_sector = {}
    by_isco = {}

    for job in jobs:
        sector = job["sector"]
        isco = job["isco08"]
        occ = job["occupation_label"]

        # Sector counts
        if sector not in by_sector:
            by_sector[sector] = {"vacancy_count": 0, "occupations": set(), "salary_usd_values": []}
        by_sector[sector]["vacancy_count"] += 1
        by_sector[sector]["occupations"].add(occ)
        if job.get("salary_usd_monthly"):
            by_sector[sector]["salary_usd_values"].append(job["salary_usd_monthly"])

        # ISCO counts
        if isco not in by_isco:
            by_isco[isco] = {"label": occ, "vacancy_count": 0, "sector": sector, "salary_usd_values": []}
        by_isco[isco]["vacancy_count"] += 1
        if job.get("salary_usd_monthly"):
            by_isco[isco]["salary_usd_values"].append(job["salary_usd_monthly"])

    # Compute medians
    def to_output(d):
        vals = d.pop("salary_usd_values", [])
        d["median_salary_usd"] = round(sorted(vals)[len(vals)//2], 0) if vals else None
        d["salary_data_points"] = len(vals)
        if "occupations" in d:
            d["occupations"] = list(d["occupations"])
        return d

    sector_summary = {k: to_output(v) for k, v in by_sector.items()}
    isco_summary = {k: to_output(v) for k, v in by_isco.items()}

    # Rank sectors by vacancy count
    ranked_sectors = sorted(sector_summary.items(), key=lambda x: x[1]["vacancy_count"], reverse=True)

    return {
        "total_vacancies_scraped": len(jobs),
        "sectors_ranked_by_demand": [
            {"sector": s, **d} for s, d in ranked_sectors
        ],
        "by_isco08": isco_summary,
        "source": "LinkedIn + Indeed Nigeria via python-jobspy",
        "vintage": datetime.now(timezone.utc).isoformat(),
        "note": "Formal sector only. Informal economy vacancies not captured. Salary data sparse — most Nigerian job postings omit salary."
    }


def run_scrape(country_code: str = "NGA"):
    """Main scrape run — call this from your machine."""
    config = COUNTRY_CONFIG[country_code]
    print(f"\n=== UNMAPPED Job Demand Scraper: {config['name']} ===")
    print(f"Scraping {len(OCCUPATION_QUERIES)} occupation categories from LinkedIn + Indeed")
    print("This will take 3-5 minutes. LinkedIn rate limits after ~10 pages.\n")

    all_jobs = []
    for key, occ in OCCUPATION_QUERIES.items():
        print(f"[{key}] {occ['label']}")
        raw_jobs = scrape_occupation(occ, config, results_per_term=15)
        normalised = [normalise_job(j, occ["isco08"], occ["label"], occ["sector"]) for j in raw_jobs]
        all_jobs.extend(normalised)
        print(f"  → {len(normalised)} jobs added (total: {len(all_jobs)})")

    summary = build_demand_summary(all_jobs)

    output = {
        "_metadata": {
            "country": config["name"],
            "country_code": country_code,
            "scraped_at": datetime.now(timezone.utc).isoformat(),
            "sources": ["LinkedIn", "Indeed Nigeria"],
            "occupation_categories_queried": len(OCCUPATION_QUERIES),
            "data_gaps": [
                "Informal sector jobs not captured — Jobberman and LinkedIn bias toward formal employers",
                "Salary data: most Nigerian postings omit salary; median based on sparse data only",
                "Geographic bias: Lagos and Abuja overrepresented vs. other states",
                "Remote roles may skew results toward global tech companies hiring Nigerians remotely",
            ]
        },
        "demand_summary": summary,
        "jobs": all_jobs,
    }

    out_path = BASE / config["data_path"]
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w") as f:
        json.dump(output, f, indent=2, default=str)

    print(f"\n✓ Saved {len(all_jobs)} jobs → {out_path}")
    print(f"✓ Top sectors by demand:")
    for s in summary.get("sectors_ranked_by_demand", [])[:5]:
        print(f"  {s['sector']}: {s['vacancy_count']} vacancies")
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--country", default="NGA", choices=["NGA", "GHA"])
    parser.add_argument("--refresh", action="store_true", help="Force refresh even if recent data exists")
    args = parser.parse_args()
    run_scrape(args.country)
