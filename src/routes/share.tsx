import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { COUNTRIES } from "@/data/countries";
import { SKILLS } from "@/data/skills";
import { useProfile } from "@/lib/profile-store";
import { profileExposure, suggestAdjacencies, matchOpportunities } from "@/lib/engine";
import { Download, Link2, FileJson, Check, Sparkles, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/share")({
  component: Share,
  head: () => ({ meta: [
    { title: "Export & share — UNMAPPED" },
    { name: "description", content: "Turn your readiness insights into a one-page PDF, a shareable link, or a structured data export." },
  ]}),
});

type ActionId = "pdf" | "link" | "json";

function Share() {
  const [profile] = useProfile();
  const country = COUNTRIES[profile.countryKey];
  const { overall, items } = useMemo(() => profileExposure(profile), [profile]);
  const adj = useMemo(() => suggestAdjacencies(profile), [profile]);
  const matches = useMemo(() => matchOpportunities(profile), [profile]);
  const [done, setDone] = useState<Record<ActionId, boolean>>({ pdf: false, link: false, json: false });
  const [busy, setBusy] = useState<ActionId | null>(null);
  const firstName = profile.name?.split(" ")[0] || "you";

  const downloadPDF = async () => {
    setBusy("pdf");
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const margin = 48;
      let y = margin;

      // Header band
      doc.setFillColor(20, 22, 28);
      doc.rect(0, 0, W, 92, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("UNMAPPED · Skills & Readiness Report", margin, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text(`Prepared for ${profile.name} · ${profile.city}, ${country.country}`, margin, 64);
      doc.setFontSize(9);
      doc.setTextColor(180, 200, 230);
      doc.text(`Generated ${new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`, margin, 80);

      y = 122;
      doc.setTextColor(20, 22, 28);

      // Readiness summary
      const lightLabel = overall < 0.35 ? "On solid ground" : overall < 0.6 ? "Shifting ground — manageable" : "Worth a serious plan";
      const lightMsg =
        overall < 0.35
          ? "Most of this work depends on judgement, hands-on skill, and trust with people — areas AI struggles with."
          : overall < 0.6
          ? "Some routine tasks will shift, but the core of the work stays human. A few targeted skills make this resilient."
          : "A meaningful share of current tasks can be automated within the decade. The adjacent skills below are reachable in 6 months.";
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("AI Readiness — 10-year outlook", margin, y); y += 18;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(lightLabel, margin, y); y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const wrap = doc.splitTextToSize(lightMsg, W - margin * 2);
      doc.text(wrap, margin, y); y += wrap.length * 13 + 8;
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      doc.text(`Composite exposure: ${Math.round(overall * 100)}%   ·   Calibrated for ${country.country} (×${country.automationCalibration})`, margin, y);
      y += 22;

      // Top skills
      doc.setTextColor(20, 22, 28);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Your top skills", margin, y); y += 16;
      const topSkills = [...items].sort((a, b) => a.exposure - b.exposure).slice(0, 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      topSkills.forEach(s => {
        const exp = `${Math.round((1 - s.exposure) * 100)}% durable`;
        doc.text(`•  ${s.label}`, margin, y);
        doc.setTextColor(90, 90, 90);
        doc.text(exp, W - margin, y, { align: "right" });
        doc.setTextColor(20, 22, 28);
        y += 14;
      });
      y += 10;

      // Opportunity pathways
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Opportunity pathways", margin, y); y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      matches.slice(0, 3).forEach(m => {
        doc.setFont("helvetica", "bold");
        doc.text(m.occupation.title, margin, y);
        const wage = `${country.currency} ${m.estMonthlyWage.toLocaleString()} / month`;
        doc.setFont("helvetica", "normal");
        doc.text(wage, W - margin, y, { align: "right" });
        y += 13;
        doc.setTextColor(90, 90, 90);
        doc.setFontSize(9);
        doc.text(`Pathway: ${m.occupation.pathways.join(" · ")}   ·   Skill fit: ${Math.round(m.fit * 100)}%`, margin, y);
        doc.setFontSize(10);
        doc.setTextColor(20, 22, 28);
        y += 16;
      });
      y += 6;

      // Next steps
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Suggested next steps", margin, y); y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      adj.slice(0, 4).forEach(a => {
        doc.text(`•  Build ${a.skill.label}`, margin, y);
        doc.setTextColor(90, 90, 90);
        doc.setFontSize(9);
        const r = doc.splitTextToSize(a.reason, W - margin * 2 - 16);
        y += 12;
        doc.text(r, margin + 16, y);
        y += r.length * 11 + 4;
        doc.setFontSize(10);
        doc.setTextColor(20, 22, 28);
      });

      // Footer
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, H - 70, W - margin, H - 70);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      const footerNote = "This report was generated to support career growth and skills development. Estimates are based on public data from ILO, World Bank, ESCO and O*NET, calibrated for local context.";
      const fw = doc.splitTextToSize(footerNote, W - margin * 2);
      doc.text(fw, margin, H - 54);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text("unmapped.dev  ·  Open infrastructure for invisible workers", margin, H - 24);

      doc.save(`unmapped-${(profile.name || "report").toLowerCase().replace(/\s+/g, "-")}.pdf`);
      setDone(d => ({ ...d, pdf: true }));
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async () => {
    setBusy("link");
    try {
      // Encode minimal profile state into URL
      const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
        n: profile.name, c: profile.city, k: profile.countryKey, s: profile.skills,
        e: profile.educationId, y: profile.yearsExperience,
      }))));
      const url = `${typeof window !== "undefined" ? window.location.origin : ""}/results?p=${payload}`;
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // Fallback
        const ta = document.createElement("textarea");
        ta.value = url; document.body.appendChild(ta); ta.select();
        document.execCommand("copy"); document.body.removeChild(ta);
      }
      setDone(d => ({ ...d, link: true }));
    } finally {
      setBusy(null);
    }
  };

  const downloadJSON = () => {
    setBusy("json");
    try {
      const payload = {
        $schema: "https://unmapped.dev/schema/skills-passport-v1.json",
        generated_at: new Date().toISOString(),
        person: { name: profile.name, city: profile.city, age: profile.age, education_id: profile.educationId, years_experience: profile.yearsExperience },
        country: { key: profile.countryKey, name: country.country, calibration_factor: country.automationCalibration },
        skills: profile.skills.map(id => ({
          id,
          label: SKILLS[id].label,
          esco_concept: SKILLS[id].esco,
          category: SKILLS[id].category,
          automation_exposure: items.find(i => i.id === id)?.exposure ?? null,
        })),
        readiness: { composite_exposure: overall, methodology: "Frey-Osborne baseline + ILO task indices, LMIC-calibrated" },
        opportunities: matches.slice(0, 5).map(m => ({
          title: m.occupation.title,
          isco_08: m.occupation.isco,
          pathways: m.occupation.pathways,
          skill_fit: m.fit,
          ai_resilience: m.resilience,
          estimated_monthly_wage: { amount: m.estMonthlyWage, currency: country.currency },
        })),
        suggested_skills: adj.map(a => ({ id: a.skill.id, label: a.skill.label, reason: a.reason })),
        sources: country.sourceNotes,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `unmapped-${(profile.name || "data").toLowerCase().replace(/\s+/g, "-")}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(d => ({ ...d, json: true }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <PageShell
      eyebrow="Module 04 · Export & share"
      title={<>You're ready to <span className="text-cobalt">take this forward.</span></>}
      lede={`Three ways to put what you've discovered to work — for an employer, a training provider, a mentor, or just for yourself, ${firstName}.`}
    >
      {/* Affirming snapshot */}
      <section className="rounded-sm border-2 border-ink bg-cobalt/5 p-6 sm:p-8 mb-10">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cobalt text-paper">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">What you'll be sharing</div>
            <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold leading-snug">
              {profile.skills.length} verified skills · {matches.length} matched opportunities · 1 clear plan
            </h2>
            <p className="mt-2 text-sm text-foreground/80">
              Built from public, citable data — calibrated for {country.country}, in {country.currency}.
            </p>
          </div>
        </div>
      </section>

      {/* Three actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* PDF */}
        <ActionCard
          icon={<Download className="h-5 w-5" />}
          eyebrow="One-page PDF"
          title="Download a clean report"
          description="A single page designed to print or email — readiness summary, top skills, opportunity pathways, and next steps."
          help="Suitable for employers, training providers, or your own records."
          buttonLabel={done.pdf ? "Downloaded" : busy === "pdf" ? "Preparing…" : "Download PDF"}
          onClick={downloadPDF}
          busy={busy === "pdf"}
          done={done.pdf}
          accent="moss"
        >
          <div className="rounded-sm border border-ink bg-paper p-4 text-xs text-foreground/70">
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Preview</div>
            <div className="mt-1 font-display text-sm font-bold text-ink">UNMAPPED · Skills & Readiness Report</div>
            <div className="mt-0.5 text-[11px]">For {profile.name} · {profile.city}, {country.country}</div>
            <div className="mt-2 italic text-[11px] text-muted-foreground">"This report was generated to support career growth and skills development."</div>
          </div>
        </ActionCard>

        {/* Link */}
        <ActionCard
          icon={<Link2 className="h-5 w-5" />}
          eyebrow="Shareable link"
          title="Copy a link to share"
          description="A short link you can send by WhatsApp, SMS, or email. Send this to a training provider or mentor in one tap."
          help="The recipient sees your skills, opportunities, and suggested next steps — nothing private."
          buttonLabel={done.link ? "Link copied" : busy === "link" ? "Copying…" : "Copy link"}
          onClick={copyLink}
          busy={busy === "link"}
          done={done.link}
          accent="cobalt"
        >
          <div className="rounded-sm border border-ink bg-paper p-4">
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Recipient sees</div>
            <ul className="mt-2 space-y-1.5 text-xs text-foreground/80">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cobalt" /> Your skills, in plain language</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cobalt" /> 5 opportunity pathways with wages</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cobalt" /> Suggested next skills to build</li>
            </ul>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <MessageCircle className="h-3 w-3" /> Ideal for WhatsApp, SMS, or email
            </div>
          </div>
        </ActionCard>

        {/* JSON */}
        <ActionCard
          icon={<FileJson className="h-5 w-5" />}
          eyebrow="Structured data"
          title="Download your data (JSON)"
          description="A machine-readable file containing everything in your profile — for apps, training platforms, or career services."
          help="JSON is a standard format that other software can read directly — your data, fully portable."
          buttonLabel={done.json ? "Downloaded" : busy === "json" ? "Preparing…" : "Download JSON"}
          onClick={downloadJSON}
          busy={busy === "json"}
          done={done.json}
          accent="ink"
        >
          <div className="rounded-sm border border-ink bg-ink p-4 font-mono text-[10px] text-paper/85 leading-relaxed">
            <div className="text-cobalt-soft">{`{`}</div>
            <div className="pl-3">"person": {`{ "name": "${profile.name}" }`},</div>
            <div className="pl-3">"skills": [...{profile.skills.length} items],</div>
            <div className="pl-3">"opportunities": [...{Math.min(5, matches.length)} items]</div>
            <div className="text-cobalt-soft">{`}`}</div>
          </div>
        </ActionCard>
      </div>

      {/* Encouragement */}
      <section className="mt-12 rounded-sm border-2 border-ink bg-paper p-6 sm:p-8 text-center shadow-[6px_6px_0_0_var(--ink)]">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">A note before you go</div>
        <p className="mt-3 font-display text-2xl sm:text-3xl font-bold leading-snug max-w-2xl mx-auto">
          Small steps today can open <span className="text-cobalt">bigger doors tomorrow.</span>
        </p>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
          Your skills are real. Your story is yours. Take it as far as you want to go.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/dashboard" className="border-2 border-ink bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-paper hover:bg-cobalt hover:border-cobalt">
            ← Back to opportunities
          </Link>
          <Link to="/passport" className="border-2 border-ink px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-ink hover:bg-cobalt hover:text-paper hover:border-cobalt">
            Update my passport
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

function ActionCard({
  icon, eyebrow, title, description, help, buttonLabel, onClick, busy, done, accent, children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  help: string;
  buttonLabel: string;
  onClick: () => void;
  busy: boolean;
  done: boolean;
  accent: "moss" | "cobalt" | "ink";
  children: React.ReactNode;
}) {
  const accentColor =
    accent === "moss" ? "var(--moss)" : accent === "cobalt" ? "var(--cobalt)" : "var(--ink)";
  return (
    <article
      className="flex flex-col rounded-sm border-2 border-ink bg-paper p-5 sm:p-6 shadow-[4px_4px_0_0_var(--ink)] transition-shadow hover:shadow-[6px_6px_0_0_var(--ink)]"
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: `color-mix(in oklab, ${accentColor} 15%, transparent)`, color: accentColor }}
        >
          {icon}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</div>
      </div>
      <h3 className="mt-4 font-display text-xl font-bold leading-tight">{title}</h3>
      <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{description}</p>

      <div className="mt-4">{children}</div>

      <p className="mt-4 text-xs text-muted-foreground italic">{help}</p>

      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        className="mt-5 inline-flex items-center justify-center gap-2 border-2 border-ink px-5 py-3 font-mono text-xs uppercase tracking-wider transition-all disabled:opacity-60"
        style={{
          background: done ? accentColor : "var(--paper)",
          color: done ? "var(--paper)" : "var(--ink)",
        }}
      >
        {done ? <Check className="h-4 w-4" /> : null}
        {buttonLabel}
      </button>
    </article>
  );
}