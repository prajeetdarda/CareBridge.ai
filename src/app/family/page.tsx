import Link from "next/link";
import type { AlertRecord, FamilyProfile } from "@/lib/types";
import { getServerBaseUrl } from "@/lib/server-url";
import FamilyDashboardAttention from "@/components/family/FamilyDashboardAttention";

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

  const loved = profile.lovedOneName || "your loved one";
  const backupContactNames = profile.backupContacts
    .map((c) => c.name?.trim())
    .filter((n): n is string => Boolean(n && n.length > 0));

  const alertsLinkBorder =
    urgentCount > 0
      ? "border-2 border-danger/45 bg-danger/5"
      : notifySoonCount > 0
        ? "border-2 border-amber-500/50 bg-amber-500/5 dark:border-amber-400/45"
        : "border border-card-border";

  return (
    <FamilyDashboardAttention
      urgentCount={urgentCount}
      notifySoonCount={notifySoonCount}
      backupContactNames={backupContactNames}
    >
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-12">
        <header className="space-y-2">
          <p className="text-sm text-muted">Family Care Relay</p>
          <h1 className="text-3xl font-bold tracking-tight">
            Hi, {profile.familyMemberName || "there"}
          </h1>
          <p className="max-w-xl text-muted">
            Stay in sync with {loved}. Recent check-ins, urgent flags, and your
            care preferences in one place.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/family/summaries"
            className="flex flex-col gap-1 rounded-xl border border-card-border bg-card p-5 transition-all hover:shadow-md"
          >
            <span className="text-xl">📋</span>
            <span className="font-medium">All summaries</span>
            <span className="text-xs text-muted">
              Full history with transcripts
            </span>
          </Link>
          <Link
            href="/family/alerts"
            className={`flex flex-col gap-1 rounded-xl ${alertsLinkBorder} bg-card p-5 transition-all hover:shadow-md`}
          >
            <span className="flex items-center gap-2 text-xl">
              🚨
              <span className="flex flex-wrap items-center gap-1.5">
                {urgentCount > 0 && (
                  <span className="rounded-full bg-danger/20 px-2 py-0.5 text-xs font-semibold text-danger">
                    {urgentCount} urgent
                  </span>
                )}
                {notifySoonCount > 0 && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
                    {notifySoonCount} notify
                  </span>
                )}
              </span>
            </span>
            <span className="font-medium">Alerts</span>
            <span className="text-xs text-muted">Urgent and follow-up flags</span>
          </Link>
          <Link
            href="/family/settings"
            className="flex flex-col gap-1 rounded-xl border border-card-border bg-card p-5 transition-all hover:shadow-md"
          >
            <span className="text-xl">⚙️</span>
            <span className="font-medium">Care settings</span>
            <span className="text-xs text-muted">Topics, reminders, contacts</span>
          </Link>
          <Link
            href="/family/check-in"
            className="flex flex-col gap-1 rounded-xl border-2 border-dashed border-primary bg-primary/5 p-5 transition-all hover:bg-primary/10"
          >
            <span className="text-xl">📞</span>
            <span className="font-medium text-primary">Start check-in</span>
            <span className="text-xs text-muted">
              Opens parent incoming in a new tab (demo) or schedule a link
            </span>
          </Link>
        </section>

        <Link href="/" className="text-sm text-muted hover:text-foreground">
          ← Back to role select
        </Link>
      </main>
    </FamilyDashboardAttention>
  );
}
