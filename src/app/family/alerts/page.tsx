import Link from "next/link";
import type { AlertRecord } from "@/lib/types";
import { getServerBaseUrl } from "@/lib/server-url";
import AlertCard from "@/components/dashboard/AlertCard";

async function fetchAlerts(): Promise<AlertRecord[]> {
  try {
    const base = await getServerBaseUrl();
    const res = await fetch(`${base}/api/alerts`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { alerts: AlertRecord[] };
    return data.alerts ?? [];
  } catch {
    return [];
  }
}

export default async function AlertsPage() {
  const alerts = await fetchAlerts();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold">Urgent alerts</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Items that need attention soon or right now. Acknowledge when
          you&apos;ve followed up so they clear from this list.
        </p>
      </div>

      {alerts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-card-border bg-card/50 p-10 text-center text-sm text-muted">
          No active alerts. When a check-in is classified as notify-soon or
          urgent, it will show up here.
        </p>
      ) : (
        <ul className="space-y-4">
          {alerts.map((a) => (
            <li key={a.id}>
              <AlertCard alert={a} />
            </li>
          ))}
        </ul>
      )}

      <Link href="/family" className="text-sm text-muted hover:text-foreground">
        ← Back to dashboard
      </Link>
    </main>
  );
}
