import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { COUNTRIES, type CountryConfig } from "@/data/countries";
import { SKILLS, type SkillId } from "@/data/skills";
import { useProfile } from "@/lib/profile-store";
import { matchOpportunities, type YouthProfile, type MatchResult } from "@/lib/engine";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [
    { title: "Opportunity & Econometric Dashboard — UNMAPPED" },
    { name: "description", content: "Realistic matching grounded in wage floors, sector growth, and returns to education." },
  ]}),
});

function Signal({ k, v, src }: { k: string; v: string; src: string }) {
  return (
    <div className="bg-paper p-5">
      <div className="font-display text-3xl font-black tracking-tight">{k}</div>
      <div className="mt-1 text-sm">{v}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{src}</div>
    </div>
  );
}
function Bar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="font-mono">{Math.round(pct * 100)}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full bg-sand">
        <div className="h-full" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function YouthView({ profile, country, matches }: { profile: YouthProfile; country: CountryConfig; matches: MatchResult[] }) {
  const fmt = (n: number) => `${country.currency} ${n.toLocaleString()}`;
  const top = matches.slice(0, 4);
  return (
    <div className="grid gap-6">
      <div className="grid gap-px bg-ink md:grid-cols-4">
        <Signal k={fmt(country.signals.medianYouthWageMonthly)} v="Median youth wage / month" src={`Floor: ${fmt(country.signals.minWageMonthly)}`} />
        <Signal k={`${country.signals.youthUnemployment}%`} v="Youth unemployment (15–24)" src="ILOSTAT 2024" />
        <Signal k={`${country.signals.informalShare}%`} v="Informal employment share" src="WBES / ILO 2023" />
        <Signal k={`+${country.signals.returnsToEducation.at(-1)?.premiumPct}%`} v="Tertiary wage premium" src="vs. primary baseline" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-sm border border-ink bg-paper p-6 shadow-[8px_8px_0_0_var(--ink)]">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Top matches for {profile.name}</div>
          <div className="mt-4 space-y-4">
            {top.length === 0 && <p className="text-sm text-muted-foreground">Add skills to your passport to surface matches.</p>}
            {top.map(m => (
              <div key={m.occupation.id} className="border-t border-line pt-4 first:border-0 first:pt-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-display text-xl font-bold">{m.occupation.title}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{m.occupation.isco} · {m.occupation.pathways.join(" · ")}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl font-black">{fmt(m.estMonthlyWage)}</div>
                    <div className="font-mono text-[10px] uppercase text-muted-foreground">est. monthly</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4">
                  <Bar label="Skill fit" pct={m.fit} color="var(--cobalt)" />
                  <Bar label="AI resilience" pct={m.resilience} color="var(--moss)" />
                </div>
                {m.missing.length > 0 && (
                  <div className="mt-3 text-xs">
                    <span className="font-mono uppercase tracking-wider text-muted-foreground">to strengthen: </span>
                    {m.missing.slice(0, 3).map((id: SkillId) => (
                      <span key={id} className="mr-2 inline-block rounded-full border border-line px-2 py-0.5">{SKILLS[id].label}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-sm border border-line bg-card p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">Returns to education</div>
          <h3 className="mt-2 font-display text-xl font-bold">What another credential is worth here</h3>
          <p className="mt-1 text-xs text-muted-foreground">Wage premium vs. primary, {country.country}</p>
          <div className="mt-5 space-y-2">
            {country.signals.returnsToEducation.map(r => (
              <div key={r.level}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{r.level}</span>
                  <span className="font-mono text-xs">+{r.premiumPct}%</span>
                </div>
                <div className="mt-1 h-2 w-full bg-sand">
                  <div className="h-full bg-ink" style={{ width: `${Math.min(100, r.premiumPct / 1.5)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-line pt-4 text-xs text-muted-foreground">Source: harmonized labor force surveys, World Bank Global Labor Database</div>
        </section>
      </div>
    </div>
  );
}

function PolicyView({ country }: { country: CountryConfig }) {
  const maxGrowth = Math.max(...country.signals.sectorGrowth.map(s => s.growthPct));
  return (
    <div className="grid gap-6">
      <div className="grid gap-px bg-ink md:grid-cols-4">
        <Signal k={`${country.signals.youthUnemployment}%`} v="Youth unemployment" src="ILOSTAT 2024" />
        <Signal k={`${country.signals.informalShare}%`} v="Informal share" src="ILO 2023" />
        <Signal k={`${country.signals.mobileBroadbandPenetration}%`} v="Mobile broadband" src="ITU DataHub 2024" />
        <Signal k={`${country.wittgenstein.at(-1)?.tertiaryYouthPct}%`} v="Projected tertiary youth 2035" src="Wittgenstein SSP2" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-sm border border-ink bg-paper p-6 shadow-[8px_8px_0_0_var(--ink)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Sector employment</div>
              <h3 className="mt-1 font-display text-xl font-bold">Where the jobs are growing</h3>
            </div>
            <div className="font-mono text-[10px] uppercase text-muted-foreground">share · YoY growth</div>
          </div>
          <div className="mt-5 space-y-3">
            {country.signals.sectorGrowth.map(s => (
              <div key={s.sector}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.sector}</span>
                  <span className="font-mono text-xs">{s.share}% share · <span className="text-cobalt">+{s.growthPct}%</span></span>
                </div>
                <div className="mt-1 flex h-2 w-full gap-px overflow-hidden bg-sand">
                  <div className="h-full bg-ink/80" style={{ width: `${s.share * 1.5}%` }} />
                  <div className="h-full bg-cobalt" style={{ width: `${(s.growthPct / maxGrowth) * 30}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-line pt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Sources: WBES Employment Indicators · Data360 Growth & Jobs · ILO Future of Work</div>
        </section>
        <section className="space-y-6">
          <div className="rounded-sm border border-line bg-card p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">Skill–population divergence</div>
            <h3 className="mt-2 font-display text-lg font-bold">Tertiary youth share, 2025 → 2035</h3>
            <div className="mt-4 flex items-end gap-2">
              {country.wittgenstein.map(w => (
                <div key={w.year} className="flex-1 text-center">
                  <div className="mx-auto bg-cobalt" style={{ height: `${w.tertiaryYouthPct * 5}px`, width: "60%" }} />
                  <div className="mt-1 font-display text-base font-bold">{w.tertiaryYouthPct}%</div>
                  <div className="font-mono text-[10px] uppercase text-muted-foreground">{w.year}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Population shift outpaces formal credentialing. The matching gap widens unless infrastructure fills it.</p>
          </div>
          <div className="rounded-sm border border-ink bg-ink p-6 text-paper">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt-soft">Cited sources</div>
            <ul className="mt-2 space-y-1 text-xs text-paper/80">
              {country.sourceNotes.map(s => <li key={s}>· {s}</li>)}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

function Dashboard() {
  const [profile] = useProfile();
  const country = COUNTRIES[profile.countryKey];
  const matches = useMemo(() => matchOpportunities(profile), [profile]);
  const [view, setView] = useState<"youth" | "policy">("youth");
  return (
    <PageShell
      eyebrow="Module 03 · Opportunity Matching"
      title={<>Honest matching. <span className="text-cobalt">Local</span> wages. Real signals.</>}
      lede="Two interfaces, one engine. Youth see realistic opportunities with the wage floor, sector momentum, and education premium they actually face. Program officers see the aggregate."
    >
      <div className="mb-8 inline-flex rounded-sm border border-ink bg-paper p-1">
        {(["youth", "policy"] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`rounded-sm px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${view === v ? "bg-ink text-paper" : "text-muted-foreground hover:text-ink"}`}>
            {v === "youth" ? "Youth user" : "Policymaker / program officer"}
          </button>
        ))}
      </div>
      {view === "youth" ? <YouthView profile={profile} country={country} matches={matches} /> : <PolicyView country={country} />}
    </PageShell>
  );
}
