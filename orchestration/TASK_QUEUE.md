# UNMAPPED Task Queue — Nightwatch Run

## Status Legend
- `[ ]` = queued
- `[→]` = in progress (agent assigned)
- `[x]` = done
- `[!]` = failed, needs retry

## Phase 1: Moat (M1–M8)

- [x] M1: Pull O*NET task data (19K tasks, skill ratings, work activities) → `data/onet/`
- [ ] M2: Pull ESCO taxonomy (13K skills, occupations, multilingual) → `data/esco/`
- [x] M3: Build SOC↔ISCO-08 crosswalk from BLS mapping → `data/crosswalks/soc_isco.csv`
- [x] M4: Build ISCO↔ESCO skill mapping → `data/crosswalks/isco_esco_skills.json`
- [x] M5: Build unified crosswalk database → `data/crosswalks/unified.db`
- [x] M6: LMIC automation recalibration using O*NET tasks → `data/nga/recalibrated_automation.json`
- [x] M7: Skills adjacency graph from ESCO → `data/crosswalks/adjacency_graph.json`
- [x] M8: Country config auto-generator script → `scripts/generate_country.py` + configs for KEN, IND, RWA

## Phase 2: Backend (B1–B3)

- [x] B1: FastAPI server wrapping query_engine + crosswalk → `backend/`
- [→] B2: LLM integration endpoint (skills parse + followup) → `backend/`
- [→] B3: Job scraper trigger endpoint → `backend/`

## Phase 3: Frontend (F1–F19)

- [ ] F1: Structured 5-step onboarding flow from country config
- [ ] F2: LLM free-text skills fallback input
- [ ] F3: AI follow-up questions for profile strengthening
- [ ] F4: Rich profile card output (radar chart, ESCO skills, export)
- [ ] F5: Task-level risk breakdown visualization
- [ ] F6: Wittgenstein education landscape chart
- [ ] F7: Resilience pathways panel with adjacency data
- [ ] F8: Youth matching view with 2 visible econometric signals
- [ ] F9: Policymaker aggregate dashboard
- [ ] F10: Country comparison mode (side-by-side)
- [ ] F11: DataSource citation component (wired throughout)
- [ ] F12: Expandable data detail panels
- [ ] F13: Calibration & limits panel (honesty text)
- [ ] F14: /infrastructure route with architecture diagram
- [ ] F15: Crosswalk explorer (interactive taxonomy flow)
- [ ] F16: Data coverage dashboard
- [ ] F17: Country visual identity engine (patterns, palettes, silhouettes)
- [ ] F18: 5 country configs with real data
- [ ] F19: Language switcher + i18n externalization

## Phase 4: Deploy (D1–D5)

- [ ] D1: Deploy backend (Railway/Fly.io)
- [ ] D2: Deploy frontend to joshuaaugustine.page/unmapped
- [ ] D3: Mobile responsiveness pass
- [ ] D4: Demo flow & narrative
- [ ] D5: Error handling & edge cases
