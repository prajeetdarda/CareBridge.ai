export type UrgencyLevel = "summary_later" | "notify_soon" | "urgent_now";

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
