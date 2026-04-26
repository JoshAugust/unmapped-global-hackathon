import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { COUNTRIES } from "@/data/countries";
import { useProfile } from "@/lib/profile-store";
import type { CountryKey } from "@/data/countries";

export const Route = createFileRoute("/configure")({
  component: Configure,
  head: () => ({ meta: [
    { title: "Configure — UNMAPPED" },
    { name: "description", content: "Country-agnostic configuration: swap context without changing code." },
  ]}),
});

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}

/* ── Side-by-side reconfiguration story (per brief: "show context A, then reconfigure to context B") ── */

const COMPARISON_ROWS: { label: string; nga: string; bgd: string }[] = [
  {
    label: "Labour market data",
    nga: "data/nga/wdi_labour.json · NBS Labour Force Survey 2022",
    bgd: "data/bgd/wdi_labour.json · BBS Labour Force Survey 2022",
  },
  {
    label: "Currency",
    nga: "₦ Naira (NGN) · ~780/USD",
    bgd: "৳ Taka (BDT) · ~110/USD",
  },
  {
    label: "Education taxonomy",
    nga: "WAEC · NECO · JSSC · ND · HND",
    bgd: "SSC · HSC · Diploma · Bachelor's",
  },
  {
    label: "UI language & script",
    nga: "English · Hausa · Yoruba (Latin)",
    bgd: "Bengali · English (Bangla script)",
  },
  {
    label: "Automation calibration",
    nga: "0.67 — urban informal, growing ICT base",
    bgd: "0.58 — high RMG exposure, low capital intensity",
  },
  {
    label: "Opportunity types surfaced",
    nga: "Formal · Self-emp · Bolt/OPay · Oga apprenticeship · Fintech agent",
    bgd: "Formal · Self-emp · Pathao · RMG sector · bKash agent · NGO co-op",
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
        The brief asks for one context, then a reconfiguration to a second. Here's what changes
        between SSA-urban-informal (Nigeria) and South-Asia-garment-mixed (Bangladesh) — every
        row below is a value in <code className="font-mono text-xs">data/config/country_config_*.json</code>,
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
                  <span className="text-xl">🇧🇩</span>
                  <div>
                    <div className="font-display text-sm font-black">Bangladesh</div>
                    <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      South Asia · garment-export
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
                <td className="py-3 pl-3 text-sm text-foreground/85">{row.bgd}</td>
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

function Configure() {
  const [profile, setProfile] = useProfile();
  const active = COUNTRIES[profile.countryKey];
  return (
    <PageShell
      eyebrow="Infrastructure layer"
      title={<>One protocol. <span className="text-cobalt">Many</span> countries.</>}
      lede="Country-specific parameters — labor data, education taxonomy, language, automation calibration, opportunity types — are inputs to the system. Swap the file, get a new context. No code changes."
    >
      <SameProductTwoContexts />

      <div className="grid gap-6 md:grid-cols-2">
        {(Object.keys(COUNTRIES) as CountryKey[]).map(k => {
          const c = COUNTRIES[k];
          const isActive = active.key === k;
          return (
            <button key={k} onClick={() => setProfile({ ...profile, countryKey: k })}
              className={`rounded-sm border p-6 text-left transition-all ${isActive ? "border-ink bg-paper shadow-[8px_8px_0_0_var(--ink)]" : "border-line bg-card hover:border-ink"}`}>
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
      <section className="mt-12 rounded-sm border border-ink bg-ink p-8 text-paper">
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
    </PageShell>
  );
}
