"use client";

import { useState } from "react";
import type { Report } from "./ReportView";

type ExportButtonProps = {
  report: Report;
};

export default function ExportButton({ report }: ExportButtonProps) {
  const [generating, setGenerating] = useState(false);

  const handleExport = async () => {
    setGenerating(true);
    try {
      const { default: generatePdf } = await import("../lib/generatePdf");
      generatePdf(report);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={generating}
      className="print:hidden inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-warm)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-muted)] transition hover:text-[var(--accent)] active:scale-[0.97] disabled:opacity-50"
      aria-label="Export report as PDF"
    >
      {generating ? (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" className="animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          Generating...
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export PDF
        </>
      )}
    </button>
  );
}