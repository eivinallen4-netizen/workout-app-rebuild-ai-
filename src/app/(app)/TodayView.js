"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GoCheck, GoChevronRight, GoLightBulb, GoMoon, GoTrophy } from "react-icons/go";
import Card, { SectionTitle } from "../components/ui/Card";
import ProgressRing from "../components/ui/ProgressRing";
import { Skeleton, ErrorState } from "../components/ui/States";
import { Chip } from "../components/ui/Choice";
import ExerciseLogger from "../components/ExerciseLogger";
import { api } from "@/lib/api";
import { addDays, formatLong, toDateStr, weekdayName } from "@/lib/dates";
import { planDay } from "@/lib/plan";
import { groupLogs } from "@/lib/logs";
import { formatWeight } from "@/lib/units";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function TodayView({ plan: initialPlan, units, name }) {
  const [plan, setPlan] = useState(initialPlan);
  const [now, setNow] = useState(null);
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState("");
  const [openSlug, setOpenSlug] = useState(null);

  // Dates depend on the user's timezone, so compute them in the browser.
  useEffect(() => setNow(new Date()), []);
  const date = now ? toDateStr(now) : null;
  const day = now ? planDay(plan, weekdayName(now)) : null;
  const tomorrow = now ? planDay(plan, weekdayName(addDays(now, 1))) : null;

  const load = useCallback(async () => {
    if (!date) return;
    setError("");
    try {
      const res = await api(`/api/logs?from=${date}&to=${date}`);
      setLogs(groupLogs(res.logs));
    } catch (e) {
      setError(e.message);
    }
  }, [date]);
  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    if (!day || !logs) return { done: 0, total: 0 };
    const done = day.exercises.filter((e) => (logs[e.name]?.length ?? 0) >= e.sets).length;
    return { done, total: day.exercises.length };
  }, [day, logs]);

  if (!now || !day) return <TodaySkeleton />;

  const openExercise = day.exercises.find((e) => e.slug === openSlug);
  const allDone = stats.total > 0 && stats.done === stats.total;

  return (
    <>
      <header className="mb-6">
        <p className="text-sm font-medium text-muted">{formatLong(now)}</p>
        <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight md:text-3xl">
          {greeting()}, {name.split(" ")[0]}
        </h1>
      </header>

      <Card className="mb-6 overflow-hidden">
        <div className="flex items-center gap-4 p-5">
          {day.restDay ? (
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
              <GoMoon size={28} />
            </div>
          ) : (
            <ProgressRing value={stats.done} max={stats.total} label={`${stats.done} of ${stats.total} exercises done`}>
              {allDone ? <GoCheck size={28} className="text-accent" /> : <span className="text-lg font-bold">{stats.done}/{stats.total}</span>}
            </ProgressRing>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted">{day.restDay ? "Rest & recovery day" : "Today's focus"}</p>
            <p className="text-xl font-bold leading-snug">{day.focus.join(" · ") || "Training"}</p>
            <p className="mt-0.5 text-sm text-muted">
              {day.restDay
                ? "Optional light mobility below — recovery is part of the plan."
                : allDone
                  ? "Workout complete. Great job!"
                  : `${day.exercises.length} exercises · tap one to log your sets`}
            </p>
          </div>
        </div>
        {allDone && (
          <div className="flex items-center gap-2 border-t border-line bg-accent-soft/60 px-5 py-3 text-sm font-semibold text-accent">
            <GoTrophy size={18} /> Session logged — see your progress on the Progress tab.
          </div>
        )}
      </Card>

      {error && <div className="mb-4"><ErrorState message={error} onRetry={load} /></div>}

      <SectionTitle>{day.restDay ? "Optional recovery" : "Exercises"}</SectionTitle>
      <ol className="space-y-2.5">
        {day.exercises.map((ex, i) => (
          <li key={ex.slug}>
            <ExerciseRow ex={ex} index={i} logged={logs?.[ex.name]?.length ?? 0} loading={!logs} units={units} onOpen={() => setOpenSlug(ex.slug)} />
          </li>
        ))}
      </ol>

      {day.tips.length > 0 && (
        <Card className="mt-6 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <GoLightBulb className="text-warn" size={18} /> Coach tips
          </h2>
          <ul className="space-y-2 text-[15px] text-muted">
            {day.tips.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tomorrow && (
        <Link href="/plan" className="mt-6 flex items-center justify-between rounded-2xl border border-line bg-surface p-4 transition hover:bg-surface-2">
          <span>
            <span className="block text-sm text-muted">Tomorrow</span>
            <span className="font-semibold">{tomorrow.restDay ? "Rest day" : tomorrow.focus.join(" · ")}</span>
          </span>
          <span className="flex items-center gap-1 text-sm font-medium text-muted">
            Full week <GoChevronRight />
          </span>
        </Link>
      )}

      {openExercise && (
        <ExerciseLogger
          open
          onClose={() => setOpenSlug(null)}
          exercise={openExercise}
          dayName={day.day}
          date={date}
          units={units}
          logged={logs?.[openExercise.name] ?? []}
          onLogsChange={(sets) => setLogs((l) => ({ ...l, [openExercise.name]: sets }))}
          onSwapped={(newDay, newEx) => {
            setPlan((p) => ({ ...p, weeklyRoutine: p.weeklyRoutine.map((d) => (d.day === newDay.day ? newDay : d)) }));
            setOpenSlug(newEx.slug);
          }}
        />
      )}
    </>
  );
}

function ExerciseRow({ ex, index, logged, loading, units, onOpen }) {
  const done = logged >= ex.sets;
  const weight = ex.recommendedKg ? formatWeight(ex.recommendedKg, units) : ex.weightNote;
  return (
    <button
      onClick={onOpen}
      className={`flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition active:scale-[.99] ${
        done ? "border-accent/40 bg-accent-soft/40" : "border-line bg-surface hover:bg-surface-2"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          done ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"
        }`}
        aria-hidden="true"
      >
        {done ? <GoCheck size={20} /> : index + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-semibold ${done ? "text-muted line-through decoration-accent/60" : ""}`}>{ex.name}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
          <span>
            {ex.sets} × {ex.reps}
          </span>
          {weight && <Chip tone={ex.recommendedKg ? "accent" : "neutral"}>{weight}</Chip>}
        </span>
        {!loading && logged > 0 && !done && (
          <span className="mt-2 flex gap-1" aria-label={`${logged} of ${ex.sets} sets logged`}>
            {Array.from({ length: ex.sets }, (_, i) => (
              <span key={i} className={`h-1.5 w-5 rounded-full ${i < logged ? "bg-accent" : "bg-line"}`} />
            ))}
          </span>
        )}
      </span>
      <GoChevronRight className="shrink-0 text-muted" size={18} />
      <span className="sr-only">{done ? "Completed" : "Open to log sets"}</span>
    </button>
  );
}

function TodaySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading today's workout">
      <Skeleton className="mb-2 h-4 w-40" />
      <Skeleton className="mb-6 h-8 w-64" />
      <Skeleton className="mb-6 h-28 w-full" />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="mb-2.5 h-[76px] w-full" />
      ))}
    </div>
  );
}
