import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { DataSource } from "@/components/data-source";
import { SOURCES } from "@/lib/sources";
import { fetchWithFallback } from "@/lib/api-client";
import {
  getCountryConfig,
  getRecalibratedData,
  getPolicymakerAggregates,
} from "@/lib/static-data";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

// ─── API base ───────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || "";

// ─── Route ──────────────────────────────────────────────────
export const Route = createFileRoute("/policymaker")({
  component: PolicymakerDashboard,
  head: () => ({
    meta: [
      { title: "Workforce Intelligence Dashboard — UNMAPPED" },
      {
        name: "description",
        content:
          "Aggregate workforce data, automation exposure, and skills gaps for policymakers.",
      },
    ],
  }),
});

// ─── Country list ───────────────────────────────────────────
interface CountryEntry {
  iso3: string;
  name: string;
  flag: string;
}

const COUNTRY_LIST: CountryEntry[] = [
  { iso3: "NGA", name: "Nigeria", flag: "🇳🇬" },
  { iso3: "GHA", name: "Ghana", flag: "🇬🇭" },
  { iso3: "KEN", name: "Kenya", flag: "🇰🇪" },
  { iso3: "RWA", name: "Rwanda", flag: "🇷🇼" },
  { iso3: "IND", name: "India", flag: "🇮🇳" },
  { iso3: "BGD", name: "Bangladesh", flag: "🇧🇩" },
];

// ─── Types ──────────────────────────────────────────────────
interface WdiLabour {
  _metadata: { country: string; iso3: string };
  macro: Record<string, { value: number; year: number; source: string; note?: string }>;
  labour_market: Record<string, any>;
  wages: Record<string, any>;
  education: Record<string, any>;
  digital: Record<string, any>;
  sector_growth_outlook?: Record<string, any>;
}

interface RecalOccupation {
  isco08: string;
  title: string;
  original_frey_osborne: number;
  recalibrated_probability: number;
  risk_tier: "low" | "medium" | "high";
  task_risk_breakdown: Record<
    string,
    { share: number; risk: number }
  >;
  narrative?: string;
  is_priority?: boolean;
}

interface RecalData {
  country: string;
  country_name: string;
  calibration_factor: number;
  methodology: string;
  total_occupations: number;
  risk_distribution: { low: number; medium: number; high: number };
  occupations: RecalOccupation[];
}

interface PolicymakerAggregates {
  country_code: string;
  country_name: string;
  skill_gap_heatmap: {
    title: string;
    source: string;
    note: string;
    sectors: {
      sector: string;
      demand_index: number;
      supply_index: number;
      gap_score: number;
      gap_direction: "shortage" | "oversupply";
      wage_premium_vs_median_pct: number;
    }[];
  };
  cohort_automation_exposure: {
    title: string;
    source: string;
    caveat: string;
    total_youth_millions: number;
    exposure: {
      tier: string;
      pct: number;
      absolute_millions: number;
      description: string;
      policy_implication: string;
    }[];
  };
  neet_overview: {
    title: string;
    source: string;
    vintage: string;
    overall_pct: number;
    note: string;
    policy_implication: string;
  };
  education_trajectory: {
    title: string;
    source: string;
    insight: string;
    upper_secondary_plus_2025_pct: number;
    upper_secondary_plus_2035_pct: number;
    policy_implication: string;
  };
  data_quality_notes: {
    overall_confidence: string;
    rationale: string;
    key_gaps: string[];
  };
}

interface CountryConfig {
  country: { name: string; iso3: string; flag?: string };
  [key: string]: any;
}

// ─── Skeleton ───────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-muted/60 ${className}`}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-paper p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

function SectionSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-48" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────
function riskColor(tier: "low" | "medium" | "high") {
  if (tier === "low") return "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30";
  if (tier === "medium") return "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30";
  return "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/30";
}

function riskBarColor(tier: "low" | "medium" | "high") {
  if (tier === "low") return "bg-emerald-500";
  if (tier === "medium") return "bg-amber-500";
  return "bg-red-500";
}

function dominantTask(
  breakdown: Record<string, { share: number; risk: number }>
): string {
  let max = "";
  let maxShare = 0;
  for (const [key, val] of Object.entries(breakdown)) {
    if (val.share > maxShare) {
      maxShare = val.share;
      max = key;
    }
  }
  const labels: Record<string, string> = {
    routine_manual: "Routine Manual",
    routine_cognitive: "Routine Cognitive",
    nonroutine_manual: "Non-routine Manual",
    nonroutine_cognitive: "Non-routine Cognitive",
    social: "Social",
  };
  return labels[max] ?? max;
}

function fmt(n: number | undefined, decimals = 1): string {
  if (n === undefined || n === null) return "—";
  return n.toLocaleString("en", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtInt(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return Math.round(n).toLocaleString("en");
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

// ─── Data hooks ─────────────────────────────────────────────
function useFetchJsonWithFallback<T>(url: string, fallbackFn: () => T) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    const endpoint = url.replace(API, '');
    fetchWithFallback<T>(endpoint, fallbackFn)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}

// ─── Sub-components ─────────────────────────────────────────

/* ── 1. Country Header ─────────────────────────────────── */
function CountryHeader({
  country,
  onSelect,
}: {
  country: CountryEntry;
  onSelect: (iso3: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <span className="text-4xl mr-3">{country.flag}</span>
        <span className="font-display text-2xl font-bold">
          {country.name}
        </span>
      </div>
      <select
        className="rounded-md border border-line bg-paper px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cobalt"
        value={country.iso3}
        onChange={(e) => onSelect(e.target.value)}
      >
        {COUNTRY_LIST.map((c) => (
          <option key={c.iso3} value={c.iso3}>
            {c.flag} {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ── 2. Key Indicators ─────────────────────────────────── */
function IndicatorCard({
  label,
  value,
  unit,
  source,
  note,
}: {
  label: string;
  value: string;
  unit?: string;
  source: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-paper p-5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-black tracking-tight">
        {value}
        {unit && (
          <span className="ml-1 text-base font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </div>
      {note && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {note}
        </p>
      )}
      <div className="mt-2">{source}</div>
    </div>
  );
}

function KeyIndicators({ wdi }: { wdi: WdiLabour | null }) {
  if (!wdi)
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );

  const gdp = wdi.macro?.gdp_per_capita_usd;
  const youthUnemp = wdi.labour_market?.youth_unemployment_rate_pct;
  const labourPart = wdi.labour_market?.female_labour_participation_pct;
  const hci = wdi.education?.human_capital_index;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <IndicatorCard
        label="GDP per Capita"
        value={gdp ? `$${fmtInt(gdp.value)}` : "—"}
        source={<DataSource compact {...SOURCES.WDI_2024} />}
        note={gdp?.note}
      />
      <IndicatorCard
        label="Youth Unemployment"
        value={youthUnemp ? `${fmt(youthUnemp.value)}%` : "—"}
        source={<DataSource compact {...SOURCES.ILOSTAT_2024} />}
        note={youthUnemp?.note}
      />
      <IndicatorCard
        label="Female Labour Participation"
        value={labourPart ? `${fmt(labourPart.value)}%` : "—"}
        source={<DataSource compact {...SOURCES.WDI_2024} />}
        note={labourPart?.note}
      />
      <IndicatorCard
        label="Human Capital Index"
        value={hci ? fmt(hci.value, 2) : "—"}
        source={<DataSource compact {...SOURCES.HCI_2020} />}
        note={hci?.note}
      />
    </div>
  );
}

/* ── 2b. Risk Tier Donut Chart ──────────────────────────── */
const DONUT_COLORS = ["#10b981", "#f59e0b", "#ef4444"]; // green, amber, red

function RiskDonutChart({ recal }: { recal: RecalData | null }) {
  if (!recal) return null;
  const { risk_distribution: rd, total_occupations: total } = recal;
  if (total === 0) return null;

  const data = [
    { name: "Low Risk", value: rd.low, pct: ((rd.low / total) * 100).toFixed(1) },
    { name: "Medium Risk", value: rd.medium, pct: ((rd.medium / total) * 100).toFixed(1) },
    { name: "High Risk", value: rd.high, pct: ((rd.high / total) * 100).toFixed(1) },
  ];

  const renderLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    pct,
    name,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={700}
      >
        {pct}%
      </text>
    );
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="h-52 w-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              dataKey="value"
              labelLine={false}
              label={renderLabel}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={DONUT_COLORS[i]} />
              ))}
            </Pie>
            <RechartsTooltip
              formatter={(value: number, name: string) => [`${value} occupations`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 text-xs">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: DONUT_COLORS[i] }} />
            <span className="text-muted-foreground">{d.name}: {d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 3. Automation Exposure Distribution ───────────────── */
function AutomationExposure({ recal }: { recal: RecalData | null }) {
  if (!recal) return <SectionSkeleton rows={4} />;

  const { risk_distribution: rd, total_occupations: total } = recal;
  const tiers: { label: string; count: number; tier: "low" | "medium" | "high" }[] = [
    { label: "Low Risk (0–30%)", count: rd.low, tier: "low" },
    { label: "Medium Risk (30–60%)", count: rd.medium, tier: "medium" },
    { label: "High Risk (60%+)", count: rd.high, tier: "high" },
  ];
  const lowPct = total > 0 ? ((rd.low / total) * 100).toFixed(1) : "0";

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-xl font-bold">
          Automation Exposure Distribution
        </h2>
        <DataSource
          compact
          label="Frey & Osborne + O*NET"
          sources={[SOURCES.FREY_OSBORNE, SOURCES.ONET_2024]}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        {lowPct}% of {total} mapped occupations are in the low-risk tier after
        LMIC recalibration (calibration factor: {recal.calibration_factor}).
      </p>
      <div className="space-y-3">
        {tiers.map((t) => {
          const widthPct = total > 0 ? (t.count / total) * 100 : 0;
          return (
            <div key={t.tier}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{t.label}</span>
                <span className="font-mono text-xs">
                  {t.count} occupations ({widthPct.toFixed(1)}%)
                </span>
              </div>
              <div className="h-6 w-full rounded bg-muted/30 overflow-hidden">
                <div
                  className={`h-full rounded ${riskBarColor(t.tier)} transition-all duration-500`}
                  style={{ width: `${Math.max(widthPct, 1)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── 4 & 5. Top 10 Tables ─────────────────────────────── */
function OccupationTable({
  title,
  subtitle,
  occupations,
}: {
  title: string;
  subtitle: string;
  occupations: RecalOccupation[];
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="pb-2 pr-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-10">
                #
              </th>
              <th className="pb-2 pr-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Occupation
              </th>
              <th className="pb-2 pr-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-right w-28">
                Recalibrated Risk
              </th>
              <th className="pb-2 pr-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                Dominant Task
              </th>
              <th className="pb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground text-right hidden md:table-cell w-20">
                Risk Tier
              </th>
            </tr>
          </thead>
          <tbody>
            {occupations.map((occ, i) => (
              <tr
                key={occ.isco08}
                className="border-b border-line/50 hover:bg-sand/50 transition-colors"
              >
                <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground">
                  {i + 1}
                </td>
                <td className="py-2.5 pr-3 font-medium">{occ.title}</td>
                <td className="py-2.5 pr-3 text-right font-mono">
                  {pct(occ.recalibrated_probability)}
                </td>
                <td className="py-2.5 pr-3 text-muted-foreground hidden md:table-cell">
                  {dominantTask(occ.task_risk_breakdown)}
                </td>
                <td className="py-2.5 text-right hidden md:table-cell">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${riskColor(occ.risk_tier)}`}
                  >
                    {occ.risk_tier}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ── 6. Skills Gap Analysis ────────────────────────────── */
function SkillsGapAnalysis({
  aggregates,
}: {
  aggregates: PolicymakerAggregates | null;
}) {
  if (!aggregates?.skill_gap_heatmap) return <SectionSkeleton rows={6} />;

  const { sectors } = aggregates.skill_gap_heatmap;
  const shortages = sectors
    .filter((s) => s.gap_direction === "shortage")
    .sort((a, b) => b.gap_score - a.gap_score);
  const oversupply = sectors
    .filter((s) => s.gap_direction === "oversupply")
    .sort((a, b) => a.gap_score - b.gap_score);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-xl font-bold">
          Skills Supply–Demand Gap
        </h2>
        <DataSource
          compact
          label="Multiple"
          sources={[SOURCES.ILOSTAT_2024, SOURCES.WDI_2024, SOURCES.WITTGENSTEIN_SSP2]}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        These are the sectors where, if training capacity scaled, the most
        career mobility would be unlocked.
      </p>

      {/* Shortage sectors */}
      <div className="space-y-2">
        <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Skills Shortage (training needed)
        </h3>
        {shortages.map((s) => {
          const barW = Math.min((s.gap_score / 10) * 100, 100);
          return (
            <div key={s.sector} className="flex items-center gap-3">
              <span className="w-36 text-sm font-medium shrink-0 truncate">
                {s.sector}
              </span>
              <div className="flex-1 h-4 rounded bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded bg-red-400 transition-all duration-500"
                  style={{ width: `${barW}%` }}
                />
              </div>
              <span className="font-mono text-xs w-16 text-right shrink-0">
                Gap {fmt(s.gap_score)}
              </span>
              <span className="font-mono text-xs text-emerald-600 w-16 text-right shrink-0">
                +{s.wage_premium_vs_median_pct}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Oversupply */}
      {oversupply.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Oversupply (transition support needed)
          </h3>
          {oversupply.map((s) => {
            const barW = Math.min((Math.abs(s.gap_score) / 10) * 100, 100);
            return (
              <div key={s.sector} className="flex items-center gap-3">
                <span className="w-36 text-sm font-medium shrink-0 truncate">
                  {s.sector}
                </span>
                <div className="flex-1 h-4 rounded bg-muted/30 overflow-hidden">
                  <div
                    className="h-full rounded bg-blue-400 transition-all duration-500"
                    style={{ width: `${barW}%` }}
                  />
                </div>
                <span className="font-mono text-xs w-16 text-right shrink-0">
                  Gap {fmt(s.gap_score)}
                </span>
                <span className="font-mono text-xs text-muted-foreground w-16 text-right shrink-0">
                  {s.wage_premium_vs_median_pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ── 7. Education Pipeline ─────────────────────────────── */
function EducationPipeline({
  wdi,
  aggregates,
}: {
  wdi: WdiLabour | null;
  aggregates: PolicymakerAggregates | null;
}) {
  if (!wdi && !aggregates) return <SectionSkeleton rows={5} />;

  const edu = wdi?.education;
  const edTraj = aggregates?.education_trajectory;
  const neet = aggregates?.neet_overview;

  const attainmentBars: { label: string; value: number; color: string }[] = [];
  if (edu) {
    if (edu.primary_completion_rate_pct)
      attainmentBars.push({
        label: "Primary completion",
        value: edu.primary_completion_rate_pct.value,
        color: "bg-sky-400",
      });
    if (edu.secondary_enrollment_gross_pct)
      attainmentBars.push({
        label: "Secondary enrolment (gross)",
        value: edu.secondary_enrollment_gross_pct.value,
        color: "bg-indigo-400",
      });
    if (edu.tertiary_enrollment_gross_pct)
      attainmentBars.push({
        label: "Tertiary enrolment (gross)",
        value: edu.tertiary_enrollment_gross_pct.value,
        color: "bg-violet-400",
      });
    if (edu.mean_years_schooling)
      attainmentBars.push({
        label: `Mean years of schooling: ${edu.mean_years_schooling.value}`,
        value: (edu.mean_years_schooling.value / 13) * 100,
        color: "bg-fuchsia-400",
      });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-xl font-bold">Education Pipeline</h2>
        <DataSource
          compact
          label="Multiple"
          sources={[SOURCES.WDI_2024, SOURCES.WITTGENSTEIN_SSP2, SOURCES.UNESCO_UIS_2024]}
        />
      </div>

      {/* Attainment bars */}
      {attainmentBars.length > 0 && (
        <div className="space-y-2">
          {attainmentBars.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-52 text-sm shrink-0 truncate">{b.label}</span>
              <div className="flex-1 h-4 rounded bg-muted/30 overflow-hidden">
                <div
                  className={`h-full rounded ${b.color} transition-all duration-500`}
                  style={{ width: `${Math.min(b.value, 100)}%` }}
                />
              </div>
              <span className="font-mono text-xs w-14 text-right shrink-0">
                {fmt(b.value)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Trajectory */}
      {edTraj && (
        <div className="rounded-lg border border-line bg-sand/30 p-4 space-y-2">
          <h3 className="font-medium text-sm">{edTraj.title}</h3>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Upper secondary+ (2025)
              </span>
              <div className="font-display text-2xl font-bold">
                {edTraj.upper_secondary_plus_2025_pct}%
              </div>
            </div>
            <div className="flex items-center text-muted-foreground">→</div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Upper secondary+ (2035)
              </span>
              <div className="font-display text-2xl font-bold text-emerald-600">
                {edTraj.upper_secondary_plus_2035_pct}%
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{edTraj.insight}</p>
          <p className="text-xs font-medium text-cobalt">
            ⚡ {edTraj.policy_implication}
          </p>
        </div>
      )}

      {/* NEET */}
      {neet && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">{neet.title}</h3>
            <DataSource compact {...SOURCES.ILOSTAT_2024} />
          </div>
          <div className="font-display text-3xl font-black text-amber-700 dark:text-amber-400">
            {neet.overall_pct}%{" "}
            <span className="text-base font-normal text-muted-foreground">
              NEET rate
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{neet.note}</p>
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
            ⚡ {neet.policy_implication}
          </p>
        </div>
      )}
    </section>
  );
}

/* ── 8. Cohort Automation Exposure ─────────────────────── */
function CohortExposure({
  aggregates,
}: {
  aggregates: PolicymakerAggregates | null;
}) {
  if (!aggregates?.cohort_automation_exposure) return null;

  const { exposure, total_youth_millions, caveat } =
    aggregates.cohort_automation_exposure;

  const tierColors: Record<string, string> = {
    "High exposure": "bg-red-500",
    "Medium exposure": "bg-amber-500",
    "Low exposure": "bg-emerald-500",
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-display text-xl font-bold">
          Youth Automation Exposure ({total_youth_millions}M youth)
        </h2>
        <DataSource
          compact
          label="Multiple"
          sources={[SOURCES.FREY_OSBORNE, SOURCES.ILOSTAT_2024]}
        />
      </div>
      <p className="text-xs text-muted-foreground">{caveat}</p>

      {/* Stacked bar */}
      <div className="h-10 w-full rounded-lg overflow-hidden flex">
        {exposure.map((e) => (
          <div
            key={e.tier}
            className={`${tierColors[e.tier] ?? "bg-gray-400"} flex items-center justify-center text-white text-xs font-medium transition-all duration-500`}
            style={{ width: `${e.pct}%` }}
            title={`${e.tier}: ${e.pct}%`}
          >
            {e.pct > 10 ? `${e.pct}%` : ""}
          </div>
        ))}
      </div>

      {/* Legend + details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {exposure.map((e) => (
          <div
            key={e.tier}
            className="rounded-lg border border-line bg-paper p-4 space-y-1"
          >
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${tierColors[e.tier] ?? "bg-gray-400"}`}
              />
              <span className="font-medium text-sm">{e.tier}</span>
            </div>
            <div className="font-display text-2xl font-bold">
              {e.absolute_millions}M
            </div>
            <p className="text-xs text-muted-foreground">{e.description}</p>
            <p className="text-xs font-medium text-cobalt">
              ⚡ {e.policy_implication}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── 9. Data Provenance Footer ─────────────────────────── */
function DataProvenanceFooter({ recal }: { recal: RecalData | null }) {
  const allSources = [
    { ...SOURCES.ILOSTAT_2024, lastUpdated: "April 2024" },
    { ...SOURCES.WDI_2024, lastUpdated: "April 2024" },
    { ...SOURCES.FREY_OSBORNE, lastUpdated: "2017 (seminal)" },
    { ...SOURCES.ONET_2024, lastUpdated: "March 2024" },
    { ...SOURCES.WITTGENSTEIN_SSP2, lastUpdated: "2024" },
    { ...SOURCES.HCI_2020, lastUpdated: "2020" },
    { ...SOURCES.NBS_LFS_2022, lastUpdated: "Q4 2022" },
    { ...SOURCES.UNESCO_UIS_2024, lastUpdated: "2024" },
  ];

  return (
    <footer className="mt-12 rounded-lg border border-line bg-sand/30 p-6 space-y-4">
      <h2 className="font-display text-lg font-bold">Data Provenance</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        {allSources.map((s) => (
          <div key={s.label} className="flex items-start gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground shrink-0 mt-0.5">
              {s.label}
            </span>
            <span className="text-xs text-muted-foreground">{s.dataset}</span>
            {s.url && (
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cobalt hover:underline shrink-0"
              >
                ↗
              </a>
            )}
          </div>
        ))}
      </div>

      {recal && (
        <div className="rounded bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium">LMIC Recalibration Methodology</p>
          <p>{recal.methodology}</p>
        </div>
      )}

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md border border-line bg-paper px-4 py-2 text-sm font-medium hover:bg-sand transition-colors"
        onClick={() => {
          // placeholder
          alert("CSV download coming soon — data export is on the roadmap.");
        }}
      >
        📥 Download data as CSV
      </button>
    </footer>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────
function PolicymakerDashboard() {
  const [selectedIso3, setSelectedIso3] = useState("NGA");

  const country = COUNTRY_LIST.find((c) => c.iso3 === selectedIso3) ?? COUNTRY_LIST[0];
  const iso3Lower = selectedIso3.toLowerCase();

  // Fetch all three data sources with static fallbacks
  const {
    data: wdi,
    loading: wdiLoading,
  } = useFetchJsonWithFallback<WdiLabour>(
    `${API}/api/country/${iso3Lower}`,
    () => getCountryConfig(selectedIso3) as unknown as WdiLabour,
  );

  const {
    data: recal,
    loading: recalLoading,
  } = useFetchJsonWithFallback<RecalData>(
    `${API}/api/country/${iso3Lower}/recalibrated`,
    () => getRecalibratedData(selectedIso3) as unknown as RecalData,
  );

  const {
    data: aggregates,
    loading: aggLoading,
  } = useFetchJsonWithFallback<PolicymakerAggregates>(
    `${API}/api/policymaker/${iso3Lower}`,
    () => getPolicymakerAggregates(selectedIso3) as unknown as PolicymakerAggregates,
  );

  // Compute top 10 resilient / exposed from recal data
  const { resilient, exposed } = useMemo(() => {
    if (!recal?.occupations)
      return { resilient: [] as RecalOccupation[], exposed: [] as RecalOccupation[] };
    const sorted = [...recal.occupations].sort(
      (a, b) => a.recalibrated_probability - b.recalibrated_probability
    );
    return {
      resilient: sorted.slice(0, 10),
      exposed: sorted.slice(-10).reverse(),
    };
  }, [recal]);

  const loading = wdiLoading || recalLoading || aggLoading;

  return (
    <PageShell
      eyebrow="Policymaker View"
      title="Workforce Intelligence Dashboard"
      lede={
        <>
          Aggregate workforce data, automation exposure, and skills gaps —
          grounded in published datasets with full provenance.
        </>
      }
    >
      <div className="space-y-12">
        {/* 1. Country Header */}
        <CountryHeader country={country} onSelect={setSelectedIso3} />

        {/* 2. Key Indicators */}
        <KeyIndicators wdi={wdi} />

        {/* 3. Automation Exposure Distribution */}
        <AutomationExposure recal={recal} />

        {/* 3b. Risk Tier Donut Chart */}
        <RiskDonutChart recal={recal} />

        {/* Cohort exposure (if policymaker aggregates available) */}
        <CohortExposure aggregates={aggregates} />

        {/* 4. Top 10 Most Resilient */}
        {recalLoading ? (
          <SectionSkeleton rows={10} />
        ) : (
          resilient.length > 0 && (
            <OccupationTable
              title="Top 10 Most Resilient Occupations"
              subtitle="Lowest recalibrated automation risk — these roles are most durable in the LMIC context."
              occupations={resilient}
            />
          )
        )}

        {/* 5. Top 10 Most Exposed */}
        {recalLoading ? (
          <SectionSkeleton rows={10} />
        ) : (
          exposed.length > 0 && (
            <OccupationTable
              title="Top 10 Most Exposed Occupations"
              subtitle="Highest recalibrated automation risk — priority targets for policy intervention and reskilling."
              occupations={exposed}
            />
          )
        )}

        {/* 6. Skills Gap Analysis */}
        <SkillsGapAnalysis aggregates={aggregates} />

        {/* 7. Education Pipeline */}
        <EducationPipeline wdi={wdi} aggregates={aggregates} />

        {/* 8. Data Provenance Footer */}
        <DataProvenanceFooter recal={recal} />
      </div>
    </PageShell>
  );
}
