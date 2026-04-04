import Image from "next/image";
import type { AccessibilityFinding } from "./ReportView";

type AccessibilityListProps = {
  findings: AccessibilityFinding[];
};

export default function AccessibilityList({ findings }: AccessibilityListProps) {
  return (
    <div className="mt-3 grid gap-3 md:grid-cols-2">
      {findings.map((finding) => (
        <div
          key={finding.id}
          className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
        >
          <span className="w-fit rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
            {finding.impact}
          </span>
          {finding.screenshot && (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
              <Image
                src={finding.screenshot}
                alt={`Screenshot for accessibility finding`}
                width={480}
                height={160}
                className="h-auto w-full object-cover"
              />
            </div>
          )}
          <p className="text-sm font-semibold text-zinc-800">{finding.issue}</p>
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Why it matters</p>
              <p className="mt-1 text-sm text-zinc-600">{finding.whyItMatters}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Suggested fix</p>
              <p className="mt-1 text-sm text-zinc-700">{finding.suggestedFix}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
