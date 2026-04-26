import { useState, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ── Fallback occupations (all 14 from passport.tsx) ── */
const FALLBACK_OCCUPATIONS = [
  { label: "Repairing phones, electronics", isco08: "7422" },
  { label: "Selling goods", isco08: "5221" },
  { label: "Sewing, tailoring", isco08: "7531" },
  { label: "Driving", isco08: "8322" },
  { label: "Cooking, food prep", isco08: "5120" },
  { label: "Construction", isco08: "7112" },
  { label: "Farming", isco08: "9211" },
  { label: "Teaching", isco08: "2356" },
  { label: "Office, admin", isco08: "4132" },
  { label: "Healthcare", isco08: "2221" },
  { label: "IT, tech", isco08: "2512" },
  { label: "Fintech, mobile money", isco08: "4215" },
  { label: "Creative work", isco08: "2651" },
  { label: "Other", isco08: "9629" },
];

interface ParsedOccupation {
  isco08: string;
  title: string;
  confidence: number;
}

interface ParseResponse {
  primary: ParsedOccupation;
  secondary?: ParsedOccupation;
  detected_skills: string[];
}

interface LlmInputProps {
  country: string;
  onConfirm: (isco08: string, label: string, detectedSkills: string[]) => void;
}

type Stage = "input" | "loading" | "results" | "fallback";

export function LlmInput({ country, onConfirm }: LlmInputProps) {
  const [text, setText] = useState("");
  const [stage, setStage] = useState<Stage>("input");
  const [parsed, setParsed] = useState<ParseResponse | null>(null);
  const [fallbackValue, setFallbackValue] = useState("");

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) return;
    setStage("loading");
    try {
      const res = await fetch(`${API}/api/skills/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), country, language: "auto" }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data: ParseResponse = await res.json();
      setParsed(data);
      setStage("results");
    } catch {
      setStage("fallback");
    }
  }, [text, country]);

  const handleFallbackSelect = useCallback(
    (val: string) => {
      setFallbackValue(val);
      const occ = FALLBACK_OCCUPATIONS.find((o) => o.isco08 === val);
      if (occ) onConfirm(occ.isco08, occ.label, []);
    },
    [onConfirm],
  );

  /* ── Input stage ── */
  if (stage === "input") {
    return (
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-ink">
            Describe what you do in your own words — any language is fine
          </span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. I fix people's phones and laptops at a market stall, I also sell accessories..."
            rows={3}
            className="mt-2 w-full rounded-sm border border-line bg-paper px-3 py-2.5 text-sm outline-none transition-colors focus:border-cobalt resize-none"
            autoFocus
          />
        </label>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="min-h-[44px] rounded-sm border border-cobalt bg-cobalt px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-paper transition-colors hover:bg-cobalt/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Analyze My Skills
        </button>
      </div>
    );
  }

  /* ── Loading stage ── */
  if (stage === "loading") {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 py-8">
        <div className="relative flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-cobalt" />
        </div>
        <p className="animate-pulse font-mono text-sm text-muted-foreground">
          Understanding your skills…
        </p>
      </div>
    );
  }

  /* ── Results stage ── */
  if (stage === "results" && parsed) {
    return (
      <div className="mt-4 space-y-3">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          We matched your description to:
        </p>

        {/* Primary */}
        <button
          type="button"
          onClick={() =>
            onConfirm(
              parsed.primary.isco08,
              parsed.primary.title,
              parsed.detected_skills,
            )
          }
          className="w-full cursor-pointer rounded-sm border-2 border-cobalt bg-cobalt/5 p-4 text-left transition-all hover:shadow-[4px_4px_0_0_var(--cobalt)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">
              {parsed.primary.title}
            </span>
            <span className="rounded-full bg-cobalt/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-cobalt">
              {Math.round(parsed.primary.confidence * 100)}% match
            </span>
          </div>
          <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
            ISCO-08: {parsed.primary.isco08}
          </span>
        </button>

        {/* Secondary */}
        {parsed.secondary && (
          <button
            type="button"
            onClick={() =>
              onConfirm(
                parsed.secondary!.isco08,
                parsed.secondary!.title,
                parsed.detected_skills,
              )
            }
            className="w-full cursor-pointer rounded-sm border border-line bg-card p-4 text-left transition-all hover:border-ink hover:shadow-[4px_4px_0_0_var(--ink)]"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">
                {parsed.secondary.title}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                {Math.round(parsed.secondary.confidence * 100)}% match
              </span>
            </div>
            <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
              ISCO-08: {parsed.secondary.isco08} · You might also be this
            </span>
          </button>
        )}

        {/* Detected skills badges */}
        {parsed.detected_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {parsed.detected_skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-line bg-muted/50 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Try again */}
        <button
          type="button"
          onClick={() => {
            setStage("input");
            setParsed(null);
          }}
          className="text-xs text-muted-foreground underline hover:text-ink"
        >
          Not quite right? Describe again
        </button>
      </div>
    );
  }

  /* ── Fallback stage (API failed) ── */
  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-muted-foreground">
        We couldn't analyze your text right now. Please pick the closest match:
      </p>
      <select
        value={fallbackValue}
        onChange={(e) => handleFallbackSelect(e.target.value)}
        className="w-full rounded-sm border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-cobalt"
      >
        <option value="">Select your occupation…</option>
        {FALLBACK_OCCUPATIONS.map((occ) => (
          <option key={occ.isco08} value={occ.isco08}>
            {occ.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => {
          setStage("input");
          setParsed(null);
        }}
        className="text-xs text-muted-foreground underline hover:text-ink"
      >
        ← Try typing again
      </button>
    </div>
  );
}
