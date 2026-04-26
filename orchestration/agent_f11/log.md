# Agent F11 — DataSource Citation Component

## Status: ✅ COMPLETE

## Files Created
1. **`src/lib/sources.ts`** — Registry of 12 data sources with full metadata (ILOSTAT, WDI, NBS LFS, Frey & Osborne, Wittgenstein SSP2, HCI, ESCO, UN WPP, UNESCO UIS, ITU, AfDB AEO, O*NET)
2. **`src/components/data-source.tsx`** — Reusable citation component with:
   - Inline badge (mono, uppercase, muted) with ⓘ icon
   - Popover with full metadata (dataset, vintage, methodology, caveat, source link)
   - Multi-source support with separator display
   - Compact mode (info icon only)
   - Uses existing Radix Popover from `src/components/ui/popover.tsx`
   - Uses `lucide-react` for Info and ExternalLink icons
   - Exports `DataSourceProps` type for other components

## Design Decisions
- Caveat/data-gap shown in amber-tinted box to draw attention
- Multi-source popover shows count header + separator between entries
- Compact mode strips border/bg for minimal footprint
- `SourceDefinition` type exported from sources.ts for reuse

## Notes
- `node_modules` not installed in repo; couldn't run tsc. Code follows existing project patterns (Radix Popover, cn utility, Tailwind classes).
- `lucide-react` used for icons — check it's in dependencies (standard for shadcn/ui projects).
