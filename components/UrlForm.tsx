import type { FormEvent } from "react";

type UrlFormProps = {
  url: string;
  isLoading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUrlChange: (value: string) => void;
};

export default function UrlForm({ url, isLoading, onSubmit, onUrlChange }: UrlFormProps) {
  return (
    <form className="flex w-full flex-col gap-4" onSubmit={onSubmit} noValidate>
      <label className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
        Website URL
      </label>
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <input
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="https://example.com"
          aria-label="Website URL"
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          className="h-12 w-full flex-1 rounded-2xl border border-zinc-200 bg-white px-4 text-base text-zinc-900 shadow-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
          style={{ fontFamily: "var(--font-body)" }}
        />
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="h-12 rounded-2xl bg-zinc-950 px-6 text-sm font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-700"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {isLoading ? "Analyzing website..." : "Analyze"}
        </button>
      </div>
    </form>
  );
}
