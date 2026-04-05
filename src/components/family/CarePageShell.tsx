"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Moon, Sun } from "lucide-react";
import { CareThemeContext, useCareThemeValue } from "./CareThemeContext";

const THEME_STORAGE_KEY = "family-dashboard-theme";
type ThemeChoice = "light" | "dark";

export default function CarePageShell({
  children,
  pageTitle,
}: {
  children: React.ReactNode;
  pageTitle?: string;
}) {
  const [theme, setTheme] = useState<ThemeChoice>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const isDark = theme === "dark";
  const themeValue = useCareThemeValue(isDark);

  function toggleTheme() {
    const next: ThemeChoice = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
  }

  return (
    <CareThemeContext.Provider value={themeValue}>
      <main
        className={`w-full flex-1 ${
          isDark
            ? "bg-[#0f0f14] text-zinc-100"
            : "bg-[#f8f4f1] text-zinc-900"
        }`}
      >
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
        </div>

        <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-8 sm:py-12">
          <header className="relative flex w-full items-center justify-center">
            <Link href="/family" className="group flex items-center gap-3">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110 ${
                  isDark ? "bg-[#be123c]" : "bg-[#e11d48]"
                }`}
              >
                <Heart className="h-5 w-5 text-white" fill="currentColor" />
              </span>
              <span
                className={`text-xl font-semibold tracking-tight transition-colors duration-200 group-hover:text-[#e11d48] ${
                  isDark ? "text-white" : "text-[#1f2937]"
                }`}
              >
                CareBridge.ai
              </span>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className={`absolute right-0 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 hover:scale-110 ${
                isDark
                  ? "bg-zinc-800/80 text-amber-400 hover:bg-zinc-700/80"
                  : "bg-white text-[#a78bfa] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </header>

          {pageTitle && (
            <p
              className={`text-center text-xs font-semibold uppercase tracking-[0.18em] ${
                isDark ? "text-zinc-500" : "text-[#9ca3af]"
              }`}
            >
              {pageTitle}
            </p>
          )}

          <div className="flex flex-col gap-4">{children}</div>
        </div>
      </main>
    </CareThemeContext.Provider>
  );
}
