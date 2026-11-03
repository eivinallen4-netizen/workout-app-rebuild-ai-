import { z } from "zod";
import { getProfile, saveProfile, query } from "@/lib/db";
import { profileSchema } from "@/lib/profile";
import { json, withUser } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = withUser(async (_req, user) => {
  return json({ user, profile: await getProfile(user.id) });
});

export const PUT = withUser(async (req, user) => {
  const body = await req.json();
  const profile = profileSchema.parse(body.profile);
  const name = z.string().trim().min(1).max(60).optional().parse(body.name);

  await saveProfile(user.id, { ...profile, onboardedAt: (await getProfile(user.id))?.onboardedAt ?? new Date().toISOString() });
  if (name) await query("UPDATE users SET name = ? WHERE id = ?", [name, user.id]);
  return json({ ok: true, profile });
});
