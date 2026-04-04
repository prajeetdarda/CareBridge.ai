// ============================================================
// SHARED TYPES — DO NOT EDIT WITHOUT COORDINATING WITH BOTH DEVS
// This file defines the contract between Dev 1 and Dev 2.
// ============================================================

// === Core Enums ===

export type UrgencyLevel = "summary_later" | "notify_soon" | "urgent_now";

// === Data Models ===

export interface FamilyProfile {
  familyMemberName: string;
  lovedOneName: string;
  preferredLanguage: string;
  relationshipLabel: string;
  careTopics: string[];
  reminderRules: ReminderRecord[];
  backupContacts: BackupContact[];
}

export interface SummaryRecord {
  id: string;
  timestamp: string;
  initiatedBy: "family" | "loved_one";
  transcript: string;
  summary: string;
  urgencyLevel: UrgencyLevel;
  escalationReason?: string;
  actionTaken?: string;
  mediaPath?: string;
  mediaType?: "audio" | "image" | "video";
  language?: string;
  callDurationSeconds?: number;
}

export interface AlertRecord {
  id: string;
  sessionId: string;
  timestamp: string;
  urgencyLevel: "notify_soon" | "urgent_now";
  reason: string;
  transcript?: string;
  acknowledged: boolean;
}

export interface CallSession {
  id: string;
  status: "ringing" | "active" | "ended";
  startedAt?: string;
  endedAt?: string;
  transcript?: string;
}

export interface ReminderRecord {
  id: string;
  title: string;
  type: string;
  time: string;
  enabled: boolean;
}

export interface BackupContact {
  name: string;
  relationship: string;
  contactInfo: string;
  escalationPriority: number;
}

// === API Request Types ===
// Dev 1 sends these. Dev 2 receives and handles them.

export interface StartCallRequest {
  lovedOneName: string;
  language: string;
}

export interface EndCallRequest {
  sessionId: string;
  transcript: string;
}

/**
 * THE KEY HANDOFF: Dev 1 POSTs this to /api/summary when a call ends
 * or when a parent leaves an update. Dev 2's handler receives it,
 * runs LLM analysis, classifies urgency, and stores the result.
 */
export interface SubmitSummaryRequest {
  sessionId: string;
  transcript: string;
  initiatedBy: "family" | "loved_one";
  mediaPath?: string;
  mediaType?: "audio" | "image" | "video";
  language?: string;
  callDurationSeconds?: number;
}

export interface CreateAlertRequest {
  sessionId: string;
  urgencyLevel: "notify_soon" | "urgent_now";
  reason: string;
  transcript?: string;
}

export interface UpdateSettingsRequest {
  familyMemberName?: string;
  lovedOneName?: string;
  preferredLanguage?: string;
  relationshipLabel?: string;
  careTopics?: string[];
  reminderRules?: ReminderRecord[];
  backupContacts?: BackupContact[];
}

// === API Response Types ===

export interface StartCallResponse {
  sessionId: string;
  status: "ringing";
  startedAt: string;
}

export interface EndCallResponse {
  success: boolean;
  sessionId: string;
  endedAt: string;
}

export interface SubmitSummaryResponse {
  summary: SummaryRecord;
}

export interface GetSummariesResponse {
  summaries: SummaryRecord[];
}

export interface GetAlertsResponse {
  alerts: AlertRecord[];
}

export interface CreateAlertResponse {
  success: boolean;
  alert: AlertRecord;
}

export interface GetSettingsResponse {
  profile: FamilyProfile;
}

export interface UpdateSettingsResponse {
  success: boolean;
  profile: FamilyProfile;
}
