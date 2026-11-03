import { GoCheck } from "react-icons/go";

/** Large selectable card used for single / multi choice questions. */
export function ChoiceCard({ selected, onClick, label, hint, multi }) {
  return (
    <button
      type="button"
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
        selected ? "border-accent bg-accent-soft/60 ring-1 ring-accent" : "border-line bg-surface hover:bg-surface-2"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{label}</span>
        {hint && <span className="mt-0.5 block text-sm text-muted">{hint}</span>}
      </span>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center border-2 transition ${multi ? "rounded-md" : "rounded-full"} ${
          selected ? "border-accent bg-accent text-accent-ink" : "border-line"
        }`}
      >
        {selected && <GoCheck size={14} strokeWidth={1} />}
      </span>
    </button>
  );
}

/** Compact segmented control. */
export function Segmented({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition ${
            value === o.value ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "bg-surface-2 text-muted",
    accent: "bg-accent-soft text-accent",
    warn: "bg-warn/15 text-warn",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}>{children}</span>;
}
