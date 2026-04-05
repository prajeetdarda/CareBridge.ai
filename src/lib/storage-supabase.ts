import { getSupabaseClient } from "./supabase";
import type {
  SummaryRecord,
  AlertRecord,
  FamilyProfile,
  PendingCallRecord,
} from "./types";

/**
 * Supabase-backed storage adapter.
 * Same async interface as storage.ts (file-based).
 * Activated when STORAGE_BACKEND=supabase.
 */

const defaultProfile: FamilyProfile = {
  familyMemberName: "Anjali",
  lovedOneName: "Amma",
  lovedOneDateOfBirth: "",
  preferredLanguage: "hi",
  relationshipLabel: "daughter",
  careTopics: ["medication", "food", "activity", "mood"],
  reminderRules: [],
  backupContacts: [],
};

// ── Summaries ──────────────────────────────────────────────────────────────

export async function getSummaries(): Promise<SummaryRecord[]> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from("summaries")
    .select("*")
    .order("timestamp", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SummaryRecord[];
}

export async function addSummary(record: SummaryRecord): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb.from("summaries").insert({
    id: record.id,
    timestamp: record.timestamp,
    initiated_by: record.initiatedBy,
    transcript: record.transcript,
    summary: record.summary,
    urgency_level: record.urgencyLevel,
    escalation_reason: record.escalationReason ?? null,
    action_taken: record.actionTaken ?? null,
    media_path: record.mediaPath ?? null,
    media_type: record.mediaType ?? null,
    language: record.language ?? null,
    call_duration_seconds: record.callDurationSeconds ?? null,
  });
  if (error) throw error;
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export async function getAlerts(): Promise<AlertRecord[]> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from("alerts")
    .select("*")
    .order("timestamp", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToAlert);
}

export async function addAlert(record: AlertRecord): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb.from("alerts").insert({
    id: record.id,
    session_id: record.sessionId,
    timestamp: record.timestamp,
    urgency_level: record.urgencyLevel,
    reason: record.reason,
    transcript: record.transcript ?? null,
    acknowledged: record.acknowledged,
  });
  if (error) throw error;
}

export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from("alerts")
    .update({ acknowledged: true })
    .eq("id", alertId)
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

function rowToAlert(row: Record<string, unknown>): AlertRecord {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    timestamp: row.timestamp as string,
    urgencyLevel: row.urgency_level as AlertRecord["urgencyLevel"],
    reason: row.reason as string,
    transcript: (row.transcript as string) ?? undefined,
    acknowledged: row.acknowledged as boolean,
  };
}

// ── Profile ────────────────────────────────────────────────────────────────

export async function getProfile(): Promise<FamilyProfile> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .eq("id", "default")
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ...defaultProfile };
  return rowToProfile(data);
}

export async function updateProfile(updates: Partial<FamilyProfile>): Promise<FamilyProfile> {
  const current = await getProfile();
  const merged = { ...current, ...updates };

  const sb = getSupabaseClient();
  const { error } = await sb.from("profiles").upsert({
    id: "default",
    family_member_name: merged.familyMemberName,
    family_member_image_url: merged.familyMemberImageUrl?.trim() || null,
    loved_one_name: merged.lovedOneName,
    loved_one_image_url: merged.lovedOneImageUrl?.trim() || null,
    loved_one_date_of_birth: merged.lovedOneDateOfBirth ?? "",
    preferred_language: merged.preferredLanguage,
    relationship_label: merged.relationshipLabel,
    care_topics: merged.careTopics,
    reminder_rules: merged.reminderRules,
    backup_contacts: merged.backupContacts,
  });
  if (error) throw error;
  return merged;
}

function rowToProfile(row: Record<string, unknown>): FamilyProfile {
  return {
    familyMemberName: (row.family_member_name as string) ?? "",
    familyMemberImageUrl:
      (row.family_member_image_url as string) || undefined,
    lovedOneName: (row.loved_one_name as string) ?? "",
    lovedOneImageUrl: (row.loved_one_image_url as string) || undefined,
    lovedOneDateOfBirth: (row.loved_one_date_of_birth as string) ?? "",
    preferredLanguage: (row.preferred_language as string) ?? "en",
    relationshipLabel: (row.relationship_label as string) ?? "",
    careTopics: (row.care_topics as string[]) ?? [],
    reminderRules: (row.reminder_rules as FamilyProfile["reminderRules"]) ?? [],
    backupContacts: (row.backup_contacts as FamilyProfile["backupContacts"]) ?? [],
  };
}

// ── Pending check-in sessions ──────────────────────────────────────────────

export async function savePendingCall(record: PendingCallRecord): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb.from("pending_calls").upsert({
    session_id: record.sessionId,
    created_at: record.createdAt,
    expires_at: record.expiresAt,
    scheduled_for: record.scheduledFor ?? null,
    incoming_signal_at: record.incomingSignalAt ?? null,
    profile_snapshot: record.profileSnapshot,
    call_notes: record.callNotes ?? null,
    voice_provider: record.voiceProvider ?? "gemini",
  });
  if (error) throw error;
}

export async function getPendingCall(sessionId: string): Promise<PendingCallRecord | null> {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from("pending_calls")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const now = Date.now();
  if (now > new Date(data.expires_at as string).getTime()) return null;

  return rowToPendingCall(data);
}

export async function deletePendingCall(sessionId: string): Promise<void> {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from("pending_calls")
    .delete()
    .eq("session_id", sessionId);
  if (error) throw error;
}

function rowToPendingCall(row: Record<string, unknown>): PendingCallRecord {
  return {
    sessionId: row.session_id as string,
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
    scheduledFor: (row.scheduled_for as string) ?? null,
    incomingSignalAt: (row.incoming_signal_at as string) ?? null,
    profileSnapshot: row.profile_snapshot as FamilyProfile,
    callNotes: (row.call_notes as string) ?? undefined,
    voiceProvider: (row.voice_provider as PendingCallRecord["voiceProvider"]) ?? "gemini",
  };
}
