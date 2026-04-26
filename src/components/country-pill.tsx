import { useEffect } from "react";
import { COUNTRIES } from "@/data/countries";
import { useProfile } from "@/lib/profile-store";
import type { CountryKey } from "@/data/countries";

// Country options exposed in the header pill. South Asia (Bangladesh) is
// intentionally hidden — Sub-Saharan Africa is the only supported context.
const VISIBLE_COUNTRIES: CountryKey[] = ["ssa-ghana", "ssa-nigeria"];

export function CountryPill() {
  const [profile, setProfile] = useProfile();

  // If the stored profile points at a hidden country, fall back to the first
  // visible one so the header never displays a removed option.
  useEffect(() => {
    if (!VISIBLE_COUNTRIES.includes(profile.countryKey)) {
      setProfile({ ...profile, countryKey: VISIBLE_COUNTRIES[0] });
    }
  }, [profile, setProfile]);

  const activeKey = VISIBLE_COUNTRIES.includes(profile.countryKey)
    ? profile.countryKey
    : VISIBLE_COUNTRIES[0];
  const c = COUNTRIES[activeKey];

  return (
    <label className="inline-flex min-w-0 items-center gap-2 border border-paper/40 px-3 py-2 text-xs text-paper">
      <span className="shrink-0 text-base leading-none">{c.flag}</span>
      <span className="hidden uppercase tracking-wider text-paper/70 sm:inline">Context</span>
      <select
        value={activeKey}
        onChange={e => setProfile({ ...profile, countryKey: e.target.value as CountryKey })}
        className="min-w-0 flex-1 cursor-pointer truncate bg-transparent font-semibold text-paper outline-none"
      >
        {VISIBLE_COUNTRIES.map(key => {
          const co = COUNTRIES[key];
          return (
            <option key={co.key} value={co.key} className="text-ink">
              {co.region}
            </option>
          );
        })}
      </select>
    </label>
  );
}