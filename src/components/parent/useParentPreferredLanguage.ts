"use client";

import { useEffect, useState } from "react";
import type { ParentLang } from "@/lib/parent-i18n";
import { normalizeParentLang } from "@/lib/parent-i18n";

export function useParentPreferredLanguage(): {
  lang: ParentLang;
  ready: boolean;
  /** Caregiver / “your name” from care profile — shown on loved one’s device instead of generic “Your family”. */
  familyMemberName: string;
} {
  const [lang, setLang] = useState<ParentLang>("en");
  const [familyMemberName, setFamilyMemberName] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (d: {
          profile?: { preferredLanguage?: string; familyMemberName?: string };
        } | null) => {
          if (cancelled || !d?.profile) return;
          setLang(normalizeParentLang(d.profile.preferredLanguage));
          setFamilyMemberName((d.profile.familyMemberName ?? "").trim());
        }
      )
      .catch(() => {
        if (!cancelled) setLang("en");
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { lang, ready, familyMemberName };
}
