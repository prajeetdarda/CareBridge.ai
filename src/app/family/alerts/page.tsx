import type { AlertRecord } from "@/lib/types";
import { getServerBaseUrl } from "@/lib/server-url";
import AlertCard from "@/components/dashboard/AlertCard";
import CarePageShell from "@/components/family/CarePageShell";

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
    <CarePageShell pageTitle="Needs Attention">
      {alerts.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-zinc-200/60 bg-white p-10 text-center shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
          <p className="text-base font-semibold text-[#1f2937]">
            All clear right now
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[#6b7280]">
            No active alerts. Future follow-up or urgent items will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((a) => (
            <li key={a.id}>
              <AlertCard alert={a} />
            </li>
          ))}
        </ul>
      )}
    </CarePageShell>
  );
}
