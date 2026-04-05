import fs from "fs";
import path from "path";
import type {
  SummaryRecord,
  AlertRecord,
  FamilyProfile,
  PendingCallRecord,
} from "./types";

/**
 * File-backed storage for the hackathon demo.
 * Data is persisted to tmp/db/*.json so it survives server restarts.
 * All function signatures are sync and identical to the previous in-memory
 * version — no API routes need to change.
 *
 * Will be replaced with Supabase in the hosted version.
 */

const DB_DIR = path.join(process.cwd(), "tmp", "db");
const SUMMARIES_PATH = path.join(DB_DIR, "summaries.json");
const ALERTS_PATH = path.join(DB_DIR, "alerts.json");
const PROFILE_PATH = path.join(DB_DIR, "profile.json");
const PENDING_CALLS_PATH = path.join(DB_DIR, "pending_calls.json");

const defaultProfile: FamilyProfile = {
  familyMemberName: "Anjali",
  lovedOneName: "Amma",
  preferredLanguage: "hi",
  relationshipLabel: "daughter",
  careTopics: ["medication", "food", "activity", "mood"],
  reminderRules: [],
  backupContacts: [],
};

// ── Helpers ────────────────────────────────────────────────────────────────

function ensureDir(): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(filePath: string, data: unknown): void {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

// ── Summaries ──────────────────────────────────────────────────────────────

export function getSummaries(): SummaryRecord[] {
  return readJson<SummaryRecord[]>(SUMMARIES_PATH, []);
}

export function addSummary(record: SummaryRecord): void {
  const list = getSummaries();
  list.push(record);
  writeJson(SUMMARIES_PATH, list);
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export function getAlerts(): AlertRecord[] {
  return readJson<AlertRecord[]>(ALERTS_PATH, []);
}

export function addAlert(record: AlertRecord): void {
  const list = getAlerts();
  list.push(record);
  writeJson(ALERTS_PATH, list);
}

export function acknowledgeAlert(alertId: string): boolean {
  const list = getAlerts();
  const alert = list.find((a) => a.id === alertId);
  if (!alert) return false;
  alert.acknowledged = true;
  writeJson(ALERTS_PATH, list);
  return true;
}

// ── Profile ────────────────────────────────────────────────────────────────

export function getProfile(): FamilyProfile {
  return readJson<FamilyProfile>(PROFILE_PATH, { ...defaultProfile });
}

export function updateProfile(updates: Partial<FamilyProfile>): FamilyProfile {
  const current = getProfile();
  const updated = { ...current, ...updates };
  writeJson(PROFILE_PATH, updated);
  return updated;
}

// ── Pending check-in sessions (child → parent handoff) ─────────────────────

function getPendingCalls(): PendingCallRecord[] {
  return readJson<PendingCallRecord[]>(PENDING_CALLS_PATH, []);
}

function writePendingCalls(list: PendingCallRecord[]): void {
  writeJson(PENDING_CALLS_PATH, list);
}

export function savePendingCall(record: PendingCallRecord): void {
  const list = getPendingCalls().filter((p) => p.sessionId !== record.sessionId);
  list.push(record);
  writePendingCalls(list);
}

export function getPendingCall(sessionId: string): PendingCallRecord | null {
  const list = getPendingCalls();
  const rec = list.find((p) => p.sessionId === sessionId);
  if (!rec) return null;
  const now = Date.now();
  if (now > new Date(rec.expiresAt).getTime()) return null;
  return rec;
}

export function deletePendingCall(sessionId: string): void {
  const list = getPendingCalls().filter((p) => p.sessionId !== sessionId);
  writePendingCalls(list);
}
