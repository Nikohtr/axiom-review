import type { ReportIssue } from "./ReportView";

type IssueCardProps = {
  issue: ReportIssue;
};

export default function IssueCard({ issue }: IssueCardProps) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white px-5 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-zinc-900">{issue.title}</h3>
        <span className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
          {issue.severity}
        </span>
      </div>
      <p className="mt-3 text-sm text-zinc-600">{issue.evidence}</p>
      <p className="mt-3 text-sm font-medium text-zinc-800">Fix: {issue.fix}</p>
    </article>
  );
}
