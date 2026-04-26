/**
 * EducationLandscape — CSS-only stacked bar chart showing Wittgenstein SSP2
 * education attainment projections for 2025 vs 2035.
 *
 * No charting library. Pure CSS flex columns with hover/click tooltips.
 *
 * @example
 * <EducationLandscape
 *   country="NGA"
 *   countryName="Nigeria"
 *   projections={config.educationProjections}
 * />
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { DataSource } from "@/components/data-source";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface EducationDistribution {
  no_education: number;
  primary: number;
  lower_secondary: number;
  upper_secondary: number;
  post_secondary: number;
}

export interface EducationLandscapeProps {
  /** ISO3 country code */
  country: string;
  /** Display name of the country */
  countryName?: string;
  /** Projections keyed by year string */
  projections: {
    [year: string]: EducationDistribution;
  };
  /** Compact mode — smaller height, no callout text */
  compact?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Data config
// ─────────────────────────────────────────────────────────────

interface LevelConfig {
  key: keyof EducationDistribution;
  label: string;
  shortLabel: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

const LEVELS: LevelConfig[] = [
  {
    key: "no_education",
    label: "No Education",
    shortLabel: "None",
    color: "#dc2626",
    bgClass: "bg-red-600",
    textClass: "text-red-700 dark:text-red-400",
    borderClass: "border-red-200 dark:border-red-900",
  },
  {
    key: "primary",
    label: "Primary",
    shortLabel: "Primary",
    color: "#ea580c",
    bgClass: "bg-orange-600",
    textClass: "text-orange-700 dark:text-orange-400",
    borderClass: "border-orange-200 dark:border-orange-900",
  },
  {
    key: "lower_secondary",
    label: "Lower Secondary",
    shortLabel: "Lower Sec.",
    color: "#ca8a04",
    bgClass: "bg-yellow-600",
    textClass: "text-yellow-700 dark:text-yellow-500",
    borderClass: "border-yellow-200 dark:border-yellow-900",
  },
  {
    key: "upper_secondary",
    label: "Upper Secondary",
    shortLabel: "Upper Sec.",
    color: "#16a34a",
    bgClass: "bg-green-600",
    textClass: "text-green-700 dark:text-green-400",
    borderClass: "border-green-200 dark:border-green-900",
  },
  {
    key: "post_secondary",
    label: "Post-Secondary / Tertiary",
    shortLabel: "Post-Sec.",
    color: "#2563eb",
    bgClass: "bg-blue-600",
    textClass: "text-blue-700 dark:text-blue-400",
    borderClass: "border-blue-200 dark:border-blue-900",
  },
];

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

interface SegmentProps {
  level: LevelConfig;
  pct: number;
  year: string;
  isActive: boolean;
  onActivate: (evt: React.MouseEvent) => void;
  onDeactivate: () => void;
  compact: boolean;
}

function Segment({
  level,
  pct,
  year,
  isActive,
  onActivate,
  onDeactivate,
  compact,
}: SegmentProps) {
  const heightPct = pct * 100;
  const showLabel = heightPct >= (compact ? 12 : 8);

  return (
    <div
      className="relative w-full cursor-pointer select-none transition-all duration-150 group"
      style={{ height: `${heightPct}%` }}
      onMouseEnter={onActivate}
      onMouseMove={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={(e) => onActivate(e as unknown as React.MouseEvent)}
      onBlur={onDeactivate}
      onClick={onActivate}
      tabIndex={0}
      role="button"
      aria-label={`${level.label}: ${Math.round(heightPct)}% in ${year}`}
    >
      {/* Bar fill */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-150",
          level.bgClass,
          isActive ? "opacity-90" : "opacity-75 group-hover:opacity-85",
        )}
      />

      {/* Inline label (when segment is tall enough) */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none px-1">
          <span className="text-white font-mono text-[10px] font-bold leading-none drop-shadow-sm">
            {Math.round(heightPct)}%
          </span>
          {heightPct >= (compact ? 18 : 12) && (
            <span className="text-white/80 font-mono text-[8px] uppercase tracking-wider mt-0.5 leading-none drop-shadow-sm text-center">
              {level.shortLabel}
            </span>
          )}
        </div>
      )}

      {/* Active highlight border */}
      {isActive && (
        <div className="absolute inset-0 ring-2 ring-white/60 ring-inset pointer-events-none z-20" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tooltip
// ─────────────────────────────────────────────────────────────

interface TooltipData {
  level: LevelConfig;
  year: string;
  pct: number;
  x: number;
  y: number;
}

function Tooltip({ data }: { data: TooltipData }) {
  return (
    <div
      className="pointer-events-none fixed z-50 max-w-[200px] rounded-lg border border-border bg-background shadow-lg p-3"
      style={{ left: data.x + 12, top: data.y - 20 }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="h-3 w-3 rounded-sm shrink-0"
          style={{ background: data.level.color }}
        />
        <span className="text-sm font-semibold leading-none">{data.level.label}</span>
      </div>
      <div className="font-mono text-2xl font-black leading-none">
        {Math.round(data.pct * 100)}%
      </div>
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
        {data.year} · SSP2 projection
      </div>
      <div className="mt-2">
        <DataSource
          label="WIC SSP2 2023"
          dataset="Wittgenstein Centre Human Capital Data Explorer"
          vintage="2023"
          methodology="SSP2 'Medium' scenario — moderate fertility decline, continued education expansion"
          url="https://dataexplorer.wittgensteincentre.org"
          compact
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bar column
// ─────────────────────────────────────────────────────────────

interface BarColumnProps {
  year: string;
  distribution: EducationDistribution;
  activeKey: string | null;
  onSegmentActivate: (key: string | null, evt?: React.MouseEvent) => void;
  compact: boolean;
}

function BarColumn({ year, distribution, activeKey, onSegmentActivate, compact }: BarColumnProps) {
  return (
    <div className="flex flex-col items-stretch flex-1 min-w-0">
      {/* Year label (above) */}
      <div className="text-center mb-2">
        <span className="font-display font-black text-lg tracking-tight">{year}</span>
      </div>

      {/* Stacked bar — built bottom-to-top by reversing the levels array */}
      <div
        className={cn(
          "relative w-full rounded overflow-hidden flex flex-col-reverse border border-border/30",
          compact ? "h-40" : "h-64 sm:h-80",
        )}
      >
        {LEVELS.map((level) => {
          const pct = distribution[level.key];
          if (pct <= 0) return null;
          return (
            <Segment
              key={level.key}
              level={level}
              pct={pct}
              year={year}
              isActive={activeKey === `${year}-${level.key}`}
              onActivate={(evt) => onSegmentActivate(`${year}-${level.key}`, evt)}
              onDeactivate={() => onSegmentActivate(null)}
              compact={compact}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Legend
// ─────────────────────────────────────────────────────────────

function Legend({ activeKey }: { activeKey: string | null }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
      {LEVELS.map((level) => {
        const isActive = activeKey?.endsWith(level.key) ?? false;
        return (
          <div
            key={level.key}
            className={cn(
              "flex items-center gap-1.5 transition-opacity",
              activeKey && !isActive ? "opacity-40" : "opacity-100",
            )}
          >
            <span
              className="h-3 w-3 rounded-sm shrink-0"
              style={{ background: level.color }}
            />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {level.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Y-axis labels
// ─────────────────────────────────────────────────────────────

function YAxis({ compact }: { compact: boolean }) {
  const ticks = [100, 75, 50, 25, 0];
  return (
    <div
      className={cn(
        "relative shrink-0 w-8 flex flex-col-reverse",
        compact ? "h-40" : "h-64 sm:h-80",
      )}
      aria-hidden="true"
    >
      {ticks.map((tick) => (
        <div
          key={tick}
          className="absolute w-full flex items-center justify-end pr-1"
          style={{ bottom: `${tick}%`, transform: "translateY(50%)" }}
        >
          <span className="font-mono text-[9px] text-muted-foreground leading-none">{tick}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Callout text
// ─────────────────────────────────────────────────────────────

function Callout({
  countryName,
  projections,
}: {
  countryName: string;
  projections: { [year: string]: EducationDistribution };
}) {
  const years = Object.keys(projections).sort();
  if (years.length < 2) return null;

  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  const first = projections[firstYear];
  const last = projections[lastYear];

  const upperFrom = Math.round(first.upper_secondary * 100);
  const upperTo = Math.round(last.upper_secondary * 100);
  const postFrom = Math.round(first.post_secondary * 100);
  const postTo = Math.round(last.post_secondary * 100);

  const noEduFrom = Math.round(first.no_education * 100);
  const noEduTo = Math.round(last.no_education * 100);
  const noEduChange = noEduFrom - noEduTo;

  return (
    <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 space-y-2">
      <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        SSP2 Projection Highlight
      </div>
      <p className="text-sm leading-relaxed">
        By {lastYear}, the share of{" "}
        <strong>{countryName}ns</strong> with upper secondary education is projected to{" "}
        {upperTo > upperFrom ? "increase" : "decrease"} from{" "}
        <strong>{upperFrom}%</strong> to <strong>{upperTo}%</strong> under the SSP2
        medium scenario — a {Math.abs(upperTo - upperFrom)} percentage point{" "}
        {upperTo > upperFrom ? "gain" : "decline"}.
      </p>
      {noEduChange > 0 && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          The share with no formal education is projected to fall by{" "}
          <strong>{noEduChange} pp</strong> ({noEduFrom}% → {noEduTo}%), while
          post-secondary attainment rises from <strong>{postFrom}%</strong> to{" "}
          <strong>{postTo}%</strong>.
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <DataSource
          label="WIC SSP2 2023"
          dataset="Wittgenstein Centre Human Capital Data Explorer"
          vintage="2023"
          methodology="SSP2 'Medium' scenario: moderate fertility, continued education investment. Age 15+, both sexes."
          url="https://dataexplorer.wittgensteincentre.org"
        />
        <DataSource
          label="UNESCO UIS 2024"
          dataset="UNESCO Institute for Statistics"
          vintage="2024"
          methodology="Administrative and household survey data on enrollment and attainment"
          url="https://uis.unesco.org"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export function EducationLandscape({
  country,
  countryName = country,
  projections,
  compact = false,
}: EducationLandscapeProps) {
  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  const [tooltip, setTooltip] = React.useState<TooltipData | null>(null);

  const years = React.useMemo(
    () => Object.keys(projections).sort(),
    [projections],
  );

  const handleActivate = React.useCallback(
    (key: string | null, evt?: React.MouseEvent) => {
      setActiveKey(key);

      if (!key || !evt) {
        setTooltip(null);
        return;
      }

      // Parse key → "2025-upper_secondary"
      const dashIdx = key.indexOf("-");
      const year = key.slice(0, dashIdx);
      const levelKey = key.slice(dashIdx + 1) as keyof EducationDistribution;
      const level = LEVELS.find((l) => l.key === levelKey);
      const dist = projections[year];

      if (!level || !dist) {
        setTooltip(null);
        return;
      }

      setTooltip({
        level,
        year,
        pct: dist[levelKey],
        x: evt.clientX,
        y: evt.clientY,
      });
    },
    [projections],
  );

  if (years.length === 0) {
    return (
      <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
        No education projection data available.
      </div>
    );
  }

  return (
    <div className={cn("w-full", compact && "text-sm")}>
      {/* Header */}
      {!compact && (
        <div className="mb-4">
          <h3 className="font-display font-black text-xl tracking-tight">
            Education Attainment Landscape
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Population aged 15+ by highest level attained · Wittgenstein SSP2
          </p>
        </div>
      )}

      {/* Chart area */}
      <div className="flex items-end gap-3">
        {/* Y-axis */}
        <div className="flex flex-col items-end">
          <div className={compact ? "h-40" : "h-64 sm:h-80"}>
            <YAxis compact={compact} />
          </div>
          <div className="h-6" /> {/* spacer for year label */}
        </div>

        {/* Columns */}
        <div className="flex gap-4 sm:gap-8 flex-1 items-end">
          {years.map((year) => (
            <BarColumn
              key={year}
              year={year}
              distribution={projections[year]}
              activeKey={activeKey}
              onSegmentActivate={(key, evt) => handleActivate(key, evt)}
              compact={compact}
            />
          ))}
        </div>
      </div>

      {/* Y-axis label */}
      <div className="mt-1 ml-8 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        % of adult population (15+)
      </div>

      {/* Legend */}
      <Legend activeKey={activeKey} />

      {/* Callout */}
      {!compact && (
        <Callout countryName={countryName} projections={projections} />
      )}

      {/* Tooltip (portal-style fixed positioning) */}
      {tooltip && <Tooltip data={tooltip} />}
    </div>
  );
}

export default EducationLandscape;
