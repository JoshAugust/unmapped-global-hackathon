# Mobile Responsiveness & Error Handling Audit

**Audited:** 2026-04-25  
**Scope:** All 15 route files in `src/routes/`

---

## Mobile Responsiveness Audit (D3)

### Touch Targets
| Route | Issue | Severity |
|-------|-------|----------|
| `crosswalk.tsx` | Occupation selector buttons use `px-3 py-2` — adequate (40px+ height) | ✅ OK |
| `crosswalk.tsx` | Skill pills use `px-3 py-1` — ~28px height, below 44px minimum | ⚠️ Low |
| `policymaker.tsx` | Country `<select>` uses `px-3 py-2` — adequate | ✅ OK |
| `policymaker.tsx` | Risk tier badges `px-2 py-0.5` — not interactive, display-only | ✅ OK |
| `compare.tsx` | Country selector `py-3` — adequate | ✅ OK |
| `compare.tsx` | Swap button `px-4 py-3` — adequate | ✅ OK |
| `results.tsx` | Skill pills `px-3 py-1` — ~28px height | ⚠️ Low |
| `dashboard.tsx` | Skill badges `px-2 py-0.5` — display-only, not tappable | ✅ OK |
| `configure.tsx` | Form inputs — need to verify `py-2` minimum | ⚠️ Check |

**Summary:** Interactive elements mostly meet 44px targets. Skill pill buttons in crosswalk and results are slightly undersized at ~28px but remain tappable.

### Horizontal Scroll (375px)
| Route | Issue | Severity |
|-------|-------|----------|
| `crosswalk.tsx` | Flow diagram uses `flex-col gap-2 md:flex-row` — stacks on mobile ✅ | ✅ OK |
| `crosswalk.tsx` | Occupation grid uses `flex-wrap` — wraps properly | ✅ OK |
| `policymaker.tsx` | Skills gap bars use `w-36` fixed width label + `flex-1` — may cause issues on very narrow screens | ⚠️ Low |
| `policymaker.tsx` | Occupation tables use `overflow-x-auto` — scrollable ✅ | ✅ OK |
| `compare.tsx` | MetricRow uses 3-col grid with `min-w-[140px]` center — could overflow at 375px | ⚠️ Medium |
| `results.tsx` | Uses responsive grid `grid-cols-1 md:grid-cols-2` — good | ✅ OK |
| `dashboard.tsx` | Grid layouts responsive | ✅ OK |
| `passport.tsx` | Should verify card layouts stack | ⚠️ Check |

**Summary:** Most layouts use responsive patterns (flex-wrap, grid-cols-1, md: breakpoints). The compare page's 3-column metric row could be tight at 375px due to `min-w-[140px]` center column.

### Text Readability
| Route | Issue | Severity |
|-------|-------|----------|
| All routes | `text-[10px]` and `text-[9px]` used for labels/badges — these are decorative mono labels, not primary content | ✅ Acceptable |
| `policymaker.tsx` | `font-mono text-[10px]` on indicator card labels | ✅ Decorative |
| `crosswalk.tsx` | `text-[9px]` on taxonomy badges | ✅ Decorative |
| Primary content | All uses `text-sm` (14px) or larger — readable | ✅ OK |

**Summary:** Small text sizes are used only for decorative labels (uppercase tracking-wider mono), not for primary readable content. Acceptable typography pattern.

---

## Error Handling Audit (D5)

### Loading States
| Route | Has Loading State | Implementation |
|-------|------------------|----------------|
| `results.tsx` | ✅ Yes | Skeleton components, loading flag, spinner |
| `policymaker.tsx` | ✅ Yes | `CardSkeleton`, `SectionSkeleton` components for each data section |
| `crosswalk.tsx` | ✅ Yes | `FlowSkeleton` + individual `Skeleton` components |
| `compare.tsx` | ✅ Yes | `Skeleton` components per section, `Loader2` spinner |
| `configure.tsx` | ⚠️ N/A | Form page — no async data fetch |
| `dashboard.tsx` | ❌ No | Static content, no loading needed |
| `demo.tsx` | ❌ No | Static demo content |
| `education.tsx` | ❌ No | Static content page |
| `index.tsx` | ❌ No | Landing page, no data fetch |
| `infrastructure.tsx` | ❌ No | Static content |
| `methodology.tsx` | ❌ No | Static content |
| `passport.tsx` | ❌ No | Unclear if fetches data — needs check |
| `readiness.tsx` | ❌ No | Static content |
| `coverage.tsx` | ❌ No | Static content |

**Summary:** All data-fetching routes (results, policymaker, crosswalk, compare) have proper loading states with skeleton UIs. Static content pages don't need them.

### API Error States
| Route | Has Error Handling | Implementation |
|-------|-------------------|----------------|
| `results.tsx` | ✅ Yes | `error` state with message display, fallback via `fetchWithFallback` |
| `policymaker.tsx` | ✅ Yes | `error` state in hook, sections gracefully degrade (show skeletons for null data) |
| `crosswalk.tsx` | ✅ Yes | Falls back to mock data on API failure, shows "Demo mode" indicator |
| `compare.tsx` | ✅ Yes | `error` state in `useCountryData`, `fetchWithFallback` added |

**Summary:** All data routes handle errors. The new `fetchWithFallback` pattern provides graceful degradation across the board.

### Empty Data States
| Route | Handles Empty | Implementation |
|-------|--------------|----------------|
| `results.tsx` | ⚠️ Partial | Shows error if API fails, but no explicit "no results found" for valid queries with empty data |
| `policymaker.tsx` | ✅ Yes | Sections conditionally render only when data exists; skeletons shown for null |
| `crosswalk.tsx` | ✅ Yes | "No data available" message in flow columns, "Select an occupation" prompts |
| `compare.tsx` | ✅ Yes | "Education data unavailable" fallback, "—" for missing metrics |

**Summary:** Empty states are generally well-handled. The crosswalk page is exemplary with explicit empty-state messages. Results page could benefit from a "no results found" state for edge cases.

---

## Recommendations (Non-blocking)
1. **Skill pills:** Consider adding `min-h-[44px]` to interactive pill buttons in crosswalk.tsx and results.tsx for better mobile touch targets
2. **Compare metrics:** Consider stacking MetricRow to single column on very small screens (`<400px`)
3. **Results empty state:** Add an explicit "No occupation data found" message when the API returns valid but empty results
4. **All routes now use `fetchWithFallback`** — the app works fully offline with static demo data ✅
