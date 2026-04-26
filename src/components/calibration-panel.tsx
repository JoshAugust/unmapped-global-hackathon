/**
 * CalibrationPanel — Embeddable honesty panel for data limits & methodology.
 *
 * Shows what data we have, what we DON'T have, and how our estimates may be
 * wrong. Credibility through honesty.
 *
 * Props:
 *   country?  — ISO3 code, highlights that country's column in the gap table
 *   compact?  — renders as a collapsible amber banner instead of full panel
 *   embedded? — strips outer card shell for embedding in results/policymaker
 */

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ArrowRight,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { DataSource } from "@/components/data-source";
import { SOURCES } from "@/lib/sources";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalibrationPanelProps {
  /** ISO3 country code — highlights that country's gaps in the data table */
  country?: string;
  /** Compact mode — shows amber banner only, expandable to full panel */
  compact?: boolean;
  /** Embedded mode — no outer page shell, for embedding in results/policymaker */
  embedded?: boolean;
}

type CoverageStatus = "complete" | "partial" | "missing";

interface DatasetRow {
  label: string;
  NGA: CoverageStatus;
  GHA: CoverageStatus;
  KEN: CoverageStatus;
  IND: CoverageStatus;
  RWA: CoverageStatus;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRIES = ["NGA", "GHA", "KEN", "IND", "RWA"] as const;
type CountryCode = (typeof COUNTRIES)[number];

const DATASET_ROWS: DatasetRow[] = [
  { label: "WDI Labour",       NGA: "complete", GHA: "complete", KEN: "complete", IND: "complete", RWA: "complete" },
  { label: "Human Capital Index", NGA: "complete", GHA: "complete", KEN: "complete", IND: "complete", RWA: "complete" },
  { label: "Job Vacancies",    NGA: "complete", GHA: "partial",  KEN: "partial",  IND: "partial",  RWA: "missing"  },
  { label: "ISCO Mapping",     NGA: "complete", GHA: "complete", KEN: "complete", IND: "complete", RWA: "complete" },
  { label: "Recalibration",    NGA: "complete", GHA: "complete", KEN: "complete", IND: "complete", RWA: "complete" },
  { label: "Policymaker Data", NGA: "complete", GHA: "partial",  KEN: "partial",  IND: "partial",  RWA: "partial"  },
];

// ─── Coverage badge ───────────────────────────────────────────────────────────

function CoverageBadge({
  status,
  highlight = false,
}: {
  status: CoverageStatus;
  highlight?: boolean;
}) {
  const ringClass = highlight ? "ring-2 ring-offset-1" : "";

  if (status === "complete") {
    return (
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${ringClass} ring-emerald-400`}
        title="Complete"
      >
        <CheckCircle className="w-5 h-5 text-emerald-500" />
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span
        className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${ringClass} ring-amber-400`}
        title="Partial / Estimated"
      >
        <AlertTriangle className="w-5 h-5 text-amber-500" />
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${ringClass} ring-red-400`}
      title="Missing"
    >
      <XCircle className="w-5 h-5 text-red-500" />
    </span>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-slate-500">{icon}</span>
      <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h3>
    </div>
  );
}

// ─── Section A: What Our Numbers Mean ────────────────────────────────────────

function SectionWhatNumbersMean() {
  return (
    <div>
      <SectionHeader title="What Our Numbers Mean" icon={<Info className="w-4 h-4" />} />
      <ul className="space-y-3">
        <li className="flex gap-3">
          <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-blue-400" />
          <p className="text-sm text-slate-700">
            <span className="font-medium">Automation risk is not a prediction</span> — it's an estimate of how
            susceptible a job's tasks are to automation. Whether and when that automation actually happens depends on
            wages, infrastructure, capital access, and policy decisions.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-blue-400" />
          <p className="text-sm text-slate-700">
            <span className="font-medium">Frey &amp; Osborne scores were designed for the US in 2013.</span> We
            recalibrate them for each country — but uncertainty remains. A Nigerian market trader and a US cashier
            share an ISCO code but have structurally different task bundles.{" "}
            <DataSource {...SOURCES.FREY_OSBORNE} compact />
          </p>
        </li>
        <li className="flex gap-3">
          <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-blue-400" />
          <p className="text-sm text-slate-700">
            <span className="font-medium">Country recalibration factors are approximations.</span> Nigeria uses 0.67,
            Ghana 0.65 — derived from capital investment ratios, power infrastructure reliability (World Bank Enterprise
            Surveys), and informal economy share. These are informed estimates, not precise measurements.{" "}
            <DataSource {...SOURCES.ILOSTAT_2024} compact />{" "}
            <DataSource {...SOURCES.WDI_2024} compact />
          </p>
        </li>
      </ul>
    </div>
  );
}

// ─── Section B: What We Don't Know ───────────────────────────────────────────

function SectionWhatWeDontKnow() {
  return (
    <div>
      <SectionHeader title="What We Don't Know" icon={<AlertTriangle className="w-4 h-4" />} />
      <ul className="space-y-3">
        <li className="flex gap-3">
          <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-amber-400" />
          <div>
            <p className="text-sm text-slate-700">
              <span className="font-medium">Informal economy data.</span> ILO estimates show Nigeria's informal sector
              is ~80% of employment — but these are modelled estimates, not direct measurement. Wage data for informal
              workers is especially sparse.{" "}
              <DataSource {...SOURCES.ILOSTAT_2024} compact />
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-amber-400" />
          <p className="text-sm text-slate-700">
            <span className="font-medium">Job vacancies.</span> Our vacancy data is scraped from online platforms,
            which represent less than 5% of actual hiring in most LMICs. The majority of jobs are filled through
            personal networks, community boards, and informal channels — invisible to us.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-amber-400" />
          <p className="text-sm text-slate-700">
            <span className="font-medium">Skills data.</span> We use ESCO (European Skills, Competences, Qualifications
            and Occupations) to map skills — a European taxonomy that may not capture culturally specific skills like
            Yoruba textile dyeing, Maasai livestock management, or kente weaving apprenticeships.
          </p>
        </li>
        <li className="flex gap-3">
          <span className="mt-1.5 shrink-0 w-2 h-2 rounded-full bg-amber-400" />
          <p className="text-sm text-slate-700">
            <span className="font-medium">Automation timeline.</span> We show susceptibility — not timing. A job rated
            "high susceptibility" could remain unautomated for decades if wages are low, power is unreliable, or capital
            is unavailable.
          </p>
        </li>
      </ul>
    </div>
  );
}

// ─── Section C: Data Gaps by Country ─────────────────────────────────────────

function SectionDataGaps({ highlightCountry }: { highlightCountry?: string }) {
  const highlighted = highlightCountry?.toUpperCase() as CountryCode | undefined;

  return (
    <div>
      <SectionHeader title="Data Gaps by Country" icon={<CheckCircle className="w-4 h-4" />} />

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm border-collapse min-w-[420px]">
          <thead>
            <tr>
              <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">
                Dataset
              </th>
              {COUNTRIES.map((cc) => (
                <th
                  key={cc}
                  className={`text-center py-2 px-2 text-xs font-semibold uppercase tracking-wide border-b border-slate-200 ${
                    highlighted === cc ? "text-blue-600 bg-blue-50/60" : "text-slate-500"
                  }`}
                >
                  {cc}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DATASET_ROWS.map((row, i) => (
              <tr key={row.label} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                <td className="py-2 px-3 text-slate-700 text-xs font-medium whitespace-nowrap">{row.label}</td>
                {COUNTRIES.map((cc) => (
                  <td
                    key={cc}
                    className={`py-2 px-2 text-center ${highlighted === cc ? "bg-blue-50/40" : ""}`}
                  >
                    <CoverageBadge status={row[cc]} highlight={highlighted === cc} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-3">
        {(
          [
            { status: "complete" as CoverageStatus, label: "Complete" },
            { status: "partial" as CoverageStatus, label: "Partial / Estimated" },
            { status: "missing" as CoverageStatus, label: "Missing" },
          ] as const
        ).map(({ status, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <CoverageBadge status={status} />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {highlighted && (
        <p className="text-xs text-blue-600 mt-2">
          ↑ Highlighted column shows data coverage for{" "}
          <span className="font-semibold">{highlighted}</span>
        </p>
      )}
    </div>
  );
}

// ─── Section D: Methodology ───────────────────────────────────────────────────

function SectionMethodology() {
  return (
    <div>
      <SectionHeader title="Methodology" icon={<Info className="w-4 h-4" />} />
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
            Task Decomposition (5 Categories)
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            We decompose each occupation into five task categories following Acemoglu &amp; Autor (2011): routine
            cognitive, routine manual, non-routine cognitive analytical, non-routine cognitive interpersonal, and
            non-routine manual physical. Automation susceptibility is weighted by each category's task share within
            the occupation.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
            LMIC Calibration Factors
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            Base Frey-Osborne scores are multiplied by a country calibration factor (0.65–0.77) derived from: capital
            investment ratios vs. OECD average, power infrastructure reliability, informal sector task-bundle
            differences within the same ISCO codes, and ILO cross-country modelled estimates.{" "}
            <DataSource {...SOURCES.FREY_OSBORNE} compact />{" "}
            <DataSource {...SOURCES.ILOSTAT_2024} compact />
          </p>
        </div>
        <Link
          to="/infrastructure"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          See full methodology on the Infrastructure page
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// ─── Panel content (shared between modes) ────────────────────────────────────

function PanelContent({
  compact,
  country,
  onCollapse,
}: {
  compact: boolean;
  country?: string;
  onCollapse?: () => void;
}) {
  return (
    <div className="divide-y divide-slate-100">
      {/* Header row */}
      <div
        className={`flex items-center justify-between px-5 py-4 ${
          compact ? "cursor-pointer hover:bg-slate-50/80 transition-colors" : ""
        }`}
        onClick={compact ? onCollapse : undefined}
        role={compact ? "button" : undefined}
        aria-expanded={compact ? false : undefined}
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Data Limits &amp; Methodology</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparency about what our numbers mean and what we don't know
            </p>
          </div>
        </div>
        {compact && <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />}
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-7">
        <SectionWhatNumbersMean />
        <SectionWhatWeDontKnow />
        <SectionDataGaps highlightCountry={country} />
        <SectionMethodology />
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-slate-50/80">
        <p className="text-xs text-slate-400">
          We'd rather you trust us on what we <span className="font-medium">do</span> know than doubt us on what we
          don't. Calibration updated: April 2025.
        </p>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function CalibrationPanel({
  country,
  compact = false,
  embedded = false,
}: CalibrationPanelProps) {
  const [expanded, setExpanded] = useState(!compact);

  // ── Compact (banner) mode — collapsed ──────────────────────────────────────
  if (compact && !expanded) {
    return (
      <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-medium">These estimates carry uncertainty.</span> Our automation risk scores are
            approximations based on US research, recalibrated for local context.{" "}
            <button
              className="underline underline-offset-2 hover:text-amber-900 font-medium"
              onClick={() => setExpanded(true)}
            >
              See full methodology →
            </button>
          </p>
        </div>
        <button
          onClick={() => setExpanded(true)}
          className="shrink-0 text-amber-600 hover:text-amber-800 transition-colors mt-0.5"
          aria-label="Expand calibration details"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ── Compact (banner) mode — expanded to full panel ─────────────────────────
  if (compact && expanded) {
    return (
      <div className="w-full border border-amber-200 rounded-xl bg-white overflow-hidden shadow-sm">
        <PanelContent compact={true} country={country} onCollapse={() => setExpanded(false)} />
      </div>
    );
  }

  // ── Embedded mode: no outer card styling ────────────────────────────────────
  if (embedded) {
    return (
      <div className="w-full border border-slate-200 rounded-xl bg-white overflow-hidden">
        <PanelContent compact={false} country={country} />
      </div>
    );
  }

  // ── Default: full card with shadow ─────────────────────────────────────────
  return (
    <div className="w-full border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <PanelContent compact={false} country={country} />
    </div>
  );
}
