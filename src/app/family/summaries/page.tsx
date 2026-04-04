import Link from "next/link";
import type { SummaryRecord } from "@/lib/types";
import { getServerBaseUrl } from "@/lib/server-url";
import SummaryCard from "@/components/dashboard/SummaryCard";

async function fetchSummaries(): Promise<SummaryRecord[]> {
  try {
    const base = await getServerBaseUrl();
    const res = await fetch(`${base}/api/summary`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { summaries: SummaryRecord[] };
    return data.summaries ?? [];
  } catch {
    return [];
  }
}

export default async function SummariesPage() {
  const summaries = await fetchSummaries();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold">Check-in summaries</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Past wellness check-ins and loved-one updates, with urgency labels and
          full transcripts when you need them.
        </p>
      </div>

      {summaries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-card-border bg-card/50 p-10 text-center text-sm text-muted">
          No summaries stored yet. Complete a call from the parent flow or POST
          to <code className="rounded bg-background px-1">/api/summary</code>{" "}
          to see entries here.
        </p>
      ) : (
        <ul className="space-y-4">
          {summaries.map((s) => (
            <li key={s.id}>
              <SummaryCard summary={s} />
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
