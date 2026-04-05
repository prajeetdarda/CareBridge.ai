// ============================================================
// SHARED TYPES — DO NOT EDIT WITHOUT COORDINATING WITH BOTH DEVS
// This file defines the contract between Dev 1 and Dev 2.
// ============================================================

// === Core Enums ===

export type UrgencyLevel = "summary_later" | "notify_soon" | "urgent_now";

/** Live voice stack for the parent check-in call */
export type CallVoiceProvider = "gemini" | "elevenlabs";

// === Data Models ===

export interface FamilyProfile {
  familyMemberName: string;
  lovedOneName: string;
  /** ISO date YYYY-MM-DD for age on dashboard */
  lovedOneDateOfBirth?: string;
  preferredLanguage: string;
  relationshipLabel: string;
  careTopics: string[];
  reminderRules: ReminderRecord[];
  backupContacts: BackupContact[];
}

export interface SummaryRecord {
  id: string;
  timestamp: string;
  initiatedBy: "family" | "loved_one" | "ai_agent";
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
  /** Preferred escalation email address for urgent alerts */
  email?: string;
  escalationPriority: number;
}

// === API Request Types ===
// Dev 1 sends these. Dev 2 receives and handles them.

/** Family dashboard → POST /api/call/start */
export interface StartCallRequest {
  mode: "now" | "schedule";
  /** Required when mode === "schedule" (ISO 8601) */
  scheduledFor?: string;
  /** Optional one-off notes; main prompt still comes from care settings profile */
  callNotes?: string;
  /** Default Gemini Live; ElevenLabs uses /parent/call-elevenlabs */
  voiceProvider?: CallVoiceProvider;
}

/** Stored server-side for parent ?session= handoff */
export interface PendingCallRecord {
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  /** If set, parent cannot fetch context until this time */
  scheduledFor: string | null;
  /** When set (immediate check-in), incoming screen may ring; scheduled uses scheduledFor instead */
  incomingSignalAt?: string | null;
  profileSnapshot: FamilyProfile;
  callNotes?: string;
  voiceProvider?: CallVoiceProvider;
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
  lovedOneDateOfBirth?: string;
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
  /** Path-only URL for the parent device, e.g. /parent/call?session=… */
  parentCallUrl: string;
  /** Open on parent phone first: wait screen then rings when check-in is active */
  parentIncomingUrl: string;
  scheduledFor: string | null;
  voiceProvider: CallVoiceProvider;
}

export type IncomingCallPhase = "wait" | "ringing" | "gone";

export interface GetIncomingStatusResponse {
  phase: IncomingCallPhase;
  scheduledFor?: string;
  /** Present when phase is wait or ringing */
  voiceProvider?: CallVoiceProvider;
}

export interface GetCallContextResponse {
  systemInstruction: string;
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
