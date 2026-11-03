"use client";
import { useId } from "react";

const inputCls =
  "h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-[16px] text-ink placeholder:text-muted/70 transition focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 aria-[invalid=true]:border-danger";

export function Field({ label, hint, error, children, className = "" }) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined, className: inputCls })}
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({ label, hint, error, className, suffix, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(f) =>
        suffix ? (
          <div className="relative">
            <input {...f} {...props} className={`${f.className} pr-12`} />
            <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-muted">{suffix}</span>
          </div>
        ) : (
          <input {...f} {...props} />
        )
      }
    </Field>
  );
}

export function TextArea({ label, hint, error, className, ...props }) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(f) => <textarea {...f} {...props} className={`${f.className} h-auto min-h-[96px] py-3`} />}
    </Field>
  );
}

export { inputCls };
