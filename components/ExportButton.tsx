"use client";

export default function ExportButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-warm)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-muted)] transition hover:text-[var(--accent)] active:scale-[0.97]"
      aria-label="Export report as PDF"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Export
    </button>
  );
}
