# Agent M2: Pull ESCO Taxonomy — Log

## 2026-04-25 16:36 PDT — Started
- Explored ESCO data sources: REST API + GitHub mirror
- ESCO API bulk endpoint has limit cap (~20/page), individual fetch works fine

## 16:50 — Hybrid Approach
- GitHub mirror: 13,939 skills + 3,658 occupations (descriptions)
- ESCO API: individual occupation details for ISCO codes + skill mappings
- 20 concurrent workers, ~7.8 requests/sec

## 17:02 — COMPLETE ✅

### Output Files (data/esco/)
| File | Contents |
|------|----------|
| `occupations_en.csv` | 3,552 occupations (2,933 with ISCO-08 codes) |
| `skills_en.csv` | 14,209 skills/competences |
| `isco_to_esco_skills.json` | 426 ISCO-08 4-digit codes → essential/optional skills |
| `summary_stats.json` | Stats and metadata |

### Acceptance Criteria
- ✅ Occupations: 3,552 (target 2,500+) with ISCO-08 codes
- ✅ Skills: 14,209 (target 10,000+) with descriptions
- ✅ Skill↔occupation mapping: 426 ISCO codes, 30,657 essential + 33,765 optional links
- ✅ Script: scripts/pull_esco.py

### Notes
- 106 occupations failed API fetch (API timeouts) — 97% success rate
- 619 occupations without ISCO codes are ISCO group headers, not leaf occupations
- Total elapsed: 736 seconds (~12 minutes)
