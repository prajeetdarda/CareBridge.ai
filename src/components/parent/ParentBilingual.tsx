"use client";

import type { ParentLang } from "@/lib/parent-i18n";

type Align = "center" | "left";

export function ParentBilingual({
  lang,
  primary,
  english,
  align = "center",
  primaryClassName = "",
  englishClassName = "text-sm text-zinc-500",
}: {
  lang: ParentLang;
  primary: string;
  english: string;
  align?: Align;
  primaryClassName?: string;
  englishClassName?: string;
}) {
  const showEnglish = lang !== "en" && english.trim() !== primary.trim();
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <span className={primaryClassName}>{primary}</span>
      {showEnglish && (
        <span className={`mt-0.5 block font-normal ${englishClassName}`}>
          ({english})
        </span>
      )}
    </div>
  );
}

/** For text on solid colored buttons (rose / violet / green): English line slightly softer. */
export function ParentBilingualOnColor({
  lang,
  primary,
  english,
  align = "center",
  primaryClassName = "",
}: {
  lang: ParentLang;
  primary: string;
  english: string;
  align?: Align;
  primaryClassName?: string;
}) {
  const showEnglish = lang !== "en" && english.trim() !== primary.trim();
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <span className={primaryClassName}>{primary}</span>
      {showEnglish && (
        <span className="mt-0.5 block text-sm font-normal text-white/80">
          ({english})
        </span>
      )}
    </div>
  );
}
