import jsPDF from "jspdf";
import type {
  Report,
  ReportIssue,
  AccessibilityFinding,
} from "../components/ReportView";

// ── Design tokens ────────────────────────────────────────────────
type RGB = [number, number, number];

const C = {
  accent: [42, 58, 78] as RGB,
  accentLight: [235, 239, 244] as RGB,
  text: [30, 30, 30] as RGB,
  textSecondary: [100, 100, 100] as RGB,
  textMuted: [150, 150, 150] as RGB,
  border: [220, 220, 220] as RGB,
  sevHigh: [196, 62, 62] as RGB,
  sevMedium: [196, 138, 62] as RGB,
  sevLow: [62, 143, 196] as RGB,
  impCritical: [196, 62, 62] as RGB,
  impSerious: [196, 106, 62] as RGB,
  impModerate: [196, 162, 62] as RGB,
  impMinor: [62, 143, 196] as RGB,
  scoreGreen: [34, 139, 34] as RGB,
  scoreYellow: [196, 162, 62] as RGB,
  scoreRed: [196, 62, 62] as RGB,
};

// ── Layout ───────────────────────────────────────────────────────
const PW = 210; // A4 width mm
const PH = 297; // A4 height mm
const M = 20; // margin
const CW = PW - 2 * M; // content width
const BOTTOM = PH - M - 14; // usable bottom (above footer)
const CARD_PAD = 6;
const CARD_INNER = CW - 2 * CARD_PAD;
const CARD_IMG_H = 30; // fixed height for element screenshots in cards
const TEXT_X = M + CARD_PAD; // left edge of card content

function scoreColor(s: number): RGB {
  return s >= 80 ? C.scoreGreen : s >= 60 ? C.scoreYellow : C.scoreRed;
}
function sevColor(s: ReportIssue["severity"]): RGB {
  return s === "high" ? C.sevHigh : s === "medium" ? C.sevMedium : C.sevLow;
}
function impColor(i: AccessibilityFinding["impact"]): RGB {
  return i === "critical" ? C.impCritical : i === "serious" ? C.impSerious : i === "moderate" ? C.impModerate : C.impMinor;
}

// ── Helpers ──────────────────────────────────────────────────────

/** Replace Unicode characters that jsPDF can't render (arrows, smart quotes, etc.)
 *  with safe ASCII equivalents so text doesn't explode into wide monospace glyphs. */
function sanitize(text: string): string {
  return text
    .replace(/[\u2018\u2019\u201A]/g, "'")   // smart single quotes
    .replace(/[\u201C\u201D\u201E]/g, '"')    // smart double quotes
    .replace(/\u2026/g, "...")                 // ellipsis
    .replace(/[\u2013\u2014]/g, "-")           // en/em dash
    .replace(/[\u2190]/g, "<-")               // left arrow
    .replace(/[\u2192\u279C\u2794\u27A1]/g, "->") // right arrows
    .replace(/[\u2191]/g, "^")                // up arrow
    .replace(/[\u2193]/g, "v")                // down arrow
    .replace(/[\u2022\u2023\u25CF]/g, "*")    // bullets
    .replace(/[\u00A0]/g, " ")                // non-breaking space
    .replace(/[^\x00-\x7F]/g, (ch) => {
      // Last resort: drop any remaining non-ASCII that helvetica can't render
      // Keep common latin-extended (accented letters)
      const code = ch.charCodeAt(0);
      if (code >= 0x00C0 && code <= 0x00FF) return ch; // Latin-1 supplement
      return " ";
    });
}

function wrap(doc: jsPDF, text: string, maxW: number): string[] {
  return doc.splitTextToSize(sanitize(text), maxW) as string[];
}

function newPageIfNeeded(doc: jsPDF, y: number, need: number): number {
  if (y + need > BOTTOM) {
    doc.addPage();
    return M + 5;
  }
  return y;
}

function addFooter(doc: jsPDF, page: number, total: number) {
  const y = PH - 8;
  doc.setFontSize(7);
  doc.setTextColor(...C.textMuted);
  doc.text("Axiom Review", M, y);
  doc.text(`Page ${page} of ${total}`, PW - M, y, { align: "right" });
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.line(M, y - 3, PW - M, y - 3);
}

/** Add a base64 image at fixed dimensions. Returns bottom Y. */
function addImg(doc: jsPDF, src: string, x: number, y: number, w: number, h: number): number {
  try {
    let fmt = "PNG";
    if (src.startsWith("data:image/jpeg") || src.startsWith("data:image/jpg")) fmt = "JPEG";
    else if (src.startsWith("data:image/webp")) fmt = "WEBP";
    doc.addImage(src, fmt, x, y, w, h);
    return y + h;
  } catch {
    return y;
  }
}

// ── Score ring ───────────────────────────────────────────────────
function drawScoreRing(doc: jsPDF, cx: number, cy: number, r: number, score: number) {
  const col = scoreColor(score);

  doc.setDrawColor(...C.border);
  doc.setLineWidth(1.5);
  doc.circle(cx, cy, r, "S");

  if (score > 0) {
    doc.setDrawColor(...col);
    doc.setLineWidth(1.5);
    const end = -90 + (score / 100) * 360;
    const steps = Math.max(Math.ceil(Math.abs(end + 90) / 2), 1);
    const dStep = (end + 90) / steps;
    for (let i = 0; i < steps; i++) {
      const a1 = ((-90 + i * dStep) * Math.PI) / 180;
      const a2 = ((-90 + (i + 1) * dStep) * Math.PI) / 180;
      doc.line(cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2));
    }
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...col);
  doc.text(String(score), cx, cy + 1, { align: "center" });
  doc.setFontSize(5);
  doc.setTextColor(...C.textMuted);
  doc.text("/ 100", cx, cy + 4.5, { align: "center" });
}

// ── Score bar ────────────────────────────────────────────────────
function drawScoreBar(doc: jsPDF, x: number, y: number, w: number, label: string, score: number): number {
  const col = scoreColor(score);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.textSecondary);
  doc.text(label, x, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...col);
  doc.text(String(score), x + w, y, { align: "right" });
  const bY = y + 2;
  doc.setFillColor(...C.accentLight);
  doc.roundedRect(x, bY, w, 2.5, 1, 1, "F");
  if (score > 0) {
    doc.setFillColor(...col);
    doc.roundedRect(x, bY, (score / 100) * w, 2.5, 1, 1, "F");
  }
  return bY + 7.5;
}

// ── Section header ───────────────────────────────────────────────
function drawSectionHeader(doc: jsPDF, y: number, title: string, count: number): number {
  y = newPageIfNeeded(doc, y, 15);
  doc.setFillColor(...C.accent);
  doc.rect(M, y, 3, 10, "F");
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.accent);
  doc.text(title, M + 7, y + 7);
  const cx = M + 7 + doc.getTextWidth(title) + 4;
  doc.setFillColor(...C.accentLight);
  doc.roundedRect(cx, y + 1.5, 10, 6, 2, 2, "F");
  doc.setFontSize(7);
  doc.setTextColor(...C.accent);
  doc.text(String(count), cx + 5, y + 5.8, { align: "center" });
  return y + 16;
}

// ── Measure card height (dry run) ────────────────────────────────
// This calculates the exact height a card will occupy so we can
// draw the background/border at the correct size before content.

interface CardContent {
  titleLines: string[];
  whyLines: string[];
  fixLines: string[];
  hasImage: boolean;
  badgeLabel: string;
}

function measureCard(c: CardContent): number {
  let h = CARD_PAD; // top pad
  h += Math.max(c.titleLines.length * 5, 7) + 3; // title (min badge height)
  h += 8; // severity/impact badge + gap
  if (c.hasImage) h += CARD_IMG_H + 4; // screenshot + gap
  h += 4 + c.whyLines.length * 4.5 + 4; // label + text + gap
  h += 4 + c.fixLines.length * 4.5; // label + text
  h += CARD_PAD; // bottom pad
  return h;
}

const TEXT_WRAP_W = CARD_INNER - 10; // text wrap width (with right margin safety)

function prepareIssueContent(doc: jsPDF, issue: ReportIssue): CardContent {
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const titleLines = wrap(doc, issue.issue, TEXT_WRAP_W - 20);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  const whyLines = wrap(doc, issue.whyItMatters, TEXT_WRAP_W);
  const fixLines = wrap(doc, issue.suggestedFix, TEXT_WRAP_W);
  const badgeLabel = issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1);
  return { titleLines, whyLines, fixLines, hasImage: !!issue.screenshot, badgeLabel };
}

function prepareA11yContent(doc: jsPDF, finding: AccessibilityFinding): CardContent {
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const titleLines = wrap(doc, finding.issue, TEXT_WRAP_W - 20);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  const whyLines = wrap(doc, finding.whyItMatters, TEXT_WRAP_W);
  const fixLines = wrap(doc, finding.suggestedFix, TEXT_WRAP_W);
  const badgeLabel = finding.impact.charAt(0).toUpperCase() + finding.impact.slice(1);
  return { titleLines, whyLines, fixLines, hasImage: !!finding.screenshot, badgeLabel };
}

// ── Draw card (shared logic) ─────────────────────────────────────
// Draws background + border first with measured height, then content.

function drawCard(
  doc: jsPDF,
  y: number,
  content: CardContent,
  color: RGB,
  index: number,
  imgSrc?: string,
): number {
  const h = measureCard(content);
  y = newPageIfNeeded(doc, y, h);
  const top = y;

  // ── Background & border (drawn first, correct size) ──
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, top, CW, h, 2, 2, "FD");

  // Severity/impact left stripe
  doc.setFillColor(...color);
  doc.rect(M, top + 1, 2.5, h - 2, "F");

  // ── Content ──
  y += CARD_PAD;

  // Index badge
  doc.setFillColor(...color);
  doc.roundedRect(TEXT_X, y, 7, 7, 1.5, 1.5, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(String(index), TEXT_X + 3.5, y + 5, { align: "center" });

  // Title
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.text);
  doc.text(content.titleLines, TEXT_X + 10, y + 5);
  y += Math.max(content.titleLines.length * 5, 7) + 3;

  // Severity/Impact badge
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  const badgeW = doc.getTextWidth(content.badgeLabel.toUpperCase()) + 6;
  doc.setFillColor(...color);
  doc.roundedRect(TEXT_X + 10, y - 2, badgeW, 5.5, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(content.badgeLabel.toUpperCase(), TEXT_X + 10 + badgeW / 2, y + 1.5, { align: "center" });
  y += 8;

  // Element screenshot (fixed height)
  if (content.hasImage && imgSrc) {
    const imgW = CARD_INNER - 14;
    addImg(doc, imgSrc, TEXT_X + 10, y, imgW, CARD_IMG_H);
    // subtle border around image area
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.15);
    doc.rect(TEXT_X + 10, y, imgW, CARD_IMG_H, "D");
    y += CARD_IMG_H + 4;
  }

  // Why it matters
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.textMuted);
  doc.text("WHY IT MATTERS", TEXT_X + 2, y);
  y += 4;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.textSecondary);
  doc.text(content.whyLines, TEXT_X + 2, y);
  y += content.whyLines.length * 4.5 + 4;

  // Suggested fix
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.textMuted);
  doc.text("SUGGESTED FIX", TEXT_X + 2, y);
  y += 4;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.text);
  doc.text(content.fixLines, TEXT_X + 2, y);

  return top + h + 4; // 4mm gap between cards
}

// ── Main PDF generation ──────────────────────────────────────────
export default function generatePdf(report: Report) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // ═══════ PAGE 1: COVER ═══════
  // Pre-measure title to size the header band
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  const titleLines = wrap(doc, report.pageTitle, CW - 10);
  const titleLineH = 7; // ~7mm per line at 18pt
  const bandH = Math.max(44, 22 + titleLines.length * titleLineH + 6);

  // Navy header band
  doc.setFillColor(...C.accent);
  doc.rect(0, 0, PW, bandH, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 210, 220);
  doc.text("AXIOM REVIEW", M, 14);

  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(dateStr, PW - M, 14, { align: "right" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(titleLines, M, 26);

  // URL (positioned below the dynamic band)
  let y = bandH + 8;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.textMuted);
  doc.text("Analyzed URL", M, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.accent);
  doc.text(sanitize(report.url), M, y + 5);

  // Score ring
  drawScoreRing(doc, PW - M - 12, y + 4, 9, report.scores.overall);

  // Divider
  y = y + 14;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(M, y, PW - M, y);

  // Executive summary
  y += 8;
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.textMuted);
  doc.text("EXECUTIVE SUMMARY", M, y);
  y += 6;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.textSecondary);
  const summaryLines = wrap(doc, report.uxSummary, CW);
  doc.text(summaryLines, M, y);
  y += summaryLines.length * 5 + 10;

  // Score breakdown
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.textMuted);
  doc.text("SCORE BREAKDOWN", M, y);
  y += 7;
  const bw = CW * 0.6;
  y = drawScoreBar(doc, M, y, bw, "Accessibility", report.scores.accessibility);
  y = drawScoreBar(doc, M, y, bw, "Clarity", report.scores.clarity);
  y = drawScoreBar(doc, M, y, bw, "Usability", report.scores.usability);

  // Divider
  y += 4;
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(M, y, PW - M, y);
  y += 8;

  // Desktop screenshot — fill remaining space on page 1
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.textMuted);
  doc.text("DESKTOP SCREENSHOT", M, y);
  y += 5;

  if (report.screenshot) {
    const maxH = BOTTOM - y;
    const imgBottom = addImg(doc, report.screenshot, M, y, CW, maxH);
    if (imgBottom > y) {
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.2);
      doc.roundedRect(M - 0.5, y - 0.5, CW + 1, imgBottom - y + 1, 1, 1, "D");
      y = imgBottom + 6;
    }
  }

  // Mobile screenshot — separate page
  if (report.mobileAnalysis?.screenshot) {
    doc.addPage();
    y = M + 5;
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.textMuted);
    doc.text("MOBILE SCREENSHOT", M, y);
    y += 5;
    const mw = 70;
    const mx = (PW - mw) / 2;
    const mMaxH = BOTTOM - y;
    const imgBottom = addImg(doc, report.mobileAnalysis.screenshot, mx, y, mw, mMaxH);
    if (imgBottom > y) {
      doc.setDrawColor(...C.border);
      doc.setLineWidth(0.2);
      doc.roundedRect(mx - 0.5, y - 0.5, mw + 1, imgBottom - y + 1, 1, 1, "D");
    }
  }

  // ═══════ TOP ISSUES ═══════
  doc.addPage();
  y = M + 5;
  y = drawSectionHeader(doc, y, "Top Issues", report.topIssues.length);

  for (let i = 0; i < report.topIssues.length; i++) {
    const issue = report.topIssues[i];
    const content = prepareIssueContent(doc, issue);
    y = drawCard(doc, y, content, sevColor(issue.severity), i + 1, issue.screenshot);
  }

  // ═══════ ACCESSIBILITY FINDINGS ═══════
  doc.addPage();
  y = M + 5;
  y = drawSectionHeader(doc, y, "Accessibility Findings", report.accessibilityFindings.length);

  for (let i = 0; i < report.accessibilityFindings.length; i++) {
    const f = report.accessibilityFindings[i];
    const content = prepareA11yContent(doc, f);
    y = drawCard(doc, y, content, impColor(f.impact), i + 1, f.screenshot);
  }

  // ═══════ MOBILE ISSUES ═══════
  if (report.mobileAnalysis && report.mobileAnalysis.issues.length > 0) {
    doc.addPage();
    y = M + 5;
    y = drawSectionHeader(doc, y, "Mobile Issues", report.mobileAnalysis.issues.length);

    for (let i = 0; i < report.mobileAnalysis.issues.length; i++) {
      const issue = report.mobileAnalysis.issues[i];
      const content = prepareIssueContent(doc, issue);
      y = drawCard(doc, y, content, sevColor(issue.severity), i + 1, issue.screenshot);
    }
  }

  // ═══════ Footers ═══════
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    addFooter(doc, p, total);
  }

  // ═══════ Download ═══════
  const safe = report.pageTitle.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_").slice(0, 40);
  doc.save(`Axiom_Review_${safe}.pdf`);
}
