import type { FormEvent } from "react";

type UrlFormProps = {
  url: string;
  isLoading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUrlChange: (value: string) => void;
  compact?: boolean;
};

export default function UrlForm({ url, isLoading, onSubmit, onUrlChange, compact }: UrlFormProps) {
  if (compact) {
    return (
      <form className="flex w-full items-center gap-2" onSubmit={onSubmit} noValidate>
        <input
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="Paste a URL to review..."
          aria-label="Website URL"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          className="h-9 w-full flex-1 rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20"
        />
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="h-9 shrink-0 rounded-lg bg-[var(--accent)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-40"
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-white/30 border-t-white" />
              Analyzing
            </span>
          ) : (
            "Review"
          )}
        </button>
      </form>
    );
  }

  return (
    <form className="flex w-full flex-col gap-2" onSubmit={onSubmit} noValidate>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            inputMode="url"
            autoComplete="url"
            placeholder="https://example.com"
            aria-label="Website URL"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            className="h-14 w-full rounded-xl border border-[var(--border)] bg-white pl-11 pr-4 text-base text-[var(--foreground)] shadow-sm outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="h-14 rounded-xl bg-[var(--accent)] px-8 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--accent-hover)] hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:hover:shadow-sm"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Analyzing...
            </span>
          ) : (
            "Review this site"
          )}
        </button>
      </div>
      <p className="pl-1 text-xs text-[var(--text-muted)]">
        We&apos;ll add https:// if you omit it.
      </p>
    </form>
  );
}
