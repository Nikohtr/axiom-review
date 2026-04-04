import Image from "next/image";
import AccessibilityList from "./AccessibilityList";
import IssueCard from "./IssueCard";

export type ReportIssue = {
  title: string;
  severity: "low" | "medium" | "high";
  evidence: string;
  fix: string;
};

export type AccessibilityFinding = {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  description: string;
};

export type Report = {
  url: string;
  screenshot: string;
  pageTitle: string;
  uxSummary: string;
  topIssues: ReportIssue[];
  accessibilityFindings: AccessibilityFinding[];
};

type ReportViewProps = {
  report: Report;
};

export default function ReportView({ report }: ReportViewProps) {
  return (
    <section className="flex flex-col gap-6 rounded-[22px] border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-400">Mock Report</span>
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <span className="font-semibold text-zinc-900">{report.pageTitle}</span>
          <span className="text-zinc-300">•</span>
          <span>{report.url}</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
          <Image
            src={report.screenshot}
            alt={`Screenshot of ${report.pageTitle}`}
            width={640}
            height={420}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-400">UX Summary</p>
            <p className="mt-2 text-base text-zinc-700">{report.uxSummary}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-400">
              Accessibility Findings
            </p>
            <AccessibilityList findings={report.accessibilityFindings} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-400">Top Issues</p>
        <div className="grid gap-4 md:grid-cols-2">
          {report.topIssues.map((issue) => (
            <IssueCard key={issue.title} issue={issue} />
          ))}
        </div>
      </div>
    </section>
  );
}
