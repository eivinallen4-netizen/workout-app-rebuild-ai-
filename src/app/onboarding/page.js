import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getActivePlan, getProfile } from "@/lib/db";
import OnboardingWizard from "./OnboardingWizard";

export const metadata = { title: "Set up your plan" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const [profile, plan] = await Promise.all([getProfile(user.id), getActivePlan(user.id)]);
  if (profile && plan) redirect("/");
  return <OnboardingWizard name={user.name} initialProfile={profile} />;
}
