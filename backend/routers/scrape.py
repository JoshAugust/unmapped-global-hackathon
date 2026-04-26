"""
UNMAPPED — Job Scraper Trigger Router
POST /api/refresh/{country}      — trigger background scrape
GET  /api/refresh/{country}/status — check scrape status
GET  /api/data-freshness/{country} — data currency report
"""
import asyncio
import subprocess
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException

BASE = Path(__file__).resolve().parent.parent.parent

router = APIRouter(tags=["scraper"])

# In-memory job registry (ephemeral — resets on server restart)
# Maps job_id -> {status, country, started_at, pid, error}
_jobs: dict[str, dict] = {}

SUPPORTED_COUNTRIES = {"NGA", "GHA", "KEN", "RWA", "IND"}
COUNTRY_TO_ISO3 = {
    "NGA": "nga",
    "GHA": "gha",
    "KEN": "ken",
    "RWA": "rwa",
    "IND": "ind",
}


async def _run_scraper(job_id: str, country: str) -> None:
    """Background coroutine that shells out to scrape_jobs.py."""
    iso3 = COUNTRY_TO_ISO3.get(country, country.lower())
    script = BASE / "scripts" / "scrape_jobs.py"
    _jobs[job_id]["status"] = "running"

    try:
        proc = await asyncio.create_subprocess_exec(
            sys.executable,
            str(script),
            "--country", country,
            "--refresh",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(BASE),
        )
        _jobs[job_id]["pid"] = proc.pid
        stdout, stderr = await proc.communicate()

        if proc.returncode == 0:
            _jobs[job_id]["status"] = "completed"
            _jobs[job_id]["completed_at"] = datetime.now(timezone.utc).isoformat()
        else:
            _jobs[job_id]["status"] = "failed"
            _jobs[job_id]["error"] = stderr.decode()[:500]
            _jobs[job_id]["completed_at"] = datetime.now(timezone.utc).isoformat()

    except Exception as exc:
        _jobs[job_id]["status"] = "failed"
        _jobs[job_id]["error"] = str(exc)
        _jobs[job_id]["completed_at"] = datetime.now(timezone.utc).isoformat()


@router.post("/api/refresh/{country}")
async def trigger_scrape(country: str):
    """
    Trigger a background job scrape for the given country.

    - country: ISO-3 country code (NGA, GHA, KEN, RWA, IND)

    Returns immediately with a job_id. Poll /api/refresh/{country}/status
    or check /api/data-freshness/{country} to see when data lands.
    """
    country = country.upper()

    if country not in SUPPORTED_COUNTRIES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported country '{country}'. Supported: {sorted(SUPPORTED_COUNTRIES)}",
        )

    job_id = str(uuid.uuid4())
    started_at = datetime.now(timezone.utc).isoformat()

    _jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "country": country,
        "started_at": started_at,
        "pid": None,
        "error": None,
        "completed_at": None,
    }

    # Fire and forget — don't await
    asyncio.create_task(_run_scraper(job_id, country))

    return {
        "status": "started",
        "job_id": job_id,
        "country": country,
        "estimated_time_seconds": 120,
        "started_at": started_at,
        "poll_url": f"/api/refresh/{country}/status?job_id={job_id}",
    }


@router.get("/api/refresh/{country}/status")
def scrape_status(country: str, job_id: Optional[str] = None):
    """
    Check scrape status for a country.

    Optionally filter to a specific job_id. If omitted, returns the
    most recent job for this country (if any) plus the live_jobs.json timestamp.
    """
    country = country.upper()
    iso3 = COUNTRY_TO_ISO3.get(country, country.lower())
    live_path = BASE / "data" / iso3 / "live_jobs.json"

    # Find matching jobs
    country_jobs = [j for j in _jobs.values() if j["country"] == country]
    if job_id:
        country_jobs = [j for j in country_jobs if j["job_id"] == job_id]

    job_info = None
    if country_jobs:
        # Most recent
        job_info = sorted(country_jobs, key=lambda j: j["started_at"], reverse=True)[0]

    file_info = None
    if live_path.exists():
        stat = live_path.stat()
        mod_time = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)
        age_hours = (datetime.now(timezone.utc) - mod_time).total_seconds() / 3600
        file_info = {
            "exists": True,
            "last_modified": mod_time.isoformat(),
            "age_hours": round(age_hours, 2),
            "size_bytes": stat.st_size,
        }
    else:
        file_info = {"exists": False}

    return {
        "country": country,
        "live_jobs_file": file_info,
        "latest_job": job_info,
    }


@router.get("/api/data-freshness/{country}")
def data_freshness(country: str):
    """
    Report on the currency of job data for a given country.

    Checks both seed_jobs.json (static baseline) and live_jobs.json (scraped).
    Returns which source is active, its age, and whether a refresh is recommended.
    """
    country_upper = country.upper()
    iso3 = COUNTRY_TO_ISO3.get(country_upper, country.lower())
    data_dir = BASE / "data" / iso3

    seed_path = data_dir / "seed_jobs.json"
    live_path = data_dir / "live_jobs.json"

    def _file_info(path: Path) -> dict:
        if not path.exists():
            return {"exists": False, "last_modified": None, "age_hours": None, "size_bytes": None}
        stat = path.stat()
        mod_time = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc)
        age_hours = (datetime.now(timezone.utc) - mod_time).total_seconds() / 3600
        return {
            "exists": True,
            "last_modified": mod_time.isoformat(),
            "age_hours": round(age_hours, 2),
            "size_bytes": stat.st_size,
        }

    seed_info = _file_info(seed_path)
    live_info = _file_info(live_path)

    # Determine active source
    if live_info["exists"]:
        active_source = "live_jobs"
        active_age_hours = live_info["age_hours"]
    elif seed_info["exists"]:
        active_source = "seed_jobs"
        active_age_hours = seed_info["age_hours"]
    else:
        raise HTTPException(
            status_code=404,
            detail=f"No job data found for {country_upper}. Country may not be supported yet.",
        )

    # Recommend refresh if live data is older than 24h OR doesn't exist yet
    refresh_recommended = (not live_info["exists"]) or (live_info["age_hours"] is not None and live_info["age_hours"] > 24)

    return {
        "country": country_upper,
        "active_source": active_source,
        "refresh_recommended": refresh_recommended,
        "refresh_url": f"/api/refresh/{country_upper}",
        "seed_jobs": seed_info,
        "live_jobs": live_info,
        "note": (
            "live_jobs.json is scraped in real time. seed_jobs.json is a curated static baseline. "
            "The query engine prefers live_jobs when available."
        ),
    }
