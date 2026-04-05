"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings2, UserRound } from "lucide-react";
import {
  createBrowserSupabaseClient,
  isSupabaseAuthConfigured,
} from "@/lib/supabase/browser";

const DEFAULT_AVATAR = "/child-profile.png";

interface FamilyProfileMenuProps {
  isDark: boolean;
  familyMemberName: string;
  familyMemberImageUrl?: string;
}

export default function FamilyProfileMenu({
  isDark,
  familyMemberName,
  familyMemberImageUrl,
}: FamilyProfileMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const avatarSrc =
    familyMemberImageUrl?.trim() || DEFAULT_AVATAR;

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onDocMouseDown);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onDocMouseDown);
        document.removeEventListener("keydown", onKey);
      };
    }
  }, [open]);

  async function signOut() {
    setOpen(false);
    if (isSupabaseAuthConfigured()) {
      try {
        const supabase = createBrowserSupabaseClient();
        await supabase.auth.signOut();
      } catch {
        /* ignore */
      }
    }
    router.push("/login");
    router.refresh();
  }

  const linkClass = isDark
    ? "bg-zinc-800/80 ring-1 ring-zinc-700/80 hover:bg-zinc-700/80"
    : "bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-zinc-200/80 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]";

  const chevronClass = isDark
    ? "bg-zinc-800/80 text-zinc-300 ring-1 ring-zinc-700/80 hover:bg-zinc-700/80"
    : "bg-white text-zinc-600 shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-zinc-200/80 hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]";

  const menuClass = isDark
    ? "border-zinc-700/90 bg-zinc-900 text-zinc-100 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
    : "border-zinc-200/80 bg-white text-zinc-900 shadow-[0_12px_40px_rgba(0,0,0,0.12)]";

  const itemClass = isDark
    ? "text-zinc-200 hover:bg-zinc-800/90"
    : "text-zinc-800 hover:bg-[#f8f4f1]";

  const dangerClass = isDark
    ? "text-rose-300 hover:bg-rose-950/40"
    : "text-rose-600 hover:bg-rose-50";

  return (
    <div className="relative flex items-center gap-1" ref={rootRef}>
      <Link
        href="/family/me"
        className={`inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl transition-all duration-200 hover:scale-110 ${linkClass}`}
        aria-label={`Edit your profile (${familyMemberName})`}
        title="Your profile"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
      </Link>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-12 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 hover:scale-105 ${chevronClass}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          role="menu"
          className={`absolute right-0 top-[calc(100%+10px)] z-50 min-w-[12.5rem] rounded-xl border py-1 ${menuClass}`}
        >
          <p
            className={`truncate border-b px-3 py-2 text-xs font-medium ${
              isDark ? "border-zinc-800 text-zinc-400" : "border-zinc-100 text-zinc-500"
            }`}
          >
            {familyMemberName}
          </p>
          <Link
            href="/family/me"
            role="menuitem"
            className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors ${itemClass}`}
            onClick={() => setOpen(false)}
          >
            <UserRound className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            Your profile
          </Link>
          <Link
            href="/family/settings"
            role="menuitem"
            className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors ${itemClass}`}
            onClick={() => setOpen(false)}
          >
            <Settings2 className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            Care settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition-colors ${dangerClass}`}
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
