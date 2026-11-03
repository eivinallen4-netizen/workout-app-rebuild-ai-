"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GoCheck, GoInfo, GoPlus, GoSync } from "react-icons/go";
import Sheet from "./ui/Sheet";
import Button from "./ui/Button";
import { Chip } from "./ui/Choice";
import { useToast } from "./ui/Toast";
import { api } from "@/lib/api";
import { isTimed, restSeconds, targetReps } from "@/lib/plan";
import { displayToKg, formatWeight, kgToDisplay, weightUnit } from "@/lib/units";

function initialRows(exercise, logged, units) {
  const count = Math.max(exercise.sets, ...logged.map((l) => l.setIndex + 1));
  const defWeight = exercise.recommendedKg ? String(kgToDisplay(exercise.recommendedKg, units)) : "";
  return Array.from({ length: count }, (_, i) => {
    const log = logged.find((l) => l.setIndex === i);
    if (log) return { reps: log.reps == null ? "" : String(log.reps), weight: log.weightKg == null ? "" : String(kgToDisplay(log.weightKg, units)), done: true };
    // Prefill from the previous logged set so users only adjust what changed.
    const prev = logged.filter((l) => l.setIndex < i).sort((a, b) => b.setIndex - a.setIndex)[0];
    const t = targetReps(exercise.reps, i);
    return {
      reps: t == null ? "" : String(t),
      weight: prev?.weightKg != null ? String(kgToDisplay(prev.weightKg, units)) : defWeight,
      done: false,
    };
  });
}

export default function ExerciseLogger({ open, onClose, exercise, dayName, date, units, logged, onLogsChange, onSwapped }) {
  const toast = useToast();
  const [rows, setRows] = useState(() => initialRows(exercise, logged, units));
  const [busy, setBusy] = useState(null);
  const [rest, setRest] = useState(null); // seconds remaining
  const [swapping, setSwapping] = useState(false);
  const timer = useRef(null);
  const timed = isTimed(exercise.reps);
  const u = weightUnit(units);

  useEffect(() => setRows(initialRows(exercise, logged, units)), [exercise.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (rest == null) return;
    if (rest <= 0) {
      setRest(null);
      navigator.vibrate?.(200);
      return;
    }
    timer.current = setTimeout(() => setRest((r) => (r == null ? null : r - 1)), 1000);
    return () => clearTimeout(timer.current);
  }, [rest]);

  const toSet = (r, i) => ({
    exerciseName: exercise.name,
    setIndex: i,
    reps: r.reps === "" ? null : Math.max(0, Math.round(Number(r.reps))),
    weightKg: r.weight === "" ? null : displayToKg(r.weight, units),
  });

  const emit = (next) =>
    onLogsChange(next.map((r, i) => (r.done ? toSet(r, i) : null)).filter(Boolean));

  async function toggle(i) {
    const row = rows[i];
    const next = rows.map((r, j) => (j === i ? { ...r, done: !r.done } : r));
    setRows(next);
    setBusy(i);
    try {
      if (row.done) {
        await api(`/api/logs?date=${date}&exercise=${encodeURIComponent(exercise.name)}&set=${i}`, { method: "DELETE" });
      } else {
        await api("/api/logs", { method: "POST", body: { date, sets: [toSet(row, i)] } });
        const remaining = next.some((r) => !r.done);
        if (remaining) setRest(restSeconds(exercise.rest));
        else {
          setRest(null);
          toast(`${exercise.name} complete 💪`);
        }
      }
      emit(next);
    } catch (e) {
      setRows(rows);
      toast(e.message, "error");
    } finally {
      setBusy(null);
    }
  }

  async function completeAll() {
    const next = rows.map((r) => ({ ...r, done: true }));
    const sets = next.map(toSet).filter((_, i) => !rows[i].done);
    if (!sets.length) return onClose();
    setBusy("all");
    try {
      await api("/api/logs", { method: "POST", body: { date, sets } });
      setRows(next);
      emit(next);
      toast(`${exercise.name} complete 💪`);
      onClose();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(null);
    }
  }

  async function swap() {
    setSwapping(true);
    try {
      const res = await api("/api/plan/swap", { method: "POST", body: { day: dayName, slug: exercise.slug } });
      toast(`Swapped for ${res.exercise.name}`);
      onSwapped(res.day, res.exercise);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSwapping(false);
    }
  }

  const update = (i, patch) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const anyDone = rows.some((r) => r.done);
  const allDone = rows.every((r) => r.done);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={exercise.name}
      description={`${exercise.sets} sets × ${exercise.reps} · Rest ${exercise.rest}`}
      footer={
        <Button block size="lg" onClick={completeAll} loading={busy === "all"} variant={allDone ? "secondary" : "primary"}>
          {allDone ? "Done" : anyDone ? "Complete remaining sets" : "Complete all sets"}
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {exercise.recommendedKg ? <Chip tone="accent">Suggested {formatWeight(exercise.recommendedKg, units)}</Chip> : exercise.weightNote ? <Chip>{exercise.weightNote}</Chip> : null}
        <Link href={`/exercise/${exercise.slug}`} className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-muted hover:bg-surface-2 hover:text-ink">
          <GoInfo /> How to
        </Link>
        {!anyDone && (
          <button onClick={swap} disabled={swapping} className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-50">
            <GoSync className={swapping ? "animate-spin" : ""} /> {swapping ? "Swapping…" : "Swap exercise"}
          </button>
        )}
      </div>

      {exercise.tip && <p className="mb-4 rounded-xl bg-surface-2 p-3 text-sm text-muted"><span className="font-semibold text-ink">Cue: </span>{exercise.tip}</p>}

      {rest != null && (
        <div className="mb-4 flex items-center justify-between rounded-xl bg-accent-soft px-4 py-3" role="timer" aria-live="off">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Rest</p>
            <p className="text-2xl font-bold tabular-nums text-accent">
              {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, "0")}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setRest((r) => r + 30)} className="h-10 rounded-lg bg-surface px-3 text-sm font-semibold">+30s</button>
            <button onClick={() => setRest(null)} className="h-10 rounded-lg bg-surface px-3 text-sm font-semibold">Skip</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[2.5rem_1fr_1fr_3rem] items-center gap-x-2.5 gap-y-2">
        <span className="text-xs font-semibold uppercase text-muted">Set</span>
        <span className="text-xs font-semibold uppercase text-muted">{timed ? "Time" : "Reps"}</span>
        <span className="text-xs font-semibold uppercase text-muted">Weight ({u})</span>
        <span>
          <span className="sr-only">Done</span>
        </span>
        {rows.map((r, i) => (
          <SetRow key={i} i={i} r={r} busy={busy === i} onChange={(p) => update(i, p)} onToggle={() => toggle(i)} />
        ))}
      </div>
      <button
        onClick={() => setRows((rs) => [...rs, { ...rs[rs.length - 1], done: false }])}
        className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-muted hover:text-ink"
      >
        <GoPlus /> Add set
      </button>
      {exercise.notes && <p className="mt-3 text-sm text-muted">{exercise.notes}</p>}
    </Sheet>
  );
}

function SetRow({ i, r, busy, onChange, onToggle }) {
  const input =
    "h-12 w-full rounded-xl border border-line bg-surface text-center text-[16px] font-semibold tabular-nums focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15 disabled:bg-surface-2 disabled:text-muted";
  return (
    <>
      <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${r.done ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"}`}>{i + 1}</span>
      <input aria-label={`Set ${i + 1} reps`} className={input} type="number" inputMode="numeric" value={r.reps} disabled={r.done} onChange={(e) => onChange({ reps: e.target.value })} placeholder="–" />
      <input aria-label={`Set ${i + 1} weight`} className={input} type="number" inputMode="decimal" value={r.weight} disabled={r.done} onChange={(e) => onChange({ weight: e.target.value })} placeholder="–" />
      <button
        onClick={onToggle}
        disabled={busy}
        aria-pressed={r.done}
        aria-label={r.done ? `Undo set ${i + 1}` : `Mark set ${i + 1} done`}
        className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition disabled:opacity-60 ${
          r.done ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:border-accent hover:text-accent"
        }`}
      >
        <GoCheck size={22} />
      </button>
    </>
  );
}
