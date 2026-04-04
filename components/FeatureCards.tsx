const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
    ),
    title: "Visual Capture",
    description: "Takes a real screenshot of your page as users see it",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 7V2h5" /><path d="M17 2h5v5" /><path d="M22 17v5h-5" /><path d="M7 22H2v-5" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    title: "Accessibility Audit",
    description: "Scans the live DOM for WCAG violations",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
        <line x1="10" y1="22" x2="14" y2="22" />
        <line x1="9" y1="17" x2="15" y2="17" />
      </svg>
    ),
    title: "UX Analysis",
    description: "AI identifies design flaws, hierarchy issues, and weak CTAs",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
    title: "Mobile Testing",
    description: "Tests on a real mobile viewport with touch-target analysis",
  },
];

export default function FeatureCards() {
  return (
    <div className="mt-14 grid w-full max-w-2xl grid-cols-2 gap-3 sm:gap-4">
      {FEATURES.map((feature) => (
        <div
          key={feature.title}
          className="group flex flex-col gap-2 rounded-xl border border-[var(--border-light)] bg-white/60 p-4 backdrop-blur-sm transition-all duration-200 hover:border-[var(--border)] hover:bg-white hover:shadow-sm"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface-warm)] text-[var(--accent)] transition-colors group-hover:bg-[var(--accent)]/10">
            {feature.icon}
          </div>
          <h3 className="text-sm font-semibold text-[var(--foreground)]">{feature.title}</h3>
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">{feature.description}</p>
        </div>
      ))}
    </div>
  );
}
