import type { FamilyProfile } from "@/lib/types";
import { getServerBaseUrl } from "@/lib/server-url";
import SettingsForm from "@/components/dashboard/SettingsForm";
import CarePageShell from "@/components/family/CarePageShell";

const emptyProfile: FamilyProfile = {
  familyMemberName: "",
  lovedOneName: "",
  lovedOneDateOfBirth: "",
  preferredLanguage: "en",
  relationshipLabel: "",
  careTopics: [],
  reminderRules: [],
  backupContacts: [],
};

async function fetchProfile(): Promise<FamilyProfile> {
  try {
    const base = await getServerBaseUrl();
    const res = await fetch(`${base}/api/settings`, { cache: "no-store" });
    if (!res.ok) return emptyProfile;
    const data = (await res.json()) as { profile: FamilyProfile };
    return data.profile ?? emptyProfile;
  } catch {
    return emptyProfile;
  }
}

export default async function SettingsPage() {
  const profile = await fetchProfile();

  return (
    <CarePageShell pageTitle="Care Profile">
      <SettingsForm initial={profile} />
    </CarePageShell>
  );
}
