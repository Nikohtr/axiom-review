import type { AccessibilityFinding } from "./ReportView";

type AccessibilityListProps = {
  findings: AccessibilityFinding[];
};

export default function AccessibilityList({ findings }: AccessibilityListProps) {
  return (
    <div className="mt-3 flex flex-col gap-3">
      {findings.map((finding) => (
        <div
          key={finding.id}
          className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3"
        >
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white">
            {finding.impact}
          </span>
          <p className="text-sm text-zinc-600">{finding.description}</p>
        </div>
      ))}
    </div>
  );
}
