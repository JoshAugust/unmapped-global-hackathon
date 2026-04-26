# Agent F19 — Language Switcher + i18n Log

## Status: COMPLETE ✅

---

## Steps completed

### 1. `src/lib/i18n.tsx` ✅
- `I18nContextValue` interface with `locale`, `t`, `setLocale`, `availableLocales`, `isLoading`
- `LocaleInfo` type with `code`, `name`, `nativeName`, `direction`, `flag`
- `AVAILABLE_LOCALES` array — 7 locales: en, fr, yo, ha, sw, hi, rw
- `I18nProvider` component:
  - Reads locale from localStorage on mount, falls back to browser `navigator.language`, then 'en'
  - Lazy-loads locale JSON via dynamic `import()` — Vite will code-split each into its own chunk
  - Translation cache so locale files are only fetched once
  - Falls back to English for missing keys; then to the inline fallback arg; then to the key itself
  - Sets `document.documentElement.lang` and `.dir` on locale change
- `useI18n()` hook with clear error if used outside provider
- Translation cache keyed by locale code

### 2. Locale files in `src/locales/` ✅
All 7 files created with 40+ keys each:
- `en.json` — English (canonical, complete)
- `fr.json` — French (West Africa register — Senegal, Côte d'Ivoire, Rwanda)
- `yo.json` — Yorùbá (Nigeria — diacritics and tonal marks included)
- `ha.json` — Hausa (Nigeria, West Africa)
- `sw.json` — Kiswahili (Kenya, East Africa)
- `hi.json` — हिन्दी (India — Devanagari script)
- `rw.json` — Kinyarwanda (Rwanda)

Each file covers:
- app.title / app.subtitle / app.tagline
- onboarding steps 1–5 (title + hint)
- results section (title, subtitle, ai_gauge, tasks, pathways, demand)
- policymaker dashboard
- common UI strings (back, next, loading, error, country, occupation, etc.)
- nav links (overview, passport, readiness, results, opportunity, education, policymaker, infrastructure, crosswalk, compare, methodology, configure, get_started)
- language.label / language.select

### 3. `src/components/language-switcher.tsx` ✅
- Dropdown with flag + native name display
- `variant="compact"` for navbar (flag + code, right-aligned dropdown)
- `variant="full"` for settings (flag + native name, checkmark on active)
- Closes on outside click (mousedown listener)
- Closes on Escape key
- `aria-haspopup="listbox"`, `aria-expanded`, `role="option"`, `aria-selected` for a11y
- Calls `setLocale()` → triggers localStorage persist + re-render

### 4. Wired into app ✅
- `src/routes/__root.tsx`: imported `I18nProvider`, wrapped `<Outlet />` in `<I18nProvider>`
- `src/components/site-nav.tsx`: imported `LanguageSwitcher`, added `<LanguageSwitcher variant="compact" />` between `<CountryPill />` and the Youth Summit link

---

## Acceptance criteria check

| # | Criterion | Status |
|---|-----------|--------|
| 1 | `src/lib/i18n.tsx` with context + hook + `t()` | ✅ |
| 2 | 7 locale files in `src/locales/` | ✅ |
| 3 | `language-switcher.tsx` with dropdown | ✅ |
| 4 | `I18nProvider` wraps the app | ✅ |
| 5 | `LanguageSwitcher` in navigation | ✅ |
| 6 | Locale persists across page loads (localStorage) | ✅ |
| 7 | Fallback to English for missing keys | ✅ |

---

## Notes for next agents
- To use translations in any component: `const { t } = useI18n()` then `t('key', 'fallback')`
- All locale JSON files use flat dot-notation keys (no nesting)
- Adding a new locale: add to `AVAILABLE_LOCALES` in `i18n.tsx` + create `src/locales/<code>.json`
- RTL support is wired (sets `document.dir`) but no locale currently uses RTL — add Arabic/Urdu if needed
