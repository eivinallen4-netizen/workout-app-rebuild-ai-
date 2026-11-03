import { loadAppData } from "@/lib/session-data";
import PlanView from "./PlanView";

export const metadata = { title: "Your plan" };

export default async function PlanPage() {
  const { profile, plan } = await loadAppData();
  return <PlanView plan={plan} units={profile.units} />;
}
