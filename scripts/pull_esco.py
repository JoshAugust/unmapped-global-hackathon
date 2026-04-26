#!/usr/bin/env python3
"""
Pull ESCO Taxonomy — hybrid approach:
  1. Bulk skill/occupation descriptions from GitHub mirror (fast)
  2. Individual occupation details from ESCO REST API (for ISCO codes + skill links)
  3. Any extra skill details from API

Outputs to data/esco/:
  - occupations_en.csv
  - skills_en.csv  
  - isco_to_esco_skills.json
  - summary_stats.json
"""

import csv
import io
import json
import os
import sys
import time
import urllib.parse
import urllib.request
import urllib.error
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

BASE_URL = "https://ec.europa.eu/esco/api"
LANGUAGE = "en"
MAX_WORKERS = 20
MAX_RETRIES = 3
RETRY_DELAY = 2

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = PROJECT_ROOT / "data" / "esco"
PROGRESS_DIR = PROJECT_ROOT / "orchestration" / "agent_m2"

GITHUB_BASE = "https://raw.githubusercontent.com/KonstantinosPetrakis/esco-skill-extractor/master/esco_skill_extractor/data"


def log(msg):
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)


def update_heartbeat(msg):
    try:
        (PROGRESS_DIR / "heartbeat.txt").write_text(msg)
    except Exception:
        pass


def api_get(url):
    """GET a URL with retry logic."""
    for attempt in range(MAX_RETRIES):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))
            else:
                return None
    return None


def build_url(path, params):
    return f"{BASE_URL}{path}?{urllib.parse.urlencode(params)}"


def download_text(url):
    """Download text content from a URL."""
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.read().decode("utf-8")
    except Exception as e:
        log(f"  WARN: Download failed {url[:60]}: {e}")
        return None


def fetch_occupation_detail(uri):
    """Fetch one occupation's ISCO code + skill links."""
    url = build_url("/resource/occupation", {"uri": uri, "language": LANGUAGE})
    data = api_get(url)
    if not data:
        return None

    links = data.get("_links", {})
    title = data.get("preferredLabel", {}).get("en", data.get("title", ""))

    # Description
    desc = ""
    df = data.get("description", {})
    if isinstance(df, dict):
        en = df.get("en", {})
        desc = en.get("literal", "") if isinstance(en, dict) else str(en) if en else ""

    # ISCO-08 code (4-digit)
    isco_code = ""
    broader = links.get("broaderIscoGroup", [])
    if isinstance(broader, dict):
        broader = [broader]
    for bg in broader:
        code = bg.get("code", "")
        if code and len(code) == 4:
            isco_code = code
            break
    if not isco_code:
        # Try code field (format: "2512.3")
        cf = str(data.get("code", ""))
        if "." in cf:
            isco_code = cf.split(".")[0]
            if len(isco_code) != 4:
                isco_code = ""

    # Skill links
    essential = [{"uri": s.get("uri", ""), "title": s.get("title", "")}
                 for s in links.get("hasEssentialSkill", [])]
    optional = [{"uri": s.get("uri", ""), "title": s.get("title", "")}
                for s in links.get("hasOptionalSkill", [])]

    return {
        "uri": uri, "title": title, "description": desc,
        "isco_code": isco_code,
        "essential_skills": essential, "optional_skills": optional,
    }


def fetch_skill_detail(uri):
    """Fetch one skill's title + description from API."""
    url = build_url("/resource/skill", {"uri": uri, "language": LANGUAGE})
    data = api_get(url)
    if not data:
        return None
    title = data.get("preferredLabel", {}).get("en", data.get("title", ""))
    desc = ""
    df = data.get("description", {})
    if isinstance(df, dict):
        en = df.get("en", {})
        desc = en.get("literal", "") if isinstance(en, dict) else str(en) if en else ""
    return {"uri": uri, "title": title, "description": desc}


def fetch_all_uris_paginated(resource_type, scheme_uri, page_size=20):
    """Fetch all URIs using paginated bulk endpoint (limit capped at 20)."""
    uris = []
    offset = 0
    total = None

    while True:
        url = build_url(f"/resource/{resource_type}", {
            "isInScheme": scheme_uri,
            "language": LANGUAGE,
            "offset": offset,
            "limit": page_size,
        })
        data = api_get(url)
        if not data:
            time.sleep(3)
            data = api_get(url)
            if not data:
                log(f"    Failed at offset={offset}")
                break

        if total is None:
            total = data.get("total", 0)
            log(f"    API reports {total} total {resource_type}s")

        concepts = data.get("concepts", [])
        if not concepts:
            break

        for c in concepts:
            uris.append(c["uri"])

        offset += len(concepts)
        if offset % 500 == 0:
            log(f"    Fetched {offset}/{total} URIs...")
            update_heartbeat(f"RUNNING - URIs {offset}/{total}")
        if offset >= total:
            break

    return uris


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PROGRESS_DIR.mkdir(parents=True, exist_ok=True)
    update_heartbeat("RUNNING - Starting ESCO pull")
    start_time = time.time()

    # ── Step 1: Download GitHub CSVs for descriptions ──
    log("Step 1: Downloading bulk data from GitHub mirror...")
    
    github_skills = {}  # uri -> description
    csv_text = download_text(f"{GITHUB_BASE}/skills.csv")
    if csv_text:
        reader = csv.DictReader(io.StringIO(csv_text))
        for row in reader:
            uri = row.get("id", "")
            if uri:
                github_skills[uri] = row.get("description", "")
        log(f"  {len(github_skills)} skills from GitHub")

    github_occs = {}  # uri -> description
    csv_text = download_text(f"{GITHUB_BASE}/occupations.csv")
    if csv_text:
        reader = csv.DictReader(io.StringIO(csv_text))
        for row in reader:
            uri = row.get("id", "")
            if uri:
                github_occs[uri] = row.get("description", "")
        log(f"  {len(github_occs)} occupations from GitHub")

    # ── Step 2: Get all occupation URIs ──
    log("Step 2: Getting all occupation URIs...")
    update_heartbeat("RUNNING - Getting occupation URIs")
    
    # Start with GitHub URIs, supplement with API
    occ_uris = set(github_occs.keys())
    log(f"  Starting with {len(occ_uris)} URIs from GitHub")
    
    # Paginate through API bulk endpoint to find any extras
    log("  Fetching from API bulk endpoint (limit=20 per page)...")
    api_uris = fetch_all_uris_paginated("occupation", "http://data.europa.eu/esco/concept-scheme/occupations")
    occ_uris.update(api_uris)
    log(f"  Total unique occupation URIs: {len(occ_uris)}")

    # ── Step 3: Get all skill URIs ──
    log("Step 3: Getting all skill URIs...")
    update_heartbeat("RUNNING - Getting skill URIs")
    
    skill_uris = set(github_skills.keys())
    log(f"  Starting with {len(skill_uris)} URIs from GitHub")
    
    api_skill_uris = fetch_all_uris_paginated("skill", "http://data.europa.eu/esco/concept-scheme/skills")
    skill_uris.update(api_skill_uris)
    log(f"  Total unique skill URIs: {len(skill_uris)}")

    # ── Step 4: Fetch individual occupation details (ISCO + skills) ──
    all_occ_uris = list(occ_uris)
    log(f"Step 4: Fetching {len(all_occ_uris)} occupation details for ISCO codes + skill links...")
    update_heartbeat(f"RUNNING - Fetching {len(all_occ_uris)} occupation details")

    occupations = []
    failed_occs = 0
    t0 = time.time()

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(fetch_occupation_detail, uri): uri for uri in all_occ_uris}
        done = 0
        for future in as_completed(futures):
            done += 1
            if done % 500 == 0:
                elapsed = time.time() - t0
                rate = done / elapsed if elapsed > 0 else 0
                eta = (len(all_occ_uris) - done) / rate if rate > 0 else 0
                log(f"  Occupations: {done}/{len(all_occ_uris)} ({rate:.1f}/s, ETA {eta:.0f}s)")
                update_heartbeat(f"RUNNING - Occs {done}/{len(all_occ_uris)}")
            result = future.result()
            if result:
                # Merge GitHub description if API didn't provide one
                if not result["description"] and result["uri"] in github_occs:
                    result["description"] = github_occs[result["uri"]]
                occupations.append(result)
            else:
                failed_occs += 1

    esco_occs = [o for o in occupations if o["isco_code"]]
    log(f"  Fetched {len(occupations)} occupations ({failed_occs} failed)")
    log(f"  {len(esco_occs)} have ISCO-08 codes")

    # ── Step 5: Build complete skill dataset ──
    log("Step 5: Building skill dataset...")
    update_heartbeat("RUNNING - Building skill dataset")

    # Collect all skill URIs referenced by occupations
    referenced_skill_uris = set()
    skill_title_map = {}  # uri -> title from occupation links
    for o in occupations:
        for s in o["essential_skills"] + o["optional_skills"]:
            if s["uri"]:
                referenced_skill_uris.add(s["uri"])
                if s["title"]:
                    skill_title_map[s["uri"]] = s["title"]

    # Merge all known skill URIs
    all_skill_uris = skill_uris | referenced_skill_uris
    log(f"  Total unique skill URIs: {len(all_skill_uris)}")
    
    # Skills that need API fetch (not in GitHub and not referenced with title)
    skills_with_data = set(github_skills.keys())
    skills_needing_api = all_skill_uris - skills_with_data
    # For skills only known from occupation links (have title), use that
    skills_from_links = {uri for uri in skills_needing_api if uri in skill_title_map}
    skills_truly_needing_api = skills_needing_api - skills_from_links
    
    log(f"  {len(skills_with_data)} from GitHub, {len(skills_from_links)} from occ links, {len(skills_truly_needing_api)} need API")

    # Fetch missing skills from API
    api_skill_results = {}
    if skills_truly_needing_api:
        log(f"  Fetching {len(skills_truly_needing_api)} skills from API...")
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = {executor.submit(fetch_skill_detail, uri): uri for uri in skills_truly_needing_api}
            for future in as_completed(futures):
                result = future.result()
                if result:
                    api_skill_results[result["uri"]] = result

    # Assemble full skills list
    skills = []
    for uri in sorted(all_skill_uris):
        if uri in github_skills:
            title = skill_title_map.get(uri, "")
            desc = github_skills[uri]
            # The GitHub CSV description often starts with alt labels then the actual description
            # Try to extract a clean title if we don't have one
            if not title and desc:
                # First few words before a longer sentence might be the title
                pass  # Leave title empty, it will come from skill_title_map
            skills.append({"uri": uri, "title": title, "description": desc})
        elif uri in api_skill_results:
            r = api_skill_results[uri]
            skills.append({"uri": uri, "title": r["title"], "description": r["description"]})
        elif uri in skill_title_map:
            skills.append({"uri": uri, "title": skill_title_map[uri], "description": ""})
        else:
            skills.append({"uri": uri, "title": "", "description": ""})

    log(f"  Total skills assembled: {len(skills)}")

    # ── Step 6: Write occupations CSV ──
    log("Step 6: Writing occupations_en.csv...")
    update_heartbeat("RUNNING - Writing output files")
    occ_csv = DATA_DIR / "occupations_en.csv"
    with open(occ_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["uri", "title", "isco_code", "description", "num_essential_skills", "num_optional_skills"])
        for o in sorted(occupations, key=lambda x: (x["isco_code"] or "zzzz", x["title"])):
            w.writerow([o["uri"], o["title"], o["isco_code"], o["description"],
                        len(o["essential_skills"]), len(o["optional_skills"])])
    log(f"  → {len(occupations)} occupations")

    # ── Step 7: Write skills CSV ──
    log("Step 7: Writing skills_en.csv...")
    skills_csv = DATA_DIR / "skills_en.csv"
    with open(skills_csv, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["uri", "title", "description"])
        for s in sorted(skills, key=lambda x: x.get("title", "")):
            w.writerow([s["uri"], s["title"], s["description"]])
    log(f"  → {len(skills)} skills")

    # ── Step 8: Build ISCO → ESCO skills mapping ──
    log("Step 8: Building isco_to_esco_skills.json...")
    isco_map = defaultdict(lambda: {"essential": [], "optional": []})
    for o in esco_occs:
        code = o["isco_code"]
        for s in o["essential_skills"]:
            entry = {"uri": s["uri"], "title": s["title"]}
            if entry not in isco_map[code]["essential"]:
                isco_map[code]["essential"].append(entry)
        for s in o["optional_skills"]:
            entry = {"uri": s["uri"], "title": s["title"]}
            if entry not in isco_map[code]["optional"]:
                isco_map[code]["optional"].append(entry)

    mapping_path = DATA_DIR / "isco_to_esco_skills.json"
    with open(mapping_path, "w", encoding="utf-8") as f:
        json.dump(dict(isco_map), f, indent=2, ensure_ascii=False)
    log(f"  → {len(isco_map)} ISCO-08 codes mapped")

    # ── Step 9: Summary ──
    total_ess = sum(len(v["essential"]) for v in isco_map.values())
    total_opt = sum(len(v["optional"]) for v in isco_map.values())
    elapsed_total = time.time() - start_time
    stats = {
        "total_occupations": len(occupations),
        "occupations_with_isco": len(esco_occs),
        "occupations_without_isco": len(occupations) - len(esco_occs),
        "occupations_failed": failed_occs,
        "total_skills": len(skills),
        "isco_codes_mapped": len(isco_map),
        "total_essential_links": total_ess,
        "total_optional_links": total_opt,
        "elapsed_seconds": round(elapsed_total),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source_api": BASE_URL,
        "source_github": GITHUB_BASE,
    }
    (DATA_DIR / "summary_stats.json").write_text(json.dumps(stats, indent=2))

    log(f"\n=== ESCO PULL COMPLETE ({elapsed_total:.0f}s) ===")
    for k, v in stats.items():
        log(f"  {k}: {v}")

    update_heartbeat(f"DONE - {len(esco_occs)} occs, {len(skills)} skills, {len(isco_map)} ISCO codes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
