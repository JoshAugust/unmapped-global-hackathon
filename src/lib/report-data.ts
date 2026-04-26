/**
 * Shared report model. The same shape powers PDF export, JSON export,
 * and shareable links — keeping the UI and downstream artifacts in sync.
 */

export interface ReportPathway {
  title: string;
  isco08: string;
  overlapPct: number;
  missingSkills: number;
  wageUpliftPct: number;
  trainingCost?: "low" | "medium" | "high";
  gapDescription?: string;
}

export interface ReportTaskRisk {
  category: string;
  label: string;
  share: number; // 0..1
  risk: number; // 0..1
}

export interface ReportLabourMarket {
  totalJobs?: number;
  avgSalary?: number;
  currencySymbol?: string;
  labourForceParticipationPct?: number;
  youthUnemploymentPct?: number;
  topSectors?: { sector: string; growthPct: number }[];
}

export interface ReportData {
  generatedAt: string; // ISO
  profileLabel: string; // user name or fallback
  occupationTitle: string;
  isco08: string;
  countryCode: string;
  countryName: string;
  educationLevel?: string;
  experienceYears?: string;
  durableSkills: string[];
  readiness: {
    riskScore: number; // 0..1 (recalibrated automation exposure)
    tier: "low" | "medium" | "high";
    summary: string;
    originalFreyOsborne?: number;
  };
  topRisks: ReportTaskRisk[];
  pathways: ReportPathway[];
  labourMarket?: ReportLabourMarket;
  notes: string[];
  dataLimitations: string[];
}

const TIER_SUMMARY: Record<ReportData["readiness"]["tier"], string> = {
  low: "Most of your work depends on judgement and human skills that AI struggles with. You are on solid ground — keep building durable skills.",
  medium: "Some routine tasks will shift, but the core of your work stays human. A few targeted skills will keep you resilient.",
  high: "A meaningful share of current tasks may be automated within a decade. The pathways below are reachable with focused upskilling.",
};

export function tierFromScore(score: number): ReportData["readiness"]["tier"] {
  if (score < 0.35) return "low";
  if (score < 0.6) return "medium";
  return "high";
}

export function buildReadinessSummary(
  tier: ReportData["readiness"]["tier"],
): string {
  return TIER_SUMMARY[tier];
}

export function reportFileBase(data: ReportData): string {
  const slug = (data.profileLabel || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32) || "report";
  const date = data.generatedAt.slice(0, 10);
  return `report-${slug}-${date}`;
}