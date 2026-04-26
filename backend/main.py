"""
UNMAPPED — FastAPI Backend Server
Wraps the data layer and query engine for the frontend.

Run from project root:
    cd unmapped-global-hackathon && uvicorn backend.main:app --reload
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Ensure scripts/ is importable
BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE / "scripts"))

from backend.routers import country, crosswalk, health, llm, query, scrape  # noqa: E402

app = FastAPI(
    title="UNMAPPED API",
    description="Job demand intelligence for emerging economies",
    version="0.1.0",
)

# CORS — wide open for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(country.router)
app.include_router(query.router)
app.include_router(crosswalk.router)
app.include_router(llm.router)
app.include_router(scrape.router)


# ── Additional endpoints not in routers ──

@app.get("/api/recalibrated/{iso3}/{isco08}")
def get_recalibrated(iso3: str, isco08: str):
    """Recalibrated automation data for a specific occupation+country."""
    iso3 = iso3.lower()
    path = BASE / f"data/{iso3}/recalibrated_automation.json"
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Recalibrated automation data not available for {iso3.upper()}",
        )

    with open(path) as f:
        data = json.load(f)

    # Find the specific occupation
    occupations = data.get("occupations", [])
    for occ in occupations:
        if occ.get("isco08") == isco08:
            return {
                "country": iso3.upper(),
                "calibration_factor": data.get("calibration_factor"),
                "methodology": data.get("methodology"),
                "occupation": occ,
            }

    # If not found, return the full dataset summary + message
    raise HTTPException(
        status_code=404,
        detail=f"ISCO-08 code '{isco08}' not found in recalibrated data for {iso3.upper()}. "
        f"Dataset contains {data.get('total_occupations', '?')} occupations.",
    )


@app.get("/api/policymaker/{iso3}")
def get_policymaker(iso3: str):
    """Policymaker aggregates for a country."""
    iso3 = iso3.lower()
    path = BASE / f"data/{iso3}/policymaker_aggregates.json"
    if not path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Policymaker aggregates not yet available for {iso3.upper()}. "
            f"Currently available for countries with completed pipeline runs.",
        )

    with open(path) as f:
        return json.load(f)


@app.get("/")
def root():
    return {
        "name": "UNMAPPED API",
        "docs": "/docs",
        "health": "/api/health",
    }
