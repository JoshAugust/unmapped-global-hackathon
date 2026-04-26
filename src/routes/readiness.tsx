import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { COUNTRIES } from "@/data/countries";
import { SKILLS } from "@/data/skills";
import { useProfile } from "@/lib/profile-store";
import { profileExposure, suggestAdjacencies } from "@/lib/engine";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ArrowRight, Download, Check, AlertCircle } from "lucide-react";
import { generateReportPDF } from "@/lib/report-pdf";
import { buildReadinessSummary, tierFromScore, type ReportData } from "@/lib/report-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import CalibrationPanel from "@/components/calibration-panel";

/** Map engine CountryKey → ISO3 used by CalibrationPanel + analytics. */
const COUNTRY_KEY_TO_ISO3: Record<string, string> = {
  "ssa-ghana": "GHA",
  "ssa-nigeria": "NGA",
  "sa-bangladesh": "BGD",
};

export const Route = createFileRoute("/readiness")({
  component: Readiness,
  head: () => ({ meta: [
    { title: "AI Readiness & Displacement Lens — UNMAPPED" },
    { name: "description", content: "Honest automation exposure assessment calibrated for LMICs." },
  ]}),
});

function riskColor(x: number) {
  if (x < 0.35) return "var(--moss)";
  if (x < 0.6) return "var(--rust)";
  return "oklch(0.55 0.2 25)";
}

type Light = "green" | "yellow" | "red";
function trafficLight(x: number): Light {
  if (x < 0.35) return "green";
  if (x < 0.6) return "yellow";
  return "red";
}
const LIGHT_META: Record<Light, { color: string; label: string; headline: string; message: string }> = {
  green: {
    color: "var(--moss)",
    label: "On solid ground",
    headline: "You're well-positioned.",
    message: "Most of what you do depends on judgement, hands-on skill, and trust with people — the parts of work that AI struggles with. Keep building, and add one digital tool a year to stay ahead.",
  },
  yellow: {
    color: "oklch(0.78 0.16 80)",
    label: "Shifting ground — manageable",
    headline: "Some parts of your work will change. The core of it won't.",
    message: "A handful of routine tasks in your day are getting cheaper for software to do. That doesn't mean your job disappears — it means the mix shifts. Lean into the people-facing and problem-solving parts you already do well.",
  },
  red: {
    color: "oklch(0.55 0.2 25)",
    label: "Worth a serious plan",
    headline: "Your task mix faces real pressure — and you have time to move.",
    message: "A meaningful share of what you do today can be done by software within the decade. This isn't a verdict — it's a heads-up. The adjacent skills below are within reach in 6 months and connect directly to growing parts of the local economy.",
  },
};

function Readiness() {
  const [profile] = useProfile();
  const country = COUNTRIES[profile.countryKey];
  const { overall, items } = useMemo(() => profileExposure(profile), [profile]);
  const adj = useMemo(() => suggestAdjacencies(profile), [profile]);
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [methodOpen, setMethodOpen] = useState(false);
  const [pdfState, setPdfState] = useState<"idle" | "generating" | "done" | "error">("idle");

  const light = trafficLight(overall);
  const meta = LIGHT_META[light];

  // Sort skills into "at risk" (top 3 highest exposure) and "durable" (lowest exposure)
  const sorted = [...items].sort((a, b) => b.exposure - a.exposure);
  const atRisk = sorted.filter(i => i.exposure >= 0.5).slice(0, 3);
  const durable = [...items].sort((a, b) => a.exposure - b.exposure).filter(i => i.exposure < 0.45).slice(0, 3);

  const placeName = profile.countryKey === "ssa-ghana" ? "Greater Accra" : country.country;

  // Build a ReportData snapshot from current screen state for PDF export.
  const reportData: ReportData = useMemo(() => {
    const tier = tierFromScore(overall);
    const sortedRisks = [...items].sort((a, b) => b.exposure - a.exposure);
    const topRisks = sortedRisks.slice(0, 4).map(it => ({
      category: it.id,
      label: it.label,
      share: 1 / Math.max(1, items.length),
      risk: it.exposure,
    }));
    const durableSkills = [...items]
      .sort((a, b) => a.exposure - b.exposure)
      .slice(0, 6)
      .map(it => it.label);
    const pathways = adj.slice(0, 3).map(a => ({
      title: a.skill.label,
      isco08: "—",
      overlapPct: Math.round((1 - a.exposure) * 100),
      missingSkills: 1,
      wageUpliftPct: Math.round(Math.max(5, (1 - a.exposure) * 25)),
      gapDescription: a.reason,
    }));
    return {
      generatedAt: new Date().toISOString(),
      profileLabel: profile.name || "Your readiness report",
      occupationTitle: country.educationLevels.find(e => e.id === profile.educationId)?.label ?? "Worker",
      isco08: "—",
      countryCode: profile.countryKey,
      countryName: country.country,
      educationLevel: country.educationLevels.find(e => e.id === profile.educationId)?.label,
      experienceYears: String(profile.yearsExperience),
      durableSkills,
      readiness: {
        riskScore: overall,
        tier,
        summary: buildReadinessSummary(tier),
      },
      topRisks,
      pathways,
      labourMarket: {
        youthUnemploymentPct: country.signals.youthUnemployment,
      },
      notes: [],
      dataLimitations: [
        `Around ${country.signals.informalShare}% of work is informal — task profiles use regional proxies.`,
        "Skills are matched by keyword to ESCO/O*NET — approximate, not exact.",
      ],
    };
  }, [overall, items, adj, profile, country]);

  const handleDownloadPDF = async () => {
    setPdfState("generating");
    try {
      const filename = await generateReportPDF(reportData);
      setPdfState("done");
      toast.success("Report downloaded", { description: filename });
      setTimeout(() => setPdfState("idle"), 2500);
    } catch (err) {
      console.error("PDF generation failed", err);
      setPdfState("error");
      toast.error("Couldn't generate the PDF", {
        description: "Please try again.",
        action: { label: "Retry", onClick: () => handleDownloadPDF() },
      });
    }
  };

  // Plain-language examples for at-risk skills
  const RISK_EXAMPLE: Record<string, string> = {
    "data-entry": "Typing customer details into spreadsheets — software now does this from a phone photo in seconds.",
    "bookkeeping": "Routine ledger entries and balancing — apps like mobile-money dashboards already automate the basics.",
    "cash-handling": "Counting and reconciling till takings — POS and mobile-money cut this work each year.",
    "customer-service": "Answering the same FAQs by phone or chat — chatbots handle the easy 60%, leaving the harder calls for you.",
    "driving": "Long-haul routing and fare calculation — apps already do this; full self-driving is far off in Accra traffic.",
    "tailoring": "Standard-pattern stitching at scale — factory automation pressures bulk work, not bespoke or alterations.",
    "social-media-content": "Writing generic captions and basic graphics — AI tools draft these in seconds now.",
    "english-written": "Drafting routine emails and short reports — AI assists strongly; your judgement on tone still matters.",
    "basic-coding": "Boilerplate code and simple scripts — AI writes the first draft; review and integration are still on you.",
  };
  const DURABLE_REASON: Record<string, string> = {
    "mobile-repair": "Diagnosing a cracked board by feel and sight is hands-on work AI can't replicate.",
    "spoken-multilingual": "Switching between Twi, Ga, and English with customers builds trust software can't fake.",
    "negotiation": "Reading the room, holding silence, knowing when to walk — deeply human.",
    "carpentry": "Custom fits, on-site judgement, and physical craftsmanship stay valuable.",
    "small-engine-repair": "Every breakdown is different. Diagnosis is non-routine and physical.",
    "smartphone-fluency": "You're the bridge for customers who don't know how. That's a service, not a task.",
    "literacy-numeracy": "The foundation under every other skill. Always pays.",
    "agri-cultivation": "Local soil, weather, and crop knowledge can't be downloaded.",
  };

  return (
    <PageShell
      eyebrow="Module 02 · AI Readiness Lens"
      title={<>Where you stand. <span className="text-cobalt">Where to go next.</span></>}
      lede={`A clear-eyed look at how AI and automation will touch your work over the next 10 years — calibrated for ${placeName}, not Silicon Valley.`}
    >
      {/* TRAFFIC LIGHT HERO */}
      <section
        className="rounded-sm border-2 p-6 sm:p-8 shadow-[6px_6px_0_0_var(--ink)]"
        style={{ borderColor: meta.color, background: "var(--paper)" }}
      >
        <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
          {/* The light */}
          <div className="flex sm:flex-col gap-3 items-center sm:items-start">
            <div className="flex flex-col gap-2">
              {(["green", "yellow", "red"] as Light[]).map(l => {
                const active = l === light;
                const colors: Record<Light, string> = {
                  green: "var(--moss)",
                  yellow: "oklch(0.78 0.16 80)",
                  red: "oklch(0.55 0.2 25)",
                };
                return (
                  <div
                    key={l}
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-ink transition-all"
                    style={{
                      background: active ? colors[l] : "var(--sand)",
                      boxShadow: active ? `0 0 24px ${colors[l]}` : "none",
                      opacity: active ? 1 : 0.3,
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Your 10-year outlook · {placeName}
            </div>
            <div
              className="mt-2 font-mono text-xs uppercase tracking-wider font-bold"
              style={{ color: meta.color }}
            >
              {meta.label}
            </div>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-black leading-tight">
              {meta.headline}
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-foreground/80">
              {meta.message}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="font-mono">Composite exposure: <span className="font-bold" style={{ color: meta.color }}>{pct(overall)}</span></span>
              <span className="font-mono">Calibrated for {country.country} (×{country.automationCalibration})</span>
            </div>
          </div>
        </div>
      </section>

      {/* THREE SECTIONS */}
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {/* AT RISK */}
        <section className="rounded-sm border border-line bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ background: "oklch(0.55 0.2 25)" }} />
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Tasks shifting
            </div>
          </div>
          <h3 className="mt-2 font-display text-xl font-bold">What AI is taking on</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            These parts of your day are getting easier for software. Knowing them is the first step to staying ahead.
          </p>
          {atRisk.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/70">
              Good news — none of your current skills are in the high-pressure zone. Keep an eye on the durable strengths to your right.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {atRisk.map(it => (
                <li key={it.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-medium text-sm">{it.label}</div>
                    <span className="font-mono text-xs" style={{ color: riskColor(it.exposure) }}>
                      {pct(it.exposure)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {RISK_EXAMPLE[it.id] ?? "Routine portions of this skill are increasingly handled by software."}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* DURABLE */}
        <section className="rounded-sm border border-line bg-card p-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ background: "var(--moss)" }} />
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Your strengths
            </div>
          </div>
          <h3 className="mt-2 font-display text-xl font-bold">What stays valuable</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            These skills get more valuable, not less, as routine work disappears around them.
          </p>
          {durable.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/70">
              Add a hands-on or people-facing skill to your profile to unlock durable strengths here.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {durable.map(it => (
                <li key={it.id} className="border-t border-line pt-3 first:border-0 first:pt-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-medium text-sm">{it.label}</div>
                    <span className="font-mono text-xs text-moss">durable</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {DURABLE_REASON[it.id] ?? "Non-routine, hands-on, or people-facing — the parts of work AI struggles with."}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ADJACENT */}
        <section className="rounded-sm border-2 border-cobalt bg-cobalt/5 p-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-cobalt" />
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">
              Build next · ≤ 6 months
            </div>
          </div>
          <h3 className="mt-2 font-display text-xl font-bold">Skills within reach</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Practical, locally-relevant skills you could add in months — not years — that compound with what you already have.
          </p>
          {adj.length === 0 ? (
            <p className="mt-4 text-sm text-foreground/70">
              Add foundational skills to your passport first, and we'll surface achievable next steps here.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {adj.map(a => (
                <li key={a.skill.id} className="border-t border-cobalt/20 pt-3 first:border-0 first:pt-0">
                  <div className="font-semibold text-sm">{a.skill.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{a.reason}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-cobalt">
                    Exposure of new skill: {pct(a.exposure)}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/dashboard"
            className="group mt-6 inline-flex items-center gap-2 rounded-sm border-2 border-ink bg-cobalt px-5 py-3 font-mono text-xs uppercase tracking-wider font-bold text-paper shadow-[4px_4px_0_0_var(--ink)] transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            See matched opportunities
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </section>
      </div>

      {/* EXPORT YOUR PASSPORT — appears after the assessment */}
      <section className="mt-10 rounded-sm border-2 border-ink bg-paper p-6 sm:p-8 shadow-[6px_6px_0_0_var(--ink)]">
        <div className="grid gap-6 md:grid-cols-[1.4fr_auto] md:items-center">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">
              Your assessment is ready
            </div>
            <h3 className="mt-2 font-display text-2xl font-bold">
              Take your readiness passport with you.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80 max-w-xl">
              A clean one-pager with your outlook, durable strengths, and next-step skills —
              ready to print or share with a trainer, mentor, or employer.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={pdfState === "generating"}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-sm border-2 border-ink px-5 py-3 font-mono text-xs uppercase tracking-wider font-bold shadow-[4px_4px_0_0_var(--ink)] transition-all disabled:opacity-60",
                pdfState === "done"
                  ? "bg-moss text-paper"
                  : "bg-ink text-paper hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_0_var(--cobalt)]",
              )}
              aria-live="polite"
            >
              {pdfState === "generating" ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Preparing PDF…
                </>
              ) : pdfState === "done" ? (
                <>
                  <Check className="h-4 w-4" /> Downloaded
                </>
              ) : pdfState === "error" ? (
                <>
                  <AlertCircle className="h-4 w-4" /> Retry
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" /> Download PDF
                </>
              )}
            </button>
            <Link
              to="/share"
              className="inline-flex items-center justify-center gap-2 rounded-sm border-2 border-ink bg-paper px-5 py-3 font-mono text-xs uppercase tracking-wider font-bold text-ink hover:bg-sand"
            >
              More ways to share
            </Link>
          </div>
        </div>
      </section>

      {/* FUTURE CONTEXT */}
      <section className="mt-10 rounded-sm border border-ink bg-paper p-6 sm:p-8">
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">
              Future context · Wittgenstein SSP2
            </div>
            <h3 className="mt-2 font-display text-2xl font-bold">
              {placeName}'s graduates are about to nearly double.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">
              By 2035, the share of {country.country}'s youth with a tertiary qualification rises from{" "}
              <span className="font-bold">{country.wittgenstein[0].tertiaryYouthPct}%</span> to{" "}
              <span className="font-bold text-cobalt">{country.wittgenstein[country.wittgenstein.length - 1].tertiaryYouthPct}%</span>.
              That means more competition for office-style cognitive roles — and more value placed on practical, trust-based, and hands-on work.
              The path forward isn't a degree alone; it's a stack of skills that machines and graduates can't easily replace.
            </p>
          </div>
          <div className="flex items-end gap-3 sm:gap-4 border-l-2 border-ink pl-4 sm:pl-6">
            {country.wittgenstein.map(w => (
              <div key={w.year} className="flex-1 text-center">
                <div
                  className="bg-cobalt mx-auto w-full rounded-sm"
                  style={{ height: `${Math.max(20, w.tertiaryYouthPct * 5)}px` }}
                />
                <div className="mt-2 font-display text-lg font-bold">{w.tertiaryYouthPct}%</div>
                <div className="font-mono text-[9px] uppercase text-muted-foreground">{w.year}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW WE ESTIMATED THIS */}
      <section className="mt-8 rounded-sm border border-line bg-sand/40 p-6">
        <Collapsible open={methodOpen} onOpenChange={setMethodOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 text-left">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Transparency
              </div>
              <h3 className="mt-1 font-display text-lg font-bold">How we estimated this</h3>
            </div>
            <ChevronDown
              className={`h-5 w-5 shrink-0 transition-transform ${methodOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/80">
            <p>
              <span className="font-semibold">The score</span> blends three pieces:
              an occupation-level automation baseline from the Frey-Osborne research (Oxford, 2017),
              the share of your tasks that are <em>routine cognitive</em> (which large language models do well),
              and the share that are <em>routine manual</em> (which physical robots do — eventually).
            </p>
            <p>
              <span className="font-semibold">Local calibration:</span> we multiply the global baseline by{" "}
              <span className="font-mono text-cobalt">×{country.automationCalibration}</span> for {country.country}.
              Why? Because automating physical work needs capital — robots, sensors, reliable power.
              In a context where labour is abundant and capital is scarce, the business case for replacing
              a tailor or driver with a machine is much weaker than in Germany or Japan.
            </p>
            <p>
              <span className="font-semibold">Why our number is lower than headlines:</span> global studies
              like the McKinsey or WEF reports assume widespread enterprise-grade adoption.
              In {placeName}, where {country.signals.informalShare}% of work is informal, automation rolls out
              unevenly. We discount routine-manual exposure but keep routine-cognitive exposure at near-full
              weight — because LLMs reach you through any phone with internet.
            </p>
          </CollapsibleContent>
        </Collapsible>
      </section>

      {/* LIMITS & DATA GAPS */}
      <section className="mt-4 rounded-sm border border-dashed border-ink/40 bg-paper p-6">
        <Collapsible open={limitsOpen} onOpenChange={setLimitsOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 text-left">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-rust">
                Be honest with me
              </div>
              <h3 className="mt-1 font-display text-lg font-bold">Limits & data gaps</h3>
            </div>
            <ChevronDown
              className={`h-5 w-5 shrink-0 transition-transform ${limitsOpen ? "rotate-180" : ""}`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/80">
            <ul className="space-y-3">
              <li className="border-l-2 border-rust pl-3">
                <span className="font-semibold">Informal sector blind spots.</span> Most labour data captures
                formal employment. Around {country.signals.informalShare}% of work in {country.country} is informal,
                so our task profiles for street vendors, mechanics, or home-based tailors lean on regional proxies,
                not direct measurement.
              </li>
              <li className="border-l-2 border-rust pl-3">
                <span className="font-semibold">Skills are matched by keyword.</span> When you tag a skill,
                we map it to a global taxonomy (ESCO/O*NET). The match is approximate — your real-world version
                of "customer service" might be richer or narrower than the standard definition.
              </li>
              <li className="border-l-2 border-rust pl-3">
                <span className="font-semibold">The future is uncertain.</span> The 10-year horizon assumes
                today's AI capabilities scale predictably and that infrastructure (power, internet, devices)
                keeps improving. Both could move faster or slower than expected.
              </li>
              <li className="border-l-2 border-rust pl-3">
                <span className="font-semibold">No verdict on you personally.</span> A score reflects average
                task composition for a skill, not your individual performance, network, or local opportunities.
                Treat this as a compass, not a forecast.
              </li>
            </ul>
            <div className="mt-4 border-t border-line pt-3 text-xs text-muted-foreground">
              <div className="font-mono uppercase tracking-wider">Sources</div>
              <ul className="mt-1 space-y-0.5">
                {country.sourceNotes.map(s => <li key={s}>· {s}</li>)}
                <li>· Automation baseline: Frey & Osborne (2017), ILO task-based indices</li>
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      {/* TASK COMPOSITION DETAIL */}
      {sorted.length > 0 && (
        <div className="mt-12">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Under the hood · task composition of your top-exposure skills
          </div>
          <div className="mt-3 grid gap-px border border-line bg-line md:grid-cols-3">
            {sorted.slice(0, 3).map(it => {
              const s = SKILLS[it.id as keyof typeof SKILLS];
              return (
                <div key={it.id} className="bg-paper p-6">
                  <div className="font-display text-base font-bold">{s.label}</div>
                  <div className="mt-3 space-y-1.5">
                    {Object.entries(s.task).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2 text-xs">
                        <span className="w-32 capitalize text-muted-foreground">{k.replace(/([A-Z])/g, " $1")}</span>
                        <div className="h-1 flex-1 bg-sand">
                          <div className="h-full bg-ink" style={{ width: `${v * 100}%` }} />
                        </div>
                        <span className="font-mono w-8 text-right">{Math.round(v * 100)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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