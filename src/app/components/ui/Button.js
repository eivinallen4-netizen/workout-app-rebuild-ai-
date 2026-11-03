import Link from "next/link";
import Spinner from "./Spinner";

const VARIANTS = {
  primary: "bg-accent text-accent-ink hover:brightness-105 active:brightness-95 shadow-sm",
  secondary: "bg-surface-2 text-ink hover:bg-line/70",
  outline: "border border-line bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink hover:bg-surface-2",
  danger: "bg-danger text-white hover:brightness-105",
  "danger-ghost": "text-danger hover:bg-danger/10",
};
const SIZES = {
  sm: "h-9 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-4 text-[15px] gap-2 rounded-xl",
  lg: "h-12 px-5 text-base gap-2 rounded-xl",
  icon: "h-11 w-11 rounded-xl",
};

export function buttonClass({ variant = "primary", size = "md", block, className = "" } = {}) {
  return [
    "inline-flex items-center justify-center font-semibold transition select-none",
    "disabled:opacity-50 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    block ? "w-full" : "",
    className,
  ].join(" ");
}

export default function Button({ variant, size, block, loading, className, children, href, ...props }) {
  const cls = buttonClass({ variant, size, block, className });
  if (href)
    return (
      <Link href={href} className={cls} {...props}>
        {children}
      </Link>
    );
  return (
    <button className={cls} disabled={loading || props.disabled} aria-busy={loading || undefined} {...props}>
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}
