export type FixPlaygroundIssueInput = {
  issue: string;
  severity: "low" | "medium" | "high";
  whyItMatters: string;
  suggestedFix: string;
};

export type FixPlaygroundAccessibilityInput = {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  issue: string;
  whyItMatters: string;
  suggestedFix: string;
};

export type FixPlaygroundReportInput = {
  url: string;
  pageTitle: string;
  uxSummary: string;
  topIssues: FixPlaygroundIssueInput[];
  accessibilityFindings: FixPlaygroundAccessibilityInput[];
};

export type ImprovementBlock = {
  before: string;
  after: string;
  rationale: string;
};

export type PrioritizedChange = {
  title: string;
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
  expectedLift: string;
};

export type GeneratedFixes = {
  improvedHero: ImprovementBlock;
  improvedCTA: ImprovementBlock;
  improvedFormUX: ImprovementBlock;
  prioritizedChanges: PrioritizedChange[];
  quickWins: string[];
};

export type GenerateFixesRequest = {
  report: FixPlaygroundReportInput;
};
