import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { PageShell } from "@/components/page-shell";
import { useOnboarding } from "@/lib/profile-store";

export const Route = createFileRoute("/passport")({
  component: Passport,
  head: () => ({
    meta: [
      { title: "Your Skills Passport — UNMAPPED" },
      {
        name: "description",
        content:
          "Answer 5 quick questions to build your portable, ESCO-aligned skill passport.",
      },
    ],
  }),
});

/* ── ISCO-08 occupation mapping ── */

interface OccupationOption {
  label: string;
  isco08: string | null;
  icon: string;
}

const WORK_OPTIONS: OccupationOption[] = [
  { label: "Repairing phones, electronics", isco08: "7422", icon: "🔧" },
  { label: "Selling goods", isco08: "5221", icon: "🛒" },
  { label: "Sewing, tailoring", isco08: "7531", icon: "🧵" },
  { label: "Driving", isco08: "8322", icon: "🚗" },
  { label: "Cooking, food prep", isco08: "5120", icon: "🍳" },
  { label: "Construction", isco08: "7112", icon: "🏗️" },
  { label: "Farming", isco08: "9211", icon: "🌾" },
  { label: "Teaching", isco08: "2356", icon: "📚" },
  { label: "Office, admin", isco08: "4132", icon: "🗂️" },
  { label: "Healthcare", isco08: "2221", icon: "🏥" },
  { label: "IT, tech", isco08: "2512", icon: "💻" },
  { label: "Fintech, mobile money", isco08: "4215", icon: "📱" },
  { label: "Creative work", isco08: "2651", icon: "🎨" },
  { label: "Something else", isco08: null, icon: "✏️" },
];

const EDUCATION_OPTIONS = [
  { code: "L0", label: "No formal education", isced: "0" },
  { code: "L1", label: "Primary (incomplete)", isced: "1" },
  { code: "L2", label: "Primary leaving certificate", isced: "1" },
  { code: "L3", label: "Junior Secondary (JSSC)", isced: "2" },
  { code: "L4", label: "Senior Secondary (WAEC/NECO)", isced: "3" },
  { code: "L5", label: "National Diploma / Technical cert", isced: "4" },
  { code: "L6", label: "Higher National Diploma (HND)", isced: "5" },
  { code: "L7", label: "University degree (B.Sc / B.A)", isced: "6" },
  { code: "L8", label: "Postgraduate", isced: "7+" },
];

const INFORMAL_SKILLS_OPTIONS = [
  "Basic computer use",
  "Smartphones and apps",
  "Social media for business",
  "Accounting / bookkeeping",
  "Trade through apprenticeship",
  "Coding / tech",
  "A language",
  "Nothing specific",
];

const EXPERIENCE_OPTIONS = [
  { label: "Less than 1 year", value: "<1" },
  { label: "1–2 years", value: "1-2" },
  { label: "3–5 years", value: "3-5" },
  { label: "More than 5 years", value: "5+" },
];

const GOAL_OPTIONS = [
  { label: "Find a formal job", icon: "💼" },
  { label: "Grow my own business", icon: "📈" },
  { label: "Learn new skill / get certified", icon: "🎓" },
  { label: "Understand what jobs pay", icon: "💰" },
  { label: "See how AI might affect my work", icon: "🤖" },
];

const TOTAL_STEPS = 5;

/* ── Main component ── */

function Passport() {
  const [onboarding, setOnboarding] = useOnboarding();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);
  const [building, setBuilding] = useState(false);

  // Local draft state (committed to store on completion)
  const [selectedWork, setSelectedWork] = useState<string | null>(
    onboarding.isco08_label || null,
  );
  const [freeText, setFreeText] = useState(onboarding.isco08_freetext || "");
  const [selectedEdu, setSelectedEdu] = useState(
    onboarding.education_level || "",
  );
  const [selectedInformal, setSelectedInformal] = useState<string[]>(
    onboarding.informal_skills || [],
  );
  const [selectedExp, setSelectedExp] = useState(
    onboarding.experience_years || "",
  );
  const [selectedGoal, setSelectedGoal] = useState(
    onboarding.user_goal || "",
  );

  const goTo = useCallback(
    (next: number) => {
      if (animating) return;
      setDirection(next > step ? "forward" : "back");
      setAnimating(true);
      setTimeout(() => {
        setStep(next);
        setAnimating(false);
      }, 250);
    },
    [step, animating],
  );

  const canNext = (): boolean => {
    switch (step) {
      case 1:
        return selectedWork === "Something else"
          ? freeText.trim().length > 0
          : selectedWork !== null;
      case 2:
        return selectedEdu !== "";
      case 3:
        return selectedInformal.length > 0;
      case 4:
        return selectedExp !== "";
      case 5:
        return selectedGoal !== "";
      default:
        return false;
    }
  };

  const handleComplete = useCallback(() => {
    const workOption = WORK_OPTIONS.find((o) => o.label === selectedWork);
    setOnboarding({
      isco08: workOption?.isco08 ?? null,
      isco08_label: selectedWork || "",
      isco08_freetext: selectedWork === "Something else" ? freeText : "",
      education_level: selectedEdu,
      informal_skills: selectedInformal,
      experience_years: selectedExp,
      user_goal: selectedGoal,
      country: "NGA",
      completed: true,
    });
    setBuilding(true);
    setTimeout(() => {
      navigate({ to: "/readiness" });
    }, 2200);
  }, [
    selectedWork,
    freeText,
    selectedEdu,
    selectedInformal,
    selectedExp,
    selectedGoal,
    setOnboarding,
    navigate,
  ]);

  const handleNext = () => {
    if (!canNext()) return;
    if (step < TOTAL_STEPS) {
      goTo(step + 1);
    } else {
      handleComplete();
    }
  };

  /* ── Building state ── */
  if (building) {
    return (
      <PageShell
        eyebrow="Module 01 · Skills Signal Engine"
        title={<>Building your profile&hellip;</>}
      >
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-line border-t-cobalt" />
          <p className="mt-6 font-mono text-sm text-muted-foreground">
            Mapping your experience to ESCO &amp; ISCO-08&hellip;
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Module 01 · Skills Signal Engine"
      title={
        <>
          Build a passport that{" "}
          <span className="text-cobalt">travels</span>.
        </>
      }
      lede="Answer 5 quick questions so we can map your experience into a portable, human-readable profile."
    >
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>Step {step} of {TOTAL_STEPS}</span>
          <span>{Math.round((step / TOTAL_STEPS) * 100)}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-line">
          <div
            className="h-full rounded-full bg-cobalt transition-all duration-500 ease-out"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="mx-auto max-w-2xl">
        <div
          className={`transition-all duration-250 ease-out ${
            animating
              ? direction === "forward"
                ? "translate-x-8 opacity-0"
                : "-translate-x-8 opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          {step === 1 && (
            <StepWork
              selected={selectedWork}
              onSelect={setSelectedWork}
              freeText={freeText}
              onFreeText={setFreeText}
            />
          )}
          {step === 2 && (
            <StepEducation
              selected={selectedEdu}
              onSelect={setSelectedEdu}
            />
          )}
          {step === 3 && (
            <StepInformalSkills
              selected={selectedInformal}
              onToggle={(skill) =>
                setSelectedInformal((prev) =>
                  prev.includes(skill)
                    ? prev.filter((s) => s !== skill)
                    : [...prev, skill],
                )
              }
            />
          )}
          {step === 4 && (
            <StepExperience
              selected={selectedExp}
              onSelect={setSelectedExp}
            />
          )}
          {step === 5 && (
            <StepGoal selected={selectedGoal} onSelect={setSelectedGoal} />
          )}
        </div>

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={() => step > 1 && goTo(step - 1)}
            disabled={step === 1}
            className="min-h-[44px] min-w-[44px] rounded-sm border border-line px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canNext()}
            className="min-h-[44px] min-w-[100px] rounded-sm border border-ink bg-ink px-6 py-2.5 font-mono text-xs uppercase tracking-wider text-paper transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {step === TOTAL_STEPS ? "Build passport →" : "Next →"}
          </button>
        </div>
      </div>
    </PageShell>
  );
}

/* ── Step components ── */

function StepHeading({
  number,
  question,
}: {
  number: number;
  question: string;
}) {
  return (
    <div className="mb-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">
        Question {number}
      </div>
      <h2 className="mt-2 font-display text-2xl font-black leading-tight text-ink md:text-3xl">
        {question}
      </h2>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] w-full cursor-pointer rounded-sm border p-4 text-left transition-all ${
        selected
          ? "border-ink bg-paper shadow-[4px_4px_0_0_var(--ink)]"
          : "border-line bg-card hover:border-ink"
      }`}
    >
      {children}
    </button>
  );
}

/* Step 1: Work activity */
function StepWork({
  selected,
  onSelect,
  freeText,
  onFreeText,
}: {
  selected: string | null;
  onSelect: (v: string) => void;
  freeText: string;
  onFreeText: (v: string) => void;
}) {
  return (
    <div>
      <StepHeading
        number={1}
        question="What do you spend most of your working time doing?"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {WORK_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.label}
            selected={selected === opt.label}
            onClick={() => onSelect(opt.label)}
          >
            <div className="text-xl">{opt.icon}</div>
            <div className="mt-1 text-sm font-medium leading-snug">
              {opt.label}
            </div>
            {opt.isco08 && (
              <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                ISCO {opt.isco08}
              </div>
            )}
          </OptionCard>
        ))}
      </div>
      {selected === "Something else" && (
        <div className="mt-4">
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Tell us what you do
            </span>
            <input
              type="text"
              value={freeText}
              onChange={(e) => onFreeText(e.target.value)}
              placeholder="e.g. Barbing / hairdressing, Photography…"
              className="mt-1 w-full rounded-sm border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-cobalt"
              autoFocus
            />
          </label>
        </div>
      )}
    </div>
  );
}

/* Step 2: Education */
function StepEducation({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <StepHeading
        number={2}
        question="What is your highest level of education?"
      />
      <div className="grid gap-3">
        {EDUCATION_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.code}
            selected={selected === opt.code}
            onClick={() => onSelect(opt.code)}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{opt.label}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                ISCED {opt.isced}
              </span>
            </div>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

/* Step 3: Informal skills (multi-select) */
function StepInformalSkills({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (skill: string) => void;
}) {
  return (
    <div>
      <StepHeading
        number={3}
        question="Have you taught yourself any skills?"
      />
      <p className="mb-4 text-sm text-muted-foreground">
        Select all that apply.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {INFORMAL_SKILLS_OPTIONS.map((skill) => {
          const isSelected = selected.includes(skill);
          return (
            <button
              key={skill}
              type="button"
              onClick={() => onToggle(skill)}
              className={`flex min-h-[44px] items-center gap-3 rounded-sm border p-4 text-left transition-all ${
                isSelected
                  ? "border-ink bg-paper shadow-[4px_4px_0_0_var(--ink)]"
                  : "border-line bg-card hover:border-ink"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                  isSelected
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-paper"
                }`}
              >
                {isSelected && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium">{skill}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* Step 4: Experience years */
function StepExperience({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <StepHeading
        number={4}
        question="How many years have you been doing your main work?"
      />
      {/* Visual timeline */}
      <div className="mb-6 flex items-center justify-between px-2">
        {EXPERIENCE_OPTIONS.map((opt, i) => (
          <div key={opt.value} className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold transition-all ${
                selected === opt.value
                  ? "border-cobalt bg-cobalt text-paper scale-110"
                  : "border-line bg-paper text-muted-foreground hover:border-ink"
              }`}
            >
              {i + 1}
            </button>
            <span className="mt-2 text-center text-xs text-muted-foreground max-w-[70px]">
              {opt.label}
            </span>
          </div>
        ))}
      </div>
      {/* Also show as cards for easier mobile tap */}
      <div className="grid gap-3">
        {EXPERIENCE_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.value}
            selected={selected === opt.value}
            onClick={() => onSelect(opt.value)}
          >
            <span className="text-sm font-medium">{opt.label}</span>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

/* Step 5: Goal */
function StepGoal({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <StepHeading
        number={5}
        question="What are you most hoping to do?"
      />
      <div className="grid gap-3">
        {GOAL_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.label}
            selected={selected === opt.label}
            onClick={() => onSelect(opt.label)}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{opt.icon}</span>
              <span className="text-sm font-medium">{opt.label}</span>
            </div>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}
