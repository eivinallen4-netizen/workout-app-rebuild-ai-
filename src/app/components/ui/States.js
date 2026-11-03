export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
          <Icon size={22} />
        </div>
      )}
      <h3 className="font-semibold">{title}</h3>
      {children && <p className="mt-1 max-w-xs text-sm text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-surface-2 ${className}`} />;
}

export function ErrorState({ message, onRetry }) {
  return (
    <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm">
      <p className="font-medium text-danger">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 font-semibold text-ink underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}
