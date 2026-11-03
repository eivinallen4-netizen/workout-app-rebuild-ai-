import { WEEKDAYS } from "./dates";

export function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const youtubeSearchUrl = (name) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} exercise proper form`)}`;

/** Target reps for a given set from strings like "5", "8-12", "5,5,5,5,5+", "30 sec". */
export function targetReps(reps, setIndex = 0) {
  const s = String(reps ?? "");
  const parts = s.includes(",") ? s.split(",") : [s];
  const part = parts[Math.min(setIndex, parts.length - 1)];
  const m = part.match(/\d+/);
  return m ? Number(m[0]) : null;
}

export const isTimed = (reps) => /sec|min|\bs\b|\d+s\b/i.test(String(reps ?? ""));

/** Rest in seconds from strings like "90s", "2-3 minutes", "60-90 sec". */
export function restSeconds(rest) {
  const s = String(rest ?? "");
  const m = s.match(/(\d+(?:\.\d+)?)/);
  if (!m) return 90;
  const n = Number(m[1]);
  return /min/i.test(s) ? Math.round(n * 60) : Math.round(n);
}

/** Returns the plan day for a weekday name. */
export function planDay(plan, dayName) {
  return plan?.weeklyRoutine?.find((d) => d.day === dayName) ?? null;
}

export function findExercise(plan, slug) {
  for (const day of plan?.weeklyRoutine ?? []) {
    const idx = day.exercises.findIndex((e) => e.slug === slug);
    if (idx !== -1) return { day, exercise: day.exercises[idx], index: idx };
  }
  return null;
}

const toStr = (v, fallback = "") => (v == null ? fallback : String(v).trim());

/**
 * Coerces a raw plan (AI output or builtin) into the shape the app relies on.
 * `toKg` converts an AI-provided weight in the user's units to kg.
 */
export function normalizePlan(raw, { toKg = (n) => n } = {}) {
  const list = Array.isArray(raw?.weeklyRoutine) ? raw.weeklyRoutine : [];
  const byDay = new Map();
  for (const d of list) {
    const name = WEEKDAYS.find((w) => w.toLowerCase() === toStr(d?.day).toLowerCase());
    if (name && !byDay.has(name)) byDay.set(name, d);
  }

  const weeklyRoutine = WEEKDAYS.map((day) => {
    const d = byDay.get(day) ?? { restDay: true, focus: ["Rest"], exercises: [] };
    const seen = new Set();
    const exercises = (Array.isArray(d.exercises) ? d.exercises : [])
      .filter((e) => toStr(e?.name))
      .slice(0, 10)
      .map((e) => {
        let slug = slugify(e.name);
        while (seen.has(slug)) slug += "-2";
        seen.add(slug);
        let recommendedKg = typeof e.recommendedKg === "number" ? e.recommendedKg : null;
        if (recommendedKg == null && typeof e.recommendedWeight === "number" && e.recommendedWeight > 0)
          recommendedKg = toKg(e.recommendedWeight);
        const sets = Math.min(10, Math.max(1, Math.round(Number(e.sets) || 3)));
        return {
          name: toStr(e.name).slice(0, 80),
          slug,
          sets,
          reps: toStr(e.reps, "10").slice(0, 40),
          rest: toStr(e.rest, "90 sec").slice(0, 40),
          tip: toStr(e.tip).slice(0, 300),
          notes: toStr(e.notes).slice(0, 600),
          recommendedKg,
          weightNote:
            recommendedKg == null
              ? toStr(typeof e.recommendedWeight === "string" ? e.recommendedWeight : e.weightNote).slice(0, 60)
              : toStr(e.weightNote).slice(0, 60),
          pattern: e.pattern ?? null,
        };
      });
    const restDay = Boolean(d.restDay) || exercises.length === 0;
    return {
      day,
      restDay,
      focus: (Array.isArray(d.focus) ? d.focus : [d.focus]).map((f) => toStr(f)).filter(Boolean).slice(0, 4),
      tips: (Array.isArray(d.tips) ? d.tips : []).map((t) => toStr(t)).filter(Boolean).slice(0, 4),
      exercises,
    };
  });

  return { summary: toStr(raw?.summary).slice(0, 600), weeklyRoutine };
}
