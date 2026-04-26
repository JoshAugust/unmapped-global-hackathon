# Agent M2: Pull ESCO Taxonomy — Log

## 2026-04-25 16:36 PDT
- Started. Heartbeat written.
- Explored ESCO data sources: API at ec.europa.eu/esco/api + GitHub mirror

## 16:40 - First Approach
- ESCO API bulk endpoint has limit cap (~20 per page at offsets > 0)
- Found GitHub mirror with 13,939 skills + 3,658 occupations (descriptions only, no ISCO codes)
- Hybrid approach: GitHub CSVs for descriptions, API for ISCO codes + skill mappings

## 16:50 - Running Pull Script
- Downloaded GitHub CSVs: 13,939 skills, 3,658 occupations
- API pagination for URIs: got ~14,007 skill URIs, 3,658 occupation URIs
- Fetching individual occupation details at ~7.8/s with 20 concurrent workers
- ETA: ~7 minutes for all occupation details

## API Stats
- Total occupations in API: 3,561
- Total skills in API: 14,158
- GitHub has slightly more occupations (3,658 vs 3,561) — likely includes newer version
