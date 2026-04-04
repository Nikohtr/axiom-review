import Image from "next/image";
import type { ReportIssue } from "./ReportView";

type IssueCardProps = {
  issue: ReportIssue;
};

export default function IssueCard({ issue }: IssueCardProps) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-zinc-900">{issue.issue}</h3>
        <span className="shrink-0 rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
          {issue.severity}
        </span>
      </div>
      {issue.screenshot && (
        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
          <Image
            src={issue.screenshot}
            alt={`Screenshot highlighting: ${issue.issue}`}
            width={480}
            height={200}
            className="h-auto w-full object-cover"
          />
        </div>
      )}
      <div className="mt-3 flex flex-col gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Why it matters</p>
          <p className="mt-1 text-sm text-zinc-600">{issue.whyItMatters}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Suggested fix</p>
          <p className="mt-1 text-sm text-zinc-700">{issue.suggestedFix}</p>
        </div>
      </div>
    </article>
  );
}
