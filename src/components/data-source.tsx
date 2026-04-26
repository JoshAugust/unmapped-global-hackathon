/**
 * DataSource — Reusable citation component for statistics.
 *
 * Renders an inline badge (source name + year) with a popover
 * containing full metadata. Supports single and multi-source modes.
 *
 * @example
 * // Single source (spread from registry):
 * <DataSource {...SOURCES.ILOSTAT_2024} />
 *
 * // Single source with custom caveat:
 * <DataSource label="NBS 2022" dataset="NBS Labour Force Survey" vintage="2022" caveat="Formal sector only" />
 *
 * // Multiple sources:
 * <DataSource label="Multiple" sources={[SOURCES.ILOSTAT_2024, SOURCES.NBS_LFS_2022]} />
 *
 * // Compact mode (info icon only):
 * <DataSource compact {...SOURCES.ILOSTAT_2024} />
 * <DataSource compact sources={[SOURCES.ILOSTAT_2024, SOURCES.NBS_LFS_2022]} />
 */

import * as React from "react";
import { Info, ExternalLink } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { SourceDefinition } from "@/lib/sources";

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface DataSourceProps {
  /** Short label shown inline, e.g. "ILOSTAT 2024". Optional when `sources` is provided. */
  label?: string;
  /** Full dataset name. Optional when `sources` is provided. */
  dataset?: string;
  /** Year or date range. Optional when `sources` is provided. */
  vintage?: string;
  /** Brief methodology description */
  methodology?: string;
  /** Known data gaps or caveats */
  caveat?: string;
  /** URL to source */
  url?: string;
  /** Compact mode — just an info icon, no text label */
  compact?: boolean;
  /** Multiple sources for compound citations */
  sources?: SourceDefinition[];
  /** Additional className for the trigger element */
  className?: string;
}

// ────────────────────────────────────────────
// Internal: single source detail card
// ────────────────────────────────────────────

function SourceDetail({
  source,
  isLast,
}: {
  source: SourceDefinition;
  isLast: boolean;
}) {
  return (
    <div className={cn("space-y-2", !isLast && "border-b pb-3 mb-3")}>
      {/* Dataset name */}
      <div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          Dataset
        </span>
        <p className="text-sm font-medium leading-snug">{source.dataset}</p>
      </div>

      {/* Vintage */}
      <div>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
          Vintage
        </span>
        <p className="text-sm">{source.vintage}</p>
      </div>

      {/* Methodology */}
      {source.methodology && (
        <div>
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Methodology
          </span>
          <p className="text-sm text-muted-foreground leading-snug">
            {source.methodology}
          </p>
        </div>
      )}

      {/* Caveat */}
      {source.caveat && (
        <div className="rounded bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1.5">
          <span className="font-mono text-[9px] uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Data gap
          </span>
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-snug">
            {source.caveat}
          </p>
        </div>
      )}

      {/* Link */}
      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          View source
        </a>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// DataSource component
// ────────────────────────────────────────────

export function DataSource({
  label,
  dataset,
  vintage,
  methodology,
  caveat,
  url,
  compact = false,
  sources,
  className,
}: DataSourceProps) {
  // Normalise into an array of sources
  const allSources: SourceDefinition[] = sources?.length
    ? sources
    : [{
        label: label ?? "Source",
        dataset: dataset ?? "",
        vintage: vintage ?? "",
        methodology,
        caveat,
        url,
      }];

  // Build the display label for multi-source mode
  const displayLabel = sources?.length
    ? sources.map((s) => s.label).join("; ")
    : (label ?? "Source");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded border border-border/50 bg-muted/40 px-1.5 py-0.5 transition-colors hover:bg-muted hover:border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer align-baseline",
            compact && "px-1 py-0.5 border-transparent bg-transparent hover:bg-muted/60",
            className,
          )}
          aria-label={`Data source: ${displayLabel}`}
        >
          {!compact && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground leading-none select-none">
              {displayLabel}
            </span>
          )}
          <Info
            className={cn(
              "shrink-0 text-muted-foreground/70",
              compact ? "h-3.5 w-3.5" : "h-3 w-3",
            )}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 max-h-96 overflow-y-auto p-4"
        align="start"
        sideOffset={6}
      >
        {/* Header for multi-source */}
        {allSources.length > 1 && (
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground mb-3">
            {allSources.length} sources
          </p>
        )}

        {allSources.map((source, i) => (
          <SourceDetail
            key={`${source.label}-${source.vintage}`}
            source={source}
            isLast={i === allSources.length - 1}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
}

export default DataSource;
