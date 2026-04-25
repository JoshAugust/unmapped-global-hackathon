// Lightweight ESCO/O*NET-aligned skill set. Each skill has a routine-vs-cognitive
// task profile used to derive automation exposure (Frey-Osborne style + ILO task indices).

export type SkillId =
  | "mobile-repair"
  | "spoken-multilingual"
  | "basic-coding"
  | "customer-service"
  | "cash-handling"
  | "social-media-content"
  | "tailoring"
  | "small-engine-repair"
  | "agri-cultivation"
  | "data-entry"
  | "driving"
  | "carpentry"
  | "literacy-numeracy"
  | "smartphone-fluency"
  | "english-written"
  | "negotiation"
  | "bookkeeping";

export interface Skill {
  id: SkillId;
  label: string;
  esco: string; // ESCO concept URI tail
  onet?: string;
  // Task composition (sums ~1)
  task: { routineManual: number; routineCognitive: number; nonRoutineManual: number; nonRoutineCognitive: number; social: number };
  // Frey-Osborne-style baseline automation probability (global, pre-calibration)
  automationBase: number; // 0..1
  // Adjacent skills you could reach with ≤6mo training
  adjacencies: SkillId[];
  category: "manual" | "digital" | "service" | "cognitive" | "foundational";
}

export const SKILLS: Record<SkillId, Skill> = {
  "mobile-repair": {
    id: "mobile-repair", label: "Mobile phone repair", esco: "/skill/repairing-mobile-devices",
    task: { routineManual: 0.35, routineCognitive: 0.15, nonRoutineManual: 0.35, nonRoutineCognitive: 0.1, social: 0.05 },
    automationBase: 0.18, adjacencies: ["small-engine-repair", "customer-service", "bookkeeping"], category: "manual",
  },
  "spoken-multilingual": {
    id: "spoken-multilingual", label: "Multilingual spoken communication", esco: "/skill/multilingualism",
    task: { routineManual: 0, routineCognitive: 0.1, nonRoutineManual: 0, nonRoutineCognitive: 0.4, social: 0.5 },
    automationBase: 0.08, adjacencies: ["customer-service", "negotiation"], category: "service",
  },
  "basic-coding": {
    id: "basic-coding", label: "Basic programming (HTML/JS/Python)", esco: "/skill/computer-programming",
    task: { routineManual: 0, routineCognitive: 0.3, nonRoutineManual: 0, nonRoutineCognitive: 0.6, social: 0.1 },
    automationBase: 0.42, adjacencies: ["data-entry", "social-media-content"], category: "digital",
  },
  "customer-service": {
    id: "customer-service", label: "Customer service", esco: "/skill/customer-service",
    task: { routineManual: 0, routineCognitive: 0.25, nonRoutineManual: 0, nonRoutineCognitive: 0.25, social: 0.5 },
    automationBase: 0.55, adjacencies: ["negotiation", "social-media-content"], category: "service",
  },
  "cash-handling": {
    id: "cash-handling", label: "Cash & inventory handling", esco: "/skill/cash-handling",
    task: { routineManual: 0.2, routineCognitive: 0.5, nonRoutineManual: 0.1, nonRoutineCognitive: 0.1, social: 0.1 },
    automationBase: 0.78, adjacencies: ["bookkeeping", "data-entry"], category: "service",
  },
  "social-media-content": {
    id: "social-media-content", label: "Social media & content creation", esco: "/skill/digital-content-creation",
    task: { routineManual: 0, routineCognitive: 0.2, nonRoutineManual: 0, nonRoutineCognitive: 0.5, social: 0.3 },
    automationBase: 0.36, adjacencies: ["customer-service", "english-written"], category: "digital",
  },
  "tailoring": {
    id: "tailoring", label: "Tailoring & garment work", esco: "/skill/tailoring",
    task: { routineManual: 0.55, routineCognitive: 0.1, nonRoutineManual: 0.3, nonRoutineCognitive: 0.05, social: 0 },
    automationBase: 0.62, adjacencies: ["small-engine-repair", "customer-service"], category: "manual",
  },
  "small-engine-repair": {
    id: "small-engine-repair", label: "Small engine / appliance repair", esco: "/skill/repair-small-equipment",
    task: { routineManual: 0.4, routineCognitive: 0.1, nonRoutineManual: 0.4, nonRoutineCognitive: 0.05, social: 0.05 },
    automationBase: 0.22, adjacencies: ["mobile-repair", "carpentry"], category: "manual",
  },
  "agri-cultivation": {
    id: "agri-cultivation", label: "Crop cultivation & livestock", esco: "/skill/crop-production",
    task: { routineManual: 0.5, routineCognitive: 0.05, nonRoutineManual: 0.35, nonRoutineCognitive: 0.05, social: 0.05 },
    automationBase: 0.48, adjacencies: ["bookkeeping", "smartphone-fluency"], category: "manual",
  },
  "data-entry": {
    id: "data-entry", label: "Data entry & spreadsheets", esco: "/skill/data-entry",
    task: { routineManual: 0, routineCognitive: 0.7, nonRoutineManual: 0, nonRoutineCognitive: 0.2, social: 0.1 },
    automationBase: 0.86, adjacencies: ["bookkeeping", "basic-coding"], category: "digital",
  },
  "driving": {
    id: "driving", label: "Commercial driving", esco: "/skill/driving",
    task: { routineManual: 0.5, routineCognitive: 0.2, nonRoutineManual: 0.2, nonRoutineCognitive: 0.05, social: 0.05 },
    automationBase: 0.69, adjacencies: ["customer-service", "small-engine-repair"], category: "manual",
  },
  "carpentry": {
    id: "carpentry", label: "Carpentry & masonry", esco: "/skill/carpentry",
    task: { routineManual: 0.35, routineCognitive: 0.1, nonRoutineManual: 0.45, nonRoutineCognitive: 0.05, social: 0.05 },
    automationBase: 0.16, adjacencies: ["small-engine-repair", "negotiation"], category: "manual",
  },
  "literacy-numeracy": {
    id: "literacy-numeracy", label: "Literacy & numeracy", esco: "/skill/literacy",
    task: { routineManual: 0, routineCognitive: 0.4, nonRoutineManual: 0, nonRoutineCognitive: 0.4, social: 0.2 },
    automationBase: 0.05, adjacencies: ["english-written", "data-entry"], category: "foundational",
  },
  "smartphone-fluency": {
    id: "smartphone-fluency", label: "Smartphone & mobile-money fluency", esco: "/skill/use-mobile-devices",
    task: { routineManual: 0, routineCognitive: 0.4, nonRoutineManual: 0, nonRoutineCognitive: 0.4, social: 0.2 },
    automationBase: 0.18, adjacencies: ["social-media-content", "data-entry", "bookkeeping"], category: "digital",
  },
  "english-written": {
    id: "english-written", label: "Written English", esco: "/skill/written-communication",
    task: { routineManual: 0, routineCognitive: 0.2, nonRoutineManual: 0, nonRoutineCognitive: 0.6, social: 0.2 },
    automationBase: 0.32, adjacencies: ["social-media-content", "customer-service"], category: "cognitive",
  },
  "negotiation": {
    id: "negotiation", label: "Negotiation & sales", esco: "/skill/negotiation",
    task: { routineManual: 0, routineCognitive: 0.1, nonRoutineManual: 0, nonRoutineCognitive: 0.4, social: 0.5 },
    automationBase: 0.14, adjacencies: ["customer-service", "bookkeeping"], category: "service",
  },
  "bookkeeping": {
    id: "bookkeeping", label: "Bookkeeping & micro-finance", esco: "/skill/bookkeeping",
    task: { routineManual: 0, routineCognitive: 0.6, nonRoutineManual: 0, nonRoutineCognitive: 0.3, social: 0.1 },
    automationBase: 0.74, adjacencies: ["data-entry", "smartphone-fluency"], category: "cognitive",
  },
};

export const ALL_SKILL_IDS = Object.keys(SKILLS) as SkillId[];

// Occupation cluster definitions — what skill bundles unlock which roles
export interface OccupationCluster {
  id: string;
  title: string;
  isco: string;
  required: SkillId[];
  helpful: SkillId[];
  // Local wage multiplier vs country median (1.0 = at median)
  wageMultiplier: number;
  pathways: ("formal" | "self-employment" | "gig" | "training" | "apprenticeship")[];
}

export const OCCUPATIONS: OccupationCluster[] = [
  {
    id: "device-tech", title: "Device repair micro-business", isco: "ISCO 7421",
    required: ["mobile-repair", "smartphone-fluency"], helpful: ["customer-service", "bookkeeping", "social-media-content"],
    wageMultiplier: 1.1, pathways: ["self-employment", "apprenticeship"],
  },
  {
    id: "bpo-csr", title: "Customer support associate (BPO)", isco: "ISCO 4222",
    required: ["customer-service", "literacy-numeracy"], helpful: ["english-written", "smartphone-fluency", "spoken-multilingual"],
    wageMultiplier: 1.4, pathways: ["formal", "training"],
  },
  {
    id: "junior-dev", title: "Junior web developer (remote)", isco: "ISCO 2512",
    required: ["basic-coding", "english-written"], helpful: ["smartphone-fluency", "literacy-numeracy"],
    wageMultiplier: 2.6, pathways: ["formal", "gig", "training"],
  },
  {
    id: "agri-aggregator", title: "Agri-aggregator / digital extension agent", isco: "ISCO 6111",
    required: ["agri-cultivation", "smartphone-fluency"], helpful: ["bookkeeping", "negotiation", "literacy-numeracy"],
    wageMultiplier: 1.0, pathways: ["self-employment", "training"],
  },
  {
    id: "social-seller", title: "Social commerce seller", isco: "ISCO 5221",
    required: ["social-media-content", "smartphone-fluency"], helpful: ["customer-service", "negotiation", "bookkeeping"],
    wageMultiplier: 0.95, pathways: ["self-employment", "gig"],
  },
  {
    id: "trade-craft", title: "Skilled trades (carpentry / construction)", isco: "ISCO 7115",
    required: ["carpentry"], helpful: ["small-engine-repair", "negotiation", "bookkeeping"],
    wageMultiplier: 1.2, pathways: ["self-employment", "apprenticeship", "formal"],
  },
  {
    id: "tailoring-shop", title: "Tailoring micro-enterprise", isco: "ISCO 7531",
    required: ["tailoring"], helpful: ["customer-service", "social-media-content", "bookkeeping"],
    wageMultiplier: 0.85, pathways: ["self-employment", "apprenticeship"],
  },
  {
    id: "logistics-driver", title: "Logistics / ride-hail driver", isco: "ISCO 8322",
    required: ["driving"], helpful: ["smartphone-fluency", "customer-service"],
    wageMultiplier: 1.05, pathways: ["gig", "self-employment"],
  },
];
