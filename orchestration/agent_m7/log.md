# Agent M7 — Skills Adjacency Graph

## Progress
- **16:51 PDT** — Started. Heartbeat written. Reading existing data files.
- **16:52 PDT** — Read ESCO skills (19 occupations), wages, and curated ADJACENCY_MAP.
- **16:53 PDT** — Wrote `scripts/build_adjacency_graph.py` and ran it successfully.
- **16:53 PDT** — ✅ COMPLETE. All 3 output files generated and verified.

## Results
- `data/crosswalks/adjacency_graph.json` — 19 occupations, 155 total adjacency entries, 16 curated entries merged
- `data/crosswalks/adjacency_matrix.csv` — 19×19 pairwise Jaccard matrix (20 rows incl. header)
- `data/crosswalks/skill_gaps.csv` — 13,688 specific missing-skill rows

## Summary Stats
- Average adjacencies per occupation: 8.2
- Most connected: 7422 (Electronics Mechanics and Servicers) — 17 adjacencies
- Most isolated: 3439 (Administrative and Executive Secretaries) — 0 adjacencies (no ESCO skills in source data)
- Top overlap: Cooks ↔ Kitchen Helpers (Jaccard 0.361)

## Notes
- 3439 (Admin/Exec Secretaries) had 0 essential and 0 optional skills in ESCO data, so no data-driven adjacencies could be computed.
- Curated adjacencies to targets outside the 19 occupations (e.g., 3139, 2522, 4215) preserved as `curated_only` entries.
