import Image from "next/image";
import AccessibilityList from "./AccessibilityList";
import IssueCard from "./IssueCard";

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

export type Report = {
  url: string;
  screenshot: string;
  pageTitle: string;
  uxSummary: string;
  scores: Scores;
  topIssues: ReportIssue[];
  accessibilityFindings: AccessibilityFinding[];
};

type ReportViewProps = {
  report: Report;
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="h-1.5 w-full rounded-full bg-zinc-100">
      <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
    </div>
  );
}

function ScorePanel({ scores }: { scores: Scores }) {
  const items: { label: string; key: keyof Scores }[] = [
    { label: "Accessibility", key: "accessibility" },
    { label: "Clarity", key: "clarity" },
    { label: "Usability", key: "usability" },
  ];
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-400">Overall Score</p>
        <span className={`text-3xl font-bold tabular-nums ${scoreColor(scores.overall)}`}>
          {scores.overall}
          <span className="text-sm font-medium text-zinc-400">/100</span>
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {items.map(({ label, key }) => (
          <div key={key} className="flex flex-col gap-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">{label}</span>
              <span className={`font-semibold tabular-nums ${scoreColor(scores[key])}`}>{scores[key]}</span>
            </div>
            <ScoreBar score={scores[key]} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportView({ report }: ReportViewProps) {
  return (
    <section className="flex flex-col gap-6 rounded-[22px] border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-400">Report</span>
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <span className="font-semibold text-zinc-900">{report.pageTitle}</span>
          <span className="text-zinc-300">•</span>
          <span>{report.url}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="h-[320px] overflow-auto rounded-2xl border border-zinc-200 bg-zinc-100">
          <Image
            src={report.screenshot}
            alt={`Screenshot of ${report.pageTitle}`}
            width={640}
            height={420}
            className="h-auto w-auto max-w-none"
          />
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-400">UX Summary</p>
            <p className="mt-2 text-base text-zinc-700">{report.uxSummary}</p>
          </div>
          {report.scores && <ScorePanel scores={report.scores} />}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-400">Accessibility Findings</p>
        <AccessibilityList findings={report.accessibilityFindings} />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-400">Top Issues</p>
        <div className="grid gap-4 md:grid-cols-2">
          {report.topIssues.map((issue) => (
            <IssueCard key={issue.issue} issue={issue} />
          ))}
        </div>
      </div>
    </section>
  );
}
