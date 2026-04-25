import { Link, useRouterState } from "@tanstack/react-router";
import { CountryPill } from "./country-pill";

const links = [
  { to: "/", label: "Overview" },
  { to: "/passport", label: "Skills Passport" },
  { to: "/readiness", label: "AI Readiness" },
  { to: "/dashboard", label: "Opportunity" },
  { to: "/configure", label: "Configure" },
] as const;

export function SiteNav() {
  const path = useRouterState({ select: s => s.location.pathname });
  return (
    <header className="sticky top-0 z-40">
      {/* Cyan brand bar */}
      <div className="bg-cobalt">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-4">
          <Link to="/" className="flex items-center gap-3 text-paper">
            <span className="font-display text-2xl font-black tracking-tight">unmapped</span>
            <span className="h-6 w-px bg-paper/40" />
            <span className="text-sm font-medium tracking-wide text-paper/95">for every young person</span>
          </Link>
          <div className="flex items-center gap-3">
            <CountryPill />
            <a href="https://www.worldbank.org/en/events/2026/06/11/youth-summit-2026-future-works-designing-jobs-for-the-digital-age" target="_blank" rel="noreferrer"
              className="hidden rounded-none border-2 border-paper px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-paper hover:text-cobalt md:inline-block">
              Youth Summit
            </a>
            <Link to="/passport"
              className="rounded-none bg-paper px-5 py-2 text-sm font-semibold text-cobalt hover:bg-ink hover:text-paper">
              Get started
            </Link>
          </div>
        </div>
      </div>
      {/* White nav */}
      <div className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-[1400px] items-center gap-1 px-6">
          {links.map(l => {
            const active = l.to === "/" ? path === "/" : path.startsWith(l.to);
            return (
              <Link key={l.to} to={l.to}
                className={`relative px-4 py-4 text-sm font-medium transition-colors ${
                  active ? "text-ink" : "text-ink/70 hover:text-ink"
                }`}>
                {l.label}
                {active && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-cobalt" />}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="bg-cobalt">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <div className="font-display text-2xl font-black">unmapped <span className="font-normal text-paper/80">| for every young person</span></div>
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] px-6 py-12">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-paper/50">About</div>
            <p className="mt-2 max-w-xs text-sm text-paper/80">
              An open infrastructure layer for mapping informal talent to real economic opportunity.
              Built for the World Bank Youth Summit × Hack-Nation 2026.
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-paper/50">Data sources</div>
            <ul className="mt-2 space-y-1 text-sm text-paper/80">
              <li>ESCO · O*NET skill taxonomies</li>
              <li>Frey & Osborne automation scores</li>
              <li>ILO task indices · World Bank STEP</li>
              <li>Wittgenstein Centre 2025–2035 projections</li>
              <li>ITU DataHub · WBES Employment</li>
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-paper/50">Principle</div>
            <p className="mt-2 text-sm text-paper/80">
              Country parameters are <span className="font-semibold text-paper">inputs</span>, never hardcoded.
              The same code runs an Accra repair stall and a Khulna rice cooperative.
            </p>
          </div>
        </div>
        <div className="mt-10 border-t border-paper/15 pt-4 text-xs uppercase tracking-[0.18em] text-paper/50">
          Prototype · not for production decisions · figures are illustrative composites of cited sources
        </div>
      </div>
    </footer>
  );
}
