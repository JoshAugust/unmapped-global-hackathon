# Agent M4: ISCO↔ESCO Skill Mapping

## Log
- **16:40** — Started. Writing heartbeat. Checking available data.
- **16:41** — Found M2's `data/esco/` files but they only have raw occupation/skill descriptions (no relationships). Using ESCO REST API instead.
- **16:42** — First attempt with `/resource/taxonomy` endpoint returned 0 occupations. Debugged API.
- **16:43** — Fixed: `/resource/concept` endpoint has `narrowerOccupation` links. Rebuilt script.
- **16:44** — Running full build for 19 priority occupations.
- **16:47** — BUILD COMPLETE. Results:
  - 19 ISCO codes processed (18 with mappings, ISCO 3439 had no ESCO occupations)
  - 1530 total skill rows in flat CSV
  - 779 essential + 751 optional skills across all codes

## Output Files
1. `data/crosswalks/isco_esco_skills.json` — full mapping with skill URIs and labels
2. `data/crosswalks/esco_skills_flat.csv` — 1530 rows (isco08_code, skill_uri, skill_label, skill_type)
3. `scripts/build_isco_esco.py` — reproducible build script (supports `--extend` for additional codes)

## Notable
- ISCO 3439 ("Business services agents not elsewhere classified") has no ESCO occupations mapped — too generic
- ISCO 2221 (Nursing) had the most essential skills (117) — heavily regulated profession
- ISCO 7543 (Product Graders/Testers) had the most ESCO occupations (11)
- ISCO 2512 (Software Developers) had 188 total skills (61 essential, 127 optional)

## Acceptance Criteria
- [x] isco_esco_skills.json with mappings for 19 priority occupations (18 with data, 1 has no ESCO match)
- [x] Flat CSV with 1530 skill mappings (target was 500+)
- [x] Script at scripts/build_isco_esco.py
