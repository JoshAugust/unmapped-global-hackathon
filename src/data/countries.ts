export type CountryKey = "ssa-ghana" | "sa-bangladesh" | "ssa-nigeria";

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
  // Wittgenstein SSP2: full 5-level education attainment distribution (% of adult pop 15+)
  educationProjections: {
    [year: string]: {
      no_education: number;
      primary: number;
      lower_secondary: number;
      upper_secondary: number;
      post_secondary: number;
    };
  };
  // WDI context signals
  literacyRate?: number;       // % adults 15+
  youthLiteracyRate?: number;  // % youth 15–24
  primaryEnrollmentRate?: number; // gross enrollment ratio %
  secondaryEnrollmentRate?: number;
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
    educationProjections: {
      "2025": { no_education: 0.22, primary: 0.30, lower_secondary: 0.24, upper_secondary: 0.16, post_secondary: 0.08 },
      "2035": { no_education: 0.15, primary: 0.27, lower_secondary: 0.26, upper_secondary: 0.22, post_secondary: 0.10 },
    },
    literacyRate: 79.0,
    youthLiteracyRate: 90.6,
    primaryEnrollmentRate: 98,
    secondaryEnrollmentRate: 67,
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
    educationProjections: {
      "2025": { no_education: 0.29, primary: 0.28, lower_secondary: 0.22, upper_secondary: 0.14, post_secondary: 0.07 },
      "2035": { no_education: 0.19, primary: 0.25, lower_secondary: 0.26, upper_secondary: 0.20, post_secondary: 0.10 },
    },
    literacyRate: 74.9,
    youthLiteracyRate: 93.1,
    primaryEnrollmentRate: 118,
    secondaryEnrollmentRate: 73,
    sourceNotes: [
      "Wages: BBS Labour Force Survey 2022 (deflated)",
      "Unemployment: ILOSTAT youth (15–24) 2024",
      "Informal share: ILO STAT informality 2023",
      "Broadband: ITU DataHub 2024",
      "Education projections: Wittgenstein Centre WIC 2023 SSP2",
    ],
  },

  "ssa-nigeria": {
    key: "ssa-nigeria",
    region: "Sub-Saharan Africa · Urban/Rural mixed",
    country: "Nigeria",
    flag: "🇳🇬",
    currency: "NGN",
    exchangeToUsd: 0.00063,
    language: "English",
    script: "latin",
    educationLevels: [
      { id: "none", label: "No formal schooling", isced: 0 },
      { id: "primary", label: "Primary (incomplete)", isced: 1 },
      { id: "jss", label: "Junior Secondary (JSSC)", isced: 2 },
      { id: "sss", label: "Senior Secondary (WAEC/NECO)", isced: 3 },
      { id: "nd", label: "National Diploma / OND", isced: 4 },
      { id: "tertiary", label: "Tertiary (HND / Degree)", isced: 6 },
    ],
    automationCalibration: 0.50,
    opportunityTypes: ["self-employment", "gig", "apprenticeship", "training", "formal"],
    signals: {
      medianYouthWageMonthly: 75000,
      minWageMonthly: 30000,
      youthUnemployment: 42.5,
      informalShare: 80,
      mobileBroadbandPenetration: 47,
      sectorGrowth: [
        { sector: "Fintech & digital services", growthPct: 18.4, share: 3 },
        { sector: "Construction & trades", growthPct: 5.2, share: 12 },
        { sector: "Agriculture & food processing", growthPct: 3.8, share: 35 },
        { sector: "Retail & informal trade", growthPct: 3.1, share: 25 },
        { sector: "Oil & gas (formal)", growthPct: 1.5, share: 5 },
        { sector: "Light manufacturing", growthPct: 4.2, share: 7 },
      ],
      returnsToEducation: [
        { level: "JSS", premiumPct: 14 },
        { level: "SSS", premiumPct: 42 },
        { level: "ND/OND", premiumPct: 67 },
        { level: "Tertiary", premiumPct: 168 },
      ],
    },
    wittgenstein: [
      { year: 2025, tertiaryYouthPct: 6.2 },
      { year: 2030, tertiaryYouthPct: 8.9 },
      { year: 2035, tertiaryYouthPct: 12.4 },
    ],
    educationProjections: {
      "2025": { no_education: 0.35, primary: 0.25, lower_secondary: 0.20, upper_secondary: 0.14, post_secondary: 0.06 },
      "2035": { no_education: 0.25, primary: 0.22, lower_secondary: 0.22, upper_secondary: 0.20, post_secondary: 0.11 },
    },
    literacyRate: 62.0,
    youthLiteracyRate: 76.4,
    primaryEnrollmentRate: 85,
    secondaryEnrollmentRate: 47,
    sourceNotes: [
      "Wages: NBS Labour Force Survey 2022 (deflated to 2024 NGN)",
      "Unemployment: NBS Nigeria Labour Force Report Q1 2024",
      "Informal share: ILO informality estimates 2023",
      "Broadband: NCC Nigeria / ITU 2024",
      "Education projections: Wittgenstein Centre WIC 2023 SSP2",
    ],
  },
};
