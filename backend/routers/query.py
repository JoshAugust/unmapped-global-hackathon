"""Main query endpoint — wraps scripts/query_engine.py."""
import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

# Ensure scripts/ is importable
BASE = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE / "scripts"))

from query_engine import query_job_demand  # noqa: E402

router = APIRouter(prefix="/api", tags=["query"])

VALID_COUNTRIES = {"NGA", "GHA", "KEN", "IND", "RWA"}


@router.get("/query")
def query(
    isco08: str = Query(..., description="ISCO-08 occupation code, e.g. 7422"),
    country: str = Query(..., description="ISO3 country code, e.g. NGA"),
):
    country = country.upper()
    if country not in VALID_COUNTRIES:
        raise HTTPException(status_code=400, detail=f"Invalid country '{country}'. Valid: {sorted(VALID_COUNTRIES)}")

    # Basic ISCO-08 validation: 1-4 digit numeric
    if not isco08.isdigit() or not (1 <= len(isco08) <= 4):
        raise HTTPException(status_code=400, detail=f"Invalid ISCO-08 code '{isco08}'. Must be 1-4 digit numeric code.")

    try:
        result = query_job_demand(isco08, country)
        return result
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query engine error: {str(e)}")
