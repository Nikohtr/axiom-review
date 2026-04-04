export default function LoadingReport() {
  return (
    <section
      className="flex flex-col gap-6 rounded-[22px] border border-zinc-200 bg-white p-6 shadow-sm"
      aria-live="polite"
    >
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-400">
          Analysis in progress
        </span>
        <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" aria-hidden="true" />
          <span>Loading page, checking accessibility, generating feedback...</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        <div className="flex h-[230px] items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100">
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span
              className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700"
              aria-hidden="true"
            />
            <span>Capturing screenshot</span>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-400">UX Summary</p>
            <div className="mt-3 flex flex-col gap-2">
              <div className="h-3 w-full rounded-full bg-zinc-200" />
              <div className="h-3 w-5/6 rounded-full bg-zinc-200" />
              <div className="h-3 w-2/3 rounded-full bg-zinc-200" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-400">
              Accessibility Findings
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <div className="h-3 w-4/5 rounded-full bg-zinc-200" />
              <div className="h-3 w-2/3 rounded-full bg-zinc-200" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-zinc-400">Top Issues</p>
        <div className="grid gap-4 md:grid-cols-2">
          {["first", "second"].map((key) => (
            <div
              key={key}
              className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4"
            >
              <div className="flex items-center justify-between">
                <div className="h-3 w-1/2 rounded-full bg-zinc-200" />
                <div className="h-6 w-16 rounded-full border border-zinc-200 bg-zinc-100" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-3 w-full rounded-full bg-zinc-200" />
                <div className="h-3 w-5/6 rounded-full bg-zinc-200" />
              </div>
              <div className="h-3 w-2/3 rounded-full bg-zinc-200" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
