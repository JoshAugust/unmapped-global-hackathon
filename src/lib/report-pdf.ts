import type { ReportData } from "./report-data";
import { reportFileBase } from "./report-data";

/**
 * Generates a clean, single-page A4/Letter-friendly PDF from ReportData
 * and triggers a browser download. Returns the filename used.
 *
 * Designed to fit on one page in normal cases by:
 *  - capping list lengths,
 *  - truncating long text to a max width,
 *  - using compact row spacing.
 */
export async function generateReportPDF(data: ReportData): Promise<string> {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40; // margin
  const COL = (W - M * 2) / 2;

  // ── Colors (minimal, print-friendly) ──
  const INK: [number, number, number] = [22, 24, 28];
  const MUTED: [number, number, number] = [110, 115, 125];
  const RULE: [number, number, number] = [220, 222, 228];
  const ACCENT: [number, number, number] =
    data.readiness.tier === "low"
      ? [22, 130, 90]
      : data.readiness.tier === "medium"
      ? [180, 120, 20]
      : [180, 50, 50];

  const setText = (rgb: [number, number, number]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const truncate = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1).trim() + "…" : s);

  // ── Header band ──
  doc.setFillColor(INK[0], INK[1], INK[2]);
  doc.rect(0, 0, W, 70, "F");
  setText([255, 255, 255]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("UNMAPPED · Skills & AI Readiness Report", M, 30);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(190, 200, 215);
  const subtitle = `${data.profileLabel} · ${truncate(data.occupationTitle, 48)} · ${data.countryName}`;
  doc.text(truncate(subtitle, 90), M, 48);
  const dateStr = new Date(data.generatedAt).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });
  doc.setFontSize(8);
  doc.text(`Generated ${dateStr}`, W - M, 48, { align: "right" });

  let y = 90;

  // ── Readiness summary band ──
  setText(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("AI Readiness", M, y);

  // Risk badge on the right
  const riskPct = Math.round(data.readiness.riskScore * 100);
  const tierLabel =
    data.readiness.tier === "low" ? "Low risk" :
    data.readiness.tier === "medium" ? "Moderate risk" : "High risk";
  doc.setFillColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.roundedRect(W - M - 110, y - 12, 110, 18, 3, 3, "F");
  setText([255, 255, 255]);
  doc.setFontSize(9);
  doc.text(`${tierLabel} · ${riskPct}%`, W - M - 55, y + 1, { align: "center" });

  y += 14;
  setText(INK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const summaryLines = doc.splitTextToSize(data.readiness.summary, W - M * 2);
  doc.text(summaryLines.slice(0, 3), M, y);
  y += Math.min(summaryLines.length, 3) * 12 + 6;

  if (data.readiness.originalFreyOsborne != null) {
    setText(MUTED);
    doc.setFontSize(8);
    doc.text(
      `Original Frey & Osborne: ${Math.round(data.readiness.originalFreyOsborne * 100)}%   →   Recalibrated for ${data.countryName}: ${riskPct}%`,
      M, y,
    );
    y += 12;
  }

  // ── Divider ──
  doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
  doc.line(M, y, W - M, y);
  y += 14;

  // ── Two-column body: Top risks (L) | Durable skills (R) ──
  const colTop = y;

  // Left: Top risk areas
  setText(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Top tasks at risk", M, y);
  y += 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const risks = [...data.topRisks].sort((a, b) => b.risk - a.risk).slice(0, 4);
  if (risks.length === 0) {
    setText(MUTED);
    doc.text("No high-risk task categories detected.", M, y);
    y += 12;
  } else {
    risks.forEach(r => {
      setText(INK);
      doc.text(`• ${truncate(r.label, 38)}`, M, y);
      setText(MUTED);
      doc.text(`${Math.round(r.risk * 100)}% risk`, M + COL - 6, y, { align: "right" });
      y += 12;
    });
  }
  const leftEnd = y;

  // Right: Durable skills
  let yR = colTop;
  setText(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Durable skills", M + COL + 12, yR);
  yR += 13;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const skills = data.durableSkills.slice(0, 6);
  if (skills.length === 0) {
    setText(MUTED);
    doc.text("Add skills to your passport to see this section.", M + COL + 12, yR);
    yR += 12;
  } else {
    skills.forEach(s => {
      setText(INK);
      doc.text(`• ${truncate(s, 42)}`, M + COL + 12, yR);
      yR += 12;
    });
  }

  y = Math.max(leftEnd, yR) + 10;
  doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
  doc.line(M, y, W - M, y);
  y += 14;

  // ── Opportunity pathways ──
  setText(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Top opportunity pathways", M, y);
  y += 14;
  doc.setFontSize(9);
  const paths = data.pathways.slice(0, 3);
  if (paths.length === 0) {
    setText(MUTED);
    doc.setFont("helvetica", "normal");
    doc.text("No transition pathways available for this profile yet.", M, y);
    y += 12;
  } else {
    paths.forEach(p => {
      setText(INK);
      doc.setFont("helvetica", "bold");
      doc.text(truncate(p.title, 60), M, y);
      doc.setFont("helvetica", "normal");
      setText(MUTED);
      const meta = `${Math.round(p.overlapPct)}% skill overlap   ·   +${Math.round(p.wageUpliftPct)}% wage   ·   ${p.missingSkills} skills to learn${p.trainingCost ? `   ·   ${p.trainingCost} cost` : ""}`;
      doc.setFontSize(8);
      doc.text(meta, M, y + 11);
      doc.setFontSize(9);
      y += 26;
    });
  }

  // ── Local labour market notes ──
  if (data.labourMarket) {
    doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
    doc.line(M, y, W - M, y);
    y += 14;
    setText(INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Local labour market — ${data.countryName}`, M, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lm = data.labourMarket;
    const stats: string[] = [];
    if (lm.totalJobs != null) stats.push(`${lm.totalJobs.toLocaleString()} open positions`);
    if (lm.avgSalary != null) stats.push(`Avg wage ${lm.currencySymbol ?? ""}${lm.avgSalary.toLocaleString()}/mo`);
    if (lm.labourForceParticipationPct != null) stats.push(`${lm.labourForceParticipationPct}% labour force participation`);
    if (lm.youthUnemploymentPct != null) stats.push(`${lm.youthUnemploymentPct}% youth unemployment`);
    if (stats.length) {
      setText(INK);
      doc.text(stats.join("   ·   "), M, y);
      y += 12;
    }
    if (lm.topSectors?.length) {
      setText(MUTED);
      const sect = lm.topSectors.slice(0, 3).map(s => `${s.sector} +${s.growthPct}%`).join("   ·   ");
      doc.text(`Growing sectors: ${truncate(sect, 110)}`, M, y);
      y += 12;
    }
  }

  // ── Footer ──
  const footerY = H - 38;
  doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
  doc.line(M, footerY, W - M, footerY);
  setText(MUTED);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(
    "This report supports career growth and skills development. Estimates: ILO, World Bank, ESCO, O*NET — calibrated locally.",
    M, footerY + 12,
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`unmapped.dev  ·  ${dateStr}  ·  ISCO-08 ${data.isco08}`, W - M, footerY + 12, { align: "right" });

  const filename = `${reportFileBase(data)}.pdf`;
  doc.save(filename);
  return filename;
}