"use client";

import { useState } from "react";
import type { SummaryRecord } from "@/lib/types";
import { publicMediaPath } from "@/lib/media-url";

interface SummaryCardProps {
  summary: SummaryRecord;
}

const urgencyStyles = {
  summary_later: { label: "Summary", bg: "bg-muted/20", text: "text-muted" },
  notify_soon: { label: "Notify Soon", bg: "bg-accent/20", text: "text-accent" },
  urgent_now: { label: "Urgent", bg: "bg-danger/20", text: "text-danger" },
};

const byLabels: Record<SummaryRecord["initiatedBy"], string> = {
  family: "Family-initiated check-in",
  loved_one: "Loved one update",
};

export default function SummaryCard({ summary }: SummaryCardProps) {
  const [open, setOpen] = useState(false);
  const style = urgencyStyles[summary.urgencyLevel];
  const mediaHref =
    summary.mediaPath && summary.mediaPath.trim()
      ? publicMediaPath(summary.mediaPath)
      : "";

  return (
    <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted">
          {new Date(summary.timestamp).toLocaleString()}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${style.bg} ${style.text}`}
        >
          {style.label}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">{byLabels[summary.initiatedBy]}</p>
      <p className="mt-3 text-sm leading-relaxed">{summary.summary}</p>
      {summary.escalationReason && (
        <p className="mt-2 text-xs text-danger">
          Note: {summary.escalationReason}
        </p>
      )}
      {summary.callDurationSeconds != null && (
        <p className="mt-2 text-xs text-muted">
          Call duration: {Math.round(summary.callDurationSeconds)}s
        </p>
      )}

      {mediaHref && (
        <div className="mt-4 rounded-lg border border-card-border bg-background/50 p-3">
          <p className="mb-2 text-xs font-medium text-muted">Original media</p>
          {summary.mediaType === "audio" || !summary.mediaType ? (
            <audio controls className="h-9 w-full max-w-md" src={mediaHref} />
          ) : summary.mediaType === "video" ? (
            <video
              controls
              className="max-h-48 w-full max-w-md rounded-md"
              src={mediaHref}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaHref}
              alt="Check-in attachment"
              className="max-h-48 max-w-full rounded-md object-contain"
            />
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-4 text-xs font-medium text-primary hover:underline"
      >
        {open ? "Hide transcript" : "View transcript"}
      </button>
      {open && (
        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-background/80 p-3 text-xs text-muted">
          {summary.transcript || "—"}
        </pre>
      )}
    </div>
  );
}
