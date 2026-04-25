export type CountryKey = "ssa-ghana" | "sa-bangladesh";

export interface CountryConfig {
  key: CountryKey;
  region: string;
  country: string;
  flag: string;
  currency: string;
  exchangeToUsd: number;
  language: string;
  script: "latin" | "bengali";
  // Education taxonomy mapped to ISCED level
  educationLevels: { id: string; label: string; isced: number }[];
  // Calibration: how much to discount global automation scores given infra/task mix
  automationCalibration: number; // multiplier 0..1
  // Opportunity types surfaced
  opportunityTypes: ("formal" | "self-employment" | "gig" | "training" | "apprenticeship")[];
  // Real signals (sources cited)
  signals: {
    medianYouthWageMonthly: number; // local currency
    minWageMonthly: number;
    youthUnemployment: number; // %
    informalShare: number; // %
    mobileBroadbandPenetration: number; // %
    sectorGrowth: { sector: string; growthPct: number; share: number }[];
    returnsToEducation: { level: string; premiumPct: number }[]; // wage premium vs primary
  };
  // Wittgenstein 2025-2035 projection: tertiary-educated youth share
  wittgenstein: { year: number; tertiaryYouthPct: number }[];
  sourceNotes: string[];
}

export const COUNTRIES: Record<CountryKey, CountryConfig> = {
  "ssa-ghana": {
    key: "ssa-ghana",
    region: "Sub-Saharan Africa · Urban informal",
    country: "Ghana",
    flag: "🇬🇭",
    currency: "GHS",
    exchangeToUsd: 0.064,
    language: "English",
    script: "latin",
    educationLevels: [
      { id: "none", label: "No formal schooling", isced: 0 },
      { id: "primary", label: "Primary (BECE not completed)", isced: 1 },
      { id: "jhs", label: "Junior High / BECE", isced: 2 },
      { id: "shs", label: "Senior High / WASSCE", isced: 3 },
      { id: "tvet", label: "TVET certificate", isced: 4 },
      { id: "tertiary", label: "Tertiary diploma / degree", isced: 6 },
    ],
    automationCalibration: 0.55,
    opportunityTypes: ["self-employment", "gig", "apprenticeship", "training", "formal"],
    signals: {
      medianYouthWageMonthly: 1450,
      minWageMonthly: 540,
      youthUnemployment: 13.9,
      informalShare: 71,
      mobileBroadbandPenetration: 69,
      sectorGrowth: [
        { sector: "Digital services & BPO", growthPct: 11.2, share: 4 },
        { sector: "Construction & trades", growthPct: 6.4, share: 14 },
        { sector: "Agri-processing", growthPct: 5.1, share: 22 },
        { sector: "Retail & informal commerce", growthPct: 3.8, share: 28 },
        { sector: "Public administration", growthPct: 1.2, share: 6 },
        { sector: "Light manufacturing", growthPct: 4.6, share: 9 },
      ],
      returnsToEducation: [
        { level: "JHS", premiumPct: 12 },
        { level: "SHS", premiumPct: 38 },
        { level: "TVET", premiumPct: 51 },
        { level: "Tertiary", premiumPct: 142 },
      ],
    },
    wittgenstein: [
      { year: 2025, tertiaryYouthPct: 9.8 },
      { year: 2030, tertiaryYouthPct: 13.2 },
      { year: 2035, tertiaryYouthPct: 17.6 },
    ],
    sourceNotes: [
      "Wages: Ghana Statistical Service GLSS-7 (latest, deflated)",
      "Unemployment: ILOSTAT youth (15–24) 2024",
      "Informal share: WBES Ghana 2023",
      "Broadband: ITU DataHub 2024",
      "Education projections: Wittgenstein Centre WIC 2023 SSP2",
    ],
  },
  "sa-bangladesh": {
    key: "sa-bangladesh",
    region: "South Asia · Rural agricultural",
    country: "Bangladesh",
    flag: "🇧🇩",
    currency: "BDT",
    exchangeToUsd: 0.0084,
    language: "Bengali",
    script: "bengali",
    educationLevels: [
      { id: "none", label: "No formal schooling", isced: 0 },
      { id: "primary", label: "Primary (Class 5)", isced: 1 },
      { id: "jsc", label: "Junior Secondary / JSC", isced: 2 },
      { id: "ssc", label: "Secondary / SSC", isced: 3 },
      { id: "hsc", label: "Higher Secondary / HSC", isced: 3 },
      { id: "tertiary", label: "Tertiary diploma / degree", isced: 6 },
    ],
    automationCalibration: 0.45,
    opportunityTypes: ["self-employment", "apprenticeship", "training", "formal", "gig"],
    signals: {
      medianYouthWageMonthly: 12500,
      minWageMonthly: 8000,
      youthUnemployment: 16.8,
      informalShare: 84,
      mobileBroadbandPenetration: 41,
      sectorGrowth: [
        { sector: "RMG & textiles", growthPct: 4.9, share: 18 },
        { sector: "Agriculture & livestock", growthPct: 2.1, share: 38 },
        { sector: "Construction", growthPct: 5.6, share: 9 },
        { sector: "Digital services", growthPct: 14.5, share: 2 },
        { sector: "Retail & trade", growthPct: 3.2, share: 17 },
        { sector: "Light manufacturing", growthPct: 4.0, share: 8 },
      ],
      returnsToEducation: [
        { level: "JSC", premiumPct: 9 },
        { level: "SSC", premiumPct: 27 },
        { level: "HSC", premiumPct: 49 },
        { level: "Tertiary", premiumPct: 118 },
      ],
    },
    wittgenstein: [
      { year: 2025, tertiaryYouthPct: 14.1 },
      { year: 2030, tertiaryYouthPct: 18.7 },
      { year: 2035, tertiaryYouthPct: 24.2 },
    ],
    sourceNotes: [
      "Wages: BBS Labour Force Survey 2022 (deflated)",
      "Unemployment: ILOSTAT youth (15–24) 2024",
      "Informal share: ILO STAT informality 2023",
      "Broadband: ITU DataHub 2024",
      "Education projections: Wittgenstein Centre WIC 2023 SSP2",
    ],
  },
};
