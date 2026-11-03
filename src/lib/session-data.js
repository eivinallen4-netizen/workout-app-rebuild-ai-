import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getUser } from "./auth";
import { getActivePlan, getProfile } from "./db";

/** Loads the signed-in user's profile and active plan for app pages (deduped per request). */
export const loadAppData = cache(async () => {
  const user = await getUser();
  if (!user) redirect("/login");
  const [profile, plan] = await Promise.all([getProfile(user.id), getActivePlan(user.id)]);
  if (!profile || !plan) redirect("/onboarding");
  return { user, profile, plan };
});
