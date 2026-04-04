"use client";

import { useState } from "react";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import LoadingReport from "../components/LoadingReport";
import ReportView, { type Report } from "../components/ReportView";
import UrlForm from "../components/UrlForm";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export default function Home() {
  type AnalyzeState = "idle" | "loading" | "success" | "error";

  const [url, setUrl] = useState("");
  const [state, setState] = useState<AnalyzeState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [report, setReport] = useState<Report | null>(null);

  const mockReport: Report = {
    url: "https://example.com",
    screenshot: "/placeholder.png",
    pageTitle: "Example Domain",
    uxSummary: "The page is simple but lacks a strong call to action and clear hierarchy.",
    topIssues: [
      {
        title: "Weak CTA visibility",
        severity: "high",
        evidence: "There is no prominent button or action above the fold.",
        fix: "Add a clear primary CTA in the hero section.",
      },
      {
        title: "Minimal content structure",
        severity: "medium",
        evidence: "The page has very little supporting context for the user.",
        fix: "Add supporting sections that explain value and next steps.",
      },
    ],
    accessibilityFindings: [
      {
        id: "color-contrast",
        impact: "serious",
        description: "Some text may not meet contrast requirements.",
      },
    ],
  };

  const isLoading = state === "loading";

  const normalizeUrl = (rawValue: string) => {
    const trimmedValue = rawValue.trim();

    if (!trimmedValue) {
      return "";
    }

    if (/^https?:\/\//i.test(trimmedValue)) {
      return trimmedValue;
    }

    return `https://${trimmedValue}`;
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);

    if (isLoading) {
      return;
    }

    if (!value.trim()) {
      setErrorMessage("");
      setReport(null);
      setState("idle");
      return;
    }

    if (state === "error") {
      setErrorMessage("");
    }

    if (report) {
      setReport(null);
    }

    setState("idle");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedUrl = normalizeUrl(url);

    if (!normalizedUrl) {
      setErrorMessage("Please enter a website URL.");
      setState("error");
      return;
    }

    try {
      const parsedUrl = new URL(normalizedUrl);
      const isHttp = parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
      const hostname = parsedUrl.hostname;
      const tldMatch = hostname.match(/\.([a-z]{2,24})$/i);
      const hasPublicTld = Boolean(tldMatch);

      if (!isHttp || !hostname || !hostname.includes(".") || !hasPublicTld) {
        throw new Error("Invalid protocol or host");
      }
    } catch {
      setErrorMessage("Please enter a valid URL, like https://example.com.");
      setState("error");
      return;
    }

    setUrl(normalizedUrl);
    setErrorMessage("");
    setReport(null);
    setState("loading");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1400));
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: normalizedUrl }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      const data: Report = await response.json();
      setReport(data);
      setState("success");
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setErrorMessage("Something went wrong. Showing a sample report for now.");
      setReport({ ...mockReport, url: normalizedUrl });
      setState("error");
    }
  };

  const LoadingState = () => (
    <span>Loading page, checking accessibility, generating feedback...</span>
  );

  const ErrorMessage = ({ message }: { message: string }) => <span>{message}</span>;

  return (
    <div
      className={`${display.variable} ${body.variable} min-h-screen bg-[radial-gradient(900px_480px_at_15%_0%,#f9e4b8_0%,transparent_60%),radial-gradient(700px_420px_at_85%_10%,#cfeadf_0%,transparent_58%),linear-gradient(180deg,#fbfbf6_0%,#f1f2f4_100%)] px-6 py-16 text-zinc-900`}
    >
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 rounded-[28px] border border-zinc-200/60 bg-white/80 p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <img src="/logo.png" alt="Axiom Review logo" className="h-11 w-11 object-contain" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Axiom Review
            </span>
            <span className="text-xs text-zinc-400">AI UX Analyzer</span>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <h1 className="max-w-2xl text-4xl leading-[1.05] sm:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
            Paste any website URL and get an AI UX review.
          </h1>
          <p className="max-w-xl text-lg text-zinc-600" style={{ fontFamily: "var(--font-body)" }}>
            Screenshot + accessibility scan + top issues in seconds.
          </p>
        </div>

        <UrlForm url={url} isLoading={isLoading} onSubmit={handleSubmit} onUrlChange={handleUrlChange} />

        <div
          className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {state === "idle" && "Enter a URL to start the analysis."}
          {state === "loading" && <LoadingState />}
          {state === "success" && "Analysis complete. Report is ready."}
          {state === "error" && <ErrorMessage message={errorMessage} />}
          {state === "idle" && (
            <span className="ml-2 text-zinc-400">We will add https:// if you omit it.</span>
          )}
        </div>

        {state === "loading" && <LoadingReport />}
        {state !== "loading" && report && <ReportView report={report} />}
      </main>
    </div>
  );
}
