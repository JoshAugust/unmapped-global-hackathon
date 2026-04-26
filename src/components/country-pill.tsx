import { useEffect } from "react";
import { COUNTRIES } from "@/data/countries";
import { useProfile } from "@/lib/profile-store";
import type { CountryKey } from "@/data/countries";

// Only Sub-Saharan Africa is supported. Since there's a single visible
// region, we render a static label instead of a dropdown.
const ACTIVE_COUNTRY: CountryKey = "ssa-nigeria";

export function CountryPill() {
  const [profile, setProfile] = useProfile();

  // Migrate any legacy profile (e.g. Bangladesh) to the active country.
  useEffect(() => {
    if (profile.countryKey !== ACTIVE_COUNTRY && profile.countryKey !== "ssa-ghana") {
      setProfile({ ...profile, countryKey: ACTIVE_COUNTRY });
    }
  }, [profile, setProfile]);

  const c = COUNTRIES[profile.countryKey] ?? COUNTRIES[ACTIVE_COUNTRY];

  return (
    <span className="inline-flex min-w-0 items-center gap-2 border border-paper/40 px-3 py-2 text-xs text-paper">
      <span className="shrink-0 text-base leading-none">{c.flag}</span>
      <span className="hidden uppercase tracking-wider text-paper/70 sm:inline">Context</span>
      <span className="min-w-0 flex-1 truncate font-semibold text-paper">
        {c.region}
      </span>
    </span>
  );
}