"use client";

import { useState } from "react";
import type { AlertRecord } from "@/lib/types";

interface AlertCardProps {
  alert: AlertRecord;
}

const levelStyle: Record<string, { label: string; ring: string }> = {
  notify_soon: { label: "Notify soon", ring: "border-accent/40 bg-accent/5" },
  urgent_now: { label: "Urgent now", ring: "border-danger/50 bg-danger/5" },
  summary_later: { label: "Info", ring: "border-card-border bg-card" },
};

export default function AlertCard({ alert }: AlertCardProps) {
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(false);
  const style = levelStyle[alert.urgencyLevel] ?? levelStyle.summary_later;

  async function acknowledge() {
    setBusy(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId: alert.id }),
      });
      if (res.ok) setGone(true);
    } finally {
      setBusy(false);
    }
  }

  if (gone) return null;

  return (
    <div className={`rounded-xl border-2 p-5 shadow-sm ${style.ring}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            {style.label}
          </span>
          <p className="mt-2 text-sm font-medium leading-snug">{alert.reason}</p>
          <p className="mt-1 text-xs text-muted">
            {new Date(alert.timestamp).toLocaleString()} · Session{" "}
            <code className="rounded bg-background px-1">{alert.sessionId}</code>
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={acknowledge}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "…" : "Acknowledge"}
        </button>
      </div>
      {alert.transcript && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-primary">
            Related transcript
          </summary>
          <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-lg bg-background/80 p-2 text-xs text-muted">
            {alert.transcript}
          </pre>
        </details>
      )}
    </div>
  );
}
