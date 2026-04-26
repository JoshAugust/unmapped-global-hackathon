import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, MessageCircle, Compass, Lightbulb, ShieldCheck, AlertTriangle, FileJson, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/methodology")({
  component: Methodology,
  head: () => ({ meta: [
    { title: "How it works — UNMAPPED" },
    { name: "description", content: "A plain-language explanation of how UNMAPPED turns your skills into honest insights about your future of work." },
  ]}),
});

function Step({ n, icon, title, children }: { n: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-sm border border-ink bg-paper p-6 sm:p-7 shadow-[6px_6px_0_0_var(--ink)]">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink bg-cobalt/10 text-cobalt">
          {icon}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Step {n}</div>
      </div>
      <h3 className="mt-4 font-display text-xl font-bold leading-tight">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed text-foreground/80 space-y-3">{children}</div>
    </div>
  );
}

function ExpandableNote({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-sm border border-line bg-card">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-5 text-left">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</div>
            <div className="mt-1 font-display text-base font-bold">{title}</div>
          </div>
          <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-line px-5 pb-5 pt-4 text-sm leading-relaxed text-foreground/80 space-y-3">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function Methodology() {
  return (
    <PageShell
      eyebrow="About · How it works"
      title={<>Tell us your story. <span className="text-cobalt">We do the heavy lifting.</span></>}
      lede="UNMAPPED helps people in informal economies see what their skills are worth — and where they could go next. Here's how it works in plain language."
    >
      {/* What it is — single-sentence */}
      <section className="rounded-sm border-2 border-ink bg-cobalt/5 p-6 sm:p-8 mb-12">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">In one sentence</div>
        <p className="mt-3 font-display text-2xl sm:text-3xl font-bold leading-snug">
          You describe what you do for a living. We turn it into a clear picture of your skills, how AI will affect your work, and which jobs you can realistically reach next.
        </p>
      </section>

      {/* Three steps */}
      <div className="grid gap-6 md:grid-cols-3">
        <Step n="1" icon={<MessageCircle className="h-5 w-5" />} title="You tell us about your work">
          <p>
            Type a few sentences in plain language — "I fix phones in Accra" or "I sell food at the market." No forms, no jargon, no CV required.
          </p>
          <p className="text-xs text-muted-foreground">
            Works in 8 languages. Designed for a shared phone on patchy 3G.
          </p>
        </Step>

        <Step n="2" icon={<Compass className="h-5 w-5" />} title="We translate it into recognised skills">
          <p>
            Behind the scenes, we match your description to international skill and occupation classifications used by employers, training providers, and governments worldwide.
          </p>
          <p className="text-xs text-muted-foreground">
            Your "fixing phones" becomes "device repair, customer service, troubleshooting" — a language any system can understand.
          </p>
        </Step>

        <Step n="3" icon={<Lightbulb className="h-5 w-5" />} title="You get three honest views">
          <p>
            A <Link to="/passport" className="font-semibold text-cobalt hover:underline">Skills Passport</Link> showing what you have,
            an <Link to="/readiness" className="font-semibold text-cobalt hover:underline">AI Readiness</Link> view showing how your work is shifting,
            and an <Link to="/dashboard" className="font-semibold text-cobalt hover:underline">Opportunities</Link> view showing where you can go next.
          </p>
        </Step>
      </div>

      {/* Why it matters */}
      <section className="mt-16 grid gap-6 md:grid-cols-2">
        <div className="rounded-sm border border-line bg-card p-6 sm:p-7">
          <div className="flex items-center gap-2 text-cobalt">
            <ShieldCheck className="h-4 w-4" />
            <div className="font-mono text-[10px] uppercase tracking-[0.2em]">What makes this different</div>
          </div>
          <h3 className="mt-2 font-display text-xl font-bold">Built for the 2 billion people the data forgot</h3>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            Most labour tools are built for office workers in rich countries. They assume a CV, a LinkedIn profile, and a job that sits in a database somewhere. UNMAPPED works for the phone repair technician in Lagos, the textile worker in Dhaka, the street food vendor in Nairobi — people whose skills are real and valuable, but invisible to the systems that shape their futures.
          </p>
        </div>

        <div className="rounded-sm border border-line bg-card p-6 sm:p-7">
          <div className="flex items-center gap-2 text-rust">
            <AlertTriangle className="h-4 w-4" />
            <div className="font-mono text-[10px] uppercase tracking-[0.2em]">What we promise</div>
          </div>
          <h3 className="mt-2 font-display text-xl font-bold">Honest, not alarmist</h3>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            Tools that exaggerate risk cause real harm. Telling someone their job will be "automated by 2027" can push them into decisions based on a forecast no one can actually make. We show our reasoning, name our limits, and adjust every estimate for the local economy you actually live in.
          </p>
        </div>
      </section>

      {/* Country-agnostic protocol — addresses the brief's
          "Infrastructure, not just an app" requirement directly. */}
      <section className="mt-16 rounded-sm border-2 border-cobalt bg-cobalt/5 p-6 sm:p-8">
        <div className="flex items-center gap-2 text-cobalt">
          <FileJson className="h-4 w-4" />
          <div className="font-mono text-[10px] uppercase tracking-[0.2em]">
            Infrastructure, not an app
          </div>
        </div>
        <h3 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
          A new country plugs in with one JSON file.
        </h3>
        <p className="mt-3 max-w-3xl text-sm text-foreground/80">
          Country-specific parameters — labour-market data, education taxonomy,
          language, automation calibration, opportunity types — are{" "}
          <strong>inputs to the system, not hardcoded assumptions</strong>.
          Drop a <code className="rounded bg-paper px-1.5 py-0.5 text-xs">data/config/country_config_xxx.json</code>{" "}
          and the same code reconfigures end-to-end. See it live below.
        </p>
        <Link
          to="/localisability"
          className="mt-5 inline-flex items-center gap-2 border-2 border-ink bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-paper hover:bg-cobalt hover:border-cobalt"
        >
          → Compare two contexts side-by-side <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      {/* Expandable details */}
      <section className="mt-16">
        <h2 className="font-display text-2xl font-bold">Want the details?</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          The simple story above is enough for most people. If you're a researcher, policymaker, or curious — open the panels below.
        </p>
        <div className="mt-6 space-y-3">
          <ExpandableNote eyebrow="The science" title="What research is this built on?">
            <p>
              Our automation estimates draw on three foundational studies, each of which we adjust for low- and middle-income contexts:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Frey &amp; Osborne (2013)</strong> — the original Oxford study estimating automation risk across 702 occupations. We use it as a baseline, not gospel.</li>
              <li><strong>Arntz, Gregory &amp; Zierahn (2016, OECD)</strong> — showed that breaking jobs into <em>tasks</em> gives much lower (and more honest) risk estimates than looking at whole occupations. We follow their task-level approach.</li>
              <li><strong>World Bank WDR 2019</strong> — documented that automation in developing countries moves slower than in OECD economies, because capital is scarcer and labour cheaper. This shapes our country-level adjustments.</li>
            </ul>
          </ExpandableNote>

          <ExpandableNote eyebrow="The maths" title="How is the AI risk score calculated?">
            <p>
              For each skill in your profile we combine three signals: an occupation-level baseline (Frey-Osborne), the share of your tasks that are <em>routine cognitive</em> (the parts AI does well), and the share that are <em>routine manual</em> (the parts robots eventually do).
            </p>
            <p>
              We then multiply by a <strong>country calibration factor</strong> (e.g. ×0.55 for Ghana). Why? Replacing a tailor with a sewing robot needs capital — robots, sensors, reliable power. Where labour is abundant and capital scarce, the business case for automation is much weaker.
            </p>
            <p>
              Routine cognitive work, however, gets near-full weight everywhere — because a large language model reaches anyone with a smartphone and internet.
            </p>
          </ExpandableNote>

          <ExpandableNote eyebrow="Honest limits" title="Where could we be wrong?">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Informal sector blind spots.</strong> Most labour data captures formal employment. In countries where 70–85% of work is informal, our task profiles for street vendors or home-based workers lean on regional proxies, not direct measurement.</li>
              <li><strong>Skills are matched by keyword.</strong> When you describe your work, we map it to a global taxonomy. The match is approximate — your real "customer service" might be richer or narrower than the standard definition.</li>
              <li><strong>The future is uncertain.</strong> Our 10-year horizon assumes today's AI scales predictably and infrastructure keeps improving. Both could move faster or slower.</li>
              <li><strong>No verdict on you personally.</strong> Scores reflect average task composition for a skill — not your individual talent, network, or local opportunities. Treat this as a compass, not a forecast.</li>
            </ul>
          </ExpandableNote>
        </div>
      </section>

      {/* Next */}
      <section className="mt-16 rounded-sm border-2 border-ink bg-ink p-6 sm:p-8 text-paper">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt-soft">Curious where the data comes from?</div>
        <h3 className="mt-2 font-display text-2xl font-bold">See our sources</h3>
        <p className="mt-2 max-w-2xl text-sm text-paper/80">
          Every number on this site can be traced back to a public dataset. The Data Sources page shows where each piece of information comes from — and how recently it was updated.
        </p>
        <Link
          to="/infrastructure"
          className="mt-5 inline-block border-2 border-cobalt-soft bg-cobalt-soft/10 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-paper hover:bg-cobalt-soft/20"
        >
          → View our data sources
        </Link>
      </section>
    </PageShell>
  );
}