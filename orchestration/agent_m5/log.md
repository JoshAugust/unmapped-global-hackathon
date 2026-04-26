# M5: Unified Crosswalk Database — Build Log

## Started
- Time: 2026-04-25 16:47 PDT

## Completed
- Status: ✅ SUCCESS

## What was built
- **Script:** `scripts/build_unified_crosswalk.py`
- **Database:** `data/crosswalks/unified_crosswalk.db` (18.2 MB)

## Table counts
| Table | Rows |
|-------|------|
| isco_occupations | 619 |
| soc_isco_map | 1,634 |
| automation_scores | 378 |
| esco_skills | 1,530 |
| onet_tasks | 38,347 |
| onet_skills | 65,625 |
| onet_work_activities | 66,297 |

## Views created
- `v_occupation_full` — ISCO occupations + automation scores
- `v_occupation_skills` — Occupations + ESCO skills
- `v_task_composition` — O*NET work activities summarized into 5 task categories per ISCO

## ISCO Coverage
- Total ISCO codes: 619
- With automation scores: 378 (61.1%)
- With ESCO skills: 18 (2.9%) — limited by M4 ESCO API sampling
- With O*NET tasks: 360 (58.2%)

## Test query: ISCO 7422
- Automation probability: 0.6425 (medium-high)
- ESCO skills: 201 (essential + optional)
- O*NET tasks: linked via 4 SOC codes
- Task composition: routine_manual=3.67, routine_cognitive=3.39, nonroutine_manual=2.96, nonroutine_cognitive=3.32, social=3.05

## Acceptance criteria
1. ✅ unified_crosswalk.db exists with 7 tables
2. ✅ Data loaded: soc_isco 1,634 | esco_skills 1,530 | onet_tasks 38,347
3. ✅ All 3 convenience views working
4. ✅ ISCO 7422 test query returns meaningful data
5. ✅ Script at scripts/build_unified_crosswalk.py
