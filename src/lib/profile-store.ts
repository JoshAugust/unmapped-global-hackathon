import { useEffect, useState } from "react";
import { SAMPLE_AMARA, type YouthProfile } from "./engine";

const KEY = "unmapped-profile-v1";
const ONBOARDING_KEY = "unmapped-onboarding-v1";

let listeners: Array<(p: YouthProfile) => void> = [];
let current: YouthProfile = SAMPLE_AMARA;
let hydrated = false;

function load() {
  if (hydrated || typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) current = { ...SAMPLE_AMARA, ...JSON.parse(raw) };
  } catch {}
  hydrated = true;
}

export function useProfile(): [YouthProfile, (p: YouthProfile) => void] {
  const [state, setState] = useState<YouthProfile>(current);
  useEffect(() => {
    load();
    setState(current);
    const fn = (p: YouthProfile) => setState(p);
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  }, []);
  const update = (p: YouthProfile) => {
    current = p;
    if (typeof window !== "undefined") {
      try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
    }
    listeners.forEach(l => l(p));
  };
  return [state, update];
}

/* ── Onboarding data ── */

export interface OnboardingData {
  name: string;
  age: string;
  isco08: string | null;
  isco08_label: string;
  isco08_freetext: string;
  education_level: string;
  informal_skills: string[];
  experience_years: string;
  user_goal: string;
  country: string;
  completed: boolean;
}

const ONBOARDING_DEFAULT: OnboardingData = {
  name: "",
  age: "",
  isco08: null,
  isco08_label: "",
  isco08_freetext: "",
  education_level: "",
  informal_skills: [],
  experience_years: "",
  user_goal: "",
  country: "NGA",
  completed: false,
};

let obListeners: Array<(d: OnboardingData) => void> = [];
let obCurrent: OnboardingData = { ...ONBOARDING_DEFAULT };
let obHydrated = false;

function loadOnboarding() {
  if (obHydrated || typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    if (raw) obCurrent = { ...ONBOARDING_DEFAULT, ...JSON.parse(raw) };
  } catch {}
  obHydrated = true;
}

export function useOnboarding(): [OnboardingData, (d: Partial<OnboardingData>) => void] {
  const [state, setState] = useState<OnboardingData>(obCurrent);
  useEffect(() => {
    loadOnboarding();
    setState(obCurrent);
    const fn = (d: OnboardingData) => setState(d);
    obListeners.push(fn);
    return () => { obListeners = obListeners.filter(l => l !== fn); };
  }, []);
  const update = (partial: Partial<OnboardingData>) => {
    obCurrent = { ...obCurrent, ...partial };
    if (typeof window !== "undefined") {
      try { localStorage.setItem(ONBOARDING_KEY, JSON.stringify(obCurrent)); } catch {}
    }
    obListeners.forEach(l => l(obCurrent));
  };
  return [state, update];
}

export function getOnboardingData(): OnboardingData {
  loadOnboarding();
  return obCurrent;
}

/* ── External setters (for non-hook code, e.g. demo persona presets) ── */

/**
 * Update the YouthProfile from outside React (e.g. demo persona). Writes
 * to localStorage and notifies all live `useProfile` hook consumers so
 * the UI re-renders without a reload.
 */
export function setProfileExternal(p: YouthProfile) {
  load();
  current = p;
  if (typeof window !== "undefined") {
    try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
  }
  listeners.forEach(l => l(p));
}

/**
 * Replace OnboardingData from outside React. Same notify-listeners
 * semantics as setProfileExternal.
 */
export function setOnboardingExternal(d: OnboardingData) {
  loadOnboarding();
  obCurrent = { ...ONBOARDING_DEFAULT, ...d };
  if (typeof window !== "undefined") {
    try { localStorage.setItem(ONBOARDING_KEY, JSON.stringify(obCurrent)); } catch {}
  }
  obListeners.forEach(l => l(obCurrent));
}
