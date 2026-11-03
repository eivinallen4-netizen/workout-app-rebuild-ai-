export default function Card({ as: Tag = "div", className = "", children, ...props }) {
  return (
    <Tag className={`rounded-2xl border border-line bg-surface shadow-card ${className}`} {...props}>
      {children}
    </Tag>
  );
}

export function SectionTitle({ children, action, className = "" }) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-3 ${className}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{children}</h2>
      {action}
    </div>
  );
}
