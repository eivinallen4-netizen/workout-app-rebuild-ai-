export default function Logo({ className = "", withText = false }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-ink shadow-sm">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
      {withText && <span className="text-lg font-bold tracking-tight">Workout Planner</span>}
    </span>
  );
}
