# UNMAPPED — Multi-Angle Review

## Angle 1: Hackathon Judge

### What Impresses
- **Compelling README** — The problem statement is clear ("1.7 billion invisible workers"), the approach is structured (5-step pipeline), and the data table with 9 sources and specific record counts is immediately credible.
- **Data rigour** — Every number has a source citation. The `<DataSource>` component is used throughout the UI. This is rare in hackathon submissions and shows genuine research integrity.
- **Architecture diagram** — The 5-layer architecture (data ingest → crosswalk → recalibration → projections → interface) is well thought through and communicated clearly.
- **Task-level recalibration** — Not just "you're at X% risk" but breaking it into routine manual, routine cognitive, etc. This is genuinely insightful and goes beyond surface-level automation scores.
- **Country-agnostic design** — The country-theme system, multi-locale support (8 languages), and ISO3-parameterised data pipeline demonstrate scalability. This isn't a Nigeria-only tool.
- **Taxonomy crosswalk** — SOC ↔ ISCO-08 ↔ ESCO ↔ O*NET bridged in one explorer is genuinely useful infrastructure.
- **Demo flow** — Landing → Passport (5 steps) → Results dashboard tells a coherent story arc.

### Concerns
- **"Prototype" disclaimer is well-placed** but a judge might wonder: how much of the API is real vs static fallback? The `fetchWithFallback` pattern is honest but should be explained in the methodology.
- **174K+ records claim** should be verifiable. Is there a data audit trail?
- **The LLM classification path** ("Something else") — how reliable is the ISCO-08 mapping? What's the accuracy? A judge would want to know.

### Questions a Judge Would Ask
1. "How accurate is the informal-to-ISCO mapping for occupations not in your preset list?"
2. "What happens when this scales to 50 countries? How much manual calibration is needed per country?"
3. "How do you validate the recalibrated automation probabilities? What ground truth exists?"
4. "What's the deployment model — who runs this, who pays for it?"

---

## Angle 2: Target User (Amara — 22-year-old phone repair technician, Lagos)

### First Impression (5-second test)
- Landing page: **"UNMAPPED — Map informal skills to economic opportunity"** — clear but slightly abstract. "Map your work to better jobs" might land faster.
- The cyan brand bar with "for every young person" is welcoming.
- "Get started" button is prominent and findable. ✅

### Onboarding Flow
- Step 1 (occupation picker): **"Repairing phones, electronics" with 🔧 icon** — Amara would find herself immediately. The ISCO code shown beneath is confusing jargon for her. Not a blocker but mildly alienating.
- The grid layout works well on mobile. Cards are tappable (min 44px touch target). ✅
- Step flow is quick (5 steps, clear progress bar). Not overwhelming.

### Results Page
- The AI Readiness gauge is visually compelling and the "Low/Medium/High risk" label is accessible.
- **Jargon concern**: "Routine Manual", "Non-Routine Cognitive", "ISCO-08: 7422" — Amara wouldn't understand these. The descriptions underneath help but the labels are still academic.
- "Transition Pathways" with "Skill Overlap 72%" is meaningful — she can see she's close to adjacent roles.
- **Currency display** (₦) is correct for Nigeria. ✅

### Would She Use It?
- **Maybe once** — to see what jobs she could move to. The results are interesting but not actionable enough without links to actual training programs or job listings.
- **The language accessibility is good** — Yoruba and Hausa are available. She'd likely stay on English but appreciate the option.
- **On 3G**: The code-split locale chunks are small (3-6 KB). The main bundle at ~290KB gzipped is acceptable but not great for intermittent connections. A service worker for offline capability would help.

### Accessibility Issues
- ISCO/ISCED codes shown in the UI are meaningless to informal workers. Consider hiding these behind a "technical details" toggle.

---

## Angle 3: Technical Reviewer

### Console Statements
- `console.error` in profile-card.tsx (line 105) — **appropriate** (error handling for PDF generation failure)
- `console.warn` in i18n.tsx (lines 66, 114) — **appropriate** (locale loading warnings)
- **No stray console.log statements found.** ✅

### Hardcoded URLs
- ~~`llm-input.tsx` and `followup-questions.tsx` had `http://localhost:8000` fallbacks~~ — **FIXED** in this wave. Now use empty string like all other files.
- All API URLs properly use `import.meta.env.VITE_API_URL || ""` pattern. ✅

### Security
- No API keys or secrets exposed in source code. ✅
- No direct `innerHTML` or `dangerouslySetInnerHTML` usage found. ✅
- DOMPurify is included (purify.es chunk visible in build output) — suggests sanitisation is in place. ✅
- localStorage is used for country/locale persistence — acceptable for non-sensitive data. ✅

### Error Handling
- `fetchWithFallback` pattern provides graceful degradation to static data. ✅
- Results page has proper loading skeleton, error state with user-friendly message. ✅
- try/catch around localStorage access (country-theme.ts, i18n.tsx). ✅

### React Patterns
- All `.map()` calls have `key` props. ✅
- `useCallback` used appropriately for stable function references in passport.tsx. ✅
- `useMemo` for sorted pathways in results.tsx — appropriate. ✅
- No unnecessary re-renders detected from prop drilling or missing memoisation.
- The `useEffect` cleanup pattern (cancelled flag) in results.tsx data fetching is correct. ✅

### Bundle Size
- `results-D9tOtB0z.js` at 625KB (183KB gzip) is large. Recharts is likely the culprit (it's pulled into the results bundle). Consider lazy-loading the chart components.
- `index-DcNO3ffm.js` at 1MB (290KB gzip) is the main framework bundle — typical for React + TanStack Router but worth monitoring.

### Unused Code
- `const API` in `results.tsx` is declared but never used (line 55). Minor dead code.
- Several Lucide icon imports in results.tsx are all actively used. ✅

### CSS
- `@import` order fixed in this wave — Google Fonts now loads before Tailwind. ✅
- No CSS-in-JS runtime overhead (Tailwind utility classes only). ✅

---

## Issues Fixed During Review

| # | Issue | Status |
|---|-------|--------|
| 1 | `localhost:8000` fallback in llm-input.tsx | **FIXED** |
| 2 | `localhost:8000` fallback in followup-questions.tsx | **FIXED** |
| 3 | i18n not wired in passport step titles | **FIXED** |
| 4 | i18n not wired in results section headings | **FIXED** |
| 5 | Country theme not initialised on app load | **FIXED** |
| 6 | Passport hardcoded to NGA regardless of country picker | **FIXED** |
| 7 | CSS @import order causing build warning | **FIXED** |
| 8 | No Bengali locale for Bangladesh | **FIXED** (8 languages total) |

## Design/Content Recommendations (Not Code Fixes)

1. **Hide ISCO/ISCED codes from youth interface** — show only in policymaker/technical views
2. **Add offline PWA capability** — service worker for the target demographic on intermittent connections
3. **Add "What to do next" section to results** — link to training platforms, job boards
4. **Simplify task category labels** — "Routine Manual" → "Repetitive physical work" for youth view
5. **README should mention 8 languages** (currently says 7 — needs update after Bangla addition)
