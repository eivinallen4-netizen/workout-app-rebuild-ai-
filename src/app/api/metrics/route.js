import { z } from "zod";
import { query } from "@/lib/db";
import { isDateStr } from "@/lib/dates";
import { json, withUser } from "@/lib/http";

export const dynamic = "force-dynamic";

const dateStr = z.string().refine(isDateStr, "Invalid date");

export const GET = withUser(async (_req, user) => {
  const r = await query("SELECT date, weight_kg FROM body_metrics WHERE user_id = ? ORDER BY date LIMIT 1000", [user.id]);
  return json({ metrics: r.rows.map((m) => ({ date: m.date, weightKg: Number(m.weight_kg) })) });
});

export const POST = withUser(async (req, user) => {
  const { date, weightKg } = z.object({ date: dateStr, weightKg: z.number().min(20).max(400) }).parse(await req.json());
  await query(
    `INSERT INTO body_metrics (user_id, date, weight_kg) VALUES (?, ?, ?)
     ON CONFLICT(user_id, date) DO UPDATE SET weight_kg = excluded.weight_kg`,
    [user.id, date, weightKg]
  );
  return json({ ok: true });
});

export const DELETE = withUser(async (req, user) => {
  const date = dateStr.parse(req.nextUrl.searchParams.get("date"));
  await query("DELETE FROM body_metrics WHERE user_id = ? AND date = ?", [user.id, date]);
  return json({ ok: true });
});
