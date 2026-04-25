import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageShell } from "@/components/page-shell";
import { COUNTRIES } from "@/data/countries";
import { SKILLS, ALL_SKILL_IDS, type SkillId } from "@/data/skills";
import { useProfile } from "@/lib/profile-store";
import { buildPassport, SAMPLE_AMARA } from "@/lib/engine";

export const Route = createFileRoute("/passport")({
  component: Passport,
  head: () => ({ meta: [
    { title: "Skills Signal Engine — UNMAPPED" },
    { name: "description", content: "Build a portable, ESCO-aligned skill passport from informal experience." },
  ]}),
});

function Passport() {
  const [profile, setProfile] = useProfile();
  const country = COUNTRIES[profile.countryKey];
  const passport = useMemo(() => buildPassport(profile), [profile]);

  const toggleSkill = (id: SkillId) => {
    const has = profile.skills.includes(id);
    setProfile({ ...profile, skills: has ? profile.skills.filter(s => s !== id) : [...profile.skills, id] });
  };

  const grouped = ALL_SKILL_IDS.reduce<Record<string, SkillId[]>>((acc, id) => {
    const c = SKILLS[id].category;
    (acc[c] ||= []).push(id);
    return acc;
  }, {});

  return (
    <PageShell
      eyebrow="Module 01 · Skills Signal Engine"
      title={<>Build a passport that <span className="italic text-cobalt">travels</span>.</>}
      lede={`Map informal experience and demonstrated competencies into a portable, human-readable profile aligned to ESCO and ${country.educationLevels.length} ISCED-mapped local credentials. Amara owns it. So can ${country.country === "Ghana" ? "every other" : "any"} youth user.`}
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* Left: input */}
        <section className="rounded-sm border border-line bg-card p-6">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Inputs · plain language</div>
            <button onClick={() => setProfile(SAMPLE_AMARA)}
              className="font-mono text-[10px] uppercase tracking-wider text-cobalt hover:underline">load Amara</button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Name">
              <input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })}
                className="input" />
            </Field>
            <Field label="Age">
              <input type="number" value={profile.age} onChange={e => setProfile({ ...profile, age: +e.target.value })}
                className="input" />
            </Field>
            <Field label="City / region">
              <input value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })}
                className="input" />
            </Field>
            <Field label="Years informal experience">
              <input type="number" value={profile.yearsExperience}
                onChange={e => setProfile({ ...profile, yearsExperience: +e.target.value })}
                className="input" />
            </Field>
            <Field label="Highest education (local taxonomy)" wide>
              <select value={profile.educationId} onChange={e => setProfile({ ...profile, educationId: e.target.value })}
                className="input">
                {country.educationLevels.map(l => (
                  <option key={l.id} value={l.id}>{l.label} · ISCED {l.isced}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="mt-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Demonstrated skills · tap to toggle
            </div>
            <div className="mt-3 space-y-4">
              {Object.entries(grouped).map(([cat, ids]) => (
                <div key={cat}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{cat}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ids.map(id => {
                      const has = profile.skills.includes(id);
                      return (
                        <button key={id} onClick={() => toggleSkill(id)}
                          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                            has ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink"
                          }`}>
                          {SKILLS[id].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right: passport output */}
        <section className="rounded-sm border border-ink bg-paper p-6 shadow-[8px_8px_0_0_var(--ink)]">
          <div className="flex items-start justify-between border-b border-ink pb-4">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">UNMAPPED · Skill Passport</div>
              <div className="mt-1 font-display text-3xl font-black">{profile.name}</div>
              <div className="text-sm text-muted-foreground">
                {profile.city}, {country.country} · age {profile.age} · {country.language}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-wider text-cobalt">verified · portable</div>
              <div className="mt-1 font-mono text-xs">PASS-{hashId(profile.name + profile.age)}</div>
            </div>
          </div>

          {passport.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Add at least one skill to generate a passport.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {passport.map(({ skill, confidence }) => (
                <div key={skill.id}>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{skill.label}</span>
                      <span className="ml-2 font-mono text-[10px] uppercase text-muted-foreground">
                        ESCO{skill.esco}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] uppercase text-muted-foreground">
                      conf {(confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-sand">
                    <div className="h-full bg-cobalt" style={{ width: `${confidence * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 grid grid-cols-3 gap-px bg-line text-center">
            <Stat k={passport.length} v="skills mapped" />
            <Stat k={`${Math.round(avgConf(passport) * 100)}%`} v="avg confidence" />
            <Stat k={profile.yearsExperience + "y"} v="experience" />
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-xs text-muted-foreground">
            <span>Aligned to ESCO v1.2 · ISCO clusters resolved · readable in {country.language}</span>
            <Link to="/readiness" className="font-mono text-cobalt hover:underline">→ Run readiness lens</Link>
          </div>
        </section>
      </div>

      <style>{`
        .input { width: 100%; border: 1px solid var(--line); background: var(--paper); padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; }
        .input:focus { border-color: var(--cobalt); }
      `}</style>
    </PageShell>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? "col-span-2 block" : "block"}>
      <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
function Stat({ k, v }: { k: React.ReactNode; v: string }) {
  return (
    <div className="bg-paper p-3">
      <div className="font-display text-2xl font-black">{k}</div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{v}</div>
    </div>
  );
}
function avgConf(p: ReturnType<typeof buildPassport>) {
  if (!p.length) return 0;
  return p.reduce((a, b) => a + b.confidence, 0) / p.length;
}
function hashId(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(16).toUpperCase().padStart(6, "0").slice(0, 6) + "·" + ((h * 7) % 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
}
