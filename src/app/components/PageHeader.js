import Link from "next/link";
import { GoArrowLeft } from "react-icons/go";

export default function PageHeader({ title, eyebrow, subtitle, back, actions }) {
  return (
    <header className="mb-6">
      {back && (
        <Link href={back} className="-ml-2 mb-2 inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted hover:text-ink">
          <GoArrowLeft size={18} /> Back
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="mb-1 text-sm font-medium text-muted">{eyebrow}</p>}
          <h1 className="text-[28px] font-bold leading-tight tracking-tight md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
    </header>
  );
}
