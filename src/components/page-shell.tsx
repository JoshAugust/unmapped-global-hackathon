import { SiteNav, SiteFooter } from "./site-nav";
import { CountryPill } from "./country-pill";

interface Props {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children: React.ReactNode;
}

export function PageShell({ eyebrow, title, lede, children }: Props) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteNav />
      <main className="mx-auto max-w-[1400px] px-6 pb-16 pt-10">
        <div className="flex flex-col gap-4 border-b border-ink pb-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-cobalt">{eyebrow}</div>
            <h1 className="mt-3 font-display text-4xl font-black leading-[1.05] md:text-5xl">{title}</h1>
            {lede && <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">{lede}</p>}
          </div>
          <CountryPill />
        </div>
        <div className="pt-10">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}