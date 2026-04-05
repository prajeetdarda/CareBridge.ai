"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import {
  Bell,
  Clock3,
  Heart,
  Phone,
  Moon,
  Plus,
  Sun,
  UserRound,
} from "lucide-react";

type ThemeChoice = "light" | "dark";

interface FamilyDashboardClientProps {
  familyMemberName: string;
  lovedOneName: string;
  relationshipLabel: string;
  urgentCount: number;
  notifySoonCount: number;
  /** Support / emergency contacts with name or contact filled */
  emergencyContactCount: number;
  /** Enabled reminder rules */
  activeReminderCount: number;
  /** From care profile DOB; null if unset or invalid */
  lovedOneAgeYears: number | null;
}

interface ActionCard {
  id: "checkin" | "attention" | "timeline" | "profile";
  href: string;
  title: string;
  subtitle: string;
  cta: string;
}

const THEME_STORAGE_KEY = "family-dashboard-theme";

export default function FamilyDashboardClient({
  familyMemberName,
  lovedOneName,
  relationshipLabel,
  urgentCount,
  notifySoonCount,
  emergencyContactCount,
  activeReminderCount,
  lovedOneAgeYears,
}: FamilyDashboardClientProps) {
  const [theme, setTheme] = useState<ThemeChoice>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const totalAttention = urgentCount + notifySoonCount;
  const isDark = theme === "dark";

  const actionCards = useMemo<ActionCard[]>(
    () => [
      {
        id: "checkin",
        href: "/family/check-in",
        title: "Start Check-in",
        subtitle: "Connect with loved ones daily",
        cta: "Begin now",
      },
      {
        id: "timeline",
        href: "/family/summaries",
        title: "Care Timeline",
        subtitle: "Track daily activities",
        cta: "Open timeline",
      },
      {
        id: "attention",
        href: "/family/alerts",
        title: "Needs Attention",
        subtitle:
          totalAttention > 0
            ? [
                urgentCount > 0 ? `${urgentCount} urgent` : "",
                notifySoonCount > 0 ? `${notifySoonCount} follow-up` : "",
              ]
                .filter(Boolean)
                .join(", ")
            : "No active alerts",
        cta: "Review alerts",
      },
      {
        id: "profile",
        href: "/family/settings",
        title: lovedOneName,
        subtitle: "Care profile",
        cta: "Open profile",
      },
    ],
    [lovedOneName, totalAttention, urgentCount, notifySoonCount]
  );

  function toggleTheme() {
    const next: ThemeChoice = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
  }

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      el.style.setProperty("--my", `${e.clientY - rect.top}px`);
    },
    []
  );

  const cursorGlowClass = isDark
    ? "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100 before:[background:radial-gradient(320px_circle_at_var(--mx)_var(--my),rgba(251,113,133,0.12),transparent_60%)]"
    : "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100 before:[background:radial-gradient(320px_circle_at_var(--mx)_var(--my),rgba(251,113,133,0.08),transparent_60%)]";

  return (
    <main
      className={`w-full flex-1 ${
        isDark
          ? "bg-[#0f0f14] text-zinc-100"
          : "bg-[#f8f4f1] text-zinc-900"
      }`}
      aria-label={`${familyMemberName}'s care dashboard`}
    >
      {/* Floating hearts */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <Heart
          className={`absolute left-[8%] top-[15%] h-28 w-28 animate-[care-heart-drift_10s_ease-in-out_infinite] ${
            isDark ? "text-pink-400/[0.12]" : "text-pink-300/[0.28]"
          }`}
          strokeWidth={1}
          fill="currentColor"
        />
        <Heart
          className={`absolute right-[10%] top-[28%] h-20 w-20 animate-[care-heart-drift_13s_ease-in-out_infinite_1s] ${
            isDark ? "text-rose-400/[0.1]" : "text-rose-300/[0.24]"
          }`}
          strokeWidth={1}
          fill="currentColor"
        />
        <Heart
          className={`absolute left-[45%] bottom-[16%] h-24 w-24 animate-[care-heart-drift_15s_ease-in-out_infinite_2s] ${
            isDark ? "text-orange-300/[0.08]" : "text-orange-200/[0.22]"
          }`}
          strokeWidth={1}
          fill="currentColor"
        />
        <Heart
          className={`absolute right-[28%] top-[62%] h-16 w-16 animate-[care-heart-drift_11s_ease-in-out_infinite_3s] ${
            isDark ? "text-violet-400/[0.1]" : "text-violet-300/[0.2]"
          }`}
          strokeWidth={1}
          fill="currentColor"
        />
        <Heart
          className={`absolute left-[18%] bottom-[32%] h-18 w-18 animate-[care-heart-drift_14s_ease-in-out_infinite_0.5s] ${
            isDark ? "text-pink-300/[0.08]" : "text-pink-200/[0.2]"
          }`}
          strokeWidth={1}
          fill="currentColor"
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:py-14">
        {/* Header — always at top */}
        <header className="relative mb-10 flex w-full items-center justify-center">
          <Link href="/family" className="group flex items-center gap-3">
            <span
              className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:shadow-xl ${
                isDark ? "bg-[#be123c]" : "bg-[#e11d48]"
              }`}
            >
              <Heart className="h-6 w-6 text-white" fill="currentColor" />
            </span>
            <span className="block">
              <span
                className={`block text-2xl font-semibold tracking-tight transition-colors duration-200 group-hover:text-[#e11d48] ${
                  isDark ? "text-white" : "text-[#1f2937]"
                }`}
              >
                CareBridge.ai
              </span>
              <span
                className={`block text-sm ${
                  isDark ? "text-zinc-400" : "text-[#6b7280]"
                }`}
              >
                Family Care Dashboard
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={toggleTheme}
            className={`absolute right-0 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 ${
              isDark
                ? "bg-zinc-800/80 text-amber-400 hover:bg-zinc-700/80"
                : "bg-white text-[#a78bfa] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
            }`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </header>

        {/* Cards */}
        <section className="grid gap-4">
          {/* Check-in pill — solid rose */}
          <div className="flex justify-center py-1">
            <Link
              href={actionCards[0].href}
              className={`group relative inline-flex items-center gap-3 rounded-full px-8 py-4 text-white transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_24px_60px_-12px_rgba(225,29,72,0.45)] ${
                isDark
                  ? "bg-[#be123c] shadow-[0_16px_50px_-12px_rgba(225,29,72,0.5)]"
                  : "bg-[#e11d48] shadow-[0_16px_50px_-12px_rgba(225,29,72,0.35)]"
              }`}
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                <Phone className="h-5 w-5" />
              </span>
              <span className="text-xl font-semibold tracking-tight">
                {actionCards[0].title}
              </span>
              <Heart className="h-5 w-5 text-white/80 transition-transform duration-300 group-hover:scale-125" />
            </Link>
          </div>

          {/* Two-column: Timeline + Attention */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              href={actionCards[1].href}
              onPointerMove={handlePointerMove}
              className={`group relative overflow-hidden rounded-[1.25rem] border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${cursorGlowClass} ${
                isDark
                  ? "border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800/80"
                  : "border-zinc-200/60 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
              }`}
            >
              <span
                className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                  isDark ? "bg-violet-500/20 text-violet-300" : "bg-[#f3e8ff] text-[#7c3aed]"
                }`}
              >
                <Clock3 className="h-5 w-5" />
              </span>
              <p
                className={`text-[1.05rem] font-semibold leading-snug ${
                  isDark ? "text-zinc-100" : "text-[#1f2937]"
                }`}
              >
                {actionCards[1].title}
              </p>
              <p
                className={`mt-1 text-sm leading-snug ${
                  isDark ? "text-zinc-400" : "text-[#6b7280]"
                }`}
              >
                {actionCards[1].subtitle}
              </p>
            </Link>

            <Link
              href={actionCards[2].href}
              onPointerMove={handlePointerMove}
              className={`group relative overflow-hidden rounded-[1.25rem] border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${cursorGlowClass} ${
                isDark
                  ? "border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800/80"
                  : "border-zinc-200/60 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
              }`}
            >
              <span
                className={`relative mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 ${
                  isDark ? "bg-rose-500/20 text-rose-300" : "bg-[#ffe4e6] text-[#e11d48]"
                }`}
              >
                <Bell className="h-5 w-5" />
                {urgentCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#e11d48] text-[10px] font-bold text-white">
                    {urgentCount}
                  </span>
                )}
                {notifySoonCount > 0 && (
                  <span className={`absolute ${urgentCount > 0 ? "-bottom-1" : "-right-1 -top-1"} -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#f59e0b] text-[10px] font-bold text-white`}>
                    {notifySoonCount}
                  </span>
                )}
              </span>
              <p
                className={`text-[1.05rem] font-semibold leading-snug ${
                  isDark ? "text-zinc-100" : "text-[#1f2937]"
                }`}
              >
                {actionCards[2].title}
              </p>
              <p
                className={`mt-1 text-sm leading-snug ${
                  isDark ? "text-zinc-400" : "text-[#6b7280]"
                }`}
              >
                {totalAttention > 0 ? (
                  <>
                    {urgentCount > 0 && (
                      <span className="font-medium text-[#e11d48]">
                        {urgentCount} urgent
                      </span>
                    )}
                    {urgentCount > 0 && notifySoonCount > 0 && ", "}
                    {notifySoonCount > 0 && (
                      <span className="font-medium text-[#f59e0b]">
                        {notifySoonCount} follow-up
                      </span>
                    )}
                  </>
                ) : (
                  "No active alerts"
                )}
              </p>
            </Link>
          </div>

          {/* Profile card */}
          <Link
            href={actionCards[3].href}
            onPointerMove={handlePointerMove}
            className={`group relative flex items-center gap-4 overflow-hidden rounded-[1.25rem] border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${cursorGlowClass} ${
              isDark
                ? "border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800/80"
                : "border-zinc-200/60 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
            }`}
          >
            <span
              className="inline-flex h-12 w-12 overflow-hidden rounded-2xl bg-gradient-to-br from-[#fb923c] to-[#ec4899] p-0.5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/parent-profile.png" alt={actionCards[3].title} className="h-full w-full rounded-[0.85rem] object-cover" />
            </span>
            <div className="flex-1">
              <p className={`text-[1.05rem] font-semibold ${isDark ? "text-zinc-100" : "text-[#1f2937]"}`}>
                {actionCards[3].title}
              </p>
              <p className={`text-sm ${isDark ? "text-zinc-400" : "text-[#6b7280]"}`}>
                {relationshipLabel} &middot; {actionCards[3].subtitle}
              </p>
            </div>
            <div className={`flex shrink-0 items-center gap-4 text-xs font-medium ${isDark ? "text-zinc-400" : "text-[#6b7280]"}`}>
              <span className="flex items-center gap-0.5" title="Emergency & support contacts">
                <Plus className="h-3 w-3 text-[#22c55e]" strokeWidth={2.5} />
                <Phone className="h-3.5 w-3.5 text-[#22c55e]" /> {emergencyContactCount}
              </span>
              <span className="flex items-center gap-1" title="Active reminders">
                <Bell className="h-3.5 w-3.5 text-[#a78bfa]" /> {activeReminderCount}
              </span>
              <span className="flex items-center gap-1" title={lovedOneAgeYears != null ? "Age from date of birth" : "Add date of birth in care profile"}>
                <Heart className="h-3.5 w-3.5 text-[#e11d48]" />
                {lovedOneAgeYears != null ? `${lovedOneAgeYears}` : "—"}
              </span>
            </div>
          </Link>
        </section>
      </div>
    </main>
  );
}
