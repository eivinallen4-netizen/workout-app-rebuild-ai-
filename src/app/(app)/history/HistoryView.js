"use client";
import { useCallback, useEffect, useState } from "react";
import { GoHistory, GoTrash } from "react-icons/go";
import PageHeader from "../../components/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { ConfirmSheet } from "../../components/ui/Sheet";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { api } from "@/lib/api";
import { sessionsByDate } from "@/lib/logs";
import { addDays, fromDateStr, toDateStr } from "@/lib/dates";
import { kgToDisplay, weightUnit } from "@/lib/units";

const WINDOW_DAYS = 60;

export default function HistoryView({ units }) {
  const toast = useToast();
  const [logs, setLogs] = useState(null);
  const [days, setDays] = useState(WINDOW_DAYS);
  const [error, setError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [pending, setPending] = useState(null); // { date, name }
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (span) => {
    setError("");
    const now = new Date();
    try {
      const res = await api(`/api/logs?from=${toDateStr(addDays(now, -span))}&to=${toDateStr(now)}`);
      setLogs(res.logs);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load(WINDOW_DAYS);
  }, [load]);

  async function loadMore() {
    setLoadingMore(true);
    const span = days + WINDOW_DAYS * 2;
    await load(span);
    setDays(span);
    setLoadingMore(false);
  }

  async function remove() {
    setDeleting(true);
    try {
      await api(`/api/logs?date=${pending.date}&exercise=${encodeURIComponent(pending.name)}`, { method: "DELETE" });
      setLogs((l) => l.filter((x) => !(x.date === pending.date && x.exerciseName === pending.name)));
      toast("Entry removed");
      setPending(null);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setDeleting(false);
    }
  }

  const sessions = logs ? sessionsByDate(logs) : null;
  const u = weightUnit(units);

  return (
    <>
      <PageHeader title="History" subtitle="Every set you've logged." />
      {error && <ErrorState message={error} onRetry={() => load(days)} />}
      {!sessions && !error && [0, 1, 2].map((i) => <Skeleton key={i} className="mb-3 h-32 w-full" />)}
      {sessions?.length === 0 && (
        <EmptyState icon={GoHistory} title="No workouts logged yet" action={<Button href="/">Go to today&apos;s workout</Button>}>
          Complete sets from the Today tab and they&apos;ll show up here.
        </EmptyState>
      )}

      <ul className="space-y-4">
        {sessions?.map((s) => {
          const d = fromDateStr(s.date);
          return (
            <li key={s.date}>
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
                  <div>
                    <p className="font-semibold">{d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
                    <p className="text-sm text-muted">
                      {s.exercises.length} exercises · {s.totalSets} sets
                      {s.volumeKg > 0 && ` · ${Math.round(kgToDisplay(s.volumeKg, units)).toLocaleString()} ${u} volume`}
                    </p>
                  </div>
                </div>
                <ul className="divide-y divide-line">
                  {s.exercises.map((ex) => (
                    <li key={ex.name} className="flex items-start gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{ex.name}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {ex.sets.map((set) => (
                            <span key={set.setIndex} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs tabular-nums text-muted">
                              {set.reps ?? "–"}
                              {set.weightKg ? ` × ${kgToDisplay(set.weightKg, units)}` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => setPending({ date: s.date, name: ex.name })}
                        aria-label={`Remove ${ex.name} from ${s.date}`}
                        className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"
                      >
                        <GoTrash size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          );
        })}
      </ul>

      {sessions?.length > 0 && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={loadMore} loading={loadingMore}>
            Load older workouts
          </Button>
        </div>
      )}

      <ConfirmSheet
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={remove}
        loading={deleting}
        danger
        confirmLabel="Remove"
        title="Remove this entry?"
        description={pending ? `All sets of ${pending.name} on this day will be deleted.` : ""}
      />
    </>
  );
}
