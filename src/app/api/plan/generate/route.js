import { getProfile, savePlan } from "@/lib/db";
import { aiConfigured, generateAIPlan } from "@/lib/ai";
import { generateBuiltinPlan } from "@/lib/planGenerator";
import { json, fail, withUser } from "@/lib/http";

export const maxDuration = 120;

export const POST = withUser(async (req, user) => {
  const { source = "auto" } = await req.json().catch(() => ({}));
  const profile = await getProfile(user.id);
  if (!profile) return fail("Finish setting up your profile first.", 409);

  let plan;
  let used = "builtin";
  let warning = null;

  if (source !== "builtin" && aiConfigured()) {
    try {
      plan = await generateAIPlan(profile);
      used = "ai";
    } catch (e) {
      console.error("[plan/generate] AI failed:", e.message);
      warning = `The AI coach couldn't build your plan (${e.message}). We built one with the built-in coach instead — you can try the AI again from Settings.`;
    }
  } else if (source !== "builtin") {
    warning = "AI isn't configured, so the built-in coach built your plan.";
  }

  if (!plan) plan = generateBuiltinPlan(profile);
  const id = await savePlan(user.id, plan, used);
  return json({ ok: true, planId: id, source: used, warning });
});
