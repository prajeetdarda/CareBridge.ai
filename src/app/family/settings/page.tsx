import Link from "next/link";
import type { FamilyProfile } from "@/lib/types";
import { getServerBaseUrl } from "@/lib/server-url";
import SettingsForm from "@/components/dashboard/SettingsForm";

const emptyProfile: FamilyProfile = {
  familyMemberName: "",
  lovedOneName: "",
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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold">Care settings</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Names, language, topics to watch for, reminders, and backup contacts.
          Stored in-memory for this demo (resets when the server restarts).
        </p>
      </div>

      <SettingsForm initial={profile} />

      <Link href="/family" className="text-sm text-muted hover:text-foreground">
        ← Back to dashboard
      </Link>
    </main>
  );
}
