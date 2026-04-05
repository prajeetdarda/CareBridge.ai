"use client";

import { useState } from "react";
import {
  Activity,
  Heart,
  Moon as MoonIcon,
  Phone,
  Pill,
  SmilePlus,
  Upload,
  Users,
  Utensils,
} from "lucide-react";
import type { SummaryRecord } from "@/lib/types";
import { publicMediaPath } from "@/lib/media-url";
import { useCareTheme } from "@/components/family/CareThemeContext";

interface SummaryCardProps {
  summary: SummaryRecord;
}

const urgencyStyles = {
  summary_later: { label: "Calm", light: "bg-[#f3e8ff] text-[#7c3aed]", dark: "bg-violet-900/40 text-violet-300" },
  notify_soon: { label: "Follow-up", light: "bg-[#fef3c7] text-[#b45309]", dark: "bg-amber-900/40 text-amber-300" },
  urgent_now: { label: "Urgent", light: "bg-[#ffe4e6] text-[#e11d48]", dark: "bg-red-900/40 text-red-300" },
};

const sourceLabels: Record<SummaryRecord["initiatedBy"], { label: string; Icon: typeof Phone }> = {
  family: { label: "Check-in call", Icon: Phone },
  loved_one: { label: "Update", Icon: Upload },
  ai_agent: { label: "Check-in call", Icon: Phone },
};

const TOPIC_DETECTORS: { keyword: RegExp; label: string; Icon: typeof Pill; color: string; darkColor: string }[] = [
  { keyword: /\b(medication|medicine|meds|pill|tablet|dose|prescription)\b/i, label: "Meds", Icon: Pill, color: "bg-blue-100 text-blue-600", darkColor: "bg-blue-900/40 text-blue-300" },
  { keyword: /\b(mood|happy|sad|anxious|worried|emotion|cheerful|depressed|upset)\b/i, label: "Mood", Icon: SmilePlus, color: "bg-amber-100 text-amber-600", darkColor: "bg-amber-900/40 text-amber-300" },
  { keyword: /\b(food|eat|meal|breakfast|lunch|dinner|appetite|nutrition)\b/i, label: "Food", Icon: Utensils, color: "bg-orange-100 text-orange-600", darkColor: "bg-orange-900/40 text-orange-300" },
  { keyword: /\b(sleep|rest|nap|insomnia|bedtime|tired|fatigue)\b/i, label: "Sleep", Icon: MoonIcon, color: "bg-indigo-100 text-indigo-600", darkColor: "bg-indigo-900/40 text-indigo-300" },
  { keyword: /\b(walk|exercise|activity|movement|physio|mobility|fell|fall)\b/i, label: "Activity", Icon: Activity, color: "bg-green-100 text-green-600", darkColor: "bg-green-900/40 text-green-300" },
  { keyword: /\b(social|friend|family|visit|lonely|alone|companion|talk)\b/i, label: "Social", Icon: Users, color: "bg-pink-100 text-pink-600", darkColor: "bg-pink-900/40 text-pink-300" },
];

function detectTopics(text: string) {
  return TOPIC_DETECTORS.filter((d) => d.keyword.test(text)).slice(0, 3);
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  const { isDark, cursorGlowClass, handlePointerMove } = useCareTheme();
  const [open, setOpen] = useState(false);
  const style = urgencyStyles[summary.urgencyLevel];
  const source = sourceLabels[summary.initiatedBy];
  const topics = detectTopics(`${summary.summary} ${summary.transcript ?? ""}`);
  const mediaPathTrim = summary.mediaPath?.trim() ?? "";
  const isPcmRecording = mediaPathTrim.toLowerCase().endsWith(".pcm");
  const isWebm = /\.webm$/i.test(mediaPathTrim);
  const mediaHref = mediaPathTrim
    ? publicMediaPath(mediaPathTrim, summary.mediaType)
    : "";

  const cardBg = isDark
    ? "border-zinc-800 bg-[rgba(24,24,30,0.7)]"
    : "border-zinc-200/60 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)]";
  const mutedText = isDark ? "text-zinc-400" : "text-[#6b7280]";
  const headText = isDark ? "text-zinc-100" : "text-[#1f2937]";
  const surfaceBg = isDark ? "border-zinc-700 bg-zinc-800/60" : "border-zinc-100 bg-[#f8f4f1]";

  return (
    <article
      onPointerMove={handlePointerMove}
      className={`relative overflow-hidden rounded-[1.25rem] border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-6 ${cursorGlowClass} ${cardBg}`}
    >
      {/* Top row: source + time + urgency */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${surfaceBg}`}
        >
          <source.Icon className="h-3 w-3" />
          {source.label}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${surfaceBg} ${mutedText}`}
          suppressHydrationWarning
        >
          {new Date(summary.timestamp).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {summary.callDurationSeconds != null && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${surfaceBg} ${mutedText}`}>
            {Math.round(summary.callDurationSeconds)}s
          </span>
        )}
        <span
          className={`ml-auto rounded-full px-2.5 py-1 text-xs font-semibold ${isDark ? style.dark : style.light}`}
        >
          {style.label}
        </span>
      </div>

      {/* Summary text */}
      <p className={`mt-3 text-sm leading-relaxed sm:text-[0.95rem] ${headText}`}>
        {summary.summary}
      </p>

      {/* Detected topic tags */}
      {topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topics.map((t) => (
            <span
              key={t.label}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isDark ? t.darkColor : t.color}`}
            >
              <t.Icon className="h-3 w-3" />
              {t.label}
            </span>
          ))}
        </div>
      )}

      {summary.escalationReason && (
        <p
          className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
            isDark
              ? "border-red-800/40 bg-red-900/20 text-red-300"
              : "border-[#e11d48]/20 bg-[#ffe4e6] text-[#e11d48]"
          }`}
        >
          <Heart className="mr-1 inline h-3 w-3" /> {summary.escalationReason}
        </p>
      )}

      {summary.actionTaken && (
        <p
          className={`mt-2 rounded-lg border px-3 py-2 text-xs ${
            isDark
              ? "border-emerald-800/40 bg-emerald-900/20 text-emerald-300"
              : "border-emerald-300/50 bg-emerald-50 text-emerald-700"
          }`}
        >
          {summary.actionTaken}
        </p>
      )}

      {mediaHref && (
        <div className={`mt-4 rounded-xl border p-3 ${surfaceBg}`}>
          <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.15em] ${mutedText}`}>
            Media
          </p>
          {isPcmRecording ? (
            <p className={`text-sm ${mutedText}`}>
              Raw PCM recording.{" "}
              <a
                href={mediaHref}
                download
                className="font-medium text-[#e11d48] underline hover:no-underline"
              >
                Download
              </a>
            </p>
          ) : summary.mediaType === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaHref}
              alt="Check-in attachment"
              className="max-h-48 max-w-full rounded-md object-contain"
            />
          ) : summary.mediaType === "video" || (isWebm && summary.mediaType !== "audio") ? (
            <video
              controls
              className="max-h-48 w-full max-w-md rounded-md"
              src={mediaHref}
            />
          ) : (
            <audio controls className="h-9 w-full max-w-md" src={mediaHref} />
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`mt-4 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
          isDark
            ? "border-zinc-700 bg-zinc-800 text-violet-300 hover:bg-zinc-700"
            : "border-zinc-200/60 bg-white text-[#7c3aed] hover:border-[#7c3aed]/30 hover:bg-[#f3e8ff]/40"
        }`}
      >
        {open ? "Hide transcript" : "View transcript"}
      </button>
      {open && (
        <pre
          className={`mt-2 max-h-52 overflow-auto whitespace-pre-wrap rounded-xl border p-3 text-xs ${
            isDark
              ? "border-zinc-700 bg-zinc-800/60 text-zinc-400"
              : "border-zinc-100 bg-[#f8f4f1] text-[#6b7280]"
          }`}
        >
          {summary.transcript || "—"}
        </pre>
      )}
    </article>
  );
}
