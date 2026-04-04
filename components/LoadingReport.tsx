"use client";

import { useState, useEffect } from "react";

const STEPS = [
  { key: "capture", label: "Capturing screenshot", icon: "camera" },
  { key: "scan", label: "Scanning accessibility", icon: "scan" },
  { key: "analyze", label: "Analyzing UX patterns", icon: "brain" },
  { key: "report", label: "Preparing report", icon: "doc" },
] as const;

function StepIcon({ icon, active }: { icon: string; active: boolean }) {
  const cls = active ? "text-[var(--accent)]" : "text-[var(--border)]";
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cls}>
      {icon === "camera" && (
        <>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </>
      )}
      {icon === "scan" && (
        <>
          <path d="M2 7V2h5" /><path d="M17 2h5v5" /><path d="M22 17v5h-5" /><path d="M7 22H2v-5" />
          <line x1="7" y1="12" x2="17" y2="12" />
        </>
      )}
      {icon === "brain" && (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </>
      )}
      {icon === "doc" && (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </>
      )}
    </svg>
  );
}

export default function LoadingReport() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((_, i) => {
      if (i === 0) return null;
      return setTimeout(() => setActiveStep(i), i * 4000);
    });
    return () => timers.forEach((t) => t && clearTimeout(t));
  }, []);

  return (
    <section className="mx-auto max-w-2xl" aria-live="polite">
      <div className="rounded-xl border border-[var(--border)] bg-white p-8">
        <div className="flex flex-col items-center gap-6">
          {/* Spinner */}
          <div className="relative flex h-16 w-16 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--border-light)]" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--accent)]" style={{ animationDuration: "1.2s" }} />
            <span className="text-lg" style={{ fontFamily: "var(--font-display)" }}>
              {activeStep + 1}/{STEPS.length}
            </span>
          </div>

          {/* Steps */}
          <div className="flex w-full max-w-sm flex-col gap-3">
            {STEPS.map((step, i) => {
              const isActive = i === activeStep;
              const isDone = i < activeStep;
              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-300 ${
                    isActive
                      ? "bg-[var(--surface-warm)]"
                      : ""
                  }`}
                >
                  {isDone ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <StepIcon icon={step.icon} active={isActive} />
                  )}
                  <span
                    className={`text-sm transition-colors duration-300 ${
                      isActive
                        ? "font-medium text-[var(--foreground)]"
                        : isDone
                          ? "text-[var(--text-muted)] line-through decoration-[var(--border)]"
                          : "text-[var(--text-muted)]"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 animate-pulse-warm rounded-full bg-[var(--accent)]" />
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            This usually takes 15–30 seconds
          </p>
        </div>
      </div>
    </section>
  );
}
