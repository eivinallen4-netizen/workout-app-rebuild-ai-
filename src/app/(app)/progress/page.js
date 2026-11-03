import { loadAppData } from "@/lib/session-data";
import ProgressView from "./ProgressView";

export const metadata = { title: "Progress" };

export default async function ProgressPage() {
  const { profile, plan } = await loadAppData();
  return <ProgressView plan={plan} profile={profile} />;
}
