import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { COUNTRIES } from "@/data/countries";
import { useProfile } from "@/lib/profile-store";
import heroImg from "@/assets/hero-amara.jpg";

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
    <div className="min-h-screen overflow-x-hidden bg-paper text-ink">
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
    <>
      {/* Photographic hero, UNICEF-style */}
      <section className="relative">
        <div className="relative h-[78vh] min-h-[560px] w-full overflow-hidden bg-ink">
          <img src={heroImg} alt="A young woman repairs a smartphone in her workshop in Accra"
            className="absolute inset-0 h-full w-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/30 to-transparent" />
          <div className="relative mx-auto flex h-full max-w-[1400px] flex-col justify-end px-6 pb-16">
            <div className="max-w-2xl">
              <h1 className="font-display text-[clamp(2.25rem,5.2vw,4.5rem)] font-black leading-[1.05] text-paper">
                <span className="bg-ink box-decoration-clone px-3 py-1">Real skills.<br/>For every young person.</span>
              </h1>
              <p className="mt-6 max-w-xl bg-ink/85 px-3 py-3 text-base text-paper md:text-lg">
                Six hundred million young people across low- and middle-income countries hold real, unrecognised skills.
                UNMAPPED is the open infrastructure that lets the world finally see them.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/passport"
                  className="inline-flex items-center gap-2 bg-cobalt px-6 py-3 text-sm font-semibold text-paper hover:bg-paper hover:text-cobalt">
                  Build Amara's passport
                </Link>
                <Link to="/dashboard"
                  className="inline-flex items-center gap-2 border-2 border-paper bg-transparent px-6 py-3 text-sm font-semibold text-paper hover:bg-paper hover:text-ink">
                  Policymaker view
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stat band */}
      <section className="border-b border-line bg-paper">
        <div className="mx-auto grid max-w-[1400px] gap-px bg-line md:grid-cols-3">
          {[
            { k: "71%", v: "of Sub-Saharan youth work in the informal economy", src: "ILO 2024" },
            { k: "1 in 4", v: "tasks held by LMIC youth face automation pressure within a decade", src: "Frey-Osborne, calibrated" },
            { k: "<3%", v: "of informal workers hold a credential employers can verify", src: "WBES · World Bank STEP" },
          ].map(s => (
            <div key={s.k} className="bg-paper p-8">
              <div className="font-display text-5xl font-black tracking-tight text-cobalt">{s.k}</div>
              <div className="mt-3 text-base">{s.v}</div>
              <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{s.src}</div>
            </div>
          ))}
        </div>
      </section>
    </>
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
        <div className="relative border border-line bg-sand p-6">
          <div className="flex items-start justify-between border-b border-line pb-3">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Skill Passport · sample</div>
              <div className="font-display text-2xl font-black">Amara O.</div>
              <div className="text-sm text-muted-foreground">Accra, Ghana · age 22</div>
            </div>
            <div className="bg-cobalt px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-paper">verified</div>
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
                  <span className="text-xs text-muted-foreground">
                    {yrs ? `${yrs}y` : "fluent"} · conf {(Number(conf) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full bg-paper">
                  <div className="h-full bg-cobalt" style={{ width: `${(Number(conf)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-line pt-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">ESCO-aligned · ISCO clusters resolved</div>
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
    <section className="border-b border-line bg-sand">
      <div className="mx-auto max-w-[1400px] px-6 py-20">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cobalt">What we built</div>
            <h2 className="mt-3 max-w-xl font-display text-4xl font-black leading-tight md:text-5xl">
              Three failures.<br/>One protocol.
            </h2>
          </div>
          <div className="hidden text-xs uppercase tracking-[0.2em] text-muted-foreground md:block">infrastructure · not product</div>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map(i => (
            <Link key={i.n} to={i.to}
              className="group relative flex flex-col border-t-4 border-cobalt bg-paper p-8 transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)]">
              <div className="text-xs font-semibold uppercase tracking-wider text-cobalt">Module {i.n}</div>
              <h3 className="mt-2 font-display text-2xl font-black">{i.title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/70">{i.body}</p>
              <div className="mt-6 flex items-center justify-between border-t border-line pt-3 text-xs">
                <span className="uppercase tracking-wider text-muted-foreground">{i.meta}</span>
                <span className="font-semibold text-cobalt transition-transform group-hover:translate-x-1">Explore →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

type Country = ReturnType<typeof getCountry>;
function getCountry(key: keyof typeof COUNTRIES) { return COUNTRIES[key]; }

function Configurability({ country }: { country: Country }) {
  return (
    <section className="bg-cobalt text-paper">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-16 md:grid-cols-2 md:px-6 md:py-20">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-paper/80">The country-agnostic requirement</div>
          <h2 className="mt-3 font-display text-4xl font-black leading-tight text-paper md:text-5xl">
            Same code.<br/>Different country.<br/>No rebuild.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-paper/95">
            Currently configured for <span className="font-semibold text-paper">{country.region}</span>.
            Swap the config and the entire stack — taxonomy, language, automation calibration, opportunity types — re-orients to a new context.
          </p>
          <Link to="/configure"
            className="mt-8 inline-flex items-center gap-2 bg-paper px-6 py-3 text-sm font-semibold text-cobalt hover:bg-ink hover:text-paper">
            See the config layer
          </Link>
        </div>
        <div className="min-w-0 border border-paper/30 bg-ink p-4 font-mono text-xs leading-relaxed text-paper md:p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="uppercase tracking-wider text-cobalt">{country.country.toLowerCase()}.config.json</span>
            <span className="text-paper/40">read-only</span>
          </div>
          <pre className="max-w-full whitespace-pre-wrap break-words text-[11px] text-paper/90 md:whitespace-pre md:text-xs">
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


