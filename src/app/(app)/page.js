import { loadAppData } from "@/lib/session-data";
import TodayView from "./TodayView";

export const metadata = { title: "Today" };

export default async function TodayPage() {
  const { user, profile, plan } = await loadAppData();
  return <TodayView plan={plan} units={profile.units} name={user.name} />;
}
