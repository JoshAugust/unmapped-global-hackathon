# UNMAPPED — Calibration Notes & Data Limits
*Document all synthetic assumptions, data gaps, and vintage labels. Every signal shown to users must be traceable to this file.*

---

## Automation Calibration

### Why Frey-Osborne Scores Need Adjustment for LMICs

Frey & Osborne (2013) estimated automation probabilities using US O*NET task data. Applying these scores directly to Ghana or Nigeria overstates automation risk for three reasons:

1. **Wage levels**: Automation is economically driven by labour costs. Where wages are low, the capital investment in automation is harder to justify. A robot that replaces a $50,000/year warehouse worker in Ohio cannot justify the same ROI replacing a $150/month worker in Accra.

2. **Infrastructure constraints**: Automation requires reliable power, internet, and capital goods supply chains. Ghana had ~26% power outage rate for firms (World Bank Enterprise Surveys 2022). Nigeria worse. This materially reduces automation deployment rates.

3. **Task composition within occupations**: LMIC versions of the same occupation have different task bundles. A "cashier" in the US operates a barcode scanner integrated POS system. A market stall cashier in Accra operates in a cash economy with no fixed infrastructure. The automatable tasks are structurally different.

### Calibration Factor Derivation

**Source**: ILO (2016), "ASEAN in Transformation: How Technology is Changing Jobs and Enterprises." Extended analysis for SSA contexts in Chang et al. (2016), World Bank Policy Research Working Paper 7765.

- ILO (2016) estimated ~44% of LMIC jobs at high automation risk vs ~57% in OECD — ratio: **0.77**
- Further informal sector adjustment applied: LMIC informal workers have lower task routine intensity than formal sector counterparts → additional **~15% reduction**
- Combined calibration: **0.77 × 0.87 ≈ 0.67**

| Country | Calibration Factor | Rationale |
|---------|-------------------|-----------|
| Ghana   | 0.65 | Urban informal; lower capital availability; significant power infrastructure gaps |
| Nigeria | 0.67 | Larger formal sector in Lagos/Abuja; better ICT infrastructure; higher capital availability |

**Recalibration trigger**: When ILO publishes updated task-content indices with SSA country coverage (expected 2025-2026), this calibration should be revisited.

---

## Data Gaps — What This Tool Does Not Know

*These are surfaced explicitly to users and policymakers in the "limits panel."*

### Ghana (GHA)

| Gap | Impact | Synthetic Assumption Used |
|-----|--------|--------------------------|
| Informal sector wage data | Cannot give Amara her actual likely wage — only formal sector benchmark | Stated caveat: "Informal wages typically 30-60% lower than formal sector figures shown" |
| Occupation-level wage data | Wages are sector-level only, not ISCO-08 occupation level | Mapped occupation to sector; flagged to user |
| Youth NEET 2022-2024 | Latest Ghana-specific data is ILO 2021 modelled estimate | Vintage label: "ILO modelled estimate, 2021. Direct survey data: GSS GLSS7 (2017)" |
| Rural sector coverage | Tool calibrated for urban Accra context | Stated in tool onboarding: "This tool is currently calibrated for urban areas. Rural contexts may differ significantly." |
| Gig economy / platform work | No official data on Bolt, Glovo, social commerce workers | Category acknowledged; no wage data available |

### Nigeria (NGA)

| Gap | Impact | Synthetic Assumption Used |
|-----|--------|--------------------------|
| Unemployment rate discontinuity | NBS changed methodology in 2022; historical data not comparable | Tool uses 2022+ NBS data with explanatory note |
| Informal sector wage data | Same as Ghana — no systematic national tracking | Same caveat applied |
| Regional variation | National figures mask Lagos/Abuja vs. North divide | Tool notes: "These figures are national averages. Lagos and Abuja labour markets differ significantly from northern states." |
| FX volatility impact on real wages | Naira has depreciated ~70% since 2022; USD-converted wages need care | Conversion rate year and method stated; real purchasing power caveat added |
| Ethnic/language disaggregation | No occupation-level data by language group | Not modelled |

---

## Data Vintage Labels

*Every signal shown to users must carry a vintage label. These are the required labels.*

| Signal | Country | Vintage | Source |
|--------|---------|---------|--------|
| Sector wages | GHA | 2017 | ILO ILOSTAT EAR_4MTH_SEX_ECO_CUR_NB_A |
| Sector wages | NGA | 2022 | NBS Labour Force Survey Q4 2022 |
| Youth NEET | GHA | 2021 (modelled) | ILO ILOSTAT SDG 8.6.1 |
| Youth NEET | NGA | 2021 (modelled) | ILO ILOSTAT SDG 8.6.1 |
| Internet penetration | GHA | 2022 | WDI IT.NET.USER.ZS |
| Internet penetration | NGA | 2022 | WDI IT.NET.USER.ZS |
| GDP per capita | GHA | 2022 | WDI NY.GDP.PCAP.CD |
| GDP per capita | NGA | 2022 | WDI NY.GDP.PCAP.CD |
| Automation scores | Both | 2013 (calibrated 2024) | Frey & Osborne (2013); LMIC calibration per ILO (2016) |
| Education projections | Both | 2018 projection model | Wittgenstein Centre v2.0 |
| Sector growth outlook | GHA | 2023 | World Bank Ghana Economic Update 2023 |
| Sector growth outlook | NGA | 2023-2024 | World Bank Nigeria Economic Update 2023; PwC Nigeria 2024 |
| Human Capital Index | Both | 2020 | World Bank HCI |

---

## Cross-Country Config Swap — What Changes

*Demo script for showing reconfiguration from Ghana → Nigeria.*

**What changes when you swap `country_config_gha.json` → `country_config_nga.json`:**

1. ✅ All UI text labels update (SHS → WAEC/NECO; apprenticeship note changes)
2. ✅ Currency display: GHS ₵ → NGN ₦
3. ✅ Wage data source updates to NBS LFS 2022
4. ✅ Automation calibration: 0.65 → 0.67
5. ✅ Sector growth outlook shows Lagos tech premium
6. ✅ Language options add Hausa, Yoruba, Igbo
7. ✅ Opportunity types: fintech agent appears; cooperative removed
8. ✅ Onboarding questions reference Nigerian credentials (WAEC, ND, HND)
9. ✅ Data gap panel shows Nigeria-specific gaps (FX volatility, methodology discontinuity)
10. ✅ Wittgenstein projections show Nigeria's steeper education gap

**What does NOT change:**
- Codebase
- ISCO-08 occupation taxonomy
- Frey-Osborne base scores
- UI framework
- API interfaces

---

## What This Tool Doesn't Know — User-Facing Text

*Displayed in the "limits panel" at the bottom of every skills profile.*

> **What this tool can't tell you**
> 
> This profile is built from real data — but all data has limits. Here's what we don't know:
> 
> - **Your actual likely wage**: The wages shown are from the formal economy. If you work informally, your actual earnings may be different — often lower, but sometimes higher for skilled trades.
> - **Your exact job opportunities**: We can show you which sectors are growing and what skills they value. But we can't see the specific job openings available to you today.
> - **How fast AI will actually arrive**: The automation risk we show reflects research on current technology. The pace of actual change in your community depends on investment, infrastructure, and policy decisions that are still being made.
> - **What's right for you personally**: Only you know your full situation — family commitments, transport access, health, goals. Use this profile as a starting point, not a final answer.
> 
> *Data sources and vintage labels: see the full data notes.*
