/**
 * ExportBar — four-button export row used on /results.
 *  - JSON: download the current onboarding payload as a .json file.
 *  - PDF:  rasterise `printTargetId` via html2canvas + jsPDF, paginated A4.
 *  - Copy: copy current URL to clipboard.
 *  - QR:   popover with a QR code of the current URL (qrcode lib).
 *
 * Hidden in presenter mode (data-presenter-hide="true") and print.
 */

import { useEffect, useRef, useState } from "react";
import { Download, FileText, Link as LinkIcon, QrCode, X, Check } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { getOnboardingData } from "@/lib/profile-store";

export interface ExportBarProps {
  /** DOM id of the element to capture for PDF export. */
  printTargetId: string;
  /** Optional filename stem (no extension). Defaults to "unmapped-report". */
  filenameStem?: string;
}

export function ExportBar({ printTargetId, filenameStem = "unmapped-report" }: ExportBarProps) {
  const [busy, setBusy] = useState<null | "pdf" | "json" | "copy" | "qr">(null);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  /* ── Close QR popover on outside click ── */
  useEffect(() => {
    if (!qrOpen) return;
    const onClick = (e: MouseEvent) => {
      if (qrRef.current && !qrRef.current.contains(e.target as Node)) {
        setQrOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [qrOpen]);

  /* ── JSON export ── */
  const handleJSON = () => {
    setBusy("json");
    try {
      const payload = getOnboardingData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filenameStem}-${dateStamp()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("JSON downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Could not export JSON");
    } finally {
      setBusy(null);
    }
  };

  /* ── PDF export (html2canvas + jsPDF, paginated A4) ── */
  const handlePDF = async () => {
    const node = document.getElementById(printTargetId);
    if (!node) {
      toast.error("Nothing to export yet");
      return;
    }
    setBusy("pdf");
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");

      // A4 portrait in mm
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * imgW) / canvas.width;

      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
      heightLeft -= pageH;

      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgW, imgH);
        heightLeft -= pageH;
      }

      pdf.save(`${filenameStem}-${dateStamp()}.pdf`);
      toast.success("PDF downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Could not generate PDF");
    } finally {
      setBusy(null);
    }
  };

  /* ── Copy link ── */
  const handleCopy = async () => {
    setBusy("copy");
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error(err);
      toast.error("Could not copy link");
    } finally {
      setBusy(null);
    }
  };

  /* ── QR code ── */
  const handleQR = async () => {
    setBusy("qr");
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      const dataUrl = await QRCode.toDataURL(url, {
        margin: 1,
        scale: 8,
        color: { dark: "#0c1424", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
      setQrOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Could not generate QR code");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      data-presenter-hide="true"
      className="relative flex flex-wrap items-center gap-2 print:hidden"
    >
      <Btn onClick={handleJSON} loading={busy === "json"} icon={<Download className="h-4 w-4" />}>
        JSON
      </Btn>
      <Btn onClick={handlePDF} loading={busy === "pdf"} icon={<FileText className="h-4 w-4" />}>
        PDF
      </Btn>
      <Btn onClick={handleCopy} loading={busy === "copy"} icon={copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}>
        {copied ? "Copied" : "Copy link"}
      </Btn>
      <div ref={qrRef} className="relative">
        <Btn onClick={handleQR} loading={busy === "qr"} icon={<QrCode className="h-4 w-4" />}>
          QR
        </Btn>
        {qrOpen && qrDataUrl && (
          <div
            role="dialog"
            aria-label="QR code for current page"
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-line bg-paper p-3 shadow-xl"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Scan to open
              </div>
              <button
                type="button"
                onClick={() => setQrOpen(false)}
                aria-label="Close QR"
                className="-m-1 rounded p-1 text-muted-foreground hover:bg-sand hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <img
              src={qrDataUrl}
              alt="QR code linking to the current page"
              className="mt-2 h-44 w-44"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Btn({
  onClick,
  loading,
  icon,
  children,
}: {
  onClick: () => void;
  loading: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-cobalt hover:bg-cobalt hover:text-paper disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
    >
      {icon}
      {children}
    </button>
  );
}

function dateStamp() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}