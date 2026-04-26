"""Country listing and detail endpoints."""
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api", tags=["countries"])

BASE = Path(__file__).resolve().parent.parent.parent

COUNTRY_CODES = ["nga", "gha", "ken", "ind", "rwa"]

# Emoji flags
FLAGS = {
    "NGA": "🇳🇬",
    "GHA": "🇬🇭",
    "KEN": "🇰🇪",
    "IND": "🇮🇳",
    "RWA": "🇷🇼",
}


def _load_config(iso3: str) -> dict:
    path = BASE / f"data/config/country_config_{iso3.lower()}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Country '{iso3}' not found")
    with open(path) as f:
        return json.load(f)


@router.get("/countries")
def list_countries():
    countries = []
    for cc in COUNTRY_CODES:
        try:
            cfg = _load_config(cc)
            c = cfg.get("country", {})
            countries.append({
                "iso3": cc.upper(),
                "name": c.get("name", cc.upper()),
                "flag": FLAGS.get(cc.upper(), "🏳️"),
                "region": c.get("region", ""),
                "calibration_factor": cfg.get("automation", {}).get("calibration_factor"),
            })
        except HTTPException:
            continue
    return {"countries": countries}


@router.get("/country/{iso3}")
def get_country(iso3: str):
    return _load_config(iso3)
