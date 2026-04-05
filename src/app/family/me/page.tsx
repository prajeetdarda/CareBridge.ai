import type { FamilyProfile } from "@/lib/types";
import { getServerBaseUrl } from "@/lib/server-url";
import CarePageShell from "@/components/family/CarePageShell";
import FamilyMemberProfileForm from "@/components/family/FamilyMemberProfileForm";

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

export default async function FamilyMemberProfilePage() {
  const profile = await fetchProfile();

  return (
    <CarePageShell pageTitle="Your profile">
      <FamilyMemberProfileForm
        initial={{
          familyMemberName: profile.familyMemberName,
          familyMemberImageUrl: profile.familyMemberImageUrl,
        }}
      />
    </CarePageShell>
  );
}
