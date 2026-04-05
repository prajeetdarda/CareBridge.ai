import Link from "next/link";
import type { AlertRecord, FamilyProfile, SummaryRecord } from "@/lib/types";
import { getServerBaseUrl } from "@/lib/server-url";
import SummaryCard from "@/components/dashboard/SummaryCard";

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
  const [{ summaries }, { alerts }, { profile }] = await Promise.all([
    fetchJson<{ summaries: SummaryRecord[] }>("/api/summary", {
      summaries: [],
    }),
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

  const recent = summaries.slice(0, 3);
  const loved = profile.lovedOneName || "your loved one";

  return (
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

      {alerts.length > 0 && (
        <section
          className="rounded-xl border-2 border-danger/30 bg-danger/5 p-4"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-danger">
            {alerts.length} active alert{alerts.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-sm text-muted">
            Review urgent or &quot;notify soon&quot; items from recent
            check-ins.
          </p>
          <Link
            href="/family/alerts"
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Open alerts →
          </Link>
        </section>
      )}

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
          className="flex flex-col gap-1 rounded-xl border border-card-border bg-card p-5 transition-all hover:shadow-md"
        >
          <span className="text-xl">🚨</span>
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

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold">Recent summaries</h2>
          {summaries.length > 3 && (
            <Link
              href="/family/summaries"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="rounded-xl border border-dashed border-card-border bg-card/50 p-8 text-center text-sm text-muted">
            No check-ins yet. When a call ends or your parent leaves an update,
            summaries will appear here.
          </p>
        ) : (
          <ul className="space-y-4">
            {recent.map((s) => (
              <li key={s.id}>
                <SummaryCard summary={s} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← Back to role select
      </Link>
    </main>
  );
}
