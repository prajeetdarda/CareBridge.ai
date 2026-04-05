"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import type { FamilyProfile, ReminderRecord, BackupContact } from "@/lib/types";
import {
  normalizeParentLang,
  PARENT_UI_LANGUAGE_OPTIONS,
} from "@/lib/parent-i18n";
import { useCareTheme } from "@/components/family/CareThemeContext";

interface SettingsFormProps {
  initial: FamilyProfile;
}

const TOPIC_OPTIONS = [
  "medication",
  "food",
  "activity",
  "mood",
  "sleep",
  "social",
  "mobility",
];

const DEFAULT_LOVED_ONE_PHOTO = "/parent-profile.png";
const MAX_LOVED_ONE_PHOTO_BYTES = 220 * 1024;

export default function SettingsForm({ initial }: SettingsFormProps) {
  const { isDark, cursorGlowClass, handlePointerMove } = useCareTheme();
  const router = useRouter();
  const [profile, setProfile] = useState<FamilyProfile>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState(0);
  const lovedOnePhotoInputRef = useRef<HTMLInputElement>(null);
  const [lovedOnePhotoUrlDraft, setLovedOnePhotoUrlDraft] = useState("");

  const lovedOnePhotoSrc =
    profile.lovedOneImageUrl?.trim() || DEFAULT_LOVED_ONE_PHOTO;

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyMemberName: profile.familyMemberName,
          familyMemberImageUrl: profile.familyMemberImageUrl,
          lovedOneName: profile.lovedOneName,
          lovedOneImageUrl: profile.lovedOneImageUrl?.trim() ?? "",
          lovedOneDateOfBirth: profile.lovedOneDateOfBirth ?? "",
          preferredLanguage: profile.preferredLanguage,
          relationshipLabel: profile.relationshipLabel,
          careTopics: profile.careTopics,
          reminderRules: profile.reminderRules,
          backupContacts: profile.backupContacts,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setProfile(data.profile);
      setMessage("Saved! Redirecting...");
      setTimeout(() => router.push("/family"), 1200);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function toggleTopic(topic: string) {
    setProfile((p) => {
      const has = p.careTopics.includes(topic);
      return {
        ...p,
        careTopics: has
          ? p.careTopics.filter((t) => t !== topic)
          : [...p.careTopics, topic],
      };
    });
  }

  function updateBackup(index: number, field: keyof BackupContact, value: string | number) {
    setProfile((p) => {
      const next = [...p.backupContacts];
      next[index] = { ...next[index], [field]: value };
      return { ...p, backupContacts: next };
    });
  }

  function addBackup() {
    setProfile((p) => ({
      ...p,
      backupContacts: [
        ...p.backupContacts,
        {
          name: "",
          relationship: "",
          contactInfo: "",
          email: "",
          escalationPriority: p.backupContacts.length + 1,
        },
      ],
    }));
  }

  function removeBackup(index: number) {
    setProfile((p) => ({ ...p, backupContacts: p.backupContacts.filter((_, i) => i !== index) }));
  }

  function updateReminder(index: number, field: keyof ReminderRecord, value: string | boolean) {
    setProfile((p) => {
      const next = [...p.reminderRules];
      next[index] = { ...next[index], [field]: value };
      return { ...p, reminderRules: next };
    });
  }

  function addReminder() {
    setProfile((p) => ({
      ...p,
      reminderRules: [
        ...p.reminderRules,
        { id: crypto.randomUUID(), title: "New reminder", type: "daily", time: "09:00", enabled: true },
      ],
    }));
  }

  function removeReminder(index: number) {
    setProfile((p) => ({ ...p, reminderRules: p.reminderRules.filter((_, i) => i !== index) }));
  }

  function onLovedOnePhotoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file for the photo.");
      return;
    }
    if (file.size > MAX_LOVED_ONE_PHOTO_BYTES) {
      setMessage("Loved one’s photo should be about 220 KB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((p) => ({ ...p, lovedOneImageUrl: reader.result as string }));
      setMessage(null);
    };
    reader.readAsDataURL(file);
  }

  function applyLovedOnePhotoUrl() {
    const t = lovedOnePhotoUrlDraft.trim();
    if (!t) {
      setMessage("Paste an image URL first.");
      return;
    }
    setProfile((p) => ({ ...p, lovedOneImageUrl: t }));
    setLovedOnePhotoUrlDraft("");
    setMessage(null);
  }

  function resetLovedOnePhoto() {
    setProfile((p) => ({ ...p, lovedOneImageUrl: "" }));
    setLovedOnePhotoUrlDraft("");
    setMessage(null);
  }

  const cardBase = isDark
    ? "border-zinc-800 bg-[rgba(24,24,30,0.7)]"
    : "border-zinc-200/60 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)]";
  const cardCls = `relative overflow-hidden rounded-[1.25rem] border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:p-6 ${cursorGlowClass} ${cardBase}`;
  const inputCls = isDark
    ? "mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-[#e11d48]/30"
    : "mt-1 w-full rounded-lg border border-zinc-200/60 bg-[#f8f4f1] px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#e11d48]/20";
  const labelCls = isDark ? "block text-xs font-medium text-zinc-400" : "block text-xs font-medium text-[#6b7280]";
  const headText = isDark ? "text-zinc-100" : "text-[#1f2937]";
  const mutedText = isDark ? "text-zinc-400" : "text-[#6b7280]";
  const surfaceBg = isDark ? "border-zinc-700 bg-zinc-800/60" : "border-zinc-100 bg-[#f8f4f1]";
  const smallInputCls = isDark
    ? "rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-[#e11d48]/30"
    : "rounded-lg border border-zinc-200/60 bg-white px-2 py-1 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#e11d48]/20";
  const selectCls = inputCls;

  const preferredLangCode = normalizeParentLang(profile.preferredLanguage || "en");
  const preferredLangLabel =
    PARENT_UI_LANGUAGE_OPTIONS.find((o) => o.value === preferredLangCode)?.label ??
    preferredLangCode;

  return (
    <div className="w-full space-y-4">
      {/* Avatar + profile fields */}
      <section onPointerMove={handlePointerMove} className={`${cardCls} space-y-5`}>
        <div className="flex flex-col items-center gap-2">
          <div className="relative inline-block">
            <div
              className={`h-24 w-24 overflow-hidden rounded-full p-0.5 ${
                isDark
                  ? "bg-gradient-to-br from-[#fb923c] to-[#ec4899]"
                  : "bg-gradient-to-br from-[#fb923c] to-[#ec4899]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lovedOnePhotoSrc}
                alt={profile.lovedOneName || "Loved one"}
                className="h-full w-full rounded-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => lovedOnePhotoInputRef.current?.click()}
              className={`absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-md transition hover:scale-105 ${
                isDark
                  ? "border-zinc-900 bg-[#e11d48] text-white hover:bg-[#be123c]"
                  : "border-white bg-[#e11d48] text-white hover:bg-[#be123c]"
              }`}
              aria-label="Change loved one’s photo"
              title="Change photo"
            >
              <Pencil className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </button>
            <input
              ref={lovedOnePhotoInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onLovedOnePhotoFile}
            />
          </div>
          <button
            type="button"
            onClick={resetLovedOnePhoto}
            className={`text-xs font-medium underline-offset-2 hover:underline ${mutedText}`}
          >
            Use default photo
          </button>
          <div className="flex w-full max-w-sm flex-col gap-1.5 sm:flex-row sm:items-center">
            <input
              type="url"
              value={lovedOnePhotoUrlDraft}
              onChange={(e) => setLovedOnePhotoUrlDraft(e.target.value)}
              placeholder="Or paste image URL"
              className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs outline-none ${
                isDark
                  ? "border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:ring-2 focus:ring-[#e11d48]/30"
                  : "border-zinc-200 bg-white text-[#1f2937] placeholder:text-zinc-400 focus:ring-2 focus:ring-[#e11d48]/20"
              }`}
            />
            <button
              type="button"
              onClick={applyLovedOnePhotoUrl}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-white ${
                isDark ? "bg-[#be123c] hover:bg-[#9f1239]" : "bg-[#e11d48] hover:bg-[#be123c]"
              }`}
            >
              Apply URL
            </button>
          </div>
          <p className={`text-lg font-semibold ${headText}`}>
            {profile.lovedOneName || "Loved one"}
          </p>
          <p className={`text-xs ${mutedText}`}>
            {profile.relationshipLabel || "Relationship"} &middot; {preferredLangLabel}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelCls}>
            Your name
            <input className={inputCls} value={profile.familyMemberName} onChange={(e) => setProfile((p) => ({ ...p, familyMemberName: e.target.value }))} />
          </label>
          <label className={labelCls}>
            Loved one&apos;s name
            <input className={inputCls} value={profile.lovedOneName} onChange={(e) => setProfile((p) => ({ ...p, lovedOneName: e.target.value }))} />
          </label>
          <label className={labelCls}>
            Date of birth
            <input
              type="date"
              className={inputCls}
              value={profile.lovedOneDateOfBirth ?? ""}
              onChange={(e) =>
                setProfile((p) => ({ ...p, lovedOneDateOfBirth: e.target.value }))
              }
            />
          </label>
          <label className={labelCls}>
            Relationship
            <input className={inputCls} value={profile.relationshipLabel} onChange={(e) => setProfile((p) => ({ ...p, relationshipLabel: e.target.value }))} />
          </label>
          <label className={`${labelCls} sm:col-span-2`}>
            Language
            <select
              className={selectCls}
              value={preferredLangCode}
              onChange={(e) =>
                setProfile((p) => ({ ...p, preferredLanguage: e.target.value }))
              }
            >
              {PARENT_UI_LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
              <option disabled value="__more__">
                More languages coming soon…
              </option>
            </select>
          </label>
        </div>
      </section>

      <section onPointerMove={handlePointerMove} className={`${cardCls} space-y-4`}>
        <h2 className={`text-base font-semibold ${headText}`}>Care topics</h2>
        <div className="flex flex-wrap gap-2">
          {TOPIC_OPTIONS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => toggleTopic(topic)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                profile.careTopics.includes(topic)
                  ? "bg-[#e11d48] text-white shadow-sm"
                  : isDark
                    ? "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-[#e11d48]"
                    : "border border-zinc-200/60 bg-[#f8f4f1] text-[#6b7280] hover:text-[#e11d48]"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </section>

      <section onPointerMove={handlePointerMove} className={`${cardCls} space-y-4`}>
        <h2 className={`text-base font-semibold ${headText}`}>Medical &amp; info documents</h2>
        <p className={`text-xs leading-relaxed ${mutedText}`}>
          Upload prescriptions, medical reports, or any reference files about your loved one.
          These help caregivers stay informed.
        </p>
        <label
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
            isDark
              ? "border-zinc-700 bg-zinc-800/40 hover:border-[#e11d48]/40"
              : "border-zinc-200 bg-[#f8f4f1]/60 hover:border-[#e11d48]/40"
          }`}
        >
          <span className={`text-2xl ${mutedText}`}>📎</span>
          <span className={`text-xs font-semibold ${headText}`}>
            Click to upload or drag &amp; drop
          </span>
          <span className={`text-[10px] ${mutedText}`}>
            PDF, JPG, PNG up to 10 MB
          </span>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={() => {
              setUploadedFiles((prev) => prev + 1);
            }}
          />
        </label>
        {uploadedFiles > 0 && (
          <p className={`flex items-center gap-1.5 text-xs font-medium ${isDark ? "text-emerald-300" : "text-emerald-600"}`}>
            <span>✓</span> {uploadedFiles} file{uploadedFiles > 1 ? "s" : ""} selected
          </p>
        )}
      </section>

      <section onPointerMove={handlePointerMove} className={`${cardCls} space-y-4`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-base font-semibold ${headText}`}>Reminders</h2>
          <button
            type="button"
            onClick={addReminder}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold text-[#e11d48] transition-all ${
              isDark ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700" : "border-zinc-200/60 bg-white shadow-sm hover:bg-[#ffe4e6]/40"
            }`}
          >
            + Add
          </button>
        </div>
        {profile.reminderRules.length === 0 && <p className={`text-xs ${mutedText}`}>No reminders yet.</p>}
        <ul className="space-y-3">
          {profile.reminderRules.map((r, i) => (
            <li key={r.id} className={`rounded-xl border p-3 ${surfaceBg}`}>
              <div className="flex flex-wrap gap-2">
                <input className={`min-w-[8rem] flex-1 ${smallInputCls}`} value={r.title} onChange={(e) => updateReminder(i, "title", e.target.value)} />
                <input className={`w-24 ${smallInputCls}`} value={r.time} onChange={(e) => updateReminder(i, "time", e.target.value)} />
                <label className={`flex items-center gap-1 text-xs ${mutedText}`}>
                  <input type="checkbox" checked={r.enabled} onChange={(e) => updateReminder(i, "enabled", e.target.checked)} />
                  On
                </label>
                <button type="button" onClick={() => removeReminder(i)} className="text-xs font-semibold text-[#e11d48] hover:underline">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section onPointerMove={handlePointerMove} className={`${cardCls} space-y-4`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-base font-semibold ${headText}`}>Support contacts</h2>
          <button
            type="button"
            onClick={addBackup}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold text-[#e11d48] transition-all ${
              isDark ? "border-zinc-700 bg-zinc-800 hover:bg-zinc-700" : "border-zinc-200/60 bg-white shadow-sm hover:bg-[#ffe4e6]/40"
            }`}
          >
            + Add
          </button>
        </div>
        {profile.backupContacts.length === 0 && <p className={`text-xs ${mutedText}`}>No contacts yet.</p>}
        <ul className="space-y-3">
          {profile.backupContacts.map((c, i) => (
            <li key={i} className={`space-y-2 rounded-xl border p-3 ${surfaceBg}`}>
              <input className={`w-full ${smallInputCls}`} placeholder="Name" value={c.name} onChange={(e) => updateBackup(i, "name", e.target.value)} />
              <input className={`w-full ${smallInputCls}`} placeholder="Relationship" value={c.relationship} onChange={(e) => updateBackup(i, "relationship", e.target.value)} />
              <input
                className={`w-full ${smallInputCls}`}
                type="email"
                placeholder="Escalation email"
                value={c.email ?? ""}
                onChange={(e) => updateBackup(i, "email", e.target.value)}
              />
              <input
                className={`w-full ${smallInputCls}`}
                placeholder="Phone or alternate contact"
                value={c.contactInfo}
                onChange={(e) => updateBackup(i, "contactInfo", e.target.value)}
              />
              <div className="flex items-center justify-between">
                <label className={`text-xs ${mutedText}`}>
                  Priority
                  <input type="number" min={1} className={`ml-2 w-16 ${smallInputCls}`} value={c.escalationPriority} onChange={(e) => updateBackup(i, "escalationPriority", Number(e.target.value) || 1)} />
                </label>
                <button type="button" onClick={() => removeBackup(i)} className="text-xs font-semibold text-[#e11d48] hover:underline">Remove</button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          disabled={saving || message === "Saved! Redirecting..."}
          onClick={save}
          className="w-full rounded-full bg-[#e11d48] py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_-6px_rgba(225,29,72,0.3)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-6px_rgba(225,29,72,0.4)] disabled:opacity-50 sm:w-auto sm:px-10"
        >
          {saving ? "Saving..." : "Save care profile"}
        </button>
        {message && (
          <span
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              message.startsWith("Saved")
                ? isDark
                  ? "bg-emerald-900/30 text-emerald-300"
                  : "bg-emerald-100 text-emerald-700"
                : isDark
                  ? "bg-red-900/30 text-red-300"
                  : "bg-[#ffe4e6] text-[#e11d48]"
            }`}
            role="status"
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
