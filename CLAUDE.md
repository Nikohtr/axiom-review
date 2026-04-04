# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

No test suite is configured yet.

## Stack

- **Next.js 16.2.2** with App Router — see `node_modules/next/dist/docs/` for this version's API
- **React 19.2.4** — Server Components by default; use `"use client"` only when needed (state, event handlers, browser APIs)
- **Tailwind CSS v4** — configured via `postcss.config.mjs`, no `tailwind.config` file
- **TypeScript**

## Architecture

This is a single-page AI UX analyzer called **Axiom Review**. The user pastes a URL and receives a UX/accessibility report.

### App structure

- `app/page.tsx` — sole page; `"use client"` component owning all state (`idle | loading | success | error`). Calls `POST /api/analyze` and renders results. Falls back to a `mockReport` on API error.
- `app/layout.tsx` — root layout; loads Geist fonts as CSS variables
- `app/api/analyze/` — **does not exist yet**; needs to be created as a Route Handler (`route.ts`) to handle the analysis request

### Component hierarchy

```
page.tsx
├── UrlForm          — controlled URL input + submit button
├── LoadingReport    — skeleton/spinner shown while fetching
└── ReportView       — renders a completed Report
    ├── IssueCard    — single UX issue (title, severity, evidence, fix)
    └── AccessibilityList — list of accessibility findings
```

### Key types (defined in `components/ReportView.tsx`)

```ts
Report {
  url, screenshot, pageTitle, uxSummary,
  topIssues: ReportIssue[],          // severity: "low" | "medium" | "high"
  accessibilityFindings: AccessibilityFinding[]  // impact: "minor" | "moderate" | "serious" | "critical"
}
```

### Adding the API route

Create `app/api/analyze/route.ts` exporting a `POST` handler. Route Handlers use Web `Request`/`Response` APIs:

```ts
import type { NextRequest } from 'next/server'
export async function POST(request: NextRequest) {
  const { url } = await request.json()
  // ... perform analysis ...
  return Response.json(report)
}
```