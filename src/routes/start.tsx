/**
 * /start — explicit "Who are you?" picker. Routes:
 *   - Policymaker → /policymaker
 *   - Youth → reveals demo persona cards or a "Live" CTA → /passport
 * Mobile-first stack, two-column on >= md.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav, SiteFooter } from "@/components/site-nav";
import { useAppMode, PERSONA_LIST, type PersonaId } from "@/lib/app-mode";
import { ArrowRight, GraduationCap, BarChart3, Sparkles, PenLine, Check } from "lucide-react";

export const Route = createFileRoute("/start")({
  component: StartPage,
  head: () => ({
    meta: [
      { title: "Get started — UNMAPPED" },
      {
        name: "description",
        content:
          "Pick your starting point: explore the platform as a young person (demo persona or your own data) or as a policymaker.",
      },
    ],
  }),
});

type Audience = "youth" | "policymaker";

function StartPage() {
  const navigate = useNavigate();
  const { setAudience, setMode, applyPersona } = useAppMode();
  const [step, setStep] = useState<"audience" | "youth-mode">("audience");

  const pickAudience = (a: Audience) => {
    setAudience(a);
    if (a === "policymaker") {
      setMode("live");
      navigate({ to: "/policymaker" });
    } else {
      setStep("youth-mode");
    }
  };

  const pickPersona = (id: PersonaId) => {
    applyPersona(id);
    navigate({ to: "/results" });
  };

  const goLive = () => {
    setMode("live");
    navigate({ to: "/passport" });
  };

  return (
    <div id="main-start" className="min-h-screen bg-paper text-ink">
      <SiteNav />

      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-14">
        <header className="text-center">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cobalt">
            Get started
          </div>
          <h1 className="mt-3 font-display text-3xl font-black leading-[1.1] sm:text-4xl md:text-5xl">
            Who are you, and how do you want to explore?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Pick a path below. You can switch personas any time from the demo bar.
          </p>
        </header>

        {step === "audience" && (
          <section
            aria-label="Choose audience"
            className="mt-10 grid gap-4 sm:gap-6 md:grid-cols-2"
          >
            <AudienceTile
              icon={<GraduationCap className="h-7 w-7" />}
              eyebrow="For you"
              title="I'm a young person"
              body="See your skills' value, automation risk, and 5-year opportunity pathways. Try a demo persona or start with your own answers."
              cta="Continue"
              onClick={() => pickAudience("youth")}
              accent="cobalt"
            />
            <AudienceTile
              icon={<BarChart3 className="h-7 w-7" />}
              eyebrow="For systems"
              title="I'm a policymaker"
              body="Workforce intelligence: cohort exposure, sector growth, returns to education, and recalibrated automation by ISCO."
              cta="Open dashboard"
              onClick={() => pickAudience("policymaker")}
              accent="ink"
            />
          </section>
        )}

        {step === "youth-mode" && (
          <section aria-label="Choose mode" className="mt-10 grid gap-6 lg:grid-cols-2">
            {/* Demo column */}
            <div className="rounded-md border-2 border-cobalt bg-cobalt-soft p-5 sm:p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cobalt">
                <Sparkles className="h-4 w-4" /> Demo
              </div>
              <h2 className="mt-2 font-display text-xl font-black sm:text-2xl">
                Walk through with a persona
              </h2>
              <p className="mt-2 text-sm text-ink/80">
                Skip the questions — pick someone whose situation rhymes with yours.
              </p>
              <ul className="mt-5 grid gap-3">
                {PERSONA_LIST.map(p => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => pickPersona(p.id)}
                      className="group flex w-full items-center gap-3 rounded-md border border-line bg-paper p-3 text-left transition-colors hover:border-cobalt sm:p-4"
                    >
                      <span className="text-2xl" aria-hidden="true">{p.flag}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-display text-base font-bold leading-tight">
                          {p.name}, {p.age}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {p.isco08_label} · {p.city}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-cobalt transition-transform group-hover:translate-x-1" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Live column */}
            <div className="flex flex-col rounded-md border-2 border-ink bg-paper p-5 sm:p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink">
                <PenLine className="h-4 w-4" /> Live
              </div>
              <h2 className="mt-2 font-display text-xl font-black sm:text-2xl">
                Use your own answers
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Build your skills passport in about 3 minutes — works in 7 languages and on a basic phone.
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
                  Pick from common informal-sector roles or describe yours.
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
                  We map skills to ESCO/O*NET behind the scenes.
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
                  Get a calibrated AI-readiness read for your country.
                </li>
              </ul>
              <button
                type="button"
                onClick={goLive}
                className="mt-auto inline-flex items-center justify-center gap-2 self-start bg-ink px-5 py-3 text-sm font-semibold text-paper hover:bg-cobalt"
              >
                Start my passport <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {step === "youth-mode" && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setStep("audience")}
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-ink"
            >
              ← Back
            </button>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function AudienceTile({
  icon,
  eyebrow,
  title,
  body,
  cta,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
  accent: "cobalt" | "ink";
}) {
  const border = accent === "cobalt" ? "hover:border-cobalt" : "hover:border-ink";
  const ctaBg = accent === "cobalt" ? "bg-cobalt hover:bg-ink" : "bg-ink hover:bg-cobalt";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-full flex-col rounded-md border-2 border-line bg-paper p-6 text-left transition-colors sm:p-8 ${border}`}
    >
      <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${accent === "cobalt" ? "bg-cobalt text-paper" : "bg-ink text-paper"}`}>
        {icon}
      </span>
      <span className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {eyebrow}
      </span>
      <span className="mt-2 font-display text-2xl font-black leading-tight sm:text-3xl">
        {title}
      </span>
      <span className="mt-3 text-sm text-muted-foreground sm:text-base">
        {body}
      </span>
      <span className={`mt-6 inline-flex items-center gap-2 self-start px-5 py-3 text-sm font-semibold text-paper ${ctaBg}`}>
        {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </button>
  );
}