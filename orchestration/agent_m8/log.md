# Agent M8 — Country Config Generator

## Status: COMPLETE ✅

## What was built

### 1. `scripts/generate_country.py` — Auto-generator script
- Takes any ISO3 country code: `python scripts/generate_country.py KEN`
- Reads from son-of-a-bridge datasets (WDI, HCI, Wittgenstein, ILO NEET)
- Generates both `country_config_{iso3}.json` AND `data/{iso3}/wdi_labour.json`
- Has curated country metadata for KEN, IND, RWA, NGA, GHA
- For unknown countries: uses minimal defaults with TODO markers
- Populates all real data from CSVs; marks fields needing manual input as "TODO"

### 2. Three new country configs generated

| Country | Config | Labour Data | GDP/cap | Unemployment | HCI |
|---------|--------|-------------|---------|-------------|-----|
| Kenya   | `data/config/country_config_ken.json` | `data/ken/wdi_labour.json` | $2,132 | 5.5% | 0.55 |
| India   | `data/config/country_config_ind.json` | `data/ind/wdi_labour.json` | $2,695 | 4.2% | 0.49 |
| Rwanda  | `data/config/country_config_rwa.json` | `data/rwa/wdi_labour.json` | $1,000 | 11.3% | 0.38 |

### 3. Country-specific details included
- **Kenya**: 8-4-4/CBC education system (KCPE/KCSE), Jua Kali informal sector, M-Pesa, Silicon Savannah
- **India**: 10+2 CBSE system (ITI/polytechnic), Skill India, UPI payments, IT/BPO sector
- **Rwanda**: 6-3-3 system, Umuganda, Vision 2050, Kigali Innovation City, MTN MoMo

### 4. Data sourced from
- WDI: GDP/cap, population, unemployment, youth unemployment, sector employment, education enrollment, internet penetration
- HCI: Human Capital Index scores
- Wittgenstein: Education projections 2025 vs 2035 (SSP2 scenario)
- ILO NEET: Youth NEET rates (SDG 8.5.2)
- Curated: wage data, informal employment %, self-employment %, sector growth outlook, education taxonomy

### Schema match
All configs follow the exact same schema as `country_config_nga.json`:
- `_schema_version`, `_description`, `country`, `data_paths`, `automation`, `education_taxonomy`, `opportunity_types`, `econometric_signals`, `ui`, `skill_input_questions`, `sector_growth_outlook`
