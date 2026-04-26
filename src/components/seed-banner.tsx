/**
 * SeedBanner — top-of-page disclosure shown when VITE_API_URL is unset
 * (i.e. the live API is not connected and the app is rendering seed
 * composites). Dismissible per-browser, hidden in print + presenter
 * mode so demo screenshots stay clean.
 */

import { useEffect, useState } from "react";
import { X, Info } from "lucide-react";

const STORAGE_KEY = "unmapped-seed-banner-dismissed-v1";

export function SeedBanner() {
  const apiConnected = Boolean(import.meta.env.VITE_API_URL);
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid SSR flash

  useEffect(() => {
    if (apiConnected) return;
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, [apiConnected]);

  if (apiConnected || dismissed) return null;

  return (
    <div
      data-presenter-hide="true"
      className="seed-banner border-b border-amber-300 bg-amber-50 px-4 py-2 text-amber-900 print:hidden"
    >
      <div className="mx-auto flex max-w-[1400px] items-start gap-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="flex-1 text-xs leading-relaxed sm:text-sm">
          <span className="font-semibold">Illustrative data.</span> Live API
          not connected — figures shown are seed composites of ILOSTAT,
          Wittgenstein, ITU, and World Bank STEP. Treat as orientation, not
          policy input.
        </p>
        <button
          type="button"
          onClick={() => {
            try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
            setDismissed(true);
          }}
          aria-label="Dismiss disclosure banner"
          className="-m-1 rounded p-1 text-amber-900/70 hover:bg-amber-100 hover:text-amber-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}