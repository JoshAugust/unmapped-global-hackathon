"""Health check endpoint."""
import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["health"])

BASE = Path(__file__).resolve().parent.parent.parent  # project root

COUNTRY_CODES = ["nga", "gha", "ken", "ind", "rwa"]


@router.get("/health")
def health():
    available = []
    for cc in COUNTRY_CODES:
        cfg_path = BASE / f"data/config/country_config_{cc}.json"
        if cfg_path.exists():
            available.append(cc.upper())

    # Check data freshness from seed_jobs if it exists
    freshness = {}
    for cc in available:
        seed = BASE / f"data/{cc.lower()}/seed_jobs.json"
        if seed.exists():
            mtime = datetime.fromtimestamp(seed.stat().st_mtime, tz=timezone.utc)
            freshness[cc] = mtime.isoformat()

    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "available_countries": available,
        "data_freshness": freshness,
        "version": "0.1.0",
    }
