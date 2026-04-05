"use client";

import { createContext, useCallback, useContext } from "react";

interface CareThemeValue {
  isDark: boolean;
  cursorGlowClass: string;
  handlePointerMove: (e: React.PointerEvent<HTMLElement>) => void;
}

export const CareThemeContext = createContext<CareThemeValue>({
  isDark: false,
  cursorGlowClass: "",
  handlePointerMove: () => {},
});

export function useCareTheme() {
  return useContext(CareThemeContext);
}

export function useCareThemeValue(isDark: boolean): CareThemeValue {
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

  return { isDark, cursorGlowClass, handlePointerMove };
}
