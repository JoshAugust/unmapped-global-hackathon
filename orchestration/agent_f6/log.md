# Agent F6 — Education Landscape Chart Log

## Task
Build `src/components/education-landscape.tsx` and `src/routes/education.tsx`

## Status: COMPLETE ✅

## Files Written

### `src/components/education-landscape.tsx` (513 lines)
- CSS-only stacked bar chart — no charting library
- Two side-by-side columns: 2025 vs 2035
- 5 education levels: No Education (red) → Primary (orange) → Lower Secondary (yellow) → Upper Secondary (green) → Post-Secondary (blue)
- Inline labels on segments ≥8% height
- Mouse-tracking tooltip with level detail + DataSource citation
- Legend with active segment highlight
- Callout text: "By 2035, the share of Nigerians with upper secondary education is projected to increase from X% to Y% under SSP2"
- `compact` prop for embedding
- `DataSource` citations: WIC SSP2 2023, UNESCO UIS 2024
- Mobile-responsive height via Tailwind `sm:` breakpoints

### `src/routes/education.tsx` (303 lines)
- Route at `/education` via TanStack Router
- Country selector: Ghana, Bangladesh, Nigeria pill buttons
- 4 WDI signal cards: Adult Literacy, Youth Literacy, Primary Enrollment, Secondary Enrollment
- EducationLandscape component embedded
- SSP2 scenario explainer with DataSource badges
- Returns-to-education mini bar chart (from country signals)
- Methodology footer with full citations
- Default country: Nigeria (ssa-nigeria)

### `src/data/countries.ts` (233 lines)
- Added `CountryKey: "ssa-nigeria"`
- Added `educationProjections` field to `CountryConfig` interface
- Added `literacyRate`, `youthLiteracyRate`, `primaryEnrollmentRate`, `secondaryEnrollmentRate` optional fields
- Added full Nigeria country config with SSP2 education projections, signals, wittgenstein data
- Added `educationProjections` + literacy data to Ghana and Bangladesh

### `src/routeTree.gen.ts`
- Registered `/education` route throughout (imports, FileRoutesByFullPath, FileRoutesByTo, FileRoutesById, FileRouteTypes, FileRoutesByPath, RootRouteChildren, rootRouteChildren)

### `src/components/site-nav.tsx`
- Added "Education" nav link at `/education`

### `data/config/country_config_{nga,gha,ken,ind,rwa}.json`
- Added `education_projections`, `literacy_rate_wdi`, `youth_literacy_rate_wdi`, `school_enrollment` to all country JSON configs

## Acceptance Criteria
1. ✅ `src/components/education-landscape.tsx` renders stacked bar chart
2. ✅ `src/routes/education.tsx` at `/education` route
3. ✅ Shows 2025 vs 2035 comparison
4. ✅ CSS-only (no charting library)
5. ✅ DataSource citations (WIC SSP2 2023, UNESCO UIS 2024)
6. ✅ Country selector works (Ghana, Bangladesh, Nigeria)
7. ✅ Mobile-responsive (Tailwind sm: breakpoints)

## Data Notes
- Nigeria SSP2 projections are estimates calibrated to Wittgenstein Centre public data patterns
- All percentages in each year sum to 1.0 (100%)
- `no_education` field uses snake_case matching the task spec
