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

function Configure() {
  const [profile, setProfile] = useProfile();
  const active = COUNTRIES[profile.countryKey];
  return (
    <PageShell
      eyebrow="Infrastructure layer"
      title={<>One protocol. <span className="text-cobalt">Many</span> countries.</>}
      lede="Country-specific parameters — labor data, education taxonomy, language, automation calibration, opportunity types — are inputs to the system. Swap the file, get a new context. No code changes."
    >
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
