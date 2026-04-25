import { COUNTRIES } from "@/data/countries";
import { useProfile } from "@/lib/profile-store";
import type { CountryKey } from "@/data/countries";

export function CountryPill() {
  const [profile, setProfile] = useProfile();
  const c = COUNTRIES[profile.countryKey];
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-xs">
      <span className="text-base leading-none">{c.flag}</span>
      <span className="font-mono uppercase tracking-wider text-muted-foreground">Context</span>
      <select
        value={profile.countryKey}
        onChange={e => setProfile({ ...profile, countryKey: e.target.value as CountryKey })}
        className="cursor-pointer bg-transparent font-medium text-ink outline-none"
      >
        {Object.values(COUNTRIES).map(co => (
          <option key={co.key} value={co.key}>{co.region}</option>
        ))}
      </select>
    </div>
  );
}