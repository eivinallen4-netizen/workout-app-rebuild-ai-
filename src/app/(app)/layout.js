import { loadAppData } from "@/lib/session-data";
import AppShell from "../components/AppShell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }) {
  const { user } = await loadAppData();
  return <AppShell userName={user.name}>{children}</AppShell>;
}
