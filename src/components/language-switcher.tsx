import { useEffect, useRef, useState } from "react";
import { useI18n, type LocaleInfo } from "../lib/i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LanguageSwitcherProps {
  /** "compact" = flag + code only (for navbar); "full" = flag + native name + checkmark */
  variant?: "compact" | "full";
  /** Additional class names for the root element */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LanguageSwitcher({ variant = "compact", className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale, availableLocales } = useI18n();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = availableLocales.find(l => l.code === locale) ?? availableLocales[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  function handleSelect(info: LocaleInfo) {
    setLocale(info.code);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${current.nativeName}`}
        className={
          variant === "compact"
            ? "flex items-center gap-1.5 rounded-none border border-paper/40 px-2 py-1.5 text-xs font-medium text-paper transition-colors hover:border-paper hover:bg-paper/10"
            : "flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-muted"
        }
      >
        {current.flag && (
          <span className="text-base leading-none" aria-hidden="true">
            {current.flag}
          </span>
        )}
        {variant === "compact" ? (
          <span className="uppercase tracking-wide">{current.code}</span>
        ) : (
          <span>{current.nativeName}</span>
        )}
        <ChevronIcon open={open} compact={variant === "compact"} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Select language"
          className={[
            "absolute z-50 mt-1 min-w-[160px] overflow-hidden rounded-md border border-line bg-paper py-1 shadow-lg",
            // align right in compact (navbar), left in full (settings)
            variant === "compact" ? "right-0" : "left-0",
          ].join(" ")}
        >
          {availableLocales.map(info => {
            const isActive = info.code === locale;
            return (
              <button
                key={info.code}
                role="option"
                aria-selected={isActive}
                type="button"
                onClick={() => handleSelect(info)}
                className={[
                  "flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-cobalt/5 font-semibold text-cobalt"
                    : "text-ink hover:bg-muted",
                ].join(" ")}
              >
                {info.flag && (
                  <span className="w-5 text-center text-base leading-none" aria-hidden="true">
                    {info.flag}
                  </span>
                )}
                <span className="flex-1 text-left">{info.nativeName}</span>
                {isActive && (
                  <span className="ml-auto text-cobalt" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ChevronIcon({ open, compact }: { open: boolean; compact: boolean }) {
  return (
    <svg
      className={[
        "shrink-0 transition-transform",
        compact ? "h-3 w-3" : "h-4 w-4",
        open ? "rotate-180" : "",
      ].join(" ")}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}
