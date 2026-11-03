import { z } from "zod";
import { query, batch, getActivePlan } from "@/lib/db";
import { isDateStr } from "@/lib/dates";
import { json, fail, withUser } from "@/lib/http";

export const dynamic = "force-dynamic";

const dateStr = z.string().refine(isDateStr, "Invalid date");

const mapRow = (r) => ({
  date: r.date,
  exerciseName: r.exercise_name,
  setIndex: Number(r.set_index),
  reps: r.reps == null ? null : Number(r.reps),
  weightKg: r.weight_kg == null ? null : Number(r.weight_kg),
});

// GET /api/logs?from=YYYY-MM-DD&to=YYYY-MM-DD  or  ?exercise=Name
export const GET = withUser(async (req, user) => {
  const p = req.nextUrl.searchParams;
  const exercise = p.get("exercise");
  let r;
  if (exercise) {
    r = await query(
      "SELECT date, exercise_name, set_index, reps, weight_kg FROM workout_logs WHERE user_id = ? AND exercise_name = ? ORDER BY date DESC, set_index LIMIT 500",
      [user.id, exercise]
    );
  } else {
    const from = dateStr.parse(p.get("from"));
    const to = dateStr.parse(p.get("to") ?? from);
    r = await query(
      "SELECT date, exercise_name, set_index, reps, weight_kg FROM workout_logs WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC, completed_at, set_index",
      [user.id, from, to]
    );
  }
  return json({ logs: r.rows.map(mapRow) });
});

const postSchema = z.object({
  date: dateStr,
  sets: z
    .array(
      z.object({
        exerciseName: z.string().trim().min(1).max(80),
        setIndex: z.number().int().min(0).max(20),
        reps: z.number().int().min(0).max(1000).nullable(),
        weightKg: z.number().min(0).max(1000).nullable(),
      })
    )
    .min(1)
    .max(50),
});

// POST: upsert one or more sets
export const POST = withUser(async (req, user) => {
  const { date, sets } = postSchema.parse(await req.json());
  const plan = await getActivePlan(user.id);
  await batch(
    sets.map((s) => ({
      sql: `INSERT INTO workout_logs (id, user_id, plan_id, date, exercise_name, set_index, reps, weight_kg)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, date, exercise_name, set_index)
            DO UPDATE SET reps = excluded.reps, weight_kg = excluded.weight_kg, completed_at = datetime('now')`,
      args: [crypto.randomUUID(), user.id, plan?.id ?? null, date, s.exerciseName, s.setIndex, s.reps, s.weightKg],
    }))
  );
  return json({ ok: true });
});

// DELETE /api/logs?date=...&exercise=...[&set=n]
export const DELETE = withUser(async (req, user) => {
  const p = req.nextUrl.searchParams;
  const date = dateStr.parse(p.get("date"));
  const exercise = p.get("exercise");
  if (!exercise) return fail("Missing exercise.");
  const set = p.get("set");
  if (set != null) {
    await query("DELETE FROM workout_logs WHERE user_id = ? AND date = ? AND exercise_name = ? AND set_index = ?", [
      user.id, date, exercise, Number(set),
    ]);
  } else {
    await query("DELETE FROM workout_logs WHERE user_id = ? AND date = ? AND exercise_name = ?", [user.id, date, exercise]);
  }
  return json({ ok: true });
});
