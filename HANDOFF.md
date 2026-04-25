# UNMAPPED — AI Handoff Document
**Hack-Nation × World Bank Youth Summit · Global AI Hackathon 2026**
**Status: Data layer complete. Frontend and API layer to build.**

---

## What This System Does

UNMAPPED closes the gap between a young person's real skills and real economic opportunity. A user inputs their work experience and education. The system returns: a standardised skills profile, AI automation risk for their occupation, matching job opportunities (direct and adjacent), and two live econometric signals (sector wages + vacancy demand).

Primary target: Nigeria, urban informal economy. Localisation-ready for Ghana and broader SSA.

---

## What Is Already Built (do not rebuild)

### Data Layer — fully functional

| File | What It Contains | How to Use It |
|------|-----------------|---------------|
| `data/config/country_config_nga.json` | All Nigeria-specific config: education taxonomy, UI strings, automation calibration factor (0.67), currency, supported languages, skill input questions (5 questions for onboarding) | Load this at app start. Swap for `country_config_gha.json` to switch to Ghana — no code changes needed |
| `data/config/country_config_gha.json` | Same structure for Ghana. Calibration factor 0.65. Supports English + Twi. | Same as above |
| `data/nga/wdi_labour.json` | Nigeria macro data: GDP, employment by sector, wages by sector, education rates, digital penetration, Wittgenstein 2025→2035 education projections, sector growth outlook. Every field has source + vintage label. | Read-only reference. Feeds Signal 1 and Signal 2. |
| `data/gha/wdi_labour.json` | Same structure for Ghana | Same as above |
| `data/nga/occupation_lookup.json` | 19 ISCO-08 occupations with: automation probability (calibrated for Nigeria), risk tier (low/medium/high), risk explanation text, durable skills list, adjacent upskill recommendations, sector wage benchmark | Query by `isco08` code to get automation data for any occupation |
| `data/gha/occupation_lookup.json` | Same for Ghana | Same as above |
| `data/nga/seed_jobs.json` | Nigeria job demand data: 8 sectors ranked by vacancy count with wages, 9 occupations with vacancy estimates + salary data + AI risk flags + adjacency pathways, informal economy signals (POS agents, gig drivers, traders) | Primary data source for matching layer. Replace with `live_jobs.json` after running scraper. |
| `data/nga/policymaker_aggregates.json` | Skill gap heatmap (8 sectors), cohort automation exposure by tier, NEET overview, education trajectory | Policymaker view only |
| `data/config/calibration_notes.md` | Full documentation of calibration rationale, data gaps, vintage labels, and user-facing "what this tool doesn't know" text | Copy the user-facing text verbatim into the UI |
| `data/isco_fo_joined.csv` | Raw joined lookup: ISCO-08 occupations × Frey-Osborne automation scores × LMIC calibration | Used by build_pipeline.py — do not query directly |

### Scripts — run once, do not modify

| Script | Purpose | When to Run |
|--------|---------|-------------|
| `scripts/build_pipeline.py` | Builds `occupation_lookup.json` for both countries | Already run. Re-run only if calibration factors change |
| `scripts/build_policymaker.py` | Builds `policymaker_aggregates.json` | Already run |
| `scripts/build_frey_osborne.py` | Builds raw automation score files | Already run |
| `scripts/scrape_jobs.py` | Live scraper: queries LinkedIn + Indeed for Nigerian jobs across 14 occupation categories. Run from any machine with internet. Outputs `live_jobs.json` | Run during hackathon from your laptop: `python scripts/scrape_jobs.py --country NGA` |
| `scripts/query_engine.py` | **Main query function** — call this from the API layer | Import and call `query_job_demand()` |

### The Core Query Function

```python
from scripts.query_engine import query_job_demand, format_for_user

result = query_job_demand(
    isco08="7422",          # Electronics Mechanics (phone repair)
    country_code="NGA",     # or "GHA"
    informal_skills=["basic coding", "three languages"],
    experience_years=5,
    user_goal="understand what jobs pay"
)

# result is a dict with these keys:
# result["occupation_profile"]        — isco08, label, sector, automation risk
# result["direct_demand"]             — vacancy count, salary, demand trend, sources
# result["adjacency_pathways"]        — list of reachable occupations with gap analysis
# result["ai_risk"]                   — level, headline, what_to_do, source
# result["econometric_signal_1"]      — sector wages table (for display to user)
# result["econometric_signal_2"]      — vacancy counts by sector (for display to user)
# result["data_limits"]               — list of honest caveats to show user
# result["data_freshness"]            — whether using live or seed data, timestamp

print(format_for_user(result))  # plain-language mobile-friendly output
```

---

## ISCO-08 Codes for Key Occupations

Map user onboarding answers to these codes. The `country_config_nga.json` has the skill_input_questions already written — map `q_work_activity` answers to these codes.

| User Says | ISCO-08 | Label |
|-----------|---------|-------|
| Repairing phones, electronics | 7422 | Electronics Mechanics and Servicers |
| Selling goods (market, shop, WhatsApp) | 5221 | Shopkeepers and Stall Keepers |
| Sewing, tailoring | 7531 | Tailors, Dressmakers |
| Driving (Bolt, okada, commercial) | 8322 | Car, Taxi and Van Drivers |
| Cooking, food prep, catering | 5120 | Cooks |
| Construction, building work | 7112 | Bricklayers / Construction Workers |
| Farming | 9211 | Crop Farm Labourers |
| Teaching, training others | 2356 | Vocational Education Teachers |
| Office, admin work | 4132 | Data Entry Clerks |
| Healthcare, caring for others | 2221 | Nursing Professionals |
| IT, tech, computer work | 2512 | Software Developers |
| Fintech, mobile money agent | 4215 | Client Information Workers (POS/agent) |
| Creative work (content, design) | 2651 | Creative/Performing Artists |
| Something else | null | — prompt for freetext, map via Claude API |

---

## What Still Needs to Be Built

### Module 01 — Skills Signal Engine (frontend + profile generation)

**Not yet built.** This is the user-facing onboarding and profile output.

Requirements from challenge brief:
- User inputs: education level, informal experience, demonstrated competencies
- System maps these to ISCO-08 + skills tags
- Outputs a human-readable, portable skills profile
- Profile must be explainable to a non-expert user

**Inputs available from existing system:**
- `country_config_nga.json` → `skill_input_questions` — 5 onboarding questions already written, with answer options and `maps_to` fields
- `occupation_lookup.json` — automation risk and durable skills for every occupation
- `query_engine.py` → `query_job_demand()` — full demand signal output

**What to build:**
1. A 5-step onboarding form (use `skill_input_questions` from config verbatim)
2. Map form answers to `isco08` code (use the table above)
3. Call `query_job_demand(isco08, country_code)` 
4. Render the result as a skills profile card with: occupation label, risk tier, top 3 adjacency pathways, two econometric signals
5. The profile must show data sources — use `result["econometric_signal_1"]["source"]` and `result["econometric_signal_2"]["source"]` directly

**Design constraints (from challenge brief):**
- Low bandwidth mode: `max_initial_payload_kb: 150` (in config)
- Mobile-first, reading level: secondary school
- Tone: `warm_direct` (in config)

---

### Module 02 — AI Readiness & Displacement Risk Lens (partial)

**Partially built.** The data is there; the UI is not.

What exists:
- `result["ai_risk"]` from `query_job_demand()` — level, headline, what_to_do text
- `occupation_lookup.json` — risk_tier, risk_explanation, durable_skills, adjacent_upskill per occupation
- Wittgenstein 2025→2035 projections in `wdi_labour.json` → `wittgenstein_projections` — formatted for chart display
- ILO 2025 GenAI calibrated scores in occupation_lookup

What still needs building:
- A visual risk indicator (traffic light or similar) showing risk level
- A "durable skills" panel — what parts of your work AI cannot replace
- A "what's changing by 2035" panel using Wittgenstein data (already chart-formatted)
- The "adjacent upskill" recommendations panel — already in `adjacency_pathways` from query

---

### Module 03 — Opportunity Matching & Econometric Dashboard

**Data built; display layer not built.**

What exists:
- `result["econometric_signal_1"]` — sector wages ranked, with source + caveat
- `result["econometric_signal_2"]` — vacancies by sector ranked, with source + caveat
- `result["direct_demand"]` — specific demand for user's occupation
- `result["adjacency_pathways"]` — reachable jobs with gap, wage uplift, employer examples
- `policymaker_aggregates.json` — skill gap heatmap + cohort exposure for policymaker view

What still needs building:
- Youth user view: wage comparison chart + vacancy bar chart (use Signal 1 + Signal 2 data directly)
- Opportunity cards: one card per adjacency pathway, showing gap + wage + demand trend
- Policymaker view: skill gap heatmap, sector demand table, cohort exposure breakdown (data in `policymaker_aggregates.json`)
- The challenge requires TWO econometric signals visibly shown to user — both are in `result["econometric_signal_1"]` and `result["econometric_signal_2"]`, with source labels

---

### Dynamic Data Refresh (not built)

**Architecture is defined; scheduler not built.**

`scripts/scrape_jobs.py` is the scraper. It reads `OCCUPATION_QUERIES` (14 categories), calls LinkedIn + Indeed via python-jobspy, and writes `live_jobs.json`. `query_engine.py` automatically uses `live_jobs.json` if it exists, falls back to `seed_jobs.json`.

To make this dynamic:
- Run `scrape_jobs.py` on a cron (daily or weekly)
- Or trigger a refresh via an API endpoint that calls `run_scrape(country_code)`
- For the hackathon demo: run it manually before the presentation

---

### Country Config Swap Demo (not built)

Switch from Nigeria to Ghana by changing one line:
```python
# Nigeria
result = query_job_demand(isco08="7422", country_code="NGA")

# Ghana — same function, different data
result = query_job_demand(isco08="7422", country_code="GHA")
```

For the demo, show the config switch live. Key differences that will be visible:
- Calibration factor: 0.67 → 0.65
- Education taxonomy: WAEC/NECO → WASSCE/BECE
- Mobile money signal: Ghana 68% adoption vs Nigeria 34%
- Sector wages differ (Ghana ICT median $489 vs Nigeria $340)
- Youth NEET: Ghana 21.3% vs Nigeria 26.8%

---

## API Contract for Frontend (Owner B)

Mount `scripts/` as a module and call:

```python
# Install
pip install python-jobspy pandas

# Import
import sys; sys.path.insert(0, "/path/to/unmapped")
from scripts.query_engine import query_job_demand

# Call
result = query_job_demand(isco08, country_code)

# All keys guaranteed to be present in result:
result["query"]                    # isco08, country, timestamp
result["data_freshness"]           # source_type: "live"|"seed", scraped_at
result["occupation_profile"]       # isco08, label, sector, automation_risk, automation_prob
result["direct_demand"]            # may be None if occupation not in seed data
result["informal_demand"]          # may be None
result["adjacency_pathways"]       # list, may be empty
result["ai_risk"]                  # level, headline, detail, what_to_do, source
result["econometric_signal_1"]     # name, description, user_sector, data[], source, caveat
result["econometric_signal_2"]     # name, description, data[], source, caveat
result["data_limits"]              # list of strings — show these to user
```

If you need a REST API instead of direct import, wrap `query_job_demand()` in a FastAPI endpoint:

```python
from fastapi import FastAPI
from scripts.query_engine import query_job_demand

app = FastAPI()

@app.get("/query")
def query(isco08: str, country: str = "NGA"):
    return query_job_demand(isco08, country)
```

---

## Requirements

```
python-jobspy>=1.1.80
pandas>=1.5.0
```

Install: `pip install python-jobspy pandas`

No other dependencies needed for the data layer.

---

## Honest Limits (show these in the UI — text already in calibration_notes.md)

1. Salary data is sparse — most Nigerian job postings omit salary. Figures are sector medians from NBS LFS 2022, not scraped salary data.
2. Geographic bias — Lagos and Abuja account for ~65% of formal listings.
3. Informal economy not captured — POS agents, gig drivers, market traders do not appear in LinkedIn/Indeed.
4. Seed data vintage — vacancy counts from April 2025. Run `scrape_jobs.py` for fresh data.
5. Adjacency pathways are curated, not ML-derived — based on skill overlap research, not live co-occurrence data.

---

## Files to Hand to Eragon in Order of Priority

1. This file (`HANDOFF.md`) — read first
2. `scripts/query_engine.py` — the core function
3. `data/config/country_config_nga.json` — onboarding questions + UI config
4. `data/nga/seed_jobs.json` — job demand data
5. `data/nga/occupation_lookup.json` — automation + adjacency data
6. `scripts/scrape_jobs.py` — live data refresh
7. `data/config/calibration_notes.md` — user-facing limits text

Everything else is supporting data that the above files read automatically.
