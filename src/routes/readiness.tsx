import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageShell } from "@/components/page-shell";
import { COUNTRIES } from "@/data/countries";
import { SKILLS } from "@/data/skills";
import { useProfile } from "@/lib/profile-store";
import { profileExposure, suggestAdjacencies } from "@/lib/engine";

export const Route = createFileRoute("/readiness")({
  component: Readiness,
  head: () => ({ meta: [
    { title: "AI Readiness & Displacement Lens — UNMAPPED" },
    { name: "description", content: "Honest automation exposure assessment calibrated for LMICs." },
  ]}),
});

function riskColor(x: number) {
  if (x < 0.25) return "var(--moss)";
  if (x < 0.5) return "var(--cobalt)";
  if (x < 0.7) return "var(--rust)";
  return "oklch(0.5 0.2 25)";
}
function riskLabel(x: number) {
  if (x < 0.25) return "Durable — your work is largely AI-resilient";
  if (x < 0.5) return "Mixed — some tasks shift, the core stays";
  if (x < 0.7) return "Elevated — material reskilling pressure";
  return "High — your task mix faces direct disruption";
}

function Readiness() {
  const [profile] = useProfile();
  const country = COUNTRIES[profile.countryKey];
  const { overall, items } = useMemo(() => profileExposure(profile), [profile]);
  const adj = useMemo(() => suggestAdjacencies(profile), [profile]);
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const sorted = [...items].sort((a, b) => b.exposure - a.exposure);

  return (
    <PageShell
      eyebrow="Module 02 · AI Readiness Lens"
      title={<>Honest exposure. <span className="italic text-cobalt">Local</span> calibration.</>}
      lede={`Calibrated to ${country.region} (multiplier ${country.automationCalibration}). A data-entry job in Bengaluru and a phone-repair stall in Kumasi face very different automation pressures — this lens does not pretend otherwise.`}
    >
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-sm border border-ink bg-paper p-8 shadow-[8px_8px_0_0_var(--ink)]">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Overall exposure · 10-year horizon</div>
          <div className="mt-2 flex items-end gap-4">
            <div className="font-display text-7xl font-black tracking-tight" style={{ color: riskColor(overall) }}>
              {pct(overall)}
            </div>
            <div className="pb-3">
              <div className="text-sm font-semibold">{riskLabel(overall)}</div>
              <div className="text-xs text-muted-foreground">Frey-Osborne baseline · ILO task indices · LMIC calibrated</div>
            </div>
          </div>
          <div className="mt-4 h-3 w-full bg-sand">
            <div className="h-full" style={{ width: pct(overall), background: riskColor(overall) }} />
          </div>

          <div className="mt-8 space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Per-skill exposure</div>
            {sorted.length === 0 && <p className="text-sm text-muted-foreground">No skills on profile yet.</p>}
            {sorted.map(it => (
              <div key={it.id}>
                <div className="flex items-center justify-between text-sm">
                  <span>{it.label}</span>
                  <span className="font-mono text-xs" style={{ color: riskColor(it.exposure) }}>{pct(it.exposure)}</span>
                </div>
                <div className="mt-1 h-1.5 w-full bg-sand">
                  <div className="h-full" style={{ width: pct(it.exposure), background: riskColor(it.exposure) }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-sm border border-line bg-card p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">Wittgenstein 2025–2035</div>
            <h3 className="mt-2 font-display text-xl font-bold">The landscape is shifting</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tertiary-educated youth share in {country.country} (SSP2 projection):
            </p>
            <div className="mt-4 flex items-end gap-4">
              {country.wittgenstein.map(w => (
                <div key={w.year} className="flex-1">
                  <div className="bg-cobalt" style={{ height: `${w.tertiaryYouthPct * 6}px` }} />
                  <div className="mt-2 font-display text-xl font-bold">{w.tertiaryYouthPct}%</div>
                  <div className="font-mono text-[10px] uppercase text-muted-foreground">{w.year}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Competition for cognitive roles will intensify. Skills with social and non-routine manual content stay durable.
            </p>
          </div>

          <div className="rounded-sm border border-line bg-card p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">Build resilience</div>
            <h3 className="mt-2 font-display text-xl font-bold">Adjacent skills · ≤ 6 months</h3>
            {adj.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Add foundational skills first to surface adjacencies.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {adj.map(a => (
                  <li key={a.skill.id} className="flex items-start gap-3 border-t border-line pt-3 first:border-0 first:pt-0">
                    <div className="mt-1 h-2 w-2 rounded-full" style={{ background: riskColor(a.exposure) }} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{a.skill.label}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">exposure {pct(a.exposure)}</div>
                      </div>
                      <div className="text-xs text-muted-foreground">{a.reason}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-sm border border-line bg-ink p-6 text-paper">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt-soft">Methodology</div>
            <p className="mt-2 text-sm leading-relaxed text-paper/80">
              Score = blend of Frey-Osborne occupation baseline (×{country.automationCalibration} for LMIC infra),
              ILO routine-cognitive task share (full weight — LLMs are global), and routine-manual share
              (discounted by physical-automation cost in low-capital contexts).
            </p>
            <Link to="/dashboard" className="mt-4 inline-block font-mono text-xs uppercase tracking-wider text-cobalt-soft hover:text-paper">
              → See matched opportunities
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-12 grid gap-px border border-line bg-line md:grid-cols-3">
        {sorted.slice(0, 3).map(it => {
          const s = SKILLS[it.id as keyof typeof SKILLS];
          return (
            <div key={it.id} className="bg-paper p-6">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Task composition</div>
              <div className="mt-1 font-display text-lg font-bold">{s.label}</div>
              <div className="mt-3 space-y-1.5">
                {Object.entries(s.task).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 text-xs">
                    <span className="w-40 capitalize text-muted-foreground">{k.replace(/([A-Z])/g, " $1")}</span>
                    <div className="h-1 flex-1 bg-sand">
                      <div className="h-full bg-ink" style={{ width: `${v * 100}%` }} />
                    </div>
                    <span className="font-mono w-8 text-right">{Math.round(v * 100)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}