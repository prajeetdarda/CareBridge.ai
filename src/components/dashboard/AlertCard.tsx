"use client";

import Link from "next/link";
import { useState } from "react";
import type { AlertRecord } from "@/lib/types";
import { summariesPageHrefForAlert } from "@/lib/summaries-nav";

interface AlertCardProps {
  alert: AlertRecord;
}

const urgencyStyles = {
  notify_soon: {
    label: "Notify soon",
    bg: "bg-amber-500/20",
    text: "text-amber-800 dark:text-amber-200",
  },
  urgent_now: {
    label: "Urgent now",
    bg: "bg-danger/20",
    text: "text-danger",
  },
};

function briefHeading(reason: string): string {
  const t = reason.trim();
  if (!t) return "Check-in needs attention";
  const max = 80;
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 32 ? cut.slice(0, lastSpace) : cut) + "…";
}

export default function AlertCard({ alert }: AlertCardProps) {
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(false);
  const style =
    urgencyStyles[alert.urgencyLevel] ?? urgencyStyles.notify_soon;

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

  const detailsHref = summariesPageHrefForAlert(alert.urgencyLevel);

  return (
    <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-base font-semibold leading-snug text-foreground">
          {briefHeading(alert.reason)}
        </h2>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${style.bg} ${style.text}`}
        >
          {style.label}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted" suppressHydrationWarning>
        {new Date(alert.timestamp).toLocaleString("en-GB", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={detailsHref}
          className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Show details
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={acknowledge}
          className="rounded-lg border border-card-border bg-background px-4 py-2 text-sm font-medium transition-opacity hover:bg-muted/20 disabled:opacity-50"
        >
          {busy ? "…" : "Acknowledge"}
        </button>
      </div>
    </div>
  );
}
