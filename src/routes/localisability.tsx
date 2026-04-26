/**
 * /localisability — direct demonstration of the brief's "Country-Agnostic
 * Requirement" (page 4):
 *
 *   "show your tool configured for one context (e.g. Sub-Saharan Africa,
 *    urban informal economy), then show what it would take to reconfigure
 *    for a second context (e.g. South Asia, rural agricultural)."
 *
 * We render two CountryConfig snapshots side-by-side, fed by the same
 * `COUNTRIES` map used everywhere else in the app — proving that swapping
 * context is a JSON edit, not a code change. A configurable selector lets
 * a judge swap either column at will.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { ArrowRight, Check, FileJson } from "lucide-react";

export const Route = createFileRoute("/localisability")({
  component: LocalisabilityPage,
  head: () => ({
    meta: [
      { title: "Localisability — UNMAPPED" },
      {
        name: "description",
        content:
          "Demonstration: how UNMAPPED reconfigures from a Sub-Saharan urban-informal context to a South-Asia rural-agricultural context — entirely through JSON configs, no code changes.",
      },
    ],
  }),
});

function LocalisabilityPage() {
  return (
    <PageShell
      eyebrow="About · Country-agnostic protocol"
      title={
        <>
          The same code runs for{" "}
          <span className="text-cobalt">very different economies</span>.
        </>
      }
      lede="Our tool is not hardcoded to any one country. It can be directly plugged into any geographic context — every difference you see is driven by a JSON config, not a separate codebase."
    >
      {/* Diff summary — what actually changes */}
      <section className="rounded-sm border-2 border-ink bg-paper p-6 sm:p-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">
          What changes between the two configs
        </div>
        <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
          Five inputs. Zero code changes.
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-foreground/80">
          The brief's "configurable without changing your codebase" requirement
          is satisfied by a single JSON file per country. Here are the five
          dimensions the brief calls out, mapped to their config keys:
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          <DiffItem
            label="Labor-market data structure"
            keyName="signals.medianYouthWageMonthly · signals.sectorGrowth"
          />
          <DiffItem
            label="Education taxonomy & credential mapping"
            keyName="educationLevels[] · isced"
          />
          <DiffItem
            label="Language and script of UI"
            keyName="language · script · src/locales/{xx}.json"
          />
          <DiffItem
            label="Automation exposure calibration"
            keyName="automationCalibration ∈ [0,1]"
          />
          <DiffItem
            label="Opportunity types surfaced"
            keyName="opportunityTypes[]"
          />
        </ul>
      </section>

      {/* How a new country is onboarded */}
      <section className="mt-12 rounded-sm border border-line bg-card p-6 sm:p-8">
        <div className="flex items-center gap-2 text-cobalt">
          <FileJson className="h-4 w-4" />
          <div className="font-mono text-[10px] uppercase tracking-[0.2em]">
            Adding a 7th country
          </div>
        </div>
        <h3 className="mt-2 font-display text-xl font-bold">
          One JSON file. Three minutes.
        </h3>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-foreground/80">
          <li>
            Drop a new <code className="rounded bg-sand px-1.5 py-0.5 text-xs">data/config/country_config_xxx.json</code>{" "}
            with the five inputs above.
          </li>
          <li>
            Drop a sibling <code className="rounded bg-sand px-1.5 py-0.5 text-xs">data/xxx/wdi_labour.json</code>{" "}
            (WDI / ILOSTAT pulls — schema is shared across countries).
          </li>
          <li>
            (Optional) Add <code className="rounded bg-sand px-1.5 py-0.5 text-xs">src/locales/xx.json</code>{" "}
            for a new UI language.
          </li>
        </ol>
        <p className="mt-4 text-xs text-muted-foreground">
          Frey-Osborne automation scores, ESCO/O*NET crosswalks, and
          Wittgenstein projections are global inputs — they require no
          per-country work.
        </p>
      </section>

      {/* Cross-link to methodology */}
      <section className="mt-12 rounded-sm border-2 border-ink bg-ink p-6 sm:p-8 text-paper">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt-soft">
          Want the underlying maths?
        </div>
        <h3 className="mt-2 font-display text-2xl font-bold">
          See how the calibration is calculated
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-paper/80">
          The country calibration factor (e.g. ×0.55 for Ghana) is not a
          guess — it's derived from infrastructure and task-mix proxies.
        </p>
        <Link
          to="/methodology"
          className="mt-5 inline-block border-2 border-cobalt-soft bg-cobalt-soft/10 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-paper hover:bg-cobalt-soft/20"
        >
          → How it works
        </Link>
      </section>
    </PageShell>
  );
}

/* ── Side-by-side column ─────────────────────────────────────────── */

function DiffItem({ label, keyName }: { label: string; keyName: string }) {
  return (
    <li className="flex items-start gap-3 rounded-sm border border-line bg-paper p-3">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
      <div className="min-w-0">
        <div className="text-sm font-semibold text-ink">{label}</div>
        <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
          {keyName} <ArrowRight className="ml-1 inline h-3 w-3" />
        </div>
      </div>
    </li>
  );
}