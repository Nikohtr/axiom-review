"use client";

import { useMemo, useState } from "react";
import type { Report } from "./ReportView";
import type {
  GenerateFixesRequest,
  GeneratedFixes,
  ImprovementBlock,
} from "../types/fixPlayground";

type FixPlaygroundProps = {
  report: Report;
};

type GenerateState = "idle" | "loading" | "success" | "error";

function isImprovementBlock(value: unknown): value is ImprovementBlock {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.before === "string" &&
    typeof candidate.after === "string" &&
    typeof candidate.rationale === "string"
  );
}

function isGeneratedFixes(value: unknown): value is GeneratedFixes {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  if (!isImprovementBlock(candidate.improvedHero)) return false;
  if (!isImprovementBlock(candidate.improvedCTA)) return false;
  if (!isImprovementBlock(candidate.improvedFormUX)) return false;

  if (!Array.isArray(candidate.prioritizedChanges)) return false;
  if (!Array.isArray(candidate.quickWins)) return false;

  const validPrioritized = candidate.prioritizedChanges.every((item) => {
    if (!item || typeof item !== "object") return false;
    const row = item as Record<string, unknown>;
    return (
      typeof row.title === "string" &&
      typeof row.impact === "string" &&
      typeof row.effort === "string" &&
      typeof row.expectedLift === "string"
    );
  });

  const validQuickWins = candidate.quickWins.every((item) => typeof item === "string");

  return validPrioritized && validQuickWins;
}

function buildMarkdown(report: Report, fixes: GeneratedFixes): string {
  const sections = [
    ["Hero", fixes.improvedHero],
    ["Primary CTA", fixes.improvedCTA],
    ["Form UX", fixes.improvedFormUX],
  ] as const;

  const sectionLines = sections.flatMap(([title, content]) => [
    `## ${title}`,
    "",
    "### Before",
    content.before,
    "",
    "### After",
    content.after,
    "",
    "### Why this improves results",
    content.rationale,
    "",
  ]);

  const prioritizedLines = fixes.prioritizedChanges.flatMap((change, index) => [
    `${index + 1}. **${change.title}**`,
    `   - Impact: ${change.impact}`,
    `   - Effort: ${change.effort}`,
    `   - Expected lift: ${change.expectedLift}`,
  ]);

  const quickWinsLines = fixes.quickWins.map((win) => `- ${win}`);

  return [
    `# Interactive Fix Playground - ${report.pageTitle}`,
    "",
    `URL: ${report.url}`,
    "",
    ...sectionLines,
    "## Prioritized Changes",
    "",
    ...prioritizedLines,
    "",
    "## Quick Wins",
    "",
    ...quickWinsLines,
    "",
  ].join("\n");
}

function ComparisonCard({
  title,
  data,
}: {
  title: string;
  data: ImprovementBlock;
}) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-white p-4">
      <h4 className="text-sm font-semibold text-[var(--foreground)]">{title}</h4>
      <div className="mt-3 grid gap-3">
        <div className="rounded-lg border border-[var(--border-light)] bg-[#f8f7f4] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Before
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{data.before}</p>
        </div>
        <div className="rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/7 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            After
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--foreground)]">{data.after}</p>
        </div>
        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--surface-warm)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Why this improves results
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{data.rationale}</p>
        </div>
      </div>
    </article>
  );
}

export default function FixPlayground({ report }: FixPlaygroundProps) {
  const [state, setState] = useState<GenerateState>("idle");
  const [generatedFixes, setGeneratedFixes] = useState<GeneratedFixes | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [exportNotice, setExportNotice] = useState("");

  const requestPayload = useMemo<GenerateFixesRequest>(
    () => ({
      report: {
        url: report.url,
        pageTitle: report.pageTitle,
        uxSummary: report.uxSummary,
        topIssues: report.topIssues.map((item) => ({
          issue: item.issue,
          severity: item.severity,
          whyItMatters: item.whyItMatters,
          suggestedFix: item.suggestedFix,
        })),
        accessibilityFindings: report.accessibilityFindings.map((item) => ({
          id: item.id,
          impact: item.impact,
          issue: item.issue,
          whyItMatters: item.whyItMatters,
          suggestedFix: item.suggestedFix,
        })),
      },
    }),
    [report]
  );

  const handleGenerate = async () => {
    setState("loading");
    setErrorMessage("");
    setExportNotice("");

    try {
      const response = await fetch("/api/generate-fixes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error("Failed to generate fixes");
      }

      const data: unknown = await response.json();
      if (!isGeneratedFixes(data)) {
        throw new Error("Unexpected response shape");
      }

      setGeneratedFixes(data);
      setState("success");
    } catch {
      setState("error");
      setErrorMessage("Could not generate improvements right now. Please retry.");
    }
  };

  const handleExportMarkdown = async () => {
    if (!generatedFixes) return;

    const markdown = buildMarkdown(report, generatedFixes);
    const filenameSafeTitle = report.pageTitle.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 36) || "analysis";
    const fileName = `axiom-fixes-${filenameSafeTitle}.md`;

    let copied = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(markdown);
        copied = true;
      } catch {
        copied = false;
      }
    }

    try {
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);
      setExportNotice(copied ? "Copied and downloaded." : "Downloaded markdown file.");
    } catch {
      setExportNotice(copied ? "Copied to clipboard." : "Export failed. Please try again.");
    }
  };

  return (
    <div className="border-x border-b border-t-0 border-[var(--border)] bg-[var(--surface-warm)] px-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)]" style={{ fontFamily: "var(--font-display)" }}>
            Interactive Fix Playground
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Generate concrete before/after improvements from this report.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={state === "loading"}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {state === "loading" && (
              <svg width="14" height="14" viewBox="0 0 24 24" className="animate-spin" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            )}
            {state === "loading" ? "Generating..." : "Generate Improved Version"}
          </button>

          {state === "success" && generatedFixes && (
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Export as Markdown
            </button>
          )}
        </div>
      </div>

      {state === "error" && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{errorMessage}</p>
        </div>
      )}

      {state === "loading" && (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-[var(--border)] bg-white p-4">
              <div className="shimmer-bar h-4 w-2/3 rounded" />
              <div className="mt-3 space-y-2">
                <div className="shimmer-bar h-16 rounded" />
                <div className="shimmer-bar h-16 rounded" />
                <div className="shimmer-bar h-14 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {state === "success" && generatedFixes && (
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <ComparisonCard title="Hero Section" data={generatedFixes.improvedHero} />
            <ComparisonCard title="Primary CTA" data={generatedFixes.improvedCTA} />
            <ComparisonCard title="Form UX" data={generatedFixes.improvedFormUX} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <section className="rounded-xl border border-[var(--border)] bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Prioritized changes
              </p>
              <ol className="mt-3 space-y-3">
                {generatedFixes.prioritizedChanges.map((change, index) => (
                  <li key={`${change.title}-${index}`} className="rounded-lg border border-[var(--border-light)] bg-[var(--surface-warm)] px-3 py-2.5">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{change.title}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      Impact: <span className="font-medium">{change.impact}</span> | Effort: <span className="font-medium">{change.effort}</span> | Expected lift:{" "}
                      <span className="font-medium">{change.expectedLift}</span>
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-xl border border-[var(--border)] bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Quick wins
              </p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
                {generatedFixes.quickWins.map((win, index) => (
                  <li key={`${win}-${index}`} className="rounded-md border border-[var(--border-light)] bg-[var(--surface-warm)] px-2.5 py-2">
                    {win}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {exportNotice && (
            <p className="text-xs font-medium text-[var(--text-muted)]">{exportNotice}</p>
          )}
        </div>
      )}
    </div>
  );
}
