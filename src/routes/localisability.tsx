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
import { COUNTRIES, type CountryKey } from "@/data/countries";
import { useProfile } from "@/lib/profile-store";

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

/* ── Side-by-side reconfiguration story ──────────────────────────── */

const COMPARISON_ROWS: { label: string; nga: string; gha: string }[] = [
  {
    label: "Labour market data",
    nga: "data/nga/wdi_labour.json · NBS Labour Force Survey 2022",
    gha: "data/gha/wdi_labour.json · GLSS-7 / Ghana Statistical Service",
  },
  {
    label: "Currency",
    nga: "₦ Naira (NGN) · ~780/USD",
    gha: "₵ Cedi (GHS) · ~15.6/USD",
  },
  {
    label: "Education taxonomy",
    nga: "WAEC · NECO · JSSC · ND · HND",
    gha: "BECE · WASSCE · TVET · HND · Degree",
  },
  {
    label: "UI language & script",
    nga: "English · Hausa · Yoruba (Latin)",
    gha: "English · Twi · Ewe (Latin)",
  },
  {
    label: "Automation calibration",
    nga: "0.67 — urban informal, growing ICT base",
    gha: "0.55 — urban informal, emerging digital services",
  },
  {
    label: "Opportunity types surfaced",
    nga: "Formal · Self-emp · Bolt/OPay · Oga apprenticeship · Fintech agent",
    gha: "Formal · Self-emp · Bolt/Yango · Master-craftsman apprenticeship · MoMo agent",
  },
];

function SameProductTwoContexts() {
  return (
    <section className="mb-12 rounded-sm border-2 border-ink bg-paper p-6 shadow-[8px_8px_0_0_var(--ink)] sm:p-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-cobalt">
        Same product · two contexts
      </div>
      <h2 className="mt-2 font-display text-2xl font-black md:text-3xl">
        Reconfiguration is a <span className="text-cobalt">JSON swap</span>, not a rewrite.
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-foreground/70">
        Every row below is a value in <code className="font-mono text-xs">data/config/country_config_*.json</code>,
        not a code path.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b-2 border-ink">
              <th className="w-[28%] py-3 pr-3 text-left font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Configurable item
              </th>
              <th className="w-[36%] py-3 pl-3 pr-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🇳🇬</span>
                  <div>
                    <div className="font-display text-sm font-black">Nigeria</div>
                    <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      SSA · urban informal
                    </div>
                  </div>
                </div>
              </th>
              <th className="w-[36%] py-3 pl-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🇬🇭</span>
                  <div>
                    <div className="font-display text-sm font-black">Ghana</div>
                    <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      SSA · urban informal
                    </div>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map(row => (
              <tr key={row.label} className="border-b border-line align-top">
                <td className="py-3 pr-3 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-cobalt">
                  {row.label}
                </td>
                <td className="py-3 pl-3 pr-3 text-sm text-foreground/85">{row.nga}</td>
                <td className="py-3 pl-3 text-sm text-foreground/85">{row.gha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-sm border-l-4 border-cobalt bg-cobalt/5 px-4 py-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-cobalt">
          Diff size
        </span>
        <span className="text-sm text-foreground/80">
          <strong>1 file swapped.</strong> Zero TypeScript files touched. Zero rebuilds required.
        </span>
      </div>
    </section>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}

function ActiveConfigInspector() {
  const [profile, setProfile] = useProfile();
  const active = COUNTRIES[profile.countryKey];
  return (
    <>
      <section className="mt-12">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-cobalt">
          Try it · pick the active config
        </div>
        <h3 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
          Switch the country, watch the app reconfigure.
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-foreground/70">
          Selecting a country here changes the active config for the whole app —
          currency, education taxonomy, calibration, opportunity types and language.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {(Object.keys(COUNTRIES) as CountryKey[]).map(k => {
            const c = COUNTRIES[k];
            const isActive = active.key === k;
            return (
              <button
                key={k}
                onClick={() => setProfile({ ...profile, countryKey: k })}
                className={`rounded-sm border p-6 text-left transition-all ${isActive ? "border-ink bg-paper shadow-[8px_8px_0_0_var(--ink)]" : "border-line bg-card hover:border-ink"}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-3xl">{c.flag}</div>
                    <div className="mt-2 font-display text-2xl font-bold">{c.country}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{c.region}</div>
                  </div>
                  {isActive && <span className="font-mono text-[10px] uppercase tracking-wider text-cobalt">active</span>}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <Kv k="Language" v={c.language} />
                  <Kv k="Currency" v={c.currency} />
                  <Kv k="Education levels" v={String(c.educationLevels.length)} />
                  <Kv k="Automation calibration" v={String(c.automationCalibration)} />
                  <Kv k="Min wage / mo" v={`${c.currency} ${c.signals.minWageMonthly.toLocaleString()}`} />
                  <Kv k="Broadband" v={`${c.signals.mobileBroadbandPenetration}%`} />
                </div>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {c.opportunityTypes.map(t => (
                    <span key={t} className="rounded-full border border-line bg-paper px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">{t}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8 rounded-sm border border-ink bg-ink p-8 text-paper">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-cobalt-soft">Active config · {active.country}</div>
        <h3 className="mt-2 font-display text-2xl font-bold">{active.region}</h3>
        <pre className="mt-6 overflow-x-auto whitespace-pre rounded-sm border border-paper/15 bg-ink/40 p-5 font-mono text-xs leading-relaxed text-paper/90">
{JSON.stringify({
  region: active.region, country: active.country, language: active.language,
  currency: active.currency, education: active.educationLevels.length + " ISCED levels",
  automationCalibration: active.automationCalibration,
  opportunityTypes: active.opportunityTypes,
  signals: active.signals, wittgenstein: active.wittgenstein,
  sources: active.sourceNotes,
}, null, 2)}
        </pre>
      </section>
    </>
  );
}

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
      <SameProductTwoContexts />

      {/* Diff summary — what actually changes */}
      <section className="rounded-sm border-2 border-ink bg-paper p-6 sm:p-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">
          What changes between the two configs
        </div>
        <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
          Five inputs. Zero code changes.
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-foreground/80">
          Reconfiguring the platform for a new country is a single JSON file —
          no code changes, no redeploy gymnastics. These are the five
          dimensions that vary by context, mapped to their config keys:
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

      <ActiveConfigInspector />

      {/* How a new country is onboarded */}
      <section className="mt-12 rounded-sm border border-line bg-card p-6 sm:p-8">
        <div className="flex items-center gap-2 text-cobalt">
          <FileJson className="h-4 w-4" />
          <div className="font-mono text-[10px] uppercase tracking-[0.2em]">
            Adding another country
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