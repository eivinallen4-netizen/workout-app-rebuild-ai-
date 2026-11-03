import { z } from "zod";
import { getActivePlan, getProfile, updatePlanJson } from "@/lib/db";
import { aiConfigured, suggestAISwap } from "@/lib/ai";
import { alternativesFor, findInLibrary } from "@/lib/exerciseLibrary";
import { normalizePlan } from "@/lib/plan";
import { displayToKg } from "@/lib/units";
import { WEEKDAYS } from "@/lib/dates";
import { json, fail, withUser } from "@/lib/http";

const schema = z.object({
  day: z.enum(WEEKDAYS),
  slug: z.string().min(1),
  reason: z.string().trim().max(200).optional().default(""),
});

export const POST = withUser(async (req, user) => {
  const { day: dayName, slug, reason } = schema.parse(await req.json());
  const [plan, profile] = await Promise.all([getActivePlan(user.id), getProfile(user.id)]);
  if (!plan || !profile) return fail("No active plan.", 404);

  const day = plan.weeklyRoutine.find((d) => d.day === dayName);
  const index = day?.exercises.findIndex((e) => e.slug === slug) ?? -1;
  if (index === -1) return fail("Exercise not found in your plan.", 404);
  const current = day.exercises[index];
  const dayNames = day.exercises.map((e) => e.name);

  let replacement = null;
  const pattern = current.pattern ?? findInLibrary(current.name)?.pattern;
  if (pattern) {
    const alts = alternativesFor(pattern, profile.equipment, dayNames);
    if (alts.length) {
      const lib = alts[0];
      replacement = {
        name: lib.name,
        pattern,
        sets: current.sets,
        reps: lib.timed ? "30-45 sec" : current.reps,
        rest: current.rest,
        tip: lib.tip,
        notes: current.notes,
        recommendedKg: null,
        weightNote: lib.equip.includes("bodyweight") ? "Bodyweight" : "Pick a weight that matches the reps",
      };
    }
  }

  if (!replacement && aiConfigured()) {
    try {
      const ai = await suggestAISwap(profile, day, current, reason);
      replacement = {
        ...ai,
        recommendedKg: typeof ai.recommendedWeight === "number" ? displayToKg(ai.recommendedWeight, profile.units) : null,
      };
    } catch (e) {
      return fail(`Couldn't find a swap: ${e.message}`, 502);
    }
  }
  if (!replacement) return fail("No alternative exercise available for your equipment.", 404);

  day.exercises[index] = replacement;
  const { id, source, createdAt, ...rest } = plan;
  const updated = normalizePlan(rest);
  await updatePlanJson(id, user.id, updated);
  const newDay = updated.weeklyRoutine.find((d) => d.day === dayName);
  return json({ ok: true, exercise: newDay.exercises[index], day: newDay });
});
