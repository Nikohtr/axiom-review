"use client";

import { useState } from "react";
import Image from "next/image";
import type { ReportIssue } from "./ReportView";

type IssueCardProps = {
  issue: ReportIssue;
  index: number;
};

const severityConfig = {
  high: { label: "High", color: "var(--severity-high)", bg: "#fef2f2" },
  medium: { label: "Medium", color: "var(--severity-medium)", bg: "#fffbeb" },
  low: { label: "Low", color: "var(--severity-low)", bg: "#eff6ff" },
};

export default function IssueCard({ issue, index }: IssueCardProps) {
  const [showToast, setShowToast] = useState(false);
  const config = severityConfig[issue.severity];

  const copyFix = () => {
    navigator.clipboard.writeText(issue.suggestedFix);
    setShowToast(false);
    requestAnimationFrame(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1400);
    });
  };

  return (
    <article
      data-print="card"
      className={`severity-stripe severity-stripe-${issue.severity} card-lift border-b border-[var(--border-light)] px-5 py-4 last:border-b-0`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold tabular-nums" style={{ background: config.bg, color: config.color }}>
            {index}
          </span>
          <h3 className="text-sm font-semibold text-[var(--foreground)] leading-snug">{issue.issue}</h3>
        </div>
        <span
          className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: config.bg, color: config.color }}
        >
          {config.label}
        </span>
      </div>

      {issue.screenshot && (
        <div className="mt-3 ml-8 overflow-hidden rounded-lg border border-[var(--border)]">
          <Image
            src={issue.screenshot}
            alt={`Screenshot: ${issue.issue}`}
            width={480}
            height={200}
            className="h-auto w-full object-cover"
          />
        </div>
      )}

      <div className="mt-3 ml-8 flex flex-col gap-2.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Why it matters</p>
          <p className="mt-0.5 text-sm leading-relaxed text-[var(--text-secondary)]">{issue.whyItMatters}</p>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Suggested fix</p>
            <div className="relative">
              <button
                type="button"
                onClick={copyFix}
                className="print:hidden flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] transition hover:bg-[var(--surface-warm)] hover:text-[var(--accent)]"
                title="Copy fix to clipboard"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                Copy
              </button>
              {showToast && (
                <span className="animate-toast-pop pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--foreground)] px-2.5 py-1 text-[10px] font-medium text-white shadow-lg">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1 inline-block">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied!
                </span>
              )}
            </div>
          </div>
          <p className="mt-0.5 text-sm leading-relaxed text-[var(--foreground)]">{issue.suggestedFix}</p>
        </div>
      </div>
    </article>
  );
}
