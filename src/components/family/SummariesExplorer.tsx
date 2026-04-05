"use client";

import { useEffect, useMemo, useState } from "react";
import type { SummaryRecord, UrgencyLevel } from "@/lib/types";
import type { SummariesTabQuery } from "@/lib/summaries-nav";
import SummaryCard from "@/components/dashboard/SummaryCard";
import { useCareTheme } from "./CareThemeContext";

type TabId = "calls" | SummariesTabQuery;
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

const TAB_URGENCY: Record<SummariesTabQuery, UrgencyLevel> = {
  later: "summary_later",
  notify: "notify_soon",
  urgent: "urgent_now",
};

const ranges: { id: RangeId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

export default function SummariesExplorer({
  summaries,
  initialTab = "later",
}: {
  summaries: SummaryRecord[];
  initialTab?: SummariesTabQuery;
}) {
  const { isDark, cursorGlowClass, handlePointerMove } = useCareTheme();
  const [tab, setTab] = useState<TabId>(initialTab);
  const [range, setRange] = useState<RangeId>("today");

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const inRangeSummaries = useMemo(
    () => summaries.filter((s) => inRange(s.timestamp, range)),
    [summaries, range]
  );

  const filtered = useMemo(() => {
    if (tab === "calls") {
      return inRangeSummaries.filter(
        (s) => s.initiatedBy === "family" || s.initiatedBy === "ai_agent"
      );
    }
    const level = TAB_URGENCY[tab];
    return inRangeSummaries.filter((s) => s.urgencyLevel === level);
  }, [inRangeSummaries, tab]);

  const counts = useMemo(() => {
    const calls = inRangeSummaries.filter(
      (s) => s.initiatedBy === "family" || s.initiatedBy === "ai_agent"
    ).length;
    return {
      calls,
      later: inRangeSummaries.filter((s) => s.urgencyLevel === "summary_later").length,
      notify: inRangeSummaries.filter((s) => s.urgencyLevel === "notify_soon").length,
      urgent: inRangeSummaries.filter((s) => s.urgencyLevel === "urgent_now").length,
    };
  }, [inRangeSummaries]);

  const cardBg = isDark
    ? "bg-[rgba(24,24,30,0.7)] border-zinc-800"
    : "bg-white border-zinc-200/60";
  const cardShadow = isDark ? "" : "shadow-[0_2px_20px_rgba(0,0,0,0.04)]";
  const mutedText = isDark ? "text-zinc-400" : "text-[#6b7280]";
  const headText = isDark ? "text-zinc-100" : "text-[#1f2937]";

  function tabBtn(id: TabId, label: string, count: number, accent?: string) {
    const isActive = tab === id;
    const activeBg = accent ?? (isDark ? "bg-zinc-700" : "bg-white");
    return (
      <button
        key={id}
        type="button"
        onClick={() => setTab(id)}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
          isActive
            ? `${activeBg} ${headText} shadow-sm`
            : `${mutedText} hover:${isDark ? "bg-zinc-800" : "bg-white/60"}`
        }`}
      >
        {label}
        <span
          className={`ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ${
            isActive
              ? isDark
                ? "bg-zinc-600 text-zinc-200"
                : "bg-zinc-100 text-zinc-700"
              : isDark
                ? "bg-zinc-800 text-zinc-500"
                : "bg-zinc-100 text-zinc-500"
          }`}
        >
          {count}
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={`flex flex-col gap-3 rounded-[1.25rem] border p-3 sm:flex-row sm:items-center sm:justify-between ${cardBg} ${cardShadow}`}
      >
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {tabBtn("calls", "Check-ins", counts.calls)}

          <span
            className={`mx-1 h-5 w-px shrink-0 ${
              isDark ? "bg-zinc-700" : "bg-zinc-200"
            }`}
          />

          {tabBtn(
            "later",
            "Calm",
            counts.later,
            isDark ? "bg-violet-900/40" : "bg-[#f3e8ff]"
          )}
          {tabBtn(
            "notify",
            "Follow-up",
            counts.notify,
            isDark ? "bg-amber-900/40" : "bg-[#fef3c7]"
          )}
          {tabBtn(
            "urgent",
            "Urgent",
            counts.urgent,
            isDark ? "bg-red-900/40" : "bg-[#ffe4e6]"
          )}
        </div>

        <select
          value={range}
          onChange={(e) => setRange(e.target.value as RangeId)}
          className={`rounded-lg border px-2.5 py-1.5 text-sm font-medium ${
            isDark
              ? "border-zinc-700 bg-zinc-900 text-zinc-200"
              : "border-zinc-200/60 bg-white text-[#1f2937]"
          }`}
        >
          {ranges.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p
          className={`rounded-[1.25rem] border border-dashed p-10 text-center text-sm ${
            isDark
              ? "border-zinc-700 bg-zinc-900/50 text-zinc-500"
              : "border-zinc-200/60 bg-white text-[#6b7280] shadow-[0_2px_20px_rgba(0,0,0,0.04)]"
          }`}
        >
          No check-ins match this view yet. Try another date range.
        </p>
      ) : (
        <ul className="space-y-3">
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
