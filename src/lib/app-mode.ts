/**
 * App-mode store: persists "demo" vs "live" mode, audience, and the
 * currently-selected demo persona. Personas are deterministic presets
 * built from the existing CountryConfig + SkillId set — no new data is
 * invented here. Used by /start, the floating <DemoBar/> and the seed
 * banner to drive the audience-aware UX.
 */

import { useEffect, useState } from "react";
import {
  setProfileExternal,
  setOnboardingExternal,
  type OnboardingData,
} from "./profile-store";
import type { YouthProfile } from "./engine";
import type { CountryKey } from "@/data/countries";
import type { SkillId } from "@/data/skills";

/* ── Types ─────────────────────────────────────────────────────────── */

export type AppMode = "demo" | "live" | null;
export type Audience = "youth" | "policymaker" | null;
export type PersonaId = "amara" | "kofi" | "rina";

export interface PersonaPreset {
  id: PersonaId;
  name: string;
  age: number;
  flag: string;
  city: string;
  country: string;          // display
  countryISO3: string;      // for country-theme + onboarding payload
  countryKey: CountryKey;   // profile-store key
  isco08: string;           // ISCO-08 code
  isco08_label: string;     // human label
  educationId: string;      // matches CountryConfig.educationLevels[].id
  yearsExperience: number;
  skills: SkillId[];
  blurb: string;            // one-liner for picker tiles + DemoBar option
}

/* ── Persona presets (built from existing country configs + SkillId) ── */

export const PERSONAS: Record<PersonaId, PersonaPreset> = {
  amara: {
    id: "amara",
    name: "Amara O.",
    age: 22,
    flag: "🇳🇬",
    city: "Lagos",
    country: "Nigeria",
    countryISO3: "NGA",
    countryKey: "ssa-nigeria",
    isco08: "7422",
    isco08_label: "Mobile phone repair technician",
    educationId: "sss",
    yearsExperience: 5,
    skills: [
      "mobile-repair",
      "smartphone-fluency",
      "customer-service",
      "english-written",
      "negotiation",
      "social-media-content",
    ],
    blurb: "Phone repair · Lagos market",
  },
  kofi: {
    id: "kofi",
    name: "Kofi A.",
    age: 26,
    flag: "🇬🇭",
    city: "Kumasi",
    country: "Ghana",
    countryISO3: "GHA",
    countryKey: "ssa-ghana",
    isco08: "5221",
    isco08_label: "Market stall vendor",
    educationId: "jhs",
    yearsExperience: 4,
    skills: [
      "negotiation",
      "cash-handling",
      "customer-service",
      "smartphone-fluency",
      "spoken-multilingual",
      "bookkeeping",
    ],
    blurb: "Market seller · Kumasi",
  },
  rina: {
    id: "rina",
    name: "Rina K.",
    age: 19,
    flag: "🇧🇩",
    city: "Khulna",
    country: "Bangladesh",
    countryISO3: "BGD",
    countryKey: "sa-bangladesh",
    isco08: "7531",
    isco08_label: "Tailor / garment worker",
    educationId: "ssc",
    yearsExperience: 2,
    skills: [
      "tailoring",
      "customer-service",
      "negotiation",
      "literacy-numeracy",
      "smartphone-fluency",
    ],
    blurb: "Tailor · Khulna co-op",
  },
};

export const PERSONA_LIST: PersonaPreset[] = Object.values(PERSONAS);

/* ── localStorage keys ─────────────────────────────────────────────── */

const MODE_KEY = "unmapped-app-mode-v1";
const AUDIENCE_KEY = "unmapped-app-audience-v1";
const PERSONA_KEY = "unmapped-app-persona-v1";
const COUNTRY_KEY = "unmapped-country"; // shared with country-theme

/* ── Internal in-memory cache + listeners ──────────────────────────── */

interface ModeState {
  mode: AppMode;
  audience: Audience;
  persona: PersonaId | null;
}

let state: ModeState = { mode: null, audience: null, persona: null };
let hydrated = false;
let listeners: Array<(s: ModeState) => void> = [];

function load() {
  if (hydrated || typeof window === "undefined") return;
  try {
    const m = localStorage.getItem(MODE_KEY) as AppMode;
    const a = localStorage.getItem(AUDIENCE_KEY) as Audience;
    const p = localStorage.getItem(PERSONA_KEY) as PersonaId | null;
    state = {
      mode: m === "demo" || m === "live" ? m : null,
      audience: a === "youth" || a === "policymaker" ? a : null,
      persona: p && (p in PERSONAS) ? p : null,
    };
  } catch { /* ignore */ }
  hydrated = true;
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    if (state.mode) localStorage.setItem(MODE_KEY, state.mode);
    else localStorage.removeItem(MODE_KEY);
    if (state.audience) localStorage.setItem(AUDIENCE_KEY, state.audience);
    else localStorage.removeItem(AUDIENCE_KEY);
    if (state.persona) localStorage.setItem(PERSONA_KEY, state.persona);
    else localStorage.removeItem(PERSONA_KEY);
  } catch { /* ignore */ }
}

function notify() {
  listeners.forEach(l => l(state));
}

/* ── Public hook ───────────────────────────────────────────────────── */

export interface UseAppModeReturn {
  mode: AppMode;
  audience: Audience;
  persona: PersonaId | null;
  setMode: (m: AppMode) => void;
  setAudience: (a: Audience) => void;
  setPersona: (p: PersonaId | null) => void;
  applyPersona: (id: PersonaId) => void;
  reset: () => void;
}

export function useAppMode(): UseAppModeReturn {
  const [snap, setSnap] = useState<ModeState>(state);

  useEffect(() => {
    load();
    setSnap(state);
    const fn = (s: ModeState) => setSnap({ ...s });
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  }, []);

  return {
    mode: snap.mode,
    audience: snap.audience,
    persona: snap.persona,
    setMode: m => { state = { ...state, mode: m }; persist(); notify(); },
    setAudience: a => { state = { ...state, audience: a }; persist(); notify(); },
    setPersona: p => { state = { ...state, persona: p }; persist(); notify(); },
    applyPersona: id => applyPersona(id),
    reset: () => {
      state = { mode: null, audience: null, persona: null };
      persist();
      notify();
    },
  };
}

/* ── Persona application ───────────────────────────────────────────── */

/**
 * Apply a persona preset: writes YouthProfile + OnboardingData into the
 * existing profile-store, sets mode=demo + audience=youth, and updates
 * the country-theme storage key so country-aware theming follows.
 */
export function applyPersona(id: PersonaId) {
  const p = PERSONAS[id];
  if (!p) return;

  // 1. YouthProfile (used by engine + readiness/dashboard/results).
  const profile: YouthProfile = {
    name: p.name,
    age: p.age,
    city: p.city,
    educationId: p.educationId,
    yearsExperience: p.yearsExperience,
    skills: [...p.skills],
    countryKey: p.countryKey,
  };
  setProfileExternal(profile);

  // 2. OnboardingData (used by /results to call query API).
  const ob: OnboardingData = {
    name: p.name,
    age: String(p.age),
    isco08: p.isco08,
    isco08_label: p.isco08_label,
    isco08_freetext: "",
    education_level: p.educationId,
    informal_skills: p.skills as unknown as string[],
    experience_years: String(p.yearsExperience),
    user_goal: "",
    country: p.countryISO3,
    completed: true,
  };
  setOnboardingExternal(ob);

  // 3. Country-theme storage (so the silhouette/pattern follows).
  if (typeof window !== "undefined") {
    try { localStorage.setItem(COUNTRY_KEY, p.countryISO3); } catch {}
  }

  // 4. App-mode flags.
  load();
  state = { mode: "demo", audience: "youth", persona: id };
  persist();
  notify();
}

/* ── Sync helpers (for non-React reads, e.g. SeedBanner SSR guard) ── */

export function getAppMode(): ModeState {
  load();
  return state;
}