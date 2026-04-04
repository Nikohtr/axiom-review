"use client";

import { useState } from "react";
import AnimatedBackground from "../components/AnimatedBackground";
import LoadingReport from "../components/LoadingReport";
import ReportView, { type Report } from "../components/ReportView";
import RotatingText from "../components/RotatingText";
import UrlForm from "../components/UrlForm";

const EXAMPLE_URLS = [
  { label: "Hacker News", url: "https://news.ycombinator.com" },
  { label: "Wikipedia", url: "https://en.wikipedia.org" },
  { label: "Craigslist", url: "https://craigslist.org" },
];

export default function Home() {
  type AnalyzeState = "idle" | "loading" | "success" | "error";

  const [url, setUrl] = useState("");
  const [state, setState] = useState<AnalyzeState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [report, setReport] = useState<Report | null>(null);

  const isLoading = state === "loading";
  const showLanding = state === "idle" && !report;

  const normalizeUrl = (rawValue: string) => {
    const trimmedValue = rawValue.trim();
    if (!trimmedValue) return "";
    if (/^https?:\/\//i.test(trimmedValue)) return trimmedValue;
    return `https://${trimmedValue}`;
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (isLoading) return;
    if (!value.trim()) {
      setErrorMessage("");
      setReport(null);
      setState("idle");
      return;
    }
    if (state === "error") setErrorMessage("");
    if (report) setReport(null);
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
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalizedUrl }),
      });
      if (!response.ok) throw new Error("Request failed");
      const data: Report = await response.json();
      setReport(data);
      setState("success");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setState("error");
    }
  };

  const handleExampleClick = (exampleUrl: string) => {
    setUrl(exampleUrl);
    const syntheticEvent = {
      preventDefault: () => {},
    } as React.FormEvent<HTMLFormElement>;

    setUrl(exampleUrl);
    setErrorMessage("");
    setReport(null);
    setState("loading");

    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: exampleUrl }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Request failed");
        return response.json();
      })
      .then((data: Report) => {
        setReport(data);
        setState("success");
      })
      .catch(() => {
        setErrorMessage("Something went wrong. Please try again.");
        setState("error");
      });
  };

  return (
    <div className="paper-bg relative min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
      {showLanding && <AnimatedBackground />}
      {/* Top bar */}
      <header className="print:hidden sticky top-0 z-50 border-b border-[var(--border-light)] bg-[var(--background)]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white">
              <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
            </div>
            <span className="text-xl tracking-tight text-[var(--foreground)]" style={{ fontFamily: "var(--font-display)" }}>
              Axiom <span className="italic text-[var(--accent)]">Review</span>
            </span>
          </div>
          {!showLanding && (
            <div className="animate-fade-in flex-1 max-w-md mx-8">
              <UrlForm
                url={url}
                isLoading={isLoading}
                onSubmit={handleSubmit}
                onUrlChange={handleUrlChange}
                compact
              />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* Landing state */}
        {showLanding && (
          <div className="relative flex min-h-[70vh] flex-col items-center justify-center py-20">
            <AnimatedBackground />
            <div className="stagger-children relative z-10 flex w-full max-w-xl flex-col items-center text-center">
              <h1
                className="mt-8 text-4xl leading-tight tracking-tight sm:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Get an expert UX review
                <br />
                <RotatingText />
              </h1>

              <p className="mt-4 max-w-md text-lg text-[var(--text-muted)]">
                Paste any URL. Our AI captures the page, audits accessibility, and delivers
                actionable feedback you can use right away.
              </p>

              <div className="mt-10 w-full">
                <UrlForm
                  url={url}
                  isLoading={isLoading}
                  onSubmit={handleSubmit}
                  onUrlChange={handleUrlChange}
                />
              </div>

              {errorMessage && (
                <p className="mt-3 text-sm text-[var(--severity-high)]">{errorMessage}</p>
              )}

              <div className="mt-6 flex flex-col items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">Or try an example</span>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXAMPLE_URLS.map((example) => (
                    <button
                      key={example.url}
                      type="button"
                      onClick={() => handleExampleClick(example.url)}
                      disabled={isLoading}
                      className="rounded-full border border-[var(--border)] bg-white px-4 py-1.5 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {state === "loading" && (
          <div className="animate-fade-up py-10">
            <LoadingReport />
          </div>
        )}

        {/* Error state (non-landing) */}
        {state === "error" && !showLanding && (
          <div className="animate-fade-up py-10">
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Report */}
        {state !== "loading" && report && (
          <div className="animate-fade-up py-10">
            <ReportView report={report} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="print:hidden mt-auto border-t border-[var(--border-light)] py-6">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs text-[var(--text-muted)]">
          Axiom Review uses AI to analyze UX patterns. Results are suggestions, not guarantees.
        </div>
      </footer>
    </div>
  );
}
