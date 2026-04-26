import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, AlertTriangle, Scale, Users } from "lucide-react";
import CalibrationPanel from "../components/calibration-panel";

export const Route = createFileRoute("/methodology")({
  component: Methodology,
});

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function LiteratureCard({
  citation,
  finding,
  url,
}: {
  citation: string;
  finding: string;
  url?: string;
}) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white hover:border-slate-300 transition-colors">
      <p className="text-xs font-semibold text-blue-600 mb-1.5 font-mono">{citation}</p>
      <p className="text-sm text-slate-600">{finding}</p>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-blue-500 transition-colors mt-1.5 block"
        >
          {url}
        </a>
      )}
    </div>
  );
}

function ComparisonRow({
  study,
  scope,
  approach,
  ourDifference,
}: {
  study: string;
  scope: string;
  approach: string;
  ourDifference: string;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-3 px-4 text-sm font-medium text-slate-700 align-top">{study}</td>
      <td className="py-3 px-4 text-sm text-slate-500 align-top">{scope}</td>
      <td className="py-3 px-4 text-sm text-slate-500 align-top">{approach}</td>
      <td className="py-3 px-4 text-sm text-slate-600 align-top">{ourDifference}</td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Methodology() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <span className="text-sm font-medium text-slate-700">Methodology &amp; Data Transparency</span>
          <div className="w-16" /> {/* spacer */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">

        {/* Hero */}
        <div className="text-center space-y-3 pb-4">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 text-xs font-semibold text-amber-700 uppercase tracking-wide">
            <AlertTriangle className="w-3.5 h-3.5" />
            Transparency First
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            How UNMAPPED Works —<br className="hidden sm:block" /> and Where It Might Be Wrong
          </h1>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            We'd rather you trust us on what we <span className="font-semibold text-slate-700">do</span> know than
            doubt us on what we don't. This page explains our methodology, our data sources, and — most importantly —
            the limits of what we can tell you.
          </p>
        </div>

        {/* Honesty statement */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <Scale className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-base font-semibold text-blue-900 mb-2">Why honesty matters here</h2>
              <p className="text-sm text-blue-800 leading-relaxed">
                Labour market tools that overstate certainty cause real harm. A worker told their job "will be automated
                by 2027" may make irreversible decisions based on a model that can't actually predict deployment
                timelines. We built UNMAPPED to be useful to people making real decisions — that means being clear
                about the difference between what we know, what we estimate, and what we simply don't have data for.
              </p>
            </div>
          </div>
        </div>

        <SectionDivider label="Team & Credentials" />

        {/* Team credentials */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex items-start gap-3 mb-5">
            <Users className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
            <h2 className="text-base font-semibold text-slate-800">Who built this</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-600">
            <p>
              UNMAPPED was built for the Workday / Bright Network Hackathon 2025. The team has backgrounds in
              development economics, labour market policy, and systems engineering — with experience across Sub-Saharan
              Africa and South Asia labour markets.
            </p>
            <p>
              We drew on publicly available international datasets (ILO, World Bank WDI, ESCO) and peer-reviewed
              automation research, applying country-specific recalibrations informed by field evidence. The methodology
              is documented fully below and open for critique.
            </p>
          </div>
        </div>

        <SectionDivider label="Literature References" />

        {/* Literature */}
        <div>
          <div className="flex items-start gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
            <h2 className="text-base font-semibold text-slate-800">Research foundations</h2>
          </div>
          <div className="space-y-3">
            <LiteratureCard
              citation="Frey & Osborne (2013)"
              finding="Estimated ~47% of US jobs at high risk of automation using O*NET task data and a machine learning classifier across 702 occupations. The foundational automation risk dataset — but US-centric and now over a decade old."
              url="https://www.oxfordmartin.ox.ac.uk/downloads/academic/The_Future_of_Employment.pdf"
            />
            <LiteratureCard
              citation="Arntz, Gregory & Zierahn (2016) — OECD Social, Employment and Migration Working Papers No. 189"
              finding="Critiqued Frey-Osborne's occupation-level approach. By decomposing jobs into tasks within occupations, they found only ~9% of OECD jobs at high automation risk — not 47%. Highlights how much task-level composition matters."
              url="https://doi.org/10.1787/5jlz9h56dvq7-en"
            />
            <LiteratureCard
              citation="World Bank World Development Report 2019: The Changing Nature of Work"
              finding="Applied task-based analysis to developing countries. Found that while automation risk is real in LMICs, complementarity effects (technology creating new tasks) and wage dynamics may slow displacement relative to OECD projections. Critical context for our LMIC calibration."
              url="https://www.worldbank.org/en/publication/wdr2019"
            />
            <LiteratureCard
              citation="ILO (2016) — ASEAN in Transformation: How Technology is Changing Jobs and Enterprises"
              finding="Estimated ~44% of LMIC jobs at high automation risk vs ~57% in OECD. Provides the empirical basis for our calibration ratio (0.77). Adjusted further for informal sector task composition to arrive at country factors of 0.65–0.67."
            />
            <LiteratureCard
              citation="Chang et al. (2016) — World Bank Policy Research Working Paper 7765"
              finding="Automation risk in developing countries accounting for infrastructure constraints, capital access, and wage levels. Direct input to our country-level calibration methodology."
            />
            <LiteratureCard
              citation="Acemoglu & Autor (2011) — Skills, Tasks and Technologies: Implications for Employment and Earnings"
              finding="The canonical task framework distinguishing routine/non-routine and cognitive/manual tasks. Our 5-category task decomposition is derived from this framework."
            />
          </div>
        </div>

        <SectionDivider label="Comparison with Other Studies" />

        {/* Comparison table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">How we compare to other automation risk tools</h2>
            <p className="text-xs text-slate-500 mt-1">Different approaches, different answers — here's why</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-slate-50">
                <tr>
                  {["Study / Tool", "Scope", "Approach", "How UNMAPPED differs"].map((h) => (
                    <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <ComparisonRow
                  study="Frey & Osborne (2013)"
                  scope="US only"
                  approach="Occupation-level classifier"
                  ourDifference="We apply task-level decomposition and LMIC recalibration. We also surface uncertainty explicitly rather than presenting point estimates as fact."
                />
                <ComparisonRow
                  study="OECD Task-Based (Arntz 2016)"
                  scope="OECD countries"
                  approach="Task-share within occupations"
                  ourDifference="We adopt the task-level approach (lower, more defensible estimates) but extend it to LMICs using ILO calibration data. OECD task shares don't apply to informal LMIC labour markets."
                />
                <ComparisonRow
                  study="McKinsey Global Institute (2017)"
                  scope="46 countries including some LMICs"
                  approach="Activity-level automation potential"
                  ourDifference="MGI uses proprietary occupation data. We use open datasets (ISCO, O*NET, ILO) for full transparency and reproducibility."
                />
                <ComparisonRow
                  study="World Bank WDR 2019"
                  scope="Global including LMICs"
                  approach="Task-based with complementarity"
                  ourDifference="We share the WDR's caution about overstating automation risk in LMICs. Where we add value: country-specific gap analysis and person-level framing for workers, not just aggregate policy analysis."
                />
              </tbody>
            </table>
          </div>
        </div>

        <SectionDivider label="Full Data Limits Panel" />

        {/* Embed the full calibration panel */}
        <CalibrationPanel embedded={true} />

        {/* Footer note */}
        <div className="text-center py-6">
          <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            Calibration factors and data vintage labels updated April 2025. When ILO publishes updated task-content
            indices with SSA country coverage (expected 2025–2026), we will revise our recalibration methodology.
            Questions or corrections:{" "}
            <a href="mailto:team@unmapped.dev" className="underline hover:text-slate-600 transition-colors">
              team@unmapped.dev
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
