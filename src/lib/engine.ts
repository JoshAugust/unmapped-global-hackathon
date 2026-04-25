import { COUNTRIES, type CountryConfig, type CountryKey } from "@/data/countries";
import { OCCUPATIONS, SKILLS, type SkillId, type OccupationCluster } from "@/data/skills";

export interface YouthProfile {
  name: string;
  age: number;
  city: string;
  educationId: string;
  yearsExperience: number;
  skills: SkillId[];
  countryKey: CountryKey;
}

export const SAMPLE_AMARA: YouthProfile = {
  name: "Amara O.",
  age: 22, city: "Accra",
  educationId: "shs", yearsExperience: 5,
  skills: ["mobile-repair", "spoken-multilingual", "basic-coding", "smartphone-fluency", "customer-service", "english-written", "negotiation"],
  countryKey: "ssa-ghana",
};

// Compute portable skill passport: confidence per skill based on experience + foundation
export function buildPassport(profile: YouthProfile) {
  const country = COUNTRIES[profile.countryKey];
  const edu = country.educationLevels.find(e => e.id === profile.educationId);
  const eduLift = edu ? Math.min(0.3, (edu.isced ?? 0) * 0.05) : 0;
  const expLift = Math.min(0.3, profile.yearsExperience * 0.05);
  return profile.skills.map(id => {
    const s = SKILLS[id];
    const confidence = Math.min(0.99, 0.45 + eduLift + expLift + (s.category === "foundational" ? 0.1 : 0));
    return { skill: s, confidence };
  });
}

// Calibrated automation exposure for a single skill in a country context
export function automationExposure(skillId: SkillId, country: CountryConfig) {
  const s = SKILLS[skillId];
  // Calibrate: routine tasks scale with country's calibration (lower infra → less near-term automation),
  // but cognitive routine (e.g. data entry) faces global LLM disruption regardless.
  const cognitiveRisk = s.task.routineCognitive * 0.95;
  const manualRisk = s.task.routineManual * 0.85 * country.automationCalibration;
  const baseline = s.automationBase * country.automationCalibration;
  return Math.min(0.97, 0.55 * baseline + 0.35 * cognitiveRisk + 0.25 * manualRisk);
}

export function profileExposure(profile: YouthProfile) {
  const country = COUNTRIES[profile.countryKey];
  const items = profile.skills.map(id => ({ id, label: SKILLS[id].label, exposure: automationExposure(id, country) }));
  const overall = items.length ? items.reduce((a, b) => a + b.exposure, 0) / items.length : 0;
  return { overall, items };
}

// Match opportunities by skill coverage
export interface MatchResult {
  occupation: OccupationCluster;
  fit: number; // 0..1
  missing: SkillId[];
  estMonthlyWage: number;
  resilience: number; // 1 - avg automation exposure of required skills
}

export function matchOpportunities(profile: YouthProfile): MatchResult[] {
  const country = COUNTRIES[profile.countryKey];
  const skillSet = new Set(profile.skills);
  return OCCUPATIONS
    .filter(o => country.opportunityTypes.some(t => o.pathways.includes(t)))
    .map(o => {
      const reqHit = o.required.filter(s => skillSet.has(s)).length;
      const helpHit = o.helpful.filter(s => skillSet.has(s)).length;
      const fit = (reqHit / o.required.length) * 0.7 + (helpHit / Math.max(1, o.helpful.length)) * 0.3;
      const missing = [...o.required.filter(s => !skillSet.has(s)), ...o.helpful.filter(s => !skillSet.has(s))];
      const reqExposure = o.required.reduce((a, s) => a + automationExposure(s, country), 0) / o.required.length;
      return {
        occupation: o,
        fit,
        missing,
        estMonthlyWage: Math.round(country.signals.medianYouthWageMonthly * o.wageMultiplier),
        resilience: 1 - reqExposure,
      };
    })
    .sort((a, b) => b.fit - a.fit);
}

// Suggest adjacent skills that would most improve resilience and opportunity reach
export function suggestAdjacencies(profile: YouthProfile, limit = 4) {
  const country = COUNTRIES[profile.countryKey];
  const have = new Set(profile.skills);
  const candidates = new Map<SkillId, { gain: number; reason: string }>();
  profile.skills.forEach(id => {
    SKILLS[id].adjacencies.forEach(adj => {
      if (have.has(adj)) return;
      const exposure = automationExposure(adj, country);
      const gain = (1 - exposure) - (1 - automationExposure(id, country));
      const existing = candidates.get(adj);
      const score = gain + 0.3;
      if (!existing || existing.gain < score) {
        candidates.set(adj, { gain: score, reason: `Builds on your ${SKILLS[id].label}` });
      }
    });
  });
  return Array.from(candidates.entries())
    .map(([id, v]) => ({ skill: SKILLS[id], ...v, exposure: automationExposure(id, country) }))
    .sort((a, b) => a.exposure - b.exposure)
    .slice(0, limit);
}
