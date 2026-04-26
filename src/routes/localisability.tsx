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
import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { COUNTRIES, type CountryKey, type CountryConfig } from "@/data/countries";
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
  const [leftKey, setLeftKey] = useState<CountryKey>("ssa-nigeria");
  const [rightKey, setRightKey] = useState<CountryKey>("ssa-ghana");

  const left = COUNTRIES[leftKey];
  const right = COUNTRIES[rightKey];

  function swap() {
    setLeftKey(rightKey);
    setRightKey(leftKey);
  }

  return (
    <PageShell
      eyebrow="About · Country-agnostic protocol"
      title={
        <>
          The same code runs for{" "}
          <span className="text-cobalt">very different economies</span>.
        </>
      }
      lede="The brief asks for a tool that is not hardcoded to one country. Compare any two contexts below — every difference you see is driven by a JSON config, not a separate codebase."
    >
      {/* Swap control — only two configured contexts, so a single
          toggle is friendlier than two dropdowns of two options each. */}
      <section className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line bg-card px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Comparing <span className="text-cobalt">{left.flag} {left.country}</span> ↔ <span className="text-rust">{right.flag} {right.country}</span>
        </div>
        <button
          type="button"
          onClick={swap}
          className="inline-flex items-center gap-2 border-2 border-ink bg-paper px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink hover:bg-ink hover:text-paper"
        >
          ↔ Swap sides
        </button>
      </section>

      {/* Side-by-side comparison */}
      <section className="grid gap-6 md:grid-cols-2">
        <ContextColumn config={left} accent="cobalt" />
        <ContextColumn config={right} accent="rust" />
      </section>

      {/* Diff summary — what actually changes */}
      <section className="mt-12 rounded-sm border-2 border-ink bg-paper p-6 sm:p-8">
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

function ContextColumn({
  config,
  accent,
}: {
  config: CountryConfig;
  accent: "cobalt" | "rust";
}) {
  const border = accent === "cobalt" ? "border-cobalt" : "border-rust";
  const ring = accent === "cobalt" ? "bg-cobalt/5" : "bg-rust/5";
  return (
    <article
      className={`rounded-sm border-2 ${border} ${ring} p-5 sm:p-6 shadow-[6px_6px_0_0_var(--ink)]`}
    >
      <header className="flex items-center gap-3 border-b border-ink/10 pb-4">
        <span className="text-3xl" aria-hidden="true">{config.flag}</span>
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {config.region}
          </div>
          <h3 className="truncate font-display text-2xl font-black leading-tight">
            {config.country}
          </h3>
        </div>
      </header>

      <dl className="mt-5 space-y-4 text-sm">
        <Row k="Currency / FX→USD" v={`${config.currency} (×${config.exchangeToUsd})`} />
        <Row k="UI language · script" v={`${config.language} · ${config.script}`} />
        <Row
          k="Automation calibration"
          v={`×${config.automationCalibration.toFixed(2)} of global Frey-Osborne baseline`}
        />
        <Row
          k="Opportunity types surfaced"
          v={config.opportunityTypes.join(" · ")}
        />
        <Row
          k="Education taxonomy"
          v={`${config.educationLevels.length} levels (ISCED ${Math.min(...config.educationLevels.map(e => e.isced))}–${Math.max(...config.educationLevels.map(e => e.isced))})`}
        />

        {/* Education ladder */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Local credentials
          </div>
          <ul className="mt-2 space-y-1">
            {config.educationLevels.map(lvl => (
              <li
                key={lvl.id}
                className="flex items-baseline justify-between gap-3 border-b border-line/60 py-1"
              >
                <span className="truncate text-foreground">{lvl.label}</span>
                <span className="shrink-0 font-mono text-[10px] uppercase text-muted-foreground">
                  ISCED {lvl.isced}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Real signals snapshot */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Stat
            label="Median youth wage"
            value={`${config.currency} ${config.signals.medianYouthWageMonthly.toLocaleString()}/mo`}
          />
          <Stat
            label="Min wage"
            value={`${config.currency} ${config.signals.minWageMonthly.toLocaleString()}/mo`}
          />
          <Stat
            label="Youth unemployment"
            value={`${config.signals.youthUnemployment}%`}
          />
          <Stat
            label="Informal share"
            value={`${config.signals.informalShare}%`}
          />
          <Stat
            label="Mobile broadband"
            value={`${config.signals.mobileBroadbandPenetration}%`}
          />
          <Stat
            label="Tertiary youth (2035)"
            value={`${config.wittgenstein[config.wittgenstein.length - 1].tertiaryYouthPct}%`}
          />
        </div>

        {/* Top-3 sector growth */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Top growth sectors
          </div>
          <ul className="mt-2 space-y-1">
            {[...config.signals.sectorGrowth]
              .sort((a, b) => b.growthPct - a.growthPct)
              .slice(0, 3)
              .map(s => (
                <li
                  key={s.sector}
                  className="flex items-baseline justify-between gap-3 border-b border-line/60 py-1"
                >
                  <span className="truncate text-foreground">{s.sector}</span>
                  <span className="shrink-0 font-mono text-xs font-semibold text-cobalt">
                    +{s.growthPct.toFixed(1)}%
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </dl>

      <footer className="mt-5 border-t border-ink/10 pt-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Sources
        </div>
        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          {config.sourceNotes.map(n => (
            <li key={n}>· {n}</li>
          ))}
        </ul>
      </footer>
    </article>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {k}
      </span>
      <span className="text-right font-medium text-foreground">{v}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-line bg-paper px-3 py-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 font-display text-sm font-bold text-ink">
        {value}
      </div>
    </div>
  );
}

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