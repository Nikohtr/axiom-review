"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AnimatedBackground from "../components/AnimatedBackground";
import FeatureCards from "../components/FeatureCards";
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
  const [showSuccessGlow, setShowSuccessGlow] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const prevStateRef = useRef<AnalyzeState>("idle");

  const isLoading = state === "loading";
  const showLanding = state === "idle" && !report;

  // Smooth scroll to report on success + success glow
  useEffect(() => {
    if (prevStateRef.current === "loading" && state === "success" && reportRef.current) {
      setTimeout(() => {
        reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
      setShowSuccessGlow(true);
      const timer = setTimeout(() => setShowSuccessGlow(false), 1200);
      return () => clearTimeout(timer);
    }
    prevStateRef.current = state;
  }, [state]);

  // Keyboard shortcut: Cmd+K / Ctrl+K to focus URL input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        urlInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const analyzeUrl = useCallback(async (targetUrl: string) => {
    setErrorMessage("");
    setReport(null);
    setState("loading");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      if (!response.ok) throw new Error("Request failed");
      const data: Report = await response.json();
      setReport(data);
      setState("success");
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setState("error");
    }
  }, []);

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
    analyzeUrl(normalizedUrl);
  };

  const handleExampleClick = (exampleUrl: string) => {
    setUrl(exampleUrl);
    analyzeUrl(exampleUrl);
  };

  const handleRetry = () => {
    if (url.trim()) {
      analyzeUrl(normalizeUrl(url));
    }
  };

  const handleAnalyzeAnother = () => {
    setUrl("");
    setReport(null);
    setErrorMessage("");
    setState("idle");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => urlInputRef.current?.focus(), 400);
  };

  return (
    <div className="paper-bg relative min-h-screen" style={{ fontFamily: "var(--font-body)" }}>
      {/* Skip-to-content for accessibility */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {showLanding && <AnimatedBackground />}

      {/* Top bar */}
      <header className="print:hidden sticky top-0 z-50 border-b border-[var(--border-light)] bg-[var(--background)]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <button
            type="button"
            onClick={handleAnalyzeAnother}
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white">
              <img src="/logo.png" alt="" className="h-8 w-8 object-contain" />
            </div>
            <span className="text-xl tracking-tight text-[var(--foreground)]" style={{ fontFamily: "var(--font-display)" }}>
              Axiom <span className="italic text-[var(--accent)]">Review</span>
            </span>
          </button>
          {!showLanding && (
            <div className="animate-fade-in flex-1 max-w-md mx-8">
              <UrlForm
                url={url}
                isLoading={isLoading}
                onSubmit={handleSubmit}
                onUrlChange={handleUrlChange}
                inputRef={urlInputRef}
                compact
              />
            </div>
          )}
        </div>
      </header>

      <main id="main" className="mx-auto max-w-6xl px-6">
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
                  inputRef={urlInputRef}
                  showShortcutHint
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

              <FeatureCards />
            </div>
          </div>
        )}

        {/* Loading state */}
        {state === "loading" && (
          <div className="animate-fade-up py-10">
            <LoadingReport url={url} />
          </div>
        )}

        {/* Error state (non-landing) */}
        {state === "error" && !showLanding && (
          <div className="animate-fade-up py-10">
            <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--severity-high)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-red-800">Analysis failed</p>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="ml-auto shrink-0 rounded-lg bg-red-100 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-200"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Report */}
        {state !== "loading" && report && (
          <div ref={reportRef} className="animate-fade-up py-10">
            <ReportView report={report} showSuccessGlow={showSuccessGlow} onAnalyzeAnother={handleAnalyzeAnother} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="print:hidden mt-auto border-t border-[var(--border-light)] py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-5 w-5 object-contain opacity-40" />
            <span className="text-xs text-[var(--text-muted)]">
              Axiom Review
            </span>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            AI-powered analysis. Results are suggestions, not guarantees.
          </span>
        </div>
      </footer>
    </div>
  );
}
