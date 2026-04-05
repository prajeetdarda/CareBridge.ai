"use client";

import Link from "next/link";
import { useState } from "react";
import type { AlertRecord } from "@/lib/types";
import { summariesPageHrefForAlert } from "@/lib/summaries-nav";
import { useCareTheme } from "@/components/family/CareThemeContext";

interface AlertCardProps {
  alert: AlertRecord;
}

const urgencyStyles = {
  notify_soon: { label: "Follow-up", light: "bg-[#fef3c7] text-[#b45309]", dark: "bg-amber-900/40 text-amber-300" },
  urgent_now: { label: "Urgent", light: "bg-[#ffe4e6] text-[#e11d48]", dark: "bg-red-900/40 text-red-300" },
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
  const { isDark, cursorGlowClass, handlePointerMove } = useCareTheme();
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

  const cardBg = isDark
    ? "border-zinc-800 bg-[rgba(24,24,30,0.7)]"
    : "border-zinc-200/60 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)]";
  const headText = isDark ? "text-zinc-100" : "text-[#1f2937]";
  const mutedText = isDark ? "text-zinc-400" : "text-[#6b7280]";
  const surfaceBg = isDark ? "border-zinc-700 bg-zinc-800/60" : "border-zinc-100 bg-[#f8f4f1]";

  return (
    <article
      onPointerMove={handlePointerMove}
      className={`relative overflow-hidden rounded-[1.25rem] border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6 ${cursorGlowClass} ${cardBg}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className={`text-lg font-semibold leading-snug ${headText}`}>
          {briefHeading(alert.reason)}
        </h2>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${isDark ? style.dark : style.light}`}
        >
          {style.label}
        </span>
      </div>
      <p
        className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs ${surfaceBg} ${mutedText}`}
        suppressHydrationWarning
      >
        {new Date(alert.timestamp).toLocaleString("en-GB", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={detailsHref}
          className="inline-flex rounded-full bg-[#e11d48] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-6px_rgba(225,29,72,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-6px_rgba(225,29,72,0.4)]"
        >
          Open timeline
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={acknowledge}
          className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 ${
            isDark
              ? "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              : "border-zinc-200/60 bg-white text-[#1f2937] shadow-sm hover:shadow-md"
          }`}
        >
          {busy ? "Marking..." : "Followed up"}
        </button>
      </div>
    </article>
  );
}
