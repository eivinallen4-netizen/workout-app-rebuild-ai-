import { addDays, fromDateStr, startOfWeek, toDateStr, weekdayName } from "./dates";
import { planDay } from "./plan";

export function groupLogs(logs) {
  const map = {};
  for (const l of logs) (map[l.exerciseName] ??= []).push(l);
  return map;
}

/** [{ date, exercises: [{ name, sets, bestKg, volumeKg, reps }] , totalSets, volumeKg }] newest first */
export function sessionsByDate(logs) {
  const byDate = new Map();
  for (const l of logs) {
    if (!byDate.has(l.date)) byDate.set(l.date, new Map());
    const ex = byDate.get(l.date);
    if (!ex.has(l.exerciseName)) ex.set(l.exerciseName, []);
    ex.get(l.exerciseName).push(l);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, ex]) => {
      const exercises = [...ex.entries()].map(([name, sets]) => ({
        name,
        sets: sets.sort((a, b) => a.setIndex - b.setIndex),
        bestKg: Math.max(0, ...sets.map((s) => s.weightKg ?? 0)) || null,
        volumeKg: sets.reduce((t, s) => t + (s.reps ?? 0) * (s.weightKg ?? 0), 0),
      }));
      return {
        date,
        exercises,
        totalSets: exercises.reduce((t, e) => t + e.sets.length, 0),
        volumeKg: exercises.reduce((t, e) => t + e.volumeKg, 0),
      };
    });
}

/** Consecutive scheduled training days completed, skipping rest days and today if not yet trained. */
export function trainingStreak(plan, trainedDates, today = new Date()) {
  const set = new Set(trainedDates);
  let streak = 0;
  for (let i = 0; i < 120; i++) {
    const d = addDays(today, -i);
    const ds = toDateStr(d);
    const pd = planDay(plan, weekdayName(d));
    if (set.has(ds)) {
      streak++;
      continue;
    }
    if (i === 0 || pd?.restDay) continue;
    break;
  }
  return streak;
}

export function weekRange(d = new Date()) {
  const start = startOfWeek(d);
  return { start, end: addDays(start, 6), from: toDateStr(start), to: toDateStr(addDays(start, 6)) };
}

export const dateLabel = (ds) => fromDateStr(ds);
