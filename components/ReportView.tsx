"use client";

import { useState } from "react";
import Image from "next/image";
import AccessibilityList from "./AccessibilityList";
import ExportButton from "./ExportButton";
import FixPlayground from "./FixPlayground";
import IssueCard from "./IssueCard";
export type {
  GeneratedFixes,
  ImprovementBlock,
  PrioritizedChange,
} from "../types/fixPlayground";

export type ReportIssue = {
  issue: string;
  severity: "low" | "medium" | "high";
  whyItMatters: string;
  suggestedFix: string;
  screenshot?: string;
};

export type AccessibilityFinding = {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  issue: string;
  whyItMatters: string;
  suggestedFix: string;
  screenshot?: string;
};

export type Scores = {
  accessibility: number;
  clarity: number;
  usability: number;
  overall: number;
};

export type MobileAnalysis = {
  screenshot: string;
  issues: ReportIssue[];
};

export type Report = {
  url: string;
  screenshot: string;
  pageTitle: string;
  uxSummary: string;
  scores: Scores;
  topIssues: ReportIssue[];
  accessibilityFindings: AccessibilityFinding[];
  mobileAnalysis?: MobileAnalysis | null;
};

type ReportViewProps = {
  report: Report;
  showSuccessGlow?: boolean;
  onAnalyzeAnother?: () => void;
};

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "var(--severity-low)" : score >= 60 ? "var(--severity-medium)" : "var(--severity-high)";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--border-light)" strokeWidth="4" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-semibold leading-none" style={{ color }}>
          {score}
        </span>
        <span className="text-[9px] text-[var(--text-muted)]">/ 100</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color =
    score >= 80 ? "var(--severity-low)" : score >= 60 ? "var(--severity-medium)" : "var(--severity-high)";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="font-semibold tabular-nums" style={{ color }}>
          {score}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-light)]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color, animation: "progress-fill 0.8s cubic-bezier(0.16,1,0.3,1) both" }}
        />
      </div>
    </div>
  );
}

function SeverityStats({ issues }: { issues: ReportIssue[] }) {
  const counts = { high: 0, medium: 0, low: 0 };
  issues.forEach((i) => counts[i.severity]++);

  const items = [
    { label: "High", count: counts.high, color: "var(--severity-high)", bg: "#fef2f2" },
    { label: "Medium", count: counts.medium, color: "var(--severity-medium)", bg: "#fffbeb" },
    { label: "Low", count: counts.low, color: "var(--severity-low)", bg: "#eff6ff" },
  ].filter((item) => item.count > 0);

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {items.map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: item.bg, color: item.color }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />
          {item.count} {item.label}
        </span>
      ))}
    </div>
  );
}

function AccessibilityStats({ findings }: { findings: AccessibilityFinding[] }) {
  const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  findings.forEach((f) => counts[f.impact]++);

  const items = [
    { label: "Critical", count: counts.critical, color: "var(--impact-critical)", bg: "#fef2f2" },
    { label: "Serious", count: counts.serious, color: "var(--impact-serious)", bg: "#fff7ed" },
    { label: "Moderate", count: counts.moderate, color: "var(--impact-moderate)", bg: "#fffbeb" },
    { label: "Minor", count: counts.minor, color: "var(--impact-minor)", bg: "#eff6ff" },
  ].filter((item) => item.count > 0);

  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {items.map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ background: item.bg, color: item.color }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: item.color }} />
          {item.count} {item.label}
        </span>
      ))}
    </div>
  );
}

type SectionId = "issues" | "accessibility" | "mobile";

export default function ReportView({ report, showSuccessGlow, onAnalyzeAnother }: ReportViewProps) {
  const [activeSection, setActiveSection] = useState<SectionId>("issues");
  const [tabKey, setTabKey] = useState(0);

  const handleTabChange = (id: SectionId) => {
    setActiveSection(id);
    setTabKey((k) => k + 1);
  };

  const sections: { id: SectionId; label: string; count: number }[] = [
    { id: "issues", label: "Top Issues", count: report.topIssues.length },
    { id: "accessibility", label: "Accessibility", count: report.accessibilityFindings.length },
    ...(report.mobileAnalysis ? [{ id: "mobile" as SectionId, label: "Mobile", count: report.mobileAnalysis.issues.length }] : []),
  ];

  return (
    <section data-print="report" className="stagger-children flex flex-col gap-0">
      {/* Header bar */}
      <div className={`flex items-center justify-between rounded-t-xl border border-[var(--border)] bg-white px-6 py-4 transition-all duration-1000 ${showSuccessGlow ? "animate-success-glow" : ""}`}>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              {report.pageTitle}
            </h2>
            <ExportButton report={report} />
          </div>
          <a
            href={report.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--text-muted)] underline decoration-[var(--border)] underline-offset-2 hover:text-[var(--accent)]"
          >
            {report.url}
          </a>
        </div>
        <ScoreRing score={report.scores.overall} />
      </div>

      {/* Executive summary + sub-scores */}
      <div className="border-x border-[var(--border)] bg-[var(--surface-warm)] px-6 py-5">
        <div className="grid gap-6 md:grid-cols-[1fr_240px]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Executive Summary
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]" style={{ fontFamily: "var(--font-display)" }}>
              {report.uxSummary}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <ScoreBar label="Accessibility" score={report.scores.accessibility} />
            <ScoreBar label="Clarity" score={report.scores.clarity} />
            <ScoreBar label="Usability" score={report.scores.usability} />
          </div>
        </div>
      </div>

      {/* Split view: screenshot + findings */}
      <div className="grid border border-t-0 border-[var(--border)] bg-white md:grid-cols-[minmax(300px,2fr)_3fr]">
        {/* Left: Screenshot */}
        <div className="border-b border-[var(--border)] md:border-b-0 md:border-r">
          <div data-print="screenshot" className="sticky top-16 overflow-auto p-4" style={{ maxHeight: "calc(100vh - 80px)" }}>
            <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-warm)]">
              <Image
                src={report.screenshot}
                alt={`Screenshot of ${report.pageTitle}`}
                width={640}
                height={420}
                className="h-auto w-full"
              />
            </div>
            {report.mobileAnalysis && (
              <div className="mt-4 flex items-start gap-3">
                <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-warm)]" style={{ width: 140 }}>
                  <Image
                    src={report.mobileAnalysis.screenshot}
                    alt="Mobile screenshot"
                    width={390}
                    height={844}
                    className="h-auto w-full"
                  />
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-[var(--surface-warm)] px-2 py-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                  <span className="text-[10px] font-medium text-[var(--text-muted)]">Mobile view</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Findings */}
        <div className="split-scroll flex flex-col">
          {/* Section tabs + severity stats */}
          <div className="print:hidden sticky top-16 z-10 border-b border-[var(--border)] bg-white">
            <div className="flex items-center">
              <div className="flex">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleTabChange(s.id)}
                    className={`flex items-center gap-1.5 px-5 py-3 text-xs font-medium transition ${
                      activeSection === s.id
                        ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    {s.label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                      activeSection === s.id
                        ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "bg-[var(--surface-warm)] text-[var(--text-muted)]"
                    }`}>
                      {s.count}
                    </span>
                  </button>
                ))}
              </div>
              <div className="ml-auto pr-4">
                {activeSection === "issues" && <SeverityStats issues={report.topIssues} />}
                {activeSection === "accessibility" && <AccessibilityStats findings={report.accessibilityFindings} />}
                {activeSection === "mobile" && report.mobileAnalysis && <SeverityStats issues={report.mobileAnalysis.issues} />}
              </div>
            </div>
          </div>

          {/* Tab content with crossfade */}
          <div key={tabKey} className="animate-tab-fade flex flex-col gap-0 p-1">
            {activeSection === "issues" &&
              report.topIssues.map((issue, i) => (
                <IssueCard key={issue.issue} issue={issue} index={i + 1} />
              ))}

            {activeSection === "accessibility" && (
              <AccessibilityList findings={report.accessibilityFindings} />
            )}

            {activeSection === "mobile" && report.mobileAnalysis && (
              <div className="flex flex-col gap-0">
                {report.mobileAnalysis.issues.map((issue, i) => (
                  <IssueCard key={issue.issue} issue={issue} index={i + 1} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <FixPlayground report={report} />

      {/* Analyze another CTA */}
      {onAnalyzeAnother && (
        <div className="flex items-center justify-center rounded-b-xl border border-t-0 border-[var(--border)] bg-[var(--surface-warm)] px-6 py-5">
          <button
            type="button"
            onClick={onAnalyzeAnother}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--text-secondary)] shadow-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)] hover:shadow-md active:scale-[0.98]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Analyze another site
          </button>
        </div>
      )}
    </section>
  );
}
