import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ExternalLink, Database, Globe, BookOpen, Building2, Wifi, Smartphone, Lock, Clock, ImageOff, Languages } from "lucide-react";

export const Route = createFileRoute("/infrastructure")({
  component: Infrastructure,
  head: () => ({ meta: [
    { title: "Our data sources — UNMAPPED" },
    { name: "description", content: "Every number on UNMAPPED comes from a public, citable source. Here's where each piece of information lives." },
  ]}),
});

type Coverage = "full" | "partial" | "limited";

interface Source {
  name: string;
  org: string;
  what: string;       // What it tells us, in plain language
  used_for: string;   // Which part of the experience it powers
  updated: string;
  url: string;
  coverage: Coverage;
  caveat?: string;
}

const SOURCES: { group: string; intro: string; icon: React.ReactNode; items: Source[] }[] = [
  {
    group: "Jobs & wages",
    intro: "These tell us what people actually earn and how the local job market is moving.",
    icon: <Building2 className="h-4 w-4" />,
    items: [
      {
        name: "ILOSTAT",
        org: "International Labour Organization",
        what: "Wages, employment rates, and informality across 190+ countries.",
        used_for: "Income ranges and youth unemployment numbers in your Opportunities view.",
        updated: "2024",
        url: "https://ilostat.ilo.org/data/",
        coverage: "full",
        caveat: "Captures formal employment best — informal sector is harder to measure.",
      },
      {
        name: "World Development Indicators",
        org: "World Bank",
        what: "Country-level economic and social statistics.",
        used_for: "Country context — GDP per capita, female labour participation, broadband access.",
        updated: "2024",
        url: "https://databank.worldbank.org/source/world-development-indicators",
        coverage: "full",
      },
      {
        name: "Human Capital Index",
        org: "World Bank",
        what: "How much a child born today is expected to earn in their lifetime, given local schooling and health.",
        used_for: "Calibration of opportunity cards for your country.",
        updated: "2024",
        url: "https://www.worldbank.org/en/publication/human-capital",
        coverage: "partial",
      },
    ],
  },
  {
    group: "Skills & occupations",
    intro: "These taxonomies translate your plain-language description of work into a vocabulary that employers and training providers recognise.",
    icon: <Globe className="h-4 w-4" />,
    items: [
      {
        name: "ESCO",
        org: "European Commission",
        what: "A standard library of 14,000+ skills and 3,500+ occupations, in 28 languages.",
        used_for: "Turning your story into recognised skills and finding adjacent jobs.",
        updated: "2023",
        url: "https://esco.ec.europa.eu/",
        coverage: "partial",
        caveat: "EU-framed — some informal occupations common in LMICs aren't represented.",
      },
      {
        name: "O*NET",
        org: "US Department of Labor",
        what: "Detailed task and skill profiles for 894 occupations.",
        used_for: "Working out which parts of a job are routine, hands-on, or social.",
        updated: "2024",
        url: "https://www.onetcenter.org/database.html",
        coverage: "limited",
        caveat: "Built around US labour patterns — we adjust for local context.",
      },
      {
        name: "ISCO-08",
        org: "International Labour Organization",
        what: "The international standard for classifying occupations.",
        used_for: "The bridge between US, European, and global occupation systems.",
        updated: "2008 (current revision)",
        url: "https://www.ilo.org/public/english/bureau/stat/isco/isco08/",
        coverage: "full",
      },
    ],
  },
  {
    group: "The future of work",
    intro: "These let us be honest about how AI and demographic change might shape the next decade.",
    icon: <BookOpen className="h-4 w-4" />,
    items: [
      {
        name: "Frey & Osborne",
        org: "University of Oxford",
        what: "Estimates of how susceptible 702 occupations are to automation.",
        used_for: "The baseline for the AI Readiness score (before local adjustment).",
        updated: "2013 (we recalibrate for LMIC context)",
        url: "https://www.oxfordmartin.ox.ac.uk/publications/the-future-of-employment/",
        coverage: "limited",
        caveat: "US-centric and a decade old — we treat it as a starting point, not an answer.",
      },
      {
        name: "Wittgenstein Centre",
        org: "IIASA / Vienna University",
        what: "Education and population projections to 2100, for 228 countries.",
        used_for: "The 'world is changing' charts showing future graduate share in your country.",
        updated: "2023",
        url: "http://www.wittgensteincentre.org/dataexplorer",
        coverage: "partial",
      },
      {
        name: "World Population Prospects",
        org: "United Nations",
        what: "Demographic projections from 1950 to 2100.",
        used_for: "Context on how your local labour market is growing.",
        updated: "2024",
        url: "https://population.un.org/wpp/",
        coverage: "full",
      },
      {
        name: "UNESCO Institute for Statistics",
        org: "UNESCO",
        what: "Education and skills statistics for 275 countries.",
        used_for: "Education pipeline charts and TVET coverage data.",
        updated: "2024",
        url: "https://uis.unesco.org/",
        coverage: "partial",
      },
    ],
  },
];

const COVERAGE_META: Record<Coverage, { label: string; color: string }> = {
  full: { label: "Full coverage", color: "var(--moss)" },
  partial: { label: "Partial coverage", color: "oklch(0.78 0.16 80)" },
  limited: { label: "Limited", color: "oklch(0.55 0.2 25)" },
};

function SourceCard({ s }: { s: Source }) {
  const [open, setOpen] = useState(false);
  const cov = COVERAGE_META[s.coverage];
  return (
    <div className="rounded-sm border border-ink bg-paper">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-start justify-between gap-4 p-5 text-left">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-bold">{s.name}</h3>
              <span
                className="rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                style={{ background: `color-mix(in oklab, ${cov.color} 15%, transparent)`, color: cov.color }}
              >
                {cov.label}
              </span>
            </div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.org}</div>
            <p className="mt-2 text-sm text-foreground/80">{s.what}</p>
          </div>
          <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-line px-5 pb-5 pt-4 space-y-3 text-sm">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Where you'll see this</div>
            <p className="mt-1 text-foreground/80">{s.used_for}</p>
          </div>
          {s.caveat && (
            <div className="rounded-sm border-l-2 border-rust bg-rust/5 px-3 py-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-rust">Honest caveat</div>
              <p className="mt-1 text-foreground/80">{s.caveat}</p>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 pt-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Last updated · {s.updated}
            </span>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-cobalt hover:underline"
            >
              View source <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function Infrastructure() {
  return (
    <PageShell
      eyebrow="About · Where our data comes from"
      title={<>No magic. <span className="text-cobalt">Just public data,</span> shown clearly.</>}
      lede="Every chart, score, and recommendation on UNMAPPED traces back to a publicly citable source. Here are the nine datasets that power the experience — and what each one is honestly good (and not so good) at telling us."
    >
      {/* The promise */}
      <section className="rounded-sm border-2 border-ink bg-cobalt/5 p-6 sm:p-8 mb-12">
        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <Database className="h-10 w-10 text-cobalt shrink-0" />
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">Our promise</div>
            <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold leading-snug">
              If we can't show you where a number comes from, we don't show you the number.
            </h2>
            <p className="mt-2 text-sm text-foreground/80">
              Each source below is open and free to inspect. We don't use any private or proprietary data.
            </p>
          </div>
        </div>
      </section>

      {/* Built for constraint — addresses brief: "design for constraint —
          low bandwidth, shared devices, incomplete credentials". */}
      <section className="mb-12 rounded-sm border-2 border-ink bg-paper p-6 shadow-[6px_6px_0_0_var(--ink)] sm:p-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-cobalt">
          Designed for constraint
        </div>
        <h2 className="mt-2 font-display text-2xl font-black leading-snug md:text-3xl">
          Built for a shared family phone on patchy 3G — <span className="text-cobalt">not a Macbook in San Francisco.</span>
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-foreground/80">
          Every design decision assumes the user has limited data, a shared device, no email account,
          and credentials a global system has never heard of. These are constraints, not edge cases.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <Wifi className="h-5 w-5" />, title: "≤150 KB initial payload", body: "Page weight budget enforced per country config (`max_initial_payload_kb`). Loads on EDGE if needed." },
            { icon: <ImageOff className="h-5 w-5" />, title: "Lazy images, SVG patterns", body: "All hero & cultural imagery defer-loads. Country silhouettes are inline SVG, not bitmaps." },
            { icon: <Smartphone className="h-5 w-5" />, title: "Works on a shared phone", body: "No login, no account, no email. State is local and ephemeral. Hand the phone over and start fresh." },
            { icon: <Lock className="h-5 w-5" />, title: "No credentials required", body: "Informal apprenticeship, self-taught, NGO training and on-the-job experience are first-class inputs — not exceptions." },
            { icon: <Languages className="h-5 w-5" />, title: "8 locales, native scripts", body: "Bengali, Hausa, Yoruba, Kinyarwanda, Swahili, Hindi, French, English. Switch in the header — instant." },
            { icon: <Clock className="h-5 w-5" />, title: "Full passport in ~2 min", body: "6 questions, no scrolling forms, no jargon. Built for someone using a borrowed device on a break." },
          ].map(item => (
            <div key={item.title} className="rounded-sm border border-line bg-card p-4">
              <div className="flex items-center gap-2 text-cobalt">{item.icon}</div>
              <div className="mt-2 font-display text-sm font-bold">{item.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-foreground/70">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Source groups */}
      <div className="space-y-12">
        {SOURCES.map(group => (
          <section key={group.group}>
            <div className="flex items-center gap-2 text-cobalt">
              {group.icon}
              <div className="font-mono text-[10px] uppercase tracking-[0.2em]">{group.group}</div>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold">{group.group}</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{group.intro}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {group.items.map(s => (
                <SourceCard key={s.name} s={s} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Coverage legend */}
      <section className="mt-16 rounded-sm border border-line bg-card p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">What "coverage" means</div>
        <div className="mt-3 grid gap-4 sm:grid-cols-3 text-sm">
          {(Object.keys(COVERAGE_META) as Coverage[]).map(c => (
            <div key={c} className="flex items-start gap-2">
              <div className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0" style={{ background: COVERAGE_META[c].color }} />
              <div>
                <div className="font-semibold">{COVERAGE_META[c].label}</div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {c === "full" && "Reliable, recent, and works well across all countries we serve."}
                  {c === "partial" && "Useful but with known gaps — we name them on each card."}
                  {c === "limited" && "Works as a starting point, but we adjust heavily for local context."}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Next */}
      <section className="mt-12 rounded-sm border-2 border-ink bg-ink p-6 sm:p-8 text-paper">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt-soft">Want to know how we use it?</div>
        <h3 className="mt-2 font-display text-2xl font-bold">See how it works</h3>
        <p className="mt-2 max-w-2xl text-sm text-paper/80">
          The methodology page explains in plain language how we turn these datasets into the three views you see.
        </p>
        <Link
          to="/methodology"
          className="mt-5 inline-block border-2 border-cobalt-soft bg-cobalt-soft/10 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-paper hover:bg-cobalt-soft/20"
        >
          → How it works
        </Link>
      </section>
    </PageShell>
  );
}