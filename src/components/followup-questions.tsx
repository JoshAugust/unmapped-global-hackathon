import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface FollowupQuestion {
  id: string;
  question: string;
  why: string;
  options: string[];
}

interface FollowupResponse {
  questions: FollowupQuestion[];
}

interface FollowupQuestionsProps {
  isco08: string;
  detectedSkills: string[];
  country: string;
  onComplete: (answers: Record<string, string>) => void;
  onSkip: () => void;
}

type Stage = "loading" | "questions" | "skipped";

export function FollowupQuestions({
  isco08,
  detectedSkills,
  country,
  onComplete,
  onSkip,
}: FollowupQuestionsProps) {
  const [stage, setStage] = useState<Stage>("loading");
  const [questions, setQuestions] = useState<FollowupQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);

  /* ── Fetch questions ── */
  useEffect(() => {
    let cancelled = false;
    async function fetchQuestions() {
      try {
        const res = await fetch(`${API}/api/skills/followup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isco08,
            detected_skills: detectedSkills,
            country,
          }),
        });
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data: FollowupResponse = await res.json();
        if (!cancelled && data.questions?.length > 0) {
          setQuestions(data.questions.slice(0, 3));
          setStage("questions");
        } else {
          // No questions returned — skip silently
          if (!cancelled) onSkip();
        }
      } catch {
        // API failure — skip silently
        if (!cancelled) onSkip();
      }
    }
    fetchQuestions();
    return () => {
      cancelled = true;
    };
  }, [isco08, detectedSkills, country, onSkip]);

  const handleAnswer = useCallback(
    (questionId: string, option: string) => {
      const newAnswers = { ...answers, [questionId]: option };
      setAnswers(newAnswers);

      if (currentIdx < questions.length - 1) {
        setCurrentIdx((i) => i + 1);
      } else {
        onComplete(newAnswers);
      }
    },
    [answers, currentIdx, questions, onComplete],
  );

  /* ── Loading ── */
  if (stage === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-cobalt" />
        <p className="animate-pulse font-mono text-sm text-muted-foreground">
          Preparing a few quick questions…
        </p>
      </div>
    );
  }

  /* ── Questions ── */
  if (stage === "questions" && questions.length > 0) {
    const q = questions[currentIdx];
    return (
      <div className="space-y-6">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i <= currentIdx ? "bg-cobalt" : "bg-line"
              }`}
            />
          ))}
        </div>

        <div className="mx-auto max-w-lg">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">
            Follow-up {currentIdx + 1} of {questions.length}
          </div>
          <h3 className="mt-2 font-display text-xl font-bold text-ink md:text-2xl">
            {q.question}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground italic">
            {q.why}
          </p>

          {/* Options */}
          <div className="mt-5 grid gap-2">
            {q.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleAnswer(q.id, opt)}
                className={`min-h-[44px] w-full rounded-sm border p-3 text-left text-sm font-medium transition-all ${
                  answers[q.id] === opt
                    ? "border-ink bg-paper shadow-[4px_4px_0_0_var(--ink)]"
                    : "border-line bg-card hover:border-ink"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Skip */}
        <div className="text-center">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-muted-foreground underline hover:text-ink"
          >
            Skip — I'm ready to see my results
          </button>
        </div>
      </div>
    );
  }

  return null;
}
