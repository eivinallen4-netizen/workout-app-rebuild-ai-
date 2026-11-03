"use client";
import { useEffect, useState } from "react";
import { GoPlay, GoLinkExternal } from "react-icons/go";
import PageHeader from "../../../components/PageHeader";
import Card, { SectionTitle } from "../../../components/ui/Card";
import { Chip } from "../../../components/ui/Choice";
import { EmptyState, Skeleton } from "../../../components/ui/States";
import { api } from "@/lib/api";
import { sessionsByDate } from "@/lib/logs";
import { fromDateStr, formatShort } from "@/lib/dates";
import { youtubeSearchUrl } from "@/lib/plan";
import { formatWeight, kgToDisplay, weightUnit } from "@/lib/units";

export default function ExerciseDetail({ exercise, days, units }) {
  const [sessions, setSessions] = useState(null);

  useEffect(() => {
    api(`/api/logs?exercise=${encodeURIComponent(exercise.name)}`)
      .then((r) => setSessions(sessionsByDate(r.logs)))
      .catch(() => setSessions([]));
  }, [exercise.name]);

  const best = sessions?.length ? Math.max(...sessions.map((s) => s.exercises[0].bestKg ?? 0)) : 0;

  return (
    <>
      <PageHeader back="/plan" title={exercise.name} subtitle={`On your plan: ${days.join(", ")}`} />

      <div className="mb-6 grid grid-cols-3 gap-2.5">
        <Stat label="Sets" value={exercise.sets} />
        <Stat label="Reps" value={exercise.reps} />
        <Stat label="Rest" value={exercise.rest} />
      </div>

      <Card className="mb-6 divide-y divide-line">
        {(exercise.recommendedKg || exercise.weightNote) && (
          <Row label="Working weight">
            {exercise.recommendedKg ? <Chip tone="accent">{formatWeight(exercise.recommendedKg, units)}</Chip> : null}
            {exercise.weightNote && <span className="text-sm text-muted">{exercise.weightNote}</span>}
          </Row>
        )}
        {exercise.tip && <Row label="Coaching cue"><span className="text-[15px]">{exercise.tip}</span></Row>}
        {exercise.notes && <Row label="Progression"><span className="text-[15px] text-muted">{exercise.notes}</span></Row>}
      </Card>

      <a
        href={youtubeSearchUrl(exercise.name)}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-8 flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:bg-surface-2"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger/10 text-danger">
          <GoPlay size={22} />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Watch form videos</span>
          <span className="text-sm text-muted">Opens YouTube demonstrations</span>
        </span>
        <GoLinkExternal className="text-muted" />
      </a>

      <SectionTitle action={best > 0 ? <span className="text-sm font-medium text-muted">Best: {formatWeight(best, units)}</span> : null}>
        Your history
      </SectionTitle>
      {!sessions ? (
        <Skeleton className="h-24 w-full" />
      ) : sessions.length === 0 ? (
        <EmptyState title="No sets logged yet">Log this exercise from the Today tab and your history will appear here.</EmptyState>
      ) : (
        <ul className="space-y-2.5">
          {sessions.slice(0, 20).map((s) => (
            <li key={s.date} className="rounded-2xl border border-line bg-surface p-4">
              <p className="mb-2 text-sm font-semibold">{formatShort(fromDateStr(s.date))}</p>
              <div className="flex flex-wrap gap-1.5">
                {s.exercises[0].sets.map((set) => (
                  <span key={set.setIndex} className="rounded-lg bg-surface-2 px-2.5 py-1 text-sm tabular-nums">
                    {set.reps ?? "–"}
                    {set.weightKg ? ` × ${kgToDisplay(set.weightKg, units)} ${weightUnit(units)}` : ""}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 truncate font-bold" title={String(value)}>{value}</p>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="p-4">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
