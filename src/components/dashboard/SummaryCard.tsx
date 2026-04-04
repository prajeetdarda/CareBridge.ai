"use client";

import type { SummaryRecord } from "@/lib/types";

interface SummaryCardProps {
  summary: SummaryRecord;
}

const urgencyStyles = {
  summary_later: { label: "Summary", bg: "bg-muted/20", text: "text-muted" },
  notify_soon: { label: "Notify Soon", bg: "bg-accent/20", text: "text-accent" },
  urgent_now: { label: "Urgent", bg: "bg-danger/20", text: "text-danger" },
};

/**
 * Dev 2 owns this component.
 * Displays a single check-in summary card on the family dashboard.
 */
export default function SummaryCard({ summary }: SummaryCardProps) {
  const style = urgencyStyles[summary.urgencyLevel];

  return (
    <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">
          {new Date(summary.timestamp).toLocaleString()}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${style.bg} ${style.text}`}
        >
          {style.label}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed">{summary.summary}</p>
      {summary.escalationReason && (
        <p className="mt-2 text-xs text-danger">
          Escalation: {summary.escalationReason}
        </p>
      )}
    </div>
  );
}
