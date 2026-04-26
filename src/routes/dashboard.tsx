import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { COUNTRIES, type CountryConfig } from "@/data/countries";
import { SKILLS, type SkillId } from "@/data/skills";
import { useProfile } from "@/lib/profile-store";
import { matchOpportunities, type YouthProfile, type MatchResult } from "@/lib/engine";
import { ArrowUpRight, Sparkles, TrendingUp, Wallet } from "lucide-react";
import CalibrationPanel from "@/components/calibration-panel";

/** Map engine CountryKey → ISO3 used by CalibrationPanel. */
const COUNTRY_KEY_TO_ISO3: Record<string, string> = {
  "ssa-ghana": "GHA",
  "ssa-nigeria": "NGA",
  "sa-bangladesh": "BGD",
};

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

type RankedMatch = MatchResult & {
  rank: number;
  reachability: "now" | "soon" | "stretch";
  reachMessage: string;
  pathwayLabel: string;
  workType: "Self-employment" | "Formal work" | "Gig / flexible" | "Apprenticeship";
};

function workType(m: MatchResult): RankedMatch["workType"] {
  const p = m.occupation.pathways;
  if (p.includes("formal")) return "Formal work";
  if (p.includes("apprenticeship") && !p.includes("self-employment")) return "Apprenticeship";
  if (p.includes("self-employment")) return "Self-employment";
  return "Gig / flexible";
}

function rankAndEnrich(matches: MatchResult[]): RankedMatch[] {
  // Combined score: reachability (skill fit) + earning potential (wage multiplier proxy via wage)
  const maxWage = Math.max(...matches.map(m => m.estMonthlyWage), 1);
  const scored = matches.map(m => ({
    m,
    score: m.fit * 0.55 + (m.estMonthlyWage / maxWage) * 0.45,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map(({ m }, i) => {
    let reachability: RankedMatch["reachability"];
    let reachMessage: string;
    if (m.fit >= 0.7 || m.missing.length === 0) {
      reachability = "now";
      reachMessage = "You can start this week — your current skills already cover it.";
    } else if (m.fit >= 0.4) {
      reachability = "soon";
      const top = m.missing[0] ? SKILLS[m.missing[0]].label : "one more skill";
      reachMessage = `You're about 3 months away — start with ${top}.`;
    } else {
      reachability = "stretch";
      reachMessage = `A 6–12 month path through training or apprenticeship — worth it.`;
    }
    return {
      ...m,
      rank: i + 1,
      reachability,
      reachMessage,
      pathwayLabel: m.occupation.pathways.join(" · "),
      workType: workType(m),
    };
  });
}

function reachStyle(r: RankedMatch["reachability"]) {
  if (r === "now") return { color: "var(--moss)", label: "Start now", icon: "●" };
  if (r === "soon") return { color: "var(--cobalt)", label: "A few months out", icon: "◐" };
  return { color: "var(--rust)", label: "Stepping-stone path", icon: "◑" };
}

function OpportunityCard({ m, country, primary }: { m: RankedMatch; country: CountryConfig; primary: boolean }) {
  const fmt = (n: number) => `${country.currency} ${n.toLocaleString()}`;
  // Realistic income range: ±25% around estimated monthly
  const low = Math.round(m.estMonthlyWage * 0.75 / 50) * 50;
  const high = Math.round(m.estMonthlyWage * 1.25 / 50) * 50;
  // Find best-matching sector growth signal
  const sector = country.signals.sectorGrowth.reduce((best, s) => {
    const titleLower = m.occupation.title.toLowerCase();
    const sectorLower = s.sector.toLowerCase();
    const match =
      (titleLower.includes("dev") && sectorLower.includes("digital")) ||
      (titleLower.includes("bpo") && sectorLower.includes("digital")) ||
      (titleLower.includes("repair") && sectorLower.includes("trade")) ||
      (titleLower.includes("driver") && sectorLower.includes("retail")) ||
      (titleLower.includes("agri") && sectorLower.includes("agri")) ||
      (titleLower.includes("social") && sectorLower.includes("retail")) ||
      (titleLower.includes("trade") && sectorLower.includes("construction")) ||
      (titleLower.includes("tailor") && sectorLower.includes("manufacturing"));
    return match ? s : best;
  }, country.signals.sectorGrowth[0]);
  const reach = reachStyle(m.reachability);

  return (
    <article
      className={`relative rounded-sm bg-paper p-5 sm:p-6 transition-all ${
        primary
          ? "border-2 border-ink shadow-[6px_6px_0_0_var(--ink)]"
          : "border border-ink hover:shadow-[4px_4px_0_0_var(--ink)]"
      }`}
    >
      {/* Rank ribbon */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 font-display text-base font-black"
            style={{ borderColor: reach.color, color: reach.color }}
          >
            {m.rank}
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {m.workType} · {m.occupation.isco}
            </div>
            <h3 className="mt-0.5 font-display text-lg sm:text-xl font-bold leading-tight">
              {m.occupation.title}
            </h3>
          </div>
        </div>
        <div
          className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider"
          style={{ background: `color-mix(in oklab, ${reach.color} 15%, transparent)`, color: reach.color }}
        >
          {reach.label}
        </div>
      </div>

      {/* Encouraging reachability line */}
      <p className="mt-4 text-sm leading-relaxed text-foreground/85">
        <Sparkles className="mr-1 inline h-3.5 w-3.5" style={{ color: reach.color }} />
        {m.reachMessage}
      </p>

      {/* Two key signals — wage + sector growth */}
      <div className="mt-5 grid grid-cols-2 gap-px bg-line border border-line">
        <div className="bg-paper p-3">
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            <Wallet className="h-3 w-3" /> Monthly income
          </div>
          <div className="mt-1 font-display text-base sm:text-lg font-black leading-tight">
            {fmt(low)} – {fmt(high)}
          </div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80">
            Source: GLSS-7 · ILOSTAT 2024
          </div>
        </div>
        <div className="bg-paper p-3">
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            <TrendingUp className="h-3 w-3" /> Sector growth
          </div>
          <div className="mt-1 font-display text-base sm:text-lg font-black leading-tight text-cobalt">
            +{sector.growthPct}% / yr
          </div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/80">
            {sector.sector} · ILO 2023
          </div>
        </div>
      </div>

      {/* Skill steps if any */}
      {m.missing.length > 0 && (
        <div className="mt-4">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Skills to add
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.missing.slice(0, 3).map((id: SkillId) => (
              <span
                key={id}
                className="rounded-full border border-cobalt/40 bg-cobalt/5 px-2.5 py-0.5 text-xs text-cobalt"
              >
                + {SKILLS[id].label}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function YouthView({ profile, country, matches }: { profile: YouthProfile; country: CountryConfig; matches: MatchResult[] }) {
  const ranked = useMemo(() => rankAndEnrich(matches), [matches]);
  const placeName = profile.countryKey === "ssa-ghana" ? "Greater Accra" : profile.city || country.country;
  const fmt = (n: number) => `${country.currency} ${n.toLocaleString()}`;
  const topGrowingSectors = [...country.signals.sectorGrowth].sort((a, b) => b.growthPct - a.growthPct).slice(0, 3);

  return (
    <div className="grid gap-8">
      {/* Encouraging intro */}
      <div className="rounded-sm border border-ink bg-paper p-6 sm:p-7 shadow-[6px_6px_0_0_var(--ink)]">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">
          Your opportunities · {placeName}
        </div>
        <h2 className="mt-2 font-display text-2xl sm:text-3xl font-black leading-tight">
          Five doors are open to you, {profile.name?.split(" ")[0] || "friend"}.
        </h2>
        <p className="mt-3 text-sm sm:text-base leading-relaxed text-foreground/80">
          Each card below is a real path — ranked from <span className="font-semibold">what you can start this week</span> to
          <span className="font-semibold"> stepping-stone roles worth investing in</span>.
          Wages and sector growth are pulled from {country.country}'s own labour data, not global averages.
        </p>
      </div>

      {ranked.length === 0 ? (
        <div className="rounded-sm border border-line bg-card p-8 text-center text-sm text-muted-foreground">
          Add a few skills to your passport and we'll surface five opportunity cards for you.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {ranked.map((m, i) => (
            <OpportunityCard key={m.occupation.id} m={m} country={country} primary={i === 0} />
          ))}
        </div>
      )}

      {/* Local labour market context */}
      <section className="rounded-sm border-2 border-ink bg-ink p-6 sm:p-8 text-paper">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt-soft">
          Big picture
        </div>
        <h3 className="mt-2 font-display text-2xl font-bold">
          What we know about your local labour market
        </h3>
        <p className="mt-2 text-sm text-paper/70">
          A few honest signals about {placeName} to keep in mind as you choose a path.
        </p>

        <div className="mt-6 grid gap-px bg-paper/10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-ink p-4">
            <div className="font-display text-3xl font-black text-paper">{country.signals.youthUnemployment}%</div>
            <div className="mt-1 text-xs text-paper/80">Youth (15–24) without work — but most find income through informal channels.</div>
            <div className="mt-2 font-mono text-[9px] uppercase tracking-wider text-cobalt-soft">ILOSTAT 2024</div>
          </div>
          <div className="bg-ink p-4">
            <div className="font-display text-3xl font-black text-paper">{country.signals.informalShare}%</div>
            <div className="mt-1 text-xs text-paper/80">Of work is informal. Self-employment isn't a fallback here — it's the norm.</div>
            <div className="mt-2 font-mono text-[9px] uppercase tracking-wider text-cobalt-soft">WBES / ILO 2023</div>
          </div>
          <div className="bg-ink p-4">
            <div className="font-display text-3xl font-black text-paper">{country.signals.mobileBroadbandPenetration}%</div>
            <div className="mt-1 text-xs text-paper/80">Of adults reach mobile internet — enough to make digital paths real.</div>
            <div className="mt-2 font-mono text-[9px] uppercase tracking-wider text-cobalt-soft">ITU DataHub 2024</div>
          </div>
          <div className="bg-ink p-4">
            <div className="font-display text-3xl font-black text-paper">+{country.signals.returnsToEducation.at(-1)?.premiumPct}%</div>
            <div className="mt-1 text-xs text-paper/80">Wage premium for tertiary credentials — but TVET also pays +{country.signals.returnsToEducation.find(r => r.level === "TVET")?.premiumPct ?? 51}%.</div>
            <div className="mt-2 font-mono text-[9px] uppercase tracking-wider text-cobalt-soft">GLSS-7 harmonised</div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-cobalt-soft">
              Where the demand is rising fastest
            </div>
            <ul className="mt-3 space-y-2">
              {topGrowingSectors.map(s => (
                <li key={s.sector} className="flex items-center gap-3">
                  <ArrowUpRight className="h-4 w-4 text-cobalt-soft shrink-0" />
                  <span className="flex-1 text-sm">{s.sector}</span>
                  <span className="font-mono text-xs text-cobalt-soft">+{s.growthPct}% / yr</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-cobalt-soft">
              The shift to watch
            </div>
            <p className="mt-3 text-sm leading-relaxed text-paper/80">
              By 2035, the share of {country.country}'s youth with a tertiary degree rises from{" "}
              <span className="font-bold text-paper">{country.wittgenstein[0].tertiaryYouthPct}%</span> to{" "}
              <span className="font-bold text-cobalt-soft">{country.wittgenstein.at(-1)?.tertiaryYouthPct}%</span>.
              That means more competition for desk jobs — and more value placed on hands-on, trust-based, and digitally-fluent work.
              The good news: your skill stack is exactly the kind that compounds.
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-paper/15 pt-4 font-mono text-[9px] uppercase tracking-wider text-paper/50">
          Wage floor: {fmt(country.signals.minWageMonthly)}/month · Sources: ILOSTAT, GLSS-7, ITU DataHub, Wittgenstein Centre SSP2
        </div>
      </section>
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
      <section className="mt-12">
        <CalibrationPanel
          country={COUNTRY_KEY_TO_ISO3[profile.countryKey] ?? "NGA"}
          embedded
          compact
        />
      </section>
    </PageShell>
  );
}
