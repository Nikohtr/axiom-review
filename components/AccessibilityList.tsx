"use client";

import { useState } from "react";
import Image from "next/image";
import type { AccessibilityFinding } from "./ReportView";

type AccessibilityListProps = {
  findings: AccessibilityFinding[];
};

const impactConfig = {
  critical: { label: "Critical", color: "var(--impact-critical)", bg: "#fef2f2" },
  serious: { label: "Serious", color: "var(--impact-serious)", bg: "#fff7ed" },
  moderate: { label: "Moderate", color: "var(--impact-moderate)", bg: "#fffbeb" },
  minor: { label: "Minor", color: "var(--impact-minor)", bg: "#eff6ff" },
};

export default function AccessibilityList({ findings }: AccessibilityListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-0">
      {findings.map((finding, i) => {
        const config = impactConfig[finding.impact];
        const isExpanded = expanded === finding.id;

        return (
          <div
            key={finding.id}
            className={`severity-stripe severity-stripe-${finding.impact} border-b border-[var(--border-light)] last:border-b-0`}
          >
            <button
              type="button"
              onClick={() => setExpanded(isExpanded ? null : finding.id)}
              className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-[var(--surface-warm)]/50"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold tabular-nums" style={{ background: config.bg, color: config.color }}>
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-[var(--foreground)] leading-snug">
                {finding.issue}
              </span>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: config.bg, color: config.color }}
              >
                {config.label}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`shrink-0 text-[var(--text-muted)] transition-transform ${isExpanded ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {isExpanded && (
              <div className="animate-fade-in px-5 pb-4 pl-13">
                <div className="ml-8 flex flex-col gap-2.5">
                  {finding.screenshot && (
                    <div className="overflow-hidden rounded-lg border border-[var(--border)]">
                      <Image
                        src={finding.screenshot}
                        alt={`Accessibility finding screenshot`}
                        width={480}
                        height={160}
                        className="h-auto w-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Why it matters</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-[var(--text-secondary)]">{finding.whyItMatters}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Suggested fix</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-[var(--foreground)]">{finding.suggestedFix}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
