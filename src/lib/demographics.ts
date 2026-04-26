/**
 * Demographics & gender disaggregation — small static slice of UN World
 * Population Prospects 2024 medium-variant + ILOSTAT 2024 figures for
 * the six countries the app supports.
 *
 * We keep this in one place (rather than scattering it across data/ JSON)
 * because /policymaker only needs a thin slice and the values are stable
 * to two decimal places. A real deployment would pull these from WPP +
 * ILOSTAT live; the schema is identical.
 *
 * Sources cited inline so the UI can attribute every number.
 */

export interface DemographyRow {
  iso3: string;
  /** Youth (15–24) population in millions, by year */
  youth15_24M: { 2025: number; 2035: number };
  /** Tertiary-educated youth share, %, by year (Wittgenstein SSP2) */
  tertiaryYouthPct: { 2025: number; 2035: number };
  /** Annual new labour-force entrants (15–24), thousands per year, 2025–2030 avg */
  newEntrantsKPerYear: number;
  source: string;
}

/** UN WPP 2024 medium variant + Wittgenstein WIC 2023 SSP2. */
export const DEMOGRAPHY: Record<string, DemographyRow> = {
  NGA: {
    iso3: "NGA",
    youth15_24M: { 2025: 49.2, 2035: 63.7 },
    tertiaryYouthPct: { 2025: 6.2, 2035: 12.4 },
    newEntrantsKPerYear: 5800,
    source: "UN WPP 2024 medium · Wittgenstein WIC 2023 SSP2",
  },
  GHA: {
    iso3: "GHA",
    youth15_24M: { 2025: 6.4, 2035: 7.5 },
    tertiaryYouthPct: { 2025: 9.8, 2035: 17.6 },
    newEntrantsKPerYear: 360,
    source: "UN WPP 2024 medium · Wittgenstein WIC 2023 SSP2",
  },
  KEN: {
    iso3: "KEN",
    youth15_24M: { 2025: 11.1, 2035: 13.6 },
    tertiaryYouthPct: { 2025: 11.4, 2035: 19.2 },
    newEntrantsKPerYear: 720,
    source: "UN WPP 2024 medium · Wittgenstein WIC 2023 SSP2",
  },
  RWA: {
    iso3: "RWA",
    youth15_24M: { 2025: 2.7, 2035: 3.4 },
    tertiaryYouthPct: { 2025: 5.4, 2035: 11.1 },
    newEntrantsKPerYear: 230,
    source: "UN WPP 2024 medium · Wittgenstein WIC 2023 SSP2",
  },
  IND: {
    iso3: "IND",
    youth15_24M: { 2025: 252.0, 2035: 234.5 },
    tertiaryYouthPct: { 2025: 26.4, 2035: 36.8 },
    newEntrantsKPerYear: 12500,
    source: "UN WPP 2024 medium · Wittgenstein WIC 2023 SSP2",
  },
  BGD: {
    iso3: "BGD",
    youth15_24M: { 2025: 31.9, 2035: 32.4 },
    tertiaryYouthPct: { 2025: 14.1, 2035: 24.2 },
    newEntrantsKPerYear: 1900,
    source: "UN WPP 2024 medium · Wittgenstein WIC 2023 SSP2",
  },
};

/* ── Gender disaggregation ────────────────────────────────────────── */

export interface GenderRow {
  iso3: string;
  /** % of 15–24 labour force that is female */
  youthLfFemalePct: number;
  /** Youth unemployment, % */
  youthUnemployment: { male: number; female: number };
  /** Labour force participation, 15+, % */
  lfp15plus: { male: number; female: number };
  /** Women, Business & Law (WBL) 2024 score, 0–100 */
  wblScore: number;
  source: string;
}

/** ILOSTAT 2024 + WB Women, Business & the Law 2024. */
export const GENDER: Record<string, GenderRow> = {
  NGA: {
    iso3: "NGA",
    youthLfFemalePct: 41.2,
    youthUnemployment: { male: 38.4, female: 47.1 },
    lfp15plus: { male: 60.5, female: 49.6 },
    wblScore: 63.1,
    source: "ILOSTAT 2024 · WB WBL 2024",
  },
  GHA: {
    iso3: "GHA",
    youthLfFemalePct: 47.8,
    youthUnemployment: { male: 12.4, female: 15.6 },
    lfp15plus: { male: 71.8, female: 63.2 },
    wblScore: 75.6,
    source: "ILOSTAT 2024 · WB WBL 2024",
  },
  KEN: {
    iso3: "KEN",
    youthLfFemalePct: 46.1,
    youthUnemployment: { male: 11.8, female: 16.4 },
    lfp15plus: { male: 71.4, female: 65.0 },
    wblScore: 80.6,
    source: "ILOSTAT 2024 · WB WBL 2024",
  },
  RWA: {
    iso3: "RWA",
    youthLfFemalePct: 50.4,
    youthUnemployment: { male: 18.2, female: 22.5 },
    lfp15plus: { male: 83.1, female: 79.8 },
    wblScore: 84.4,
    source: "ILOSTAT 2024 · WB WBL 2024",
  },
  IND: {
    iso3: "IND",
    youthLfFemalePct: 24.6,
    youthUnemployment: { male: 17.4, female: 24.7 },
    lfp15plus: { male: 73.6, female: 28.3 },
    wblScore: 74.4,
    source: "ILOSTAT 2024 · WB WBL 2024",
  },
  BGD: {
    iso3: "BGD",
    youthLfFemalePct: 31.4,
    youthUnemployment: { male: 12.1, female: 14.8 },
    lfp15plus: { male: 79.2, female: 38.4 },
    wblScore: 49.4,
    source: "ILOSTAT 2024 · WB WBL 2024",
  },
};

/**
 * Skill–population divergence: how fast the youth labour pool grows vs. how
 * fast tertiary-educated youth grow. A negative gap = supply of educated
 * youth growing faster than the cohort (good); a positive gap = the cohort
 * is outrunning education (the brief's "skill-population divergence").
 *
 * Returns absolute deltas in millions and a normalised gap %.
 */
export function getDivergence(iso3: string) {
  const d = DEMOGRAPHY[iso3.toUpperCase()];
  if (!d) return null;
  const youthDelta = d.youth15_24M[2035] - d.youth15_24M[2025];
  const tertiary2025 = (d.youth15_24M[2025] * d.tertiaryYouthPct[2025]) / 100;
  const tertiary2035 = (d.youth15_24M[2035] * d.tertiaryYouthPct[2035]) / 100;
  const tertiaryDelta = tertiary2035 - tertiary2025;
  // Gap = how many extra youth join the pool per extra tertiary-educated youth
  const gapRatio = tertiaryDelta > 0 ? youthDelta / tertiaryDelta : Infinity;
  return {
    youthDeltaM: youthDelta,
    tertiaryDeltaM: tertiaryDelta,
    gapRatio,
    youth2025M: d.youth15_24M[2025],
    youth2035M: d.youth15_24M[2035],
    tertiary2025Pct: d.tertiaryYouthPct[2025],
    tertiary2035Pct: d.tertiaryYouthPct[2035],
    newEntrantsKPerYear: d.newEntrantsKPerYear,
    source: d.source,
  };
}