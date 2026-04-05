import fs from "fs";
import path from "path";
import type {
  SummaryRecord,
  AlertRecord,
  FamilyProfile,
  PendingCallRecord,
} from "./types";

/**
 * File-backed storage for local development / hackathon demo.
 * Data is persisted to tmp/db/*.json so it survives server restarts.
 *
 * All functions are async to match the Supabase adapter interface.
 * When STORAGE_BACKEND=supabase, storage-supabase.ts is used instead.
 */

const DB_DIR = path.join(process.cwd(), "tmp", "db");
const SUMMARIES_PATH = path.join(DB_DIR, "summaries.json");
const ALERTS_PATH = path.join(DB_DIR, "alerts.json");
const PROFILE_PATH = path.join(DB_DIR, "profile.json");
const PENDING_CALLS_PATH = path.join(DB_DIR, "pending_calls.json");

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

export async function getSummaries(): Promise<SummaryRecord[]> {
  return readJson<SummaryRecord[]>(SUMMARIES_PATH, []);
}

export async function addSummary(record: SummaryRecord): Promise<void> {
  const list = await getSummaries();
  list.push(record);
  writeJson(SUMMARIES_PATH, list);
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export async function getAlerts(): Promise<AlertRecord[]> {
  return readJson<AlertRecord[]>(ALERTS_PATH, []);
}

export async function addAlert(record: AlertRecord): Promise<void> {
  const list = await getAlerts();
  list.push(record);
  writeJson(ALERTS_PATH, list);
}

export async function acknowledgeAlert(alertId: string): Promise<boolean> {
  const list = await getAlerts();
  const alert = list.find((a) => a.id === alertId);
  if (!alert) return false;
  alert.acknowledged = true;
  writeJson(ALERTS_PATH, list);
  return true;
}

// ── Profile ────────────────────────────────────────────────────────────────

export async function getProfile(): Promise<FamilyProfile> {
  return readJson<FamilyProfile>(PROFILE_PATH, { ...defaultProfile });
}

export async function updateProfile(updates: Partial<FamilyProfile>): Promise<FamilyProfile> {
  const current = await getProfile();
  const updated = { ...current, ...updates };
  writeJson(PROFILE_PATH, updated);
  return updated;
}

// ── Pending check-in sessions (child → parent handoff) ─────────────────────

async function getPendingCalls(): Promise<PendingCallRecord[]> {
  return readJson<PendingCallRecord[]>(PENDING_CALLS_PATH, []);
}

async function writePendingCalls(list: PendingCallRecord[]): Promise<void> {
  writeJson(PENDING_CALLS_PATH, list);
}

export async function savePendingCall(record: PendingCallRecord): Promise<void> {
  const list = (await getPendingCalls()).filter((p) => p.sessionId !== record.sessionId);
  list.push(record);
  await writePendingCalls(list);
}

export async function getPendingCall(sessionId: string): Promise<PendingCallRecord | null> {
  const list = await getPendingCalls();
  const rec = list.find((p) => p.sessionId === sessionId);
  if (!rec) return null;
  const now = Date.now();
  if (now > new Date(rec.expiresAt).getTime()) return null;
  return rec;
}

export async function deletePendingCall(sessionId: string): Promise<void> {
  const list = (await getPendingCalls()).filter((p) => p.sessionId !== sessionId);
  await writePendingCalls(list);
}
