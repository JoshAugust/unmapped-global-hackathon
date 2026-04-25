import { useEffect, useState } from "react";
import { SAMPLE_AMARA, type YouthProfile } from "./engine";

const KEY = "unmapped-profile-v1";

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
