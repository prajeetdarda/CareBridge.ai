"use client";

import { useEffect, useMemo, useState } from "react";
import type { SummaryRecord, UrgencyLevel } from "@/lib/types";
import type { SummariesTabQuery } from "@/lib/summaries-nav";
import SummaryCard from "@/components/dashboard/SummaryCard";

type TabId = SummariesTabQuery;
type RangeId = "today" | "week" | "month";

function startOfTodayMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function inRange(ts: string, range: RangeId): boolean {
  const t = new Date(ts).getTime();
  const now = Date.now();
  if (range === "today") return t >= startOfTodayMs();
  if (range === "week") return t >= now - 7 * 24 * 60 * 60 * 1000;
  return t >= now - 30 * 24 * 60 * 60 * 1000;
}

const TAB_URGENCY: Record<TabId, UrgencyLevel> = {
  later: "summary_later",
  notify: "notify_soon",
  urgent: "urgent_now",
};

const tabs: { id: TabId; label: string }[] = [
  { id: "later", label: "For later" },
  { id: "notify", label: "Notify worthy" },
  { id: "urgent", label: "Urgent" },
];

const ranges: { id: RangeId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Past week" },
  { id: "month", label: "Past month" },
];

export default function SummariesExplorer({
  summaries,
  initialTab = "later",
}: {
  summaries: SummaryRecord[];
  initialTab?: TabId;
}) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const [range, setRange] = useState<RangeId>("today");

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const filtered = useMemo(() => {
    const level = TAB_URGENCY[tab];
    return summaries.filter(
      (s) => s.urgencyLevel === level && inRange(s.timestamp, range)
    );
  }, [summaries, tab, range]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 rounded-xl border border-card-border bg-card p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? t.id === "urgent"
                    ? "bg-danger/20 text-danger"
                    : t.id === "notify"
                      ? "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                      : "bg-muted/40 text-foreground"
                  : "text-muted hover:bg-background/80"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted whitespace-nowrap">Date</span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as RangeId)}
            className="rounded-lg border border-card-border bg-background px-3 py-2 font-medium"
          >
            {ranges.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-card-border bg-card/50 p-10 text-center text-sm text-muted">
          No summaries in this category for the selected period.
        </p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((s) => (
            <li key={s.id}>
              <SummaryCard summary={s} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
