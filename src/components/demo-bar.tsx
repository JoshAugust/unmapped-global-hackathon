/**
 * DemoBar — floating bottom-center pill shown when app-mode === "demo".
 * Lets the presenter swap between persona presets without leaving the
 * current page, and offers an Exit button that clears mode and routes
 * back to /start. Hidden under presenter mode (data-presenter-hide).
 */

import { useNavigate } from "@tanstack/react-router";
import { useAppMode, PERSONA_LIST, type PersonaId } from "@/lib/app-mode";
import { LogOut, Sparkles } from "lucide-react";

export function DemoBar() {
  const { mode, persona, applyPersona, reset } = useAppMode();
  const navigate = useNavigate();

  if (mode !== "demo") return null;

  const handlePersonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value as PersonaId;
    if (PERSONA_LIST.find(p => p.id === id)) applyPersona(id);
  };

  const handleExit = () => {
    reset();
    navigate({ to: "/start" });
  };

  return (
    <div
      data-presenter-hide="true"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 print:hidden sm:bottom-6"
    >
      <div className="pointer-events-auto flex max-w-[95vw] items-center gap-2 rounded-full border border-ink/20 bg-ink/95 px-3 py-2 text-paper shadow-2xl backdrop-blur sm:gap-3 sm:px-4">
        <span className="hidden items-center gap-1.5 rounded-full bg-cobalt/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-cobalt-soft sm:inline-flex">
          <Sparkles className="h-3 w-3" />
          Demo mode
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-cobalt/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-cobalt-soft sm:hidden">
          <Sparkles className="h-3 w-3" />
          Demo
        </span>

        <label className="flex items-center gap-1.5 text-xs">
          <span className="sr-only">Switch persona</span>
          <select
            value={persona ?? ""}
            onChange={handlePersonaChange}
            className="cursor-pointer rounded-full bg-paper/10 px-3 py-1.5 text-xs font-medium text-paper outline-none ring-1 ring-paper/20 hover:bg-paper/15 focus:ring-cobalt"
          >
            <option value="" disabled className="text-ink">
              Choose persona…
            </option>
            {PERSONA_LIST.map(p => (
              <option key={p.id} value={p.id} className="text-ink">
                {p.flag}  {p.name} — {p.blurb}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={handleExit}
          className="inline-flex items-center gap-1 rounded-full border border-paper/30 px-2.5 py-1.5 text-xs font-medium text-paper/90 hover:bg-paper hover:text-ink"
          aria-label="Exit demo mode"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </div>
  );
}