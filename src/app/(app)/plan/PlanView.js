"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GoChevronRight, GoMoon, GoSync, GoZap } from "react-icons/go";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/ui/Card";
import { Chip } from "../../components/ui/Choice";
import RegeneratePlan from "../../components/RegeneratePlan";
import { WEEKDAYS, weekdayName } from "@/lib/dates";
import { formatWeight } from "@/lib/units";

export default function PlanView({ plan, units }) {
  const [today, setToday] = useState(null);
  const [selected, setSelected] = useState(null);
  const [regenOpen, setRegenOpen] = useState(false);

  useEffect(() => {
    const t = weekdayName(new Date());
    setToday(t);
    setSelected(t);
  }, []);

  const day = plan.weeklyRoutine.find((d) => d.day === (selected ?? "Monday"));
  const trainingDays = plan.weeklyRoutine.filter((d) => !d.restDay).length;

  return (
    <>
      <PageHeader
        title="Your plan"
        subtitle={`${trainingDays} training days a week`}
        actions={
          <button
            onClick={() => setRegenOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm font-semibold hover:bg-surface-2"
          >
            <GoSync /> <span className="hidden sm:inline">Regenerate</span>
            <span className="sr-only sm:hidden">Regenerate plan</span>
          </button>
        }
      />

      {plan.summary && (
        <Card className="mb-5 flex gap-3 p-4">
          <GoZap className="mt-0.5 shrink-0 text-accent" size={18} />
          <div className="text-sm">
            <p className="text-muted">{plan.summary}</p>
            <p className="mt-1.5 text-xs font-medium text-muted/80">
              Built by {plan.source === "ai" ? "the AI coach" : "the built-in coach"}
            </p>
          </div>
        </Card>
      )}

      <div role="tablist" aria-label="Days of the week" className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-7 md:px-0">
        {WEEKDAYS.map((name) => {
          const d = plan.weeklyRoutine.find((x) => x.day === name);
          const active = name === selected;
          return (
            <button
              key={name}
              role="tab"
              aria-selected={active}
              onClick={() => setSelected(name)}
              className={`flex min-w-[64px] flex-col items-center rounded-xl border px-2 py-2.5 transition ${
                active ? "border-accent bg-accent text-accent-ink" : "border-line bg-surface hover:bg-surface-2"
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wide opacity-80">{name.slice(0, 3)}</span>
              <span className={`mt-1 h-1.5 w-1.5 rounded-full ${d.restDay ? (active ? "bg-accent-ink/40" : "bg-line") : active ? "bg-accent-ink" : "bg-accent"}`} />
              {name === today && <span className="mt-1 text-[10px] font-bold uppercase">Today</span>}
            </button>
          );
        })}
      </div>

      {day && (
        <section role="tabpanel" aria-label={day.day}>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-xl font-bold">{day.day}</h2>
            <p className="text-sm text-muted">{day.restDay ? "Rest & recovery" : day.focus.join(" · ")}</p>
          </div>
          {day.restDay && (
            <p className="mb-3 flex items-center gap-2 rounded-xl bg-surface-2 p-3 text-sm text-muted">
              <GoMoon /> Rest day — these light recovery moves are optional.
            </p>
          )}
          <ul className="space-y-2.5">
            {day.exercises.map((ex) => (
              <li key={ex.slug}>
                <Link href={`/exercise/${ex.slug}`} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:bg-surface-2">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{ex.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                      {ex.sets} × {ex.reps} · rest {ex.rest}
                      {ex.recommendedKg ? <Chip tone="accent">{formatWeight(ex.recommendedKg, units)}</Chip> : null}
                    </span>
                  </span>
                  <GoChevronRight className="shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <RegeneratePlan open={regenOpen} onClose={() => setRegenOpen(false)} />
    </>
  );
}
