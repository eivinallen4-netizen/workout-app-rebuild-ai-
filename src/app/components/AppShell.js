"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GoHome, GoCalendar, GoGraph, GoHistory, GoGear } from "react-icons/go";
import Logo from "./Logo";

const NAV = [
  { href: "/", label: "Today", icon: GoHome },
  { href: "/plan", label: "Plan", icon: GoCalendar },
  { href: "/progress", label: "Progress", icon: GoGraph },
  { href: "/history", label: "History", icon: GoHistory },
  { href: "/settings", label: "Settings", icon: GoGear },
];

const isActive = (pathname, href) =>
  href === "/" ? pathname === "/" || pathname.startsWith("/exercise") : pathname.startsWith(href);

export default function AppShell({ userName, children }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh md:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface px-4 py-6 md:flex">
        <Link href="/" className="mb-8 px-2">
          <Logo withText />
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-11 items-center gap-3 rounded-xl px-3 font-medium transition ${
                  active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-sm font-bold">
            {userName?.[0]?.toUpperCase()}
          </span>
          <span className="truncate text-sm font-medium">{userName}</span>
        </div>
      </aside>

      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-10">
        {children}
      </main>

      {/* Mobile tab bar */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-safe backdrop-blur md:hidden">
        <ul className="mx-auto flex max-w-lg">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${
                    active ? "text-accent" : "text-muted"
                  }`}
                >
                  <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${active ? "bg-accent-soft" : ""}`}>
                    <Icon size={20} />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
