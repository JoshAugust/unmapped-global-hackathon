import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { CountryPill } from "@/components/country-pill";
import { COUNTRIES } from "@/data/countries";
import { useProfile } from "@/lib/profile-store";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "UNMAPPED — Open skills infrastructure for LMICs" },
      { name: "description", content: "An open infrastructure layer that maps informal talent to real economic opportunity. Built for the World Bank Youth Summit × Hack-Nation 2026." },
      { property: "og:title", content: "UNMAPPED — Open skills infrastructure for LMICs" },
      { property: "og:description", content: "Closing the distance between real skills and economic opportunity in the age of AI." },
    ],
  }),
});

function Index() {
  const [profile] = useProfile();
  const country = COUNTRIES[profile.countryKey];
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteNav />
      <Hero />
      <Amara />
      <Modules />
      <Configurability country={country} />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-ink">
      <div className="absolute inset-0 grid-paper opacity-50" />
      <div className="relative mx-auto max-w-[1400px] px-6 pb-20 pt-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            World Bank Youth Summit · Hack-Nation 2026 · Challenge 05
          </div>
          <CountryPill />
        </div>
        <h1 className="mt-10 font-display text-[clamp(3rem,8vw,7.5rem)] font-black leading-[0.92] tracking-[-0.04em]">
          Six hundred million<br />
          <span className="italic text-cobalt">unmapped</span> people.
        </h1>
        <p className="mt-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
          The world's most capable generation is also the most invisible to it.
          UNMAPPED is an open infrastructure layer that turns informal skills into portable,
          credible, opportunity-bearing signals — calibrated to local labor realities, not Silicon Valley benchmarks.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link to="/passport"
            className="inline-flex items-center gap-2 rounded-sm bg-ink px-6 py-3 font-mono text-xs uppercase tracking-wider text-paper transition-transform hover:-translate-y-0.5">
            Build Amara's passport →
          </Link>
          <Link to="/dashboard"
            className="inline-flex items-center gap-2 rounded-sm border border-ink px-6 py-3 font-mono text-xs uppercase tracking-wider hover:bg-ink hover:text-paper">
            Policymaker view
          </Link>
        </div>
        <div className="mt-16 grid gap-6 border-t border-ink pt-8 md:grid-cols-3">
          {[
            { k: "71%", v: "of Sub-Saharan youth work in the informal economy", src: "ILO 2024" },
            { k: "1 in 4", v: "tasks held by LMIC youth face automation pressure within a decade", src: "Frey-Osborne, calibrated" },
            { k: "<3%", v: "of informal workers hold a credential employers can verify", src: "WBES, World Bank STEP" },
          ].map(s => (
            <div key={s.k}>
              <div className="font-display text-5xl font-black tracking-tight">{s.k}</div>
              <div className="mt-2 text-sm">{s.v}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.src}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Amara() {
  return (
    <section className="border-b border-line bg-card">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-20 md:grid-cols-[1fr_1.2fr]">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-cobalt">A user, not a persona</div>
          <h2 className="mt-3 font-display text-4xl font-black leading-tight">Meet Amara.</h2>
          <p className="mt-6 text-lg leading-relaxed">
            22, lives outside Accra, holds a secondary school certificate.
            Speaks three languages. Has run a phone repair business since she was 17.
            Taught herself basic coding on a shared mobile connection.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            By any reasonable measure, Amara has skills. By every formal measure, she does not exist.
            <span className="text-ink"> UNMAPPED is built for her — not a generic 'youth user'.</span>
          </p>
        </div>
        <div className="relative rounded-sm border border-ink bg-paper p-6 shadow-[8px_8px_0_0_var(--ink)]">
          <div className="flex items-start justify-between border-b border-ink pb-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Skill Passport · sample</div>
              <div className="font-display text-2xl font-bold">Amara O.</div>
              <div className="text-sm text-muted-foreground">Accra, Ghana · age 22</div>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-cobalt">verified · portable</div>
          </div>
          <div className="mt-4 space-y-3">
            {[
              ["Mobile phone repair", 5, 0.92],
              ["Multilingual communication (Twi · English · Ga)", null, 0.95],
              ["Customer service & negotiation", 5, 0.88],
              ["Basic programming (HTML · JS · Python)", 1.5, 0.61],
              ["Smartphone & mobile-money fluency", 6, 0.94],
            ].map(([label, yrs, conf]) => (
              <div key={label as string}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">
                    {yrs ? `${yrs}y` : "fluent"} · conf {(Number(conf) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full bg-sand">
                  <div className="h-full bg-cobalt" style={{ width: `${(Number(conf)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-line pt-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">ESCO-aligned · ISCO clusters resolved</div>
            <div className="font-mono text-xs">PASS-7F2A·4Q19</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Modules() {
  const items = [
    { n: "01", to: "/passport", title: "Skills Signal Engine",
      body: "Map education, informal experience and demonstrated competencies into a portable, ESCO-aligned passport that Amara can read, own, and carry across borders.",
      meta: "ESCO · O*NET · WBES STEP" },
    { n: "02", to: "/readiness", title: "AI Readiness Lens",
      body: "Honest exposure assessment calibrated to LMIC task composition. Which parts of your work are at risk, which are durable, which adjacent skills shore up resilience.",
      meta: "Frey-Osborne · ILO task indices" },
    { n: "03", to: "/dashboard", title: "Opportunity & Econometric Dashboard",
      body: "Realistic matching grounded in wage floors, sector growth, and returns to education. Dual interface: one for the youth user, one for a policymaker watching the aggregate.",
      meta: "WBES · ILOSTAT · Wittgenstein 25–35" },
  ];
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1400px] px-6 py-20">
        <div className="flex items-end justify-between">
          <h2 className="max-w-xl font-display text-4xl font-black leading-tight md:text-5xl">
            Three failures.<br/>One protocol.
          </h2>
          <div className="hidden font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:block">infrastructure · not product</div>
        </div>
        <div className="mt-12 grid gap-px bg-ink md:grid-cols-3">
          {items.map(i => (
            <Link key={i.n} to={i.to} className="group relative bg-paper p-8 transition-colors hover:bg-cobalt-soft">
              <div className="font-display text-7xl font-black text-cobalt">{i.n}</div>
              <h3 className="mt-4 font-display text-2xl font-bold">{i.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{i.body}</p>
              <div className="mt-6 flex items-center justify-between border-t border-line pt-3 font-mono text-[10px] uppercase tracking-wider">
                <span className="text-muted-foreground">{i.meta}</span>
                <span className="text-ink group-hover:translate-x-1 transition-transform">open →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Configurability({ country }: { country: ReturnType<typeof useCountry> }) {
  return (
    <section className="bg-ink text-paper">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-cobalt-soft">The country-agnostic requirement</div>
          <h2 className="mt-3 font-display text-4xl font-black leading-tight md:text-5xl">
            Same code.<br/>Different country.<br/>No rebuild.
          </h2>
          <p className="mt-6 max-w-md text-lg text-paper/70">
            Currently configured for <span className="font-semibold text-paper">{country.region}</span>.
            Swap the config and the entire stack — taxonomy, language, automation calibration, opportunity types — re-orients to a new context.
          </p>
          <Link to="/configure"
            className="mt-8 inline-flex items-center gap-2 rounded-sm bg-cobalt px-6 py-3 font-mono text-xs uppercase tracking-wider text-paper hover:bg-paper hover:text-ink">
            See the config layer →
          </Link>
        </div>
        <div className="rounded-sm border border-paper/20 bg-ink/40 p-6 font-mono text-xs leading-relaxed">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-cobalt-soft uppercase tracking-wider">{country.country.toLowerCase()}.config.json</span>
            <span className="text-paper/40">read-only</span>
          </div>
          <pre className="overflow-x-auto whitespace-pre text-paper/90">
{`{
  "region":          "${country.region}",
  "language":        "${country.language}",
  "currency":        "${country.currency}",
  "education":       [${country.educationLevels.length} ISCED-mapped levels],
  "automationCal":   ${country.automationCalibration},
  "opportunities":   [${country.opportunityTypes.map(t => `"${t}"`).join(", ")}],
  "wageFloor":       ${country.signals.minWageMonthly},
  "broadband":       ${country.signals.mobileBroadbandPenetration}%,
  "informalShare":   ${country.signals.informalShare}%
}`}
          </pre>
        </div>
      </div>
    </section>
  );
}

function useCountry() { const [p] = useProfile(); return COUNTRIES[p.countryKey]; }
}
