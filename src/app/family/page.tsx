import type { AlertRecord, BackupContact, FamilyProfile, ReminderRecord } from "@/lib/types";
import { ageFromIsoDate } from "@/lib/age";
import { getServerBaseUrl } from "@/lib/server-url";
import FamilyDashboardAttention from "@/components/family/FamilyDashboardAttention";
import FamilyDashboardClient from "@/components/family/FamilyDashboardClient";

async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const base = await getServerBaseUrl();
    const res = await fetch(`${base}${path}`, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

function countEmergencyContacts(contacts: BackupContact[]): number {
  return contacts.filter(
    (c) => Boolean(c.name?.trim() || c.contactInfo?.trim() || c.email?.trim())
  ).length;
}

function countActiveReminders(rules: ReminderRecord[]): number {
  return rules.filter((r) => r.enabled).length;
}

export default async function FamilyDashboardPage() {
  const [{ alerts }, { profile }] = await Promise.all([
    fetchJson<{ alerts: AlertRecord[] }>("/api/alerts", { alerts: [] }),
    fetchJson<{ profile: FamilyProfile }>("/api/settings", {
      profile: {
        familyMemberName: "",
        lovedOneName: "your loved one",
        preferredLanguage: "en",
        relationshipLabel: "",
        careTopics: [],
        reminderRules: [],
        backupContacts: [],
      },
    }),
  ]);

  const urgentCount = alerts.filter((a) => a.urgencyLevel === "urgent_now").length;
  const notifySoonCount = alerts.filter(
    (a) => a.urgencyLevel === "notify_soon"
  ).length;

  const emergencyContactCount = countEmergencyContacts(profile.backupContacts);
  const activeReminderCount = countActiveReminders(profile.reminderRules);
  const lovedOneAgeYears = ageFromIsoDate(profile.lovedOneDateOfBirth);

  const loved = profile.lovedOneName || "your loved one";
  const backupContactNames = profile.backupContacts
    .map((c) => c.name?.trim())
    .filter((n): n is string => Boolean(n && n.length > 0));

  return (
    <FamilyDashboardAttention
      urgentCount={urgentCount}
      notifySoonCount={notifySoonCount}
      backupContactNames={backupContactNames}
    >
      <FamilyDashboardClient
        familyMemberName={profile.familyMemberName || "Family"}
        lovedOneName={loved}
        relationshipLabel={profile.relationshipLabel?.trim() || "Loved one"}
        urgentCount={urgentCount}
        notifySoonCount={notifySoonCount}
        emergencyContactCount={emergencyContactCount}
        activeReminderCount={activeReminderCount}
        lovedOneAgeYears={lovedOneAgeYears}
      />
    </FamilyDashboardAttention>
  );
}
