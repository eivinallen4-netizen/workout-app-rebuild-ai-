import { loadAppData } from "@/lib/session-data";
import { aiConfigured, aiModel } from "@/lib/ai";
import SettingsView from "./SettingsView";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, profile, plan } = await loadAppData();
  return (
    <SettingsView
      user={user}
      profile={profile}
      planInfo={{ source: plan.source, createdAt: plan.createdAt }}
      ai={{ configured: aiConfigured(), model: aiModel() }}
    />
  );
}
