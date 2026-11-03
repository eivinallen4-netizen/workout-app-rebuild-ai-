"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { GoX } from "react-icons/go";

/** Bottom sheet on mobile, centered dialog on larger screens. */
export default function Sheet({ open, onClose, title, description, children, footer }) {
  const panel = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      panel.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [];
    requestAnimationFrame(() => (focusable()[1] ?? focusable()[0])?.focus());

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = [...focusable()].filter((el) => !el.disabled);
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lastFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-black/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex max-h-[92dvh] w-full animate-slide-up flex-col rounded-t-2xl bg-surface shadow-sheet sm:max-w-lg sm:animate-pop-in sm:rounded-2xl"
      >
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden="true" />
        <div className="flex items-start gap-3 px-5 pb-3 pt-3 sm:pt-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold leading-tight">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="-mr-2 -mt-1 flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface-2">
            <GoX size={22} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4 pb-safe sm:pb-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmSheet({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", danger, loading }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <div className="flex gap-3">
          <button onClick={onClose} className="h-11 flex-1 rounded-xl bg-surface-2 font-semibold hover:bg-line/70">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`h-11 flex-1 rounded-xl font-semibold disabled:opacity-60 ${danger ? "bg-danger text-white" : "bg-accent text-accent-ink"}`}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      }
    />
  );
}
