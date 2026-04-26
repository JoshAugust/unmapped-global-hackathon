/**
 * DataChip — small consistent provenance pill for any datapoint.
 * Shows "Source · Vintage" with an optional confidence dot:
 *  - low    → rust
 *  - medium → cobalt
 *  - high   → moss
 *
 * Two variants:
 *  - "muted" (default): subtle outline pill, fits in card footers
 *  - "solid": filled cobalt pill, draws attention near headlines
 */

import { cn } from "@/lib/utils";

export interface DataChipProps {
  source: string;
  vintage?: string | number;
  confidence?: "low" | "medium" | "high";
  variant?: "muted" | "solid";
  className?: string;
}

const DOT_COLOR: Record<NonNullable<DataChipProps["confidence"]>, string> = {
  low: "bg-rust",
  medium: "bg-cobalt",
  high: "bg-moss",
};

export function DataChip({
  source,
  vintage,
  confidence,
  variant = "muted",
  className,
}: DataChipProps) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider";
  const variantClass =
    variant === "solid"
      ? "bg-cobalt text-paper"
      : "border border-line bg-sand text-muted-foreground";

  return (
    <span
      className={cn(base, variantClass, className)}
      title={vintage ? `${source} (${vintage})` : source}
    >
      {confidence && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", DOT_COLOR[confidence])}
          aria-label={`${confidence} confidence`}
        />
      )}
      <span className="font-semibold">{source}</span>
      {vintage !== undefined && vintage !== "" && (
        <span className={variant === "solid" ? "text-paper/80" : "text-muted-foreground"}>
          · {vintage}
        </span>
      )}
    </span>
  );
}