import { COUNTRIES } from "@/data/countries";
import { useProfile } from "@/lib/profile-store";
import type { CountryKey } from "@/data/countries";

export function CountryPill() {
  const [profile, setProfile] = useProfile();
  const c = COUNTRIES[profile.countryKey];
  return (
    <label className="inline-flex items-center gap-2 border border-paper/40 px-3 py-2 text-xs text-paper">
      <span className="text-base leading-none">{c.flag}</span>
      <span className="hidden uppercase tracking-wider text-paper/70 sm:inline">Context</span>
      <select
        value={profile.countryKey}
        onChange={e => setProfile({ ...profile, countryKey: e.target.value as CountryKey })}
        className="cursor-pointer bg-transparent font-semibold text-paper outline-none"
      >
        {Object.values(COUNTRIES).map(co => (
          <option key={co.key} value={co.key} className="text-ink">{co.region}</option>
        ))}
      </select>
    </label>
  );
}