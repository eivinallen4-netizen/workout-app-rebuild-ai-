import { loadAppData } from "@/lib/session-data";
import HistoryView from "./HistoryView";

export const metadata = { title: "History" };

export default async function HistoryPage() {
  const { profile } = await loadAppData();
  return <HistoryView units={profile.units} />;
}
