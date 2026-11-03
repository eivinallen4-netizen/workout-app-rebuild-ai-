"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart, LineChart } from "@mui/x-charts";
import { GoFlame, GoGraph } from "react-icons/go";
import PageHeader from "../../components/PageHeader";
import Card, { SectionTitle } from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { TextInput } from "../../components/ui/Field";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/States";
import { useToast } from "../../components/ui/Toast";
import { api } from "@/lib/api";
import { sessionsByDate, trainingStreak, weekRange } from "@/lib/logs";
import { WEEKDAYS, addDays, formatShort, fromDateStr, startOfWeek, toDateStr } from "@/lib/dates";
import { displayToKg, kgToDisplay, weightUnit } from "@/lib/units";

const ACCENT = "rgb(var(--accent))";
const chartSx = {
  "& .MuiChartsAxis-tickLabel": { fill: "rgb(var(--muted)) !important" },
  "& .MuiChartsAxis-label": { fill: "rgb(var(--muted)) !important" },
  "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": { stroke: "rgb(var(--line)) !important" },
  "& .MuiChartsGrid-line": { stroke: "rgb(var(--line))", strokeDasharray: "3 3" },
  "& .MuiChartsReferenceLine-line": { stroke: "rgb(var(--warn)) !important" },
  "& .MuiChartsReferenceLine-label": { fill: "rgb(var(--warn)) !important" },
};

export default function ProgressView({ plan, profile }) {
  const units = profile.units;
  const u = weightUnit(units);
  const toast = useToast();
  const [logs, setLogs] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");
  const [exercise, setExercise] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(null);

  const load = useCallback(async () => {
    const today = new Date();
    setNow(today);
    setError("");
    try {
      const from = toDateStr(addDays(startOfWeek(today), -7 * 11));
      const [l, m] = await Promise.all([api(`/api/logs?from=${from}&to=${toDateStr(today)}`), api("/api/metrics")]);
      setLogs(l.logs);
      setMetrics(m.metrics);
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const data = useMemo(() => {
    if (!logs || !now) return null;
    const sessions = sessionsByDate(logs);
    const week = weekRange(now);
    const thisWeek = sessions.filter((s) => s.date >= week.from && s.date <= week.to);
    const setsByDay = WEEKDAYS.map((_, i) => thisWeek.find((s) => s.date === toDateStr(addDays(week.start, i)))?.totalSets ?? 0);

    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = addDays(week.start, -7 * (7 - i));
      const from = toDateStr(start);
      const to = toDateStr(addDays(start, 6));
      return { label: formatShort(start), count: sessions.filter((s) => s.date >= from && s.date <= to).length };
    });

    // Best set weight per session for each exercise that has weights logged.
    const byExercise = {};
    for (const s of [...sessions].reverse())
      for (const ex of s.exercises) if (ex.bestKg) (byExercise[ex.name] ??= []).push({ date: s.date, kg: ex.bestKg });
    const exerciseNames = Object.keys(byExercise).sort((a, b) => byExercise[b].length - byExercise[a].length);

    return {
      workoutsThisWeek: thisWeek.length,
      setsThisWeek: thisWeek.reduce((t, s) => t + s.totalSets, 0),
      volumeThisWeek: thisWeek.reduce((t, s) => t + s.volumeKg, 0),
      streak: trainingStreak(plan, sessions.map((s) => s.date), now),
      setsByDay,
      weeks,
      byExercise,
      exerciseNames,
    };
  }, [logs, now, plan]);

  useEffect(() => {
    if (data && !exercise && data.exerciseNames[0]) setExercise(data.exerciseNames[0]);
  }, [data, exercise]);

  async function logWeight(e) {
    e.preventDefault();
    const kg = displayToKg(weightInput, units);
    if (!kg || kg < 20 || kg > 400) return toast("Enter a valid weight", "error");
    setSaving(true);
    try {
      const date = toDateStr(new Date());
      await api("/api/metrics", { method: "POST", body: { date, weightKg: kg } });
      setMetrics((m) => [...m.filter((x) => x.date !== date), { date, weightKg: kg }].sort((a, b) => (a.date < b.date ? -1 : 1)));
      setWeightInput("");
      toast("Weight logged");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (error) return (<><PageHeader title="Progress" /><ErrorState message={error} onRetry={load} /></>);
  if (!data || !metrics)
    return (
      <>
        <PageHeader title="Progress" />
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
        <Skeleton className="h-64 w-full" />
      </>
    );

  const exSeries = data.byExercise[exercise] ?? [];
  const latestWeight = metrics.at(-1);
  const hasAnyLogs = logs.length > 0;

  return (
    <>
      <PageHeader title="Progress" subtitle="Your consistency and strength over time." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="This week" value={`${data.workoutsThisWeek}/${profile.daysPerWeek}`} sub="workouts" />
        <Stat label="Streak" value={data.streak} sub={data.streak === 1 ? "training day" : "training days"} icon={data.streak > 0 ? <GoFlame className="text-warn" /> : null} />
        <Stat label="Sets" value={data.setsThisWeek} sub="this week" />
        <Stat label="Volume" value={Math.round(kgToDisplay(data.volumeThisWeek, units) ?? 0).toLocaleString()} sub={`${u} this week`} />
      </div>

      {!hasAnyLogs && (
        <div className="mb-6">
          <EmptyState icon={GoGraph} title="Your charts will appear here" action={<Button href="/">Start today&apos;s workout</Button>}>
            Log your first sets and we&apos;ll start tracking your progress.
          </EmptyState>
        </div>
      )}

      {hasAnyLogs && (
        <>
          <Card className="mb-6 p-4 pb-1">
            <SectionTitle>Sets this week</SectionTitle>
            <BarChart
              height={220}
              margin={{ top: 10, right: 10, bottom: 30, left: 36 }}
              xAxis={[{ scaleType: "band", data: WEEKDAYS.map((d) => d.slice(0, 3)) }]}
              yAxis={[{ tickMinStep: 1 }]}
              series={[{ data: data.setsByDay, color: ACCENT, label: "Sets" }]}
              slotProps={{ legend: { hidden: true } }}
              borderRadius={6}
              grid={{ horizontal: true }}
              sx={chartSx}
            />
          </Card>

          <Card className="mb-6 p-4 pb-1">
            <SectionTitle>Workouts per week</SectionTitle>
            <BarChart
              height={200}
              margin={{ top: 10, right: 10, bottom: 30, left: 30 }}
              xAxis={[{ scaleType: "band", data: data.weeks.map((w) => w.label) }]}
              yAxis={[{ tickMinStep: 1 }]}
              series={[{ data: data.weeks.map((w) => w.count), color: ACCENT, label: "Workouts" }]}
              slotProps={{ legend: { hidden: true } }}
              borderRadius={6}
              grid={{ horizontal: true }}
              sx={chartSx}
            />
          </Card>

          <Card className="mb-6 p-4 pb-1">
            <SectionTitle>Strength</SectionTitle>
            {data.exerciseNames.length === 0 ? (
              <p className="pb-4 text-sm text-muted">Log sets with a weight to see your strength trend.</p>
            ) : (
              <>
                <label className="sr-only" htmlFor="ex-select">Exercise</label>
                <select
                  id="ex-select"
                  value={exercise}
                  onChange={(e) => setExercise(e.target.value)}
                  className="mb-2 h-11 w-full rounded-xl border border-line bg-surface px-3 text-[15px] font-medium"
                >
                  {data.exerciseNames.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
                {exSeries.length < 2 ? (
                  <p className="pb-4 pt-2 text-sm text-muted">
                    Best so far: <strong className="text-ink">{kgToDisplay(exSeries[0]?.kg, units)} {u}</strong>. Log another session to see a trend.
                  </p>
                ) : (
                  <LineChart
                    height={220}
                    margin={{ top: 16, right: 16, bottom: 30, left: 44 }}
                    xAxis={[{ scaleType: "point", data: exSeries.map((p) => formatShort(fromDateStr(p.date))) }]}
                    series={[{ data: exSeries.map((p) => kgToDisplay(p.kg, units)), color: ACCENT, label: `Best set (${u})`, curve: "monotoneX" }]}
                    slotProps={{ legend: { hidden: true } }}
                    grid={{ horizontal: true }}
                    sx={chartSx}
                  />
                )}
              </>
            )}
          </Card>
        </>
      )}

      <Card className="p-4">
        <SectionTitle
          action={
            profile.goalWeightKg ? <span className="text-sm text-muted">Goal {kgToDisplay(profile.goalWeightKg, units)} {u}</span> : null
          }
        >
          Body weight
        </SectionTitle>
        <form onSubmit={logWeight} className="mb-3 flex items-end gap-2">
          <TextInput
            className="flex-1"
            label="Today's weight"
            type="number"
            inputMode="decimal"
            suffix={u}
            placeholder={latestWeight ? String(kgToDisplay(latestWeight.weightKg, units)) : String(kgToDisplay(profile.weightKg, units))}
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
          />
          <Button type="submit" size="lg" loading={saving}>
            Log
          </Button>
        </form>
        {metrics.length >= 2 ? (
          <LineChart
            height={220}
            margin={{ top: 16, right: 16, bottom: 30, left: 44 }}
            xAxis={[{ scaleType: "point", data: metrics.map((m) => formatShort(fromDateStr(m.date))) }]}
            series={[{ data: metrics.map((m) => kgToDisplay(m.weightKg, units)), color: ACCENT, label: `Weight (${u})`, curve: "monotoneX" }]}
            slotProps={{ legend: { hidden: true } }}
            grid={{ horizontal: true }}
            sx={chartSx}
          />
        ) : (
          <p className="text-sm text-muted">
            {metrics.length === 1 ? `Logged ${kgToDisplay(metrics[0].weightKg, units)} ${u}. ` : ""}Log your weight regularly (e.g. weekly, same time of day) to see a trend.
          </p>
        )}
      </Card>
    </>
  );
}

function Stat({ label, value, sub, icon }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-2xl font-bold tabular-nums">
        {icon}
        {value}
      </p>
      <p className="text-xs text-muted">{sub}</p>
    </Card>
  );
}
