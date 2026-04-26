#!/usr/bin/env python3
"""
Build ISCO-08 → ESCO skill mapping.

Uses the ESCO REST API to:
1. Look up ESCO occupations under each ISCO-08 4-digit code
2. Fetch essential + optional skills for each occupation
3. Aggregate skills per ISCO code (union across child occupations)

Outputs:
  data/crosswalks/isco_esco_skills.json
  data/crosswalks/esco_skills_flat.csv
"""

import json
import csv
import os
import sys
import time
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
CROSSWALKS_DIR = DATA_DIR / "crosswalks"
CROSSWALKS_DIR.mkdir(parents=True, exist_ok=True)

ESCO_API = "https://ec.europa.eu/esco/api"

# Priority ISCO codes from NGA occupation lookup
PRIORITY_CODES = [
    "7422", "5221", "5222", "7543", "7531", "5141", "8322", "8331",
    "9111", "9412", "5120", "7112", "7115", "4132", "2512", "2356",
    "2221", "9211", "3439"
]


def api_get(url, params=None, retries=3):
    """GET request to ESCO API with retries."""
    if params:
        url = url + "?" + urllib.parse.urlencode(params)
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 2 ** (attempt + 1)
                print(f"  Rate limited, waiting {wait}s...")
                time.sleep(wait)
                continue
            elif e.code == 404:
                return None
            else:
                print(f"  HTTP {e.code} for {url}")
                if attempt < retries - 1:
                    time.sleep(1)
                    continue
                return None
        except Exception as e:
            print(f"  Error: {e}")
            if attempt < retries - 1:
                time.sleep(1)
                continue
            return None
    return None


def get_isco_occupations(isco_code):
    """Get ESCO occupations mapped to an ISCO-08 code via the concept endpoint."""
    uri = f"http://data.europa.eu/esco/isco/C{isco_code}"
    data = api_get(f"{ESCO_API}/resource/concept", {
        "uri": uri,
        "language": "en"
    })
    if not data:
        return []

    occupations = []
    links = data.get("_links", {})
    narrower = links.get("narrowerOccupation", []) or links.get("narrowerConcept", [])
    if isinstance(narrower, dict):
        narrower = [narrower]
    for occ in narrower:
        occupations.append({
            "uri": occ.get("uri", occ.get("href", "")),
            "title": occ.get("title", occ.get("prefLabel", ""))
        })
    return occupations


def get_occupation_skills(occ_uri):
    """Fetch essential and optional skills for an ESCO occupation."""
    data = api_get(f"{ESCO_API}/resource/occupation", {
        "uri": occ_uri,
        "language": "en"
    })
    if not data:
        return [], []

    essential = []
    optional = []

    links = data.get("_links", {})

    # Essential skills
    ess_list = links.get("hasEssentialSkill", [])
    if isinstance(ess_list, dict):
        ess_list = [ess_list]
    for s in ess_list:
        essential.append({
            "uri": s.get("uri", s.get("href", "")),
            "label": s.get("title", s.get("prefLabel", "")),
            "description": ""
        })

    # Optional skills
    opt_list = links.get("hasOptionalSkill", [])
    if isinstance(opt_list, dict):
        opt_list = [opt_list]
    for s in opt_list:
        optional.append({
            "uri": s.get("uri", s.get("href", "")),
            "label": s.get("title", s.get("prefLabel", "")),
            "description": ""
        })

    return essential, optional


def enrich_skill_descriptions(skills, batch_size=20):
    """Optionally fetch full descriptions for skills. Skip if too many to stay within time."""
    # For now, we skip description enrichment to stay fast
    # The labels are the primary value
    return skills


def load_isco_titles():
    """Load ISCO-08 titles from the ILO CSV if available."""
    isco_path = BASE_DIR.parent / "son-of-a-bridge" / "data" / "ilo_isco08" / "isco08_occupations.csv"
    titles = {}
    if isco_path.exists():
        with open(isco_path, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                code = row.get("code", row.get("isco08", "")).strip()
                title = row.get("title", row.get("label", "")).strip()
                if code and title and len(code) == 4:
                    titles[code] = title
    return titles


def load_priority_titles():
    """Load titles from the NGA occupation lookup."""
    lookup_path = DATA_DIR / "nga" / "occupation_lookup.json"
    titles = {}
    if lookup_path.exists():
        with open(lookup_path, "r") as f:
            data = json.load(f)
            for occ in data.get("occupation_lookup", []):
                titles[str(occ["isco08"])] = occ["title"]
    return titles


def build_mapping(codes, isco_titles):
    """Build the ISCO → ESCO skills mapping for given codes."""
    result = {}
    total_skills = 0

    for i, code in enumerate(codes):
        print(f"[{i+1}/{len(codes)}] Processing ISCO {code}...")
        title = isco_titles.get(code, f"ISCO {code}")

        # Get ESCO occupations under this ISCO code
        occupations = get_isco_occupations(code)
        print(f"  Found {len(occupations)} ESCO occupations")

        all_essential = {}
        all_optional = {}

        for occ in occupations:
            occ_uri = occ["uri"]
            essential, optional = get_occupation_skills(occ_uri)
            print(f"    {occ.get('title', occ_uri)}: {len(essential)} essential, {len(optional)} optional")

            for s in essential:
                if s["uri"] not in all_essential:
                    all_essential[s["uri"]] = s
            for s in optional:
                if s["uri"] not in all_optional and s["uri"] not in all_essential:
                    all_optional[s["uri"]] = s

            time.sleep(0.3)  # Be nice to the API

        result[code] = {
            "isco_title": title,
            "essential_skills": list(all_essential.values()),
            "optional_skills": list(all_optional.values())
        }
        total_skills += len(all_essential) + len(all_optional)
        print(f"  Total: {len(all_essential)} essential, {len(all_optional)} optional skills")
        time.sleep(0.2)

    return result, total_skills


def write_outputs(mapping):
    """Write JSON and CSV output files."""
    # JSON
    json_path = CROSSWALKS_DIR / "isco_esco_skills.json"
    with open(json_path, "w") as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    print(f"\nWrote {json_path}")

    # Flat CSV
    csv_path = CROSSWALKS_DIR / "esco_skills_flat.csv"
    rows = 0
    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["isco08_code", "skill_uri", "skill_label", "skill_type"])
        for code, data in sorted(mapping.items()):
            for s in data["essential_skills"]:
                writer.writerow([code, s["uri"], s["label"], "essential"])
                rows += 1
            for s in data["optional_skills"]:
                writer.writerow([code, s["uri"], s["label"], "optional"])
                rows += 1
    print(f"Wrote {csv_path} ({rows} rows)")
    return rows


def main():
    print("=" * 60)
    print("ISCO-08 → ESCO Skill Mapping Builder")
    print("=" * 60)

    # Load titles
    isco_titles = load_priority_titles()
    isco_titles_full = load_isco_titles()
    isco_titles.update({k: v for k, v in isco_titles_full.items() if k not in isco_titles})

    # Phase 1: Priority codes
    print(f"\n--- Phase 1: {len(PRIORITY_CODES)} priority occupations ---")
    mapping, total = build_mapping(PRIORITY_CODES, isco_titles)
    print(f"\nPhase 1 complete: {total} total skill mappings across {len(PRIORITY_CODES)} codes")

    # Write outputs after phase 1
    rows = write_outputs(mapping)

    # Phase 2: If we have time, extend to more codes from ISCO data
    # (keeping this optional - the priority codes are the acceptance criteria)
    if "--extend" in sys.argv:
        additional = [c for c in isco_titles_full.keys() if c not in mapping]
        print(f"\n--- Phase 2: Extending to {len(additional)} additional codes ---")
        ext_mapping, ext_total = build_mapping(additional[:50], isco_titles)  # Cap at 50
        mapping.update(ext_mapping)
        rows = write_outputs(mapping)

    print(f"\n{'=' * 60}")
    print(f"DONE. {len(mapping)} ISCO codes, {rows} skill rows in CSV")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
