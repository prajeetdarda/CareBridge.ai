"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus } from "lucide-react";
import type { FamilyProfile } from "@/lib/types";
import { useCareTheme } from "@/components/family/CareThemeContext";

const DEFAULT_AVATAR = "/child-profile.png";
const MAX_FILE_BYTES = 220 * 1024;

interface FamilyMemberProfileFormProps {
  initial: Pick<FamilyProfile, "familyMemberName" | "familyMemberImageUrl">;
}

export default function FamilyMemberProfileForm({ initial }: FamilyMemberProfileFormProps) {
  const { isDark, cursorGlowClass, handlePointerMove } = useCareTheme();
  const router = useRouter();
  const [name, setName] = useState(initial.familyMemberName ?? "");
  const [imageUrl, setImageUrl] = useState(
    initial.familyMemberImageUrl?.trim() || ""
  );
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const displaySrc = imageUrl.trim() || DEFAULT_AVATAR;

  function applyPhotoUrl() {
    const t = photoUrlInput.trim();
    if (!t) {
      setMessage("Paste an image URL first.");
      return;
    }
    setImageUrl(t);
    setPhotoUrlInput("");
    setMessage(null);
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setMessage("Image must be about 220 KB or smaller for this demo.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setMessage(null);
    };
    reader.readAsDataURL(file);
  }

  function useDefaultPhoto() {
    setImageUrl("");
    setPhotoUrlInput("");
    setMessage(null);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyMemberName: name.trim(),
          familyMemberImageUrl: imageUrl.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setMessage("Saved.");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const cardCls = isDark
    ? "border-zinc-800 bg-zinc-900/70"
    : "border-zinc-200/60 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)]";
  const inputCls = isDark
    ? "rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-pink-500/50"
    : "rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-[#d36c9c]";

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/family"
        className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
          isDark ? "text-zinc-400 hover:text-zinc-200" : "text-[#6b7280] hover:text-[#1f2937]"
        }`}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to dashboard
      </Link>

      <div
        onPointerMove={handlePointerMove}
        className={`relative overflow-hidden rounded-[1.25rem] border p-6 sm:p-8 ${cursorGlowClass} ${cardCls}`}
      >
        <h1
          className={`mb-1 text-xl font-semibold sm:text-2xl ${
            isDark ? "text-white" : "text-[#1f2937]"
          }`}
        >
          Your profile
        </h1>
        <p className={`mb-6 text-sm ${isDark ? "text-zinc-400" : "text-[#6b7280]"}`}>
          This is how you appear on the family dashboard. Loved-one care settings stay under Care
          Profile.
        </p>

        <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div
            className={`relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl p-0.5 ${
              isDark
                ? "bg-gradient-to-br from-[#fb923c] to-[#ec4899]"
                : "bg-gradient-to-br from-[#fb923c] to-[#ec4899]"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displaySrc}
              alt=""
              className="h-full w-full rounded-[0.9rem] object-cover"
            />
          </div>
          <div className="flex w-full max-w-md flex-col gap-3">
            <label className="block">
              <span
                className={`mb-2 block text-sm font-semibold ${
                  isDark ? "text-zinc-300" : "text-[#374151]"
                }`}
              >
                Display name
              </span>
              <input
                className={`w-full ${inputCls}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
            <div>
              <span
                className={`mb-2 block text-sm font-semibold ${
                  isDark ? "text-zinc-300" : "text-[#374151]"
                }`}
              >
                Profile photo
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <label
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                    isDark
                      ? "border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                      : "border-zinc-200 bg-[#fdf2f8] text-[#9d174d] hover:bg-[#fce7f3]"
                  }`}
                >
                  <ImagePlus className="h-4 w-4" aria-hidden />
                  Upload image
                  <input type="file" accept="image/*" className="sr-only" onChange={onPickFile} />
                </label>
                <button
                  type="button"
                  onClick={useDefaultPhoto}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                    isDark
                      ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                      : "border-zinc-200 text-[#6b7280] hover:bg-zinc-50"
                  }`}
                >
                  Use default photo
                </button>
              </div>
              <p className={`mt-2 text-xs ${isDark ? "text-zinc-500" : "text-[#9ca3af]"}`}>
                Uploads are stored with your profile (demo: keep images small, under ~220 KB).
              </p>
            </div>
            <div>
              <span
                className={`mb-2 block text-sm font-semibold ${
                  isDark ? "text-zinc-300" : "text-[#374151]"
                }`}
              >
                Or paste image URL
              </span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className={`min-w-0 flex-1 ${inputCls}`}
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  placeholder="https://…"
                  type="url"
                />
                <button
                  type="button"
                  onClick={applyPhotoUrl}
                  className={`shrink-0 rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                    isDark ? "bg-[#be123c] hover:bg-[#9f1239]" : "bg-[#e11d48] hover:bg-[#be123c]"
                  }`}
                >
                  Apply URL
                </button>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <p
            className={`mb-4 text-sm ${
              message === "Saved."
                ? isDark
                  ? "text-emerald-400"
                  : "text-emerald-600"
                : isDark
                  ? "text-amber-300"
                  : "text-amber-700"
            }`}
          >
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saving || !name.trim()}
          className={`w-full rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition disabled:opacity-40 sm:w-auto sm:min-w-[10rem] ${
            isDark
              ? "bg-[#be123c] shadow-rose-900/30 hover:bg-[#9f1239]"
              : "bg-[#e11d48] shadow-[#e11d48]/25 hover:bg-[#be123c]"
          }`}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
