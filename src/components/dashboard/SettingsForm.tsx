"use client";

import { useState } from "react";
import type { FamilyProfile, ReminderRecord, BackupContact } from "@/lib/types";

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

export default function SettingsForm({ initial }: SettingsFormProps) {
  const [profile, setProfile] = useState<FamilyProfile>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          familyMemberName: profile.familyMemberName,
          lovedOneName: profile.lovedOneName,
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
      setMessage("Saved.");
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

  function updateBackup(
    index: number,
    field: keyof BackupContact,
    value: string | number
  ) {
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
          escalationPriority: p.backupContacts.length + 1,
        },
      ],
    }));
  }

  function removeBackup(index: number) {
    setProfile((p) => ({
      ...p,
      backupContacts: p.backupContacts.filter((_, i) => i !== index),
    }));
  }

  function updateReminder(
    index: number,
    field: keyof ReminderRecord,
    value: string | boolean
  ) {
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
        {
          id: crypto.randomUUID(),
          title: "New reminder",
          type: "daily",
          time: "09:00",
          enabled: true,
        },
      ],
    }));
  }

  function removeReminder(index: number) {
    setProfile((p) => ({
      ...p,
      reminderRules: p.reminderRules.filter((_, i) => i !== index),
    }));
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Profile</h2>
        <label className="block text-xs text-muted">
          Your name
          <input
            className="mt-1 w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm"
            value={profile.familyMemberName}
            onChange={(e) =>
              setProfile((p) => ({ ...p, familyMemberName: e.target.value }))
            }
          />
        </label>
        <label className="block text-xs text-muted">
          Loved one&apos;s name
          <input
            className="mt-1 w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm"
            value={profile.lovedOneName}
            onChange={(e) =>
              setProfile((p) => ({ ...p, lovedOneName: e.target.value }))
            }
          />
        </label>
        <label className="block text-xs text-muted">
          Relationship (e.g. daughter)
          <input
            className="mt-1 w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm"
            value={profile.relationshipLabel}
            onChange={(e) =>
              setProfile((p) => ({ ...p, relationshipLabel: e.target.value }))
            }
          />
        </label>
        <label className="block text-xs text-muted">
          Preferred language (BCP-47 / short code)
          <input
            className="mt-1 w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm"
            value={profile.preferredLanguage}
            onChange={(e) =>
              setProfile((p) => ({ ...p, preferredLanguage: e.target.value }))
            }
            placeholder="hi, te, en, …"
          />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Care topics</h2>
        <p className="text-xs text-muted">
          Topics the AI should pay extra attention to in summaries.
        </p>
        <div className="flex flex-wrap gap-2">
          {TOPIC_OPTIONS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => toggleTopic(topic)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                profile.careTopics.includes(topic)
                  ? "bg-primary text-white"
                  : "border border-card-border bg-card text-muted"
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Reminders</h2>
          <button
            type="button"
            onClick={addReminder}
            className="text-xs font-medium text-primary hover:underline"
          >
            + Add
          </button>
        </div>
        {profile.reminderRules.length === 0 && (
          <p className="text-xs text-muted">No reminders yet.</p>
        )}
        <ul className="space-y-3">
          {profile.reminderRules.map((r, i) => (
            <li
              key={r.id}
              className="rounded-lg border border-card-border bg-card p-3"
            >
              <div className="flex flex-wrap gap-2">
                <input
                  className="min-w-[8rem] flex-1 rounded border border-card-border bg-background px-2 py-1 text-sm"
                  value={r.title}
                  onChange={(e) => updateReminder(i, "title", e.target.value)}
                />
                <input
                  className="w-24 rounded border border-card-border bg-background px-2 py-1 text-sm"
                  value={r.time}
                  onChange={(e) => updateReminder(i, "time", e.target.value)}
                />
                <label className="flex items-center gap-1 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) =>
                      updateReminder(i, "enabled", e.target.checked)
                    }
                  />
                  On
                </label>
                <button
                  type="button"
                  onClick={() => removeReminder(i)}
                  className="text-xs text-danger hover:underline"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Backup contacts
          </h2>
          <button
            type="button"
            onClick={addBackup}
            className="text-xs font-medium text-primary hover:underline"
          >
            + Add
          </button>
        </div>
        {profile.backupContacts.length === 0 && (
          <p className="text-xs text-muted">No backup contacts yet.</p>
        )}
        <ul className="space-y-3">
          {profile.backupContacts.map((c, i) => (
            <li
              key={i}
              className="space-y-2 rounded-lg border border-card-border bg-card p-3"
            >
              <input
                className="w-full rounded border border-card-border bg-background px-2 py-1 text-sm"
                placeholder="Name"
                value={c.name}
                onChange={(e) => updateBackup(i, "name", e.target.value)}
              />
              <input
                className="w-full rounded border border-card-border bg-background px-2 py-1 text-sm"
                placeholder="Relationship"
                value={c.relationship}
                onChange={(e) =>
                  updateBackup(i, "relationship", e.target.value)
                }
              />
              <input
                className="w-full rounded border border-card-border bg-background px-2 py-1 text-sm"
                placeholder="Phone or email"
                value={c.contactInfo}
                onChange={(e) =>
                  updateBackup(i, "contactInfo", e.target.value)
                }
              />
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted">
                  Priority
                  <input
                    type="number"
                    min={1}
                    className="ml-2 w-16 rounded border border-card-border bg-background px-2 py-1 text-sm"
                    value={c.escalationPriority}
                    onChange={(e) =>
                      updateBackup(
                        i,
                        "escalationPriority",
                        Number(e.target.value) || 1
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeBackup(i)}
                  className="text-xs text-danger hover:underline"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
        {message && (
          <span className="text-sm text-muted" role="status">
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
