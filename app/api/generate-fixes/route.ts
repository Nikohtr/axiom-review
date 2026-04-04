import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import type {
  GenerateFixesRequest,
  GeneratedFixes,
  ImprovementBlock,
  FixPlaygroundReportInput,
} from "../../../types/fixPlayground";

const FIX_SYSTEM_PROMPT = `You are a senior UX optimization strategist.
You will receive a UX report with top issues and accessibility findings.

Return ONLY valid JSON with this exact shape:
{
  "improvedHero": { "before": "...", "after": "...", "rationale": "..." },
  "improvedCTA": { "before": "...", "after": "...", "rationale": "..." },
  "improvedFormUX": { "before": "...", "after": "...", "rationale": "..." },
  "prioritizedChanges": [
    { "title": "...", "impact": "high|medium|low", "effort": "high|medium|low", "expectedLift": "..." }
  ],
  "quickWins": ["...", "...", "..."]
}

Rules:
- Keep improvements concrete and product-ready.
- Keep prioritizedChanges to 3-5 items, sorted by highest impact first.
- Keep quickWins to 3-5 items.
- Rationale should connect to conversion, clarity, trust, or accessibility outcomes.
- Do not include markdown, explanations, or code fences.`;

function isImprovementBlock(value: unknown): value is ImprovementBlock {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.before === "string" &&
    typeof candidate.after === "string" &&
    typeof candidate.rationale === "string"
  );
}

function isFixReportInput(value: unknown): value is FixPlaygroundReportInput {
  if (!value || typeof value !== "object") return false;
  const report = value as Record<string, unknown>;
  return (
    typeof report.url === "string" &&
    typeof report.pageTitle === "string" &&
    typeof report.uxSummary === "string" &&
    Array.isArray(report.topIssues) &&
    Array.isArray(report.accessibilityFindings)
  );
}

function isGeneratedFixes(value: unknown): value is GeneratedFixes {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  if (!isImprovementBlock(candidate.improvedHero)) return false;
  if (!isImprovementBlock(candidate.improvedCTA)) return false;
  if (!isImprovementBlock(candidate.improvedFormUX)) return false;
  if (!Array.isArray(candidate.prioritizedChanges) || !Array.isArray(candidate.quickWins)) return false;

  const validPriority = candidate.prioritizedChanges.every((item) => {
    if (!item || typeof item !== "object") return false;
    const row = item as Record<string, unknown>;
    return (
      typeof row.title === "string" &&
      (row.impact === "high" || row.impact === "medium" || row.impact === "low") &&
      (row.effort === "high" || row.effort === "medium" || row.effort === "low") &&
      typeof row.expectedLift === "string"
    );
  });

  const validQuickWins = candidate.quickWins.every((item) => typeof item === "string");
  return validPriority && validQuickWins;
}

function buildDeterministicFallback(report: FixPlaygroundReportInput): GeneratedFixes {
  const topIssue = report.topIssues[0]?.issue ?? "The value proposition is hard to scan at first glance.";
  const topA11yIssue =
    report.accessibilityFindings[0]?.issue ?? "Some interactive elements are difficult to parse quickly.";

  return {
    improvedHero: {
      before: `Current hero likely feels generic and does not clearly resolve: ${topIssue}`,
      after:
        "Lead with one sharp outcome statement, add one supporting proof point, and place a single focused CTA above the fold.",
      rationale:
        "Users decide in seconds whether to continue. A clear promise + proof + one next step reduces bounce and improves conversion intent.",
    },
    improvedCTA: {
      before:
        "CTAs are present but may be vague or visually blended into surrounding content, making the next action less obvious.",
      after:
        "Use one primary action label tied to user intent (for example, Start free UX audit) and increase contrast/whitespace around the button.",
      rationale:
        "High-intent language and visual prominence improve click confidence and reduce decision friction.",
    },
    improvedFormUX: {
      before: `Form interaction can create uncertainty due to UX/a11y friction such as: ${topA11yIssue}`,
      after:
        "Reduce fields to minimum required inputs, add helper text and inline validation, and provide success/error feedback immediately.",
      rationale:
        "Lower cognitive load plus clear validation decreases abandonment and improves task completion speed.",
    },
    prioritizedChanges: [
      {
        title: "Rewrite hero to emphasize one measurable benefit",
        impact: "high",
        effort: "low",
        expectedLift: "Higher first-screen clarity and improved conversion quality",
      },
      {
        title: "Promote a single primary CTA with stronger contrast",
        impact: "high",
        effort: "low",
        expectedLift: "More focused click-through on the intended user path",
      },
      {
        title: "Simplify form with inline validation and clear labels",
        impact: "medium",
        effort: "medium",
        expectedLift: "Lower drop-off during submission steps",
      },
      {
        title: "Address top accessibility blockers in interactive elements",
        impact: "medium",
        effort: "medium",
        expectedLift: "Improved usability and trust for broader audiences",
      },
    ],
    quickWins: [
      "Replace generic CTA text with intent-based language.",
      "Add one trust signal near the primary action.",
      "Increase spacing around key conversion elements.",
      "Clarify form field purpose with concise helper copy.",
    ],
  };
}

async function generateViaModel(report: FixPlaygroundReportInput): Promise<GeneratedFixes> {
  const client = new Anthropic();
  const textContext = [
    `URL: ${report.url}`,
    `Page title: ${report.pageTitle}`,
    `UX summary: ${report.uxSummary}`,
    `Top issues: ${JSON.stringify(report.topIssues)}`,
    `Accessibility findings: ${JSON.stringify(report.accessibilityFindings)}`,
  ].join("\n");

  const message = await client.messages.create({
    model: "claude-opus-4-1-20250805",
    max_tokens: 2200,
    system: FIX_SYSTEM_PROMPT,
    messages: [{ role: "user", content: [{ type: "text", text: textContext }] }],
  });

  const rawText = message.content[0]?.type === "text" ? message.content[0].text : "";
  const jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed: unknown = JSON.parse(jsonText);

  if (!isGeneratedFixes(parsed)) {
    throw new Error("Model returned invalid fixes shape");
  }

  return parsed;
}

export async function POST(request: NextRequest) {
  let body: GenerateFixesRequest;

  try {
    body = (await request.json()) as GenerateFixesRequest;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.report || !isFixReportInput(body.report)) {
    return Response.json(
      { error: "report with url, pageTitle, uxSummary, topIssues, accessibilityFindings is required" },
      { status: 400 }
    );
  }

  const fallback = buildDeterministicFallback(body.report);

  try {
    const generated = await generateViaModel(body.report);
    return Response.json(generated);
  } catch (error) {
    console.error("[generate-fixes] using fallback due to model error:", error);
    return Response.json(fallback);
  }
}
