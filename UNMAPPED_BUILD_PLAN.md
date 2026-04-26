# UNMAPPED — Final Build Plan

**World Bank Youth Summit × Hack-Nation 2026**
**Budget: 55 hours (40 hackathon + 15 moat)**
**Status: Data layer complete. Research handoff received. Frontend shell exists (Lovable). Ready to build.**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  TanStack Router · Tailwind · Radix UI · Recharts       │
│                                                          │
│  /              Landing + Amara narrative                 │
│  /passport      Module 1: Skills Signal Engine           │
│  /readiness     Module 2: AI Readiness Lens              │
│  /dashboard     Module 3: Opportunity Matching           │
│  /infrastructure  Info: architecture + crosswalk viz     │
│  /configure     Country switcher with visual identity    │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API
┌──────────────────────┴──────────────────────────────────┐
│                   BACKEND (FastAPI)                       │
│                                                          │
│  /api/query      → query_engine.py (core function)       │
│  /api/skills     → LLM skills parser (OpenAI)            │
│  /api/country    → country config loader                 │
│  /api/scrape     → trigger live job refresh              │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│                    DATA LAYER                             │
│                                                          │
│  country_config_{nga,gha}.json   Country parameters      │
│  seed_jobs.json / live_jobs.json  Job demand signals     │
│  occupation_lookup.json          ISCO-08 + automation    │
│  wdi_labour.json                 Macro + econometric     │
│  policymaker_aggregates.json     Aggregate dashboard     │
│  calibration_notes.md            Honesty + methodology   │
│                                                          │
│  + son-of-a-bridge/ datasets     Raw international data  │
│  + O*NET task data               Task-level granularity  │
│  + ESCO taxonomy                 13K skills, 28 langs    │
│  + SOC↔ISCO↔ESCO crosswalk      Taxonomy bridge         │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: Moat — Crosswalk & Derived Analytics (15 hours)

*The analytical infrastructure no other team will have. Makes every downstream module better.*

### 1A. Additional Data Pulls (4 hours)

| # | Task | Hours | Description |
|---|------|:-----:|-------------|
| M1 | **Pull O\*NET task data** | 2 | Download from O\*NET Resource Center: Task Statements (19K tasks mapped to SOC codes), Skills (35 ratings per occupation), Work Activities, Technology Skills. Save to `data/onet/`. These give us task-level granularity for automation recalibration — "what % of a cashier's day is scanning barcodes vs. handling customer complaints." |
| M2 | **Pull ESCO taxonomy** | 2 | Download ESCO v1.2 from EU portal: 13,890 skills, 3,008 occupations, skill↔occupation essential/optional mappings, multilingual labels (EN, FR, AR, BN + 24 more). Save to `data/esco/`. This is the skills vocabulary — when Amara says "I fix phones," we map to specific ESCO competencies, not just a job title. |

### 1B. Crosswalk Engine (5 hours)

| # | Task | Hours | Description |
|---|------|:-----:|-------------|
| M3 | **SOC↔ISCO-08 crosswalk** | 1.5 | Parse the official BLS SOC-to-ISCO mapping (published as Excel). Handle many-to-many relationships (one SOC code can map to multiple ISCO codes). Build clean lookup: `soc_isco_crosswalk.csv`. This bridges Frey-Osborne (SOC) to everything else (ISCO). |
| M4 | **ISCO↔ESCO skill mapping** | 1.5 | Parse ESCO's occupation↔skill relationships. For each ISCO-08 4-digit code, list: essential skills, optional skills, skill URIs, multilingual labels. Build: `isco_esco_skills.json`. This is what turns "ISCO 7422" into "can diagnose hardware faults, understands circuit design, manages customer expectations." |
| M5 | **Unified crosswalk database** | 2 | Combine M3 + M4 + O\*NET tasks into one queryable SQLite/DuckDB database. Single query: "Given ISCO 7422 → what are the O\*NET tasks, ESCO skills, Frey-Osborne automation score, and task composition breakdown?" Add this to the backend so any module can call it. |

### 1C. Derived Analytics (6 hours)

| # | Task | Hours | Description |
|---|------|:-----:|-------------|
| M6 | **LMIC automation recalibration** | 2.5 | For each of the 19 occupations in `occupation_lookup.json`: pull O\*NET task decomposition via crosswalk, compute task composition (% routine-manual, % routine-cognitive, % non-routine-manual, % non-routine-cognitive, % social/interpersonal). Then reweight: in LMIC informal economies, routine-manual share is lower (more improvisation), social share is higher (relationship-based commerce). Output: a recalibrated automation probability per occupation per country that we can *explain at task level*. This turns "26% automation risk" into "the circuit diagnosis part of your work (35% of your time) is at 18% risk, but the customer trust-building (25%) is at 3% risk." |
| M7 | **Skills adjacency graph** | 2 | Using ESCO skill↔occupation mappings: for each of the 19 core occupations, compute skill overlap with all other occupations in the ESCO taxonomy. Output: ranked list of adjacent occupations with skill gap count and specific missing skills. Merge with the hand-researched adjacency pathways from `query_engine.py` — keep the human-written transition descriptions ("3-month solar PV course, ₦30-80k"), but validate and extend with ESCO data. Build: `adjacency_graph.json`. |
| M8 | **Country config auto-generator** | 1.5 | Script that reads our son-of-a-bridge datasets (WDI, ILOSTAT, HCI, Wittgenstein) and generates a `country_config_{iso3}.json` in the same schema as the Nigeria/Ghana configs. Input: ISO3 code. Output: populated config with real education taxonomy, real macro data, real labor signals, real Wittgenstein projections. Adding a new country becomes one command: `python scripts/generate_country.py KEN`. Run for Kenya, India, and one additional country (Rwanda or South Africa). |

---

## Phase 2: Backend API (5 hours)

*Wrap the existing query engine + crosswalk in a REST API the frontend can call.*

| # | Task | Hours | Description |
|---|------|:-----:|-------------|
| B1 | **FastAPI server** | 2 | Mount `query_engine.py` as the core. Endpoints: `GET /api/query?isco08=7422&country=NGA` (main query), `GET /api/country/{iso3}` (full country config), `GET /api/countries` (list available), `GET /api/crosswalk/{isco08}` (taxonomy bridge data for info tab). CORS configured for frontend. |
| B2 | **LLM integration endpoint** | 2 | `POST /api/skills/parse` — accepts free-text skills description in any language, returns mapped ISCO-08 code + ESCO skills + confidence. Uses OpenAI API (gpt-4o-mini for speed, gpt-4o for complex inputs). Also: `POST /api/skills/followup` — given current profile, returns 2-3 contextual follow-up questions to strengthen the mapping. Provider-abstracted (swap to Claude, Gemini, or local model). |
| B3 | **Job scraper trigger** | 1 | `POST /api/refresh/{country}` — triggers `scrape_jobs.py` for a country, writes `live_jobs.json`. For hackathon demo: run manually before presentation. For production: would be cron-scheduled. |

---

## Phase 3: Frontend — Module Rebuilds (18 hours)

*Replace the Lovable shell internals with real data, real interactions, real depth.*

### 3A. Module 1 — Skills Signal Engine (5 hours)

| # | Task | Hours | Description |
|---|------|:-----:|-------------|
| F1 | **Structured onboarding flow** | 2 | Replace the checkbox grid with the 5-step onboarding form from `country_config_nga.json`. Each question renders with the right input type (select, multi-select, select-with-freetext). Questions load from the country config — swap country, get different questions, education levels, and language. Map answers to ISCO-08 code using the mapping table from the handoff. "Something else" triggers the LLM parser (B2). |
| F2 | **LLM free-text fallback** | 1 | When user picks "Something else" or wants to describe skills in their own words: text area → calls `/api/skills/parse` → shows mapped skills with confidence. "We understood: mobile phone repair (92%), customer service (87%), basic accounting (71%). Is this right?" User confirms or edits. |
| F3 | **AI follow-up questions** | 1 | After initial mapping, call `/api/skills/followup` → render 2-3 contextual questions. "You mentioned phone repair — do you also diagnose hardware faults or mainly replace screens?" Each answer refines the profile. Conversational, not form-like. |
| F4 | **Rich profile card output** | 1 | Redesign the passport result: show ISCO-08 occupation with plain-language label, mapped ESCO skills as tags, task composition radar chart (from crosswalk data), automation exposure preview, education equivalence. The card is printable, shareable (generate link), and exportable as PDF. Amara understands it. A judge is impressed by it. |

### 3B. Module 2 — AI Readiness & Displacement Risk (4 hours)

| # | Task | Hours | Description |
|---|------|:-----:|-------------|
| F5 | **Task-level risk breakdown** | 2 | The differentiator. Instead of one overall percentage, show: "Here's how you spend your work time, and which parts face AI pressure." Visualize as a stacked bar or treemap: each task segment colored by risk level. Data from O\*NET task decomposition via crosswalk (M6). Example: "Circuit diagnosis (35% of your time): 18% risk. Customer trust-building (25%): 3% risk. Parts sourcing (20%): 44% risk." This is the insight no other team will show. |
| F6 | **Wittgenstein education landscape** | 1 | Interactive area chart: education distribution in user's country shifting over 2025–2050 under SSP2. Highlight user's education level band. "In 2025, 34M Nigerians have no formal education. By 2040, that drops to 18M. Your secondary education puts you in a growing but competitive middle." Data from our actual Wittgenstein pull. Source citation visible. |
| F7 | **Resilience pathways panel** | 1 | Render the adjacency pathways from `query_engine.py` as visual cards: destination occupation → gap level (color-coded) → specific training description → wage uplift % → demand trend. Enhanced with ESCO skill gap data from M7: "You need these 3 specific skills to get there." Each pathway is actionable, not abstract. |

### 3C. Module 3 — Opportunity Matching & Dashboard (5 hours)

| # | Task | Hours | Description |
|---|------|:-----:|-------------|
| F8 | **Youth matching view** | 2 | Show real matches from `query_engine.py` results. Each match card: occupation title, ISCO code, sector, estimated monthly wage (with source citation), skill fit %, AI resilience %, missing skills to acquire. **Two visible econometric signals** as required by brief: Signal 1 = sector wage comparison bar chart (from `econometric_signal_1`), Signal 2 = vacancy demand by sector (from `econometric_signal_2`). User's sector highlighted in both. |
| F9 | **Policymaker aggregate dashboard** | 2 | Second tab/view using `policymaker_aggregates.json`: skills gap heatmap (8 sectors × gap level), cohort automation exposure by tier (pie/donut chart), NEET overview, education trajectory chart. Every visualization has a source badge. Designed for a program officer asking "where should we invest in training?" |
| F10 | **Country comparison mode** | 1 | Side-by-side: same skills profile across 2 countries. Show how wages, automation risk, opportunity set, and education landscape differ. "Amara's skills in Nigeria vs Ghana vs Kenya." Demonstrates the country-agnostic infrastructure the brief asks for. |

### 3D. Data Provenance & Transparency (3 hours)

| # | Task | Hours | Description |
|---|------|:-----:|-------------|
| F11 | **`<DataSource>` citation component** | 1 | Reusable component: every stat on the platform gets a small citation badge showing source name + year. Click/hover expands: full dataset name, methodology note, vintage, data gap caveat, direct download link. Wire throughout all module pages. Uses the source fields already embedded in `wdi_labour.json`, `seed_jobs.json`, and `query_engine.py` results. |
| F12 | **Expandable data detail panels** | 1 | On each module page: "Explore the data" accordion that shows the underlying data table, a methodology note, and a mini chart for key indicators. The policymaker can drill into the numbers. The judge can verify the data is real. |
| F13 | **Calibration & limits panel** | 1 | User-facing honesty section on every results page. Text pulled verbatim from `calibration_notes.md`: "What this tool doesn't know" — salary data is sparse, geographic bias toward Lagos, informal economy not captured. Builds trust, satisfies the brief's emphasis on honest assessment. |

### 3E. Infrastructure Info Tab (3 hours)

| # | Task | Hours | Description |
|---|------|:-----:|-------------|
| F14 | **`/infrastructure` route** | 1.5 | New page: interactive architecture diagram showing the full system. Data sources (8 international datasets) → crosswalk engine (SOC↔ISCO↔ESCO↔O\*NET) → computation modules → user output. Click any node to see details. Shows real stats: "ILOSTAT: 2.6M rows, 190 countries. Frey-Osborne: 702 occupations. ESCO: 13,890 skills in 28 languages." The judge understands the plumbing in 60 seconds. |
| F15 | **Crosswalk explorer** | 1 | Interactive demo within the info tab: pick any occupation from a dropdown, watch it flow through all 4 taxonomies. "Phone Repair → SOC 49-2097 → ISCO 7422 → ESCO skills: diagnose hardware faults, use testing instruments, repair consumer electronics → O\*NET tasks: test circuits, replace components, explain repairs to customers → Frey-Osborne: 0.39 (recalibrated to 0.26 for Nigeria)." |
| F16 | **Data coverage dashboard** | 0.5 | Within info tab: table showing which datasets have data for which countries, year ranges, row counts. Demonstrates the data foundation is real and deep. |

### 3F. Country System & Visual Identity (3 hours)

| # | Task | Hours | Description |
|---|------|:-----:|-------------|
| F17 | **Country visual identity engine** | 1.5 | Each country gets a distinct visual treatment beyond emoji. Components: hero gradient in national color palette, cultural textile pattern as subtle background (kente for Ghana, adire for Nigeria, kikoy for Kenya, jamdani for Bangladesh, block print for India), country outline SVG silhouette in header. Switching countries transitions the entire visual tone — the app *feels* like it's moved somewhere different. CSS custom properties per country, loaded from config. |
| F18 | **5 country configs with real data** | 1 | Generate via M8 auto-generator + hand-tune: Nigeria 🇳🇬 (urban informal), Ghana 🇬🇭 (urban informal), Kenya 🇰🇪 (East Africa mixed), Bangladesh 🇧🇩 (South Asia manufacturing), India 🇮🇳 (South Asia services). Each has: real education taxonomy, real macro data from WDI, real Wittgenstein projections, real ILOSTAT labor signals, appropriate automation calibration factor. |
| F19 | **Language & i18n** | 0.5 | Language switcher in nav. Externalize all UI strings. For Nigeria: English + Yoruba + Hausa (questions already translated in config). For Ghana: English + Twi. For Bangladesh: English + Bengali. LLM input box accepts any language natively. Use `react-intl` or lightweight alternative. Start with English fully wired; other languages as progressive enhancement. |

---

## Phase 4: Deploy & Polish (5 hours)

| # | Task | Hours | Description |
|---|------|:-----:|-------------|
| D1 | **Deploy backend** | 1 | FastAPI server deployed to Railway or Fly.io (quick, free tier available). Or: Cloudflare Worker wrapping the Python query engine. Environment variables for OpenAI key. CORS whitelisted for joshuaaugustine.page. |
| D2 | **Deploy frontend to joshuaaugustine.page/unmapped** | 1 | Build static frontend (`vite build`), deploy to existing joshuaaugustine.page hosting (corgi-gcp/homepage repo). Configure `/unmapped` path prefix in Vite config + router. Verify all routes work, assets load, API calls succeed. |
| D3 | **Mobile responsiveness pass** | 1 | Amara is on a shared phone with a cracked screen. Every page must work on 375px. Touch targets ≥ 44px, collapsible data panels, swipeable cards, no horizontal scroll. Test the full onboarding → profile → risk → opportunities flow on mobile viewport. |
| D4 | **Demo flow & narrative** | 1 | Build a guided demo mode: "Meet Amara" → she describes her skills → 5-question onboarding → profile generated → risk assessment with task breakdown → opportunities with econometric signals → switch to Nigeria → switch to Kenya → policymaker dashboard → infrastructure tab. Smooth, 5-minute walkthrough. Write speaker notes. |
| D5 | **Error handling & edge cases** | 1 | LLM timeout → graceful fallback to structured input. Empty profile → helpful prompt. Sparse country data → show what's available with "limited data" badge. API down → cached last response. No occupation match → suggest closest + explain why. Loading states throughout. |

---

## Phase 5: Buffer (5 hours)

Reserved for:
- Build errors and integration bugs (always happen)
- Unexpected API changes or rate limits
- Visual polish that only becomes obvious after integration
- Performance optimization if DuckDB queries are slow
- Additional country configs if time permits
- Scraper run for fresh live data before demo

---

## Dependency Graph

```
MOAT (parallel start):
  M1 (O*NET) ──────┐
  M2 (ESCO) ───────┤
  M3 (SOC↔ISCO) ──→ M5 (Unified DB) ──→ M6 (Recalibration)
  M4 (ISCO↔ESCO) ─→ M5               ──→ M7 (Adjacency)
                                       ──→ M8 (Country gen)

BACKEND (after M5):
  B1 (FastAPI) ─┬──→ B2 (LLM endpoints)
                └──→ B3 (Scraper trigger)

FRONTEND (parallel waves, after B1):
  Wave 1: F1, F11, F14, F17    (onboarding, citations, info tab, visual identity)
  Wave 2: F2, F3, F5, F8, F18  (LLM input, risk breakdown, matching, countries)
  Wave 3: F4, F6, F7, F9, F15  (profile card, Wittgenstein, resilience, policymaker, crosswalk)
  Wave 4: F10, F12, F13, F16, F19  (comparison, data panels, limits, coverage, i18n)

DEPLOY (after frontend waves):
  D1 → D2 → D3, D4, D5 (parallel polish)
```

## Summary

| Phase | Hours | Tasks | What You Get |
|-------|:-----:|:-----:|-------------|
| 1. Moat | 15 | M1–M8 | O\*NET + ESCO + crosswalk + recalibrated automation + adjacency graph + country generator |
| 2. Backend | 5 | B1–B3 | FastAPI wrapping query engine + LLM skills parser + live scraper |
| 3. Frontend | 18 | F1–F19 | All 3 modules rebuilt with real data, info tab, country identity, i18n, provenance |
| 4. Deploy | 5 | D1–D5 | Live at joshuaaugustine.page/unmapped, mobile-ready, demo-polished |
| 5. Buffer | 5 | — | Integration fixes, polish, fresh scraper run |
| **Total** | **48** | **35 tasks** | **+ 7 hours buffer** |
