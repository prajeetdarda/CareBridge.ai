import type { SummaryRecord } from "@/lib/types";
import { getServerBaseUrl } from "@/lib/server-url";
import { parseSummariesTabParam } from "@/lib/summaries-nav";
import SummariesExplorer from "@/components/family/SummariesExplorer";
import CarePageShell from "@/components/family/CarePageShell";

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

export default async function SummariesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { tab: tabParam } = await searchParams;
  const initialTab = parseSummariesTabParam(tabParam);
  const summaries = await fetchSummaries();

  return (
    <CarePageShell pageTitle="Care Timeline">
      {summaries.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-zinc-200/60 bg-white p-10 text-center shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
          <p className="text-base font-semibold text-[#1f2937]">
            Your timeline is waiting for the first care moment
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[#6b7280]">
            Complete a call from the parent flow and it will appear here.
          </p>
        </div>
      ) : (
        <SummariesExplorer summaries={summaries} initialTab={initialTab} />
      )}
    </CarePageShell>
  );
}
