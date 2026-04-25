import { Link, useRouterState } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Overview" },
  { to: "/passport", label: "01 · Skills Passport" },
  { to: "/readiness", label: "02 · AI Readiness" },
  { to: "/dashboard", label: "03 · Opportunity" },
  { to: "/configure", label: "Configure" },
] as const;

export function SiteNav() {
  const path = useRouterState({ select: s => s.location.pathname });
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-ink text-paper">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 20 L8 8 L13 16 L17 6 L21 14" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="8" cy="8" r="1.4" fill="currentColor" />
              <circle cx="13" cy="16" r="1.4" fill="currentColor" />
              <circle cx="17" cy="6" r="1.4" fill="currentColor" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-bold tracking-tight">UNMAPPED</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">open skills infrastructure</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map(l => {
            const active = l.to === "/" ? path === "/" : path.startsWith(l.to);
            return (
              <Link key={l.to} to={l.to}
                className={`rounded-sm px-3 py-2 font-mono text-xs uppercase tracking-wider transition-colors ${
                  active ? "bg-ink text-paper" : "text-muted-foreground hover:bg-sand hover:text-ink"
                }`}>
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="font-display text-xl font-bold">UNMAPPED</div>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              An open infrastructure layer for mapping informal talent to real economic opportunity.
              Built for the World Bank Youth Summit × Hack-Nation 2026.
            </p>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Data sources</div>
            <ul className="mt-2 space-y-1 text-sm">
              <li>ESCO · O*NET skill taxonomies</li>
              <li>Frey & Osborne automation scores</li>
              <li>ILO task indices · World Bank STEP</li>
              <li>Wittgenstein Centre 2025–2035 projections</li>
              <li>ITU DataHub · WBES Employment</li>
            </ul>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Principle</div>
            <p className="mt-2 text-sm">
              Country parameters are <span className="font-semibold text-ink">inputs</span>, never hardcoded.
              The same code runs an Accra repair stall and a Khulna rice cooperative.
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Prototype · not for production decisions · figures are illustrative composites of cited sources
        </div>
      </div>
    </footer>
  );
}
