import { SiteNav, SiteFooter } from "./site-nav";

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
      <section className="border-b border-line bg-sand">
        <div className="mx-auto max-w-[1400px] px-6 py-12 md:py-16">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cobalt">{eyebrow}</div>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-black leading-[1.1] text-ink md:text-5xl">{title}</h1>
          {lede && <p className="mt-5 max-w-2xl text-base text-ink/70 md:text-lg">{lede}</p>}
        </div>
      </section>
      <main className="mx-auto max-w-[1400px] px-6 py-12">{children}</main>
      <SiteFooter />
    </div>
  );
}