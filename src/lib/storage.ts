import type { SummaryRecord, AlertRecord, FamilyProfile } from "./types";

/**
 * Mock storage — Dev 2 owns this file.
 *
 * Simple in-memory store for the hackathon MVP.
 * Will be replaced with Supabase in the hosted version.
 */

const summaries: SummaryRecord[] = [];
const alerts: AlertRecord[] = [];

const defaultProfile: FamilyProfile = {
  familyMemberName: "Anjali",
  lovedOneName: "Amma",
  preferredLanguage: "hi",
  relationshipLabel: "daughter",
  careTopics: ["medication", "food", "activity", "mood"],
  reminderRules: [],
  backupContacts: [],
};

let profile: FamilyProfile = { ...defaultProfile };

export function getSummaries(): SummaryRecord[] {
  return summaries;
}

export function addSummary(record: SummaryRecord): void {
  summaries.push(record);
}

export function getAlerts(): AlertRecord[] {
  return alerts;
}

export function addAlert(record: AlertRecord): void {
  alerts.push(record);
}

export function acknowledgeAlert(alertId: string): boolean {
  const alert = alerts.find((a) => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    return true;
  }
  return false;
}

export function getProfile(): FamilyProfile {
  return profile;
}

export function updateProfile(updates: Partial<FamilyProfile>): FamilyProfile {
  profile = { ...profile, ...updates };
  return profile;
}
