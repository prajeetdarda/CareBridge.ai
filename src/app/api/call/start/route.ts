import { NextResponse } from "next/server";
import type {
  CallVoiceProvider,
  StartCallRequest,
  StartCallResponse,
} from "@/lib/types";
import { getProfile, savePendingCall } from "@/lib/storage-adapter";

const TTL_MS = 48 * 60 * 60 * 1000;

/**
 * POST /api/call/start
 * Family dashboard: create a pending handoff session from current care settings.
 */
export async function POST(request: Request) {
  let body: StartCallRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const mode = body?.mode;
  if (mode !== "now" && mode !== "schedule") {
    return NextResponse.json(
      { error: "mode must be \"now\" or \"schedule\"" },
      { status: 400 }
    );
  }

  let scheduledFor: string | null = null;
  if (mode === "schedule") {
    const raw = body.scheduledFor?.trim();
    if (!raw) {
      return NextResponse.json(
        { error: "scheduledFor is required when mode is \"schedule\"" },
        { status: 400 }
      );
    }
    const t = new Date(raw).getTime();
    if (Number.isNaN(t)) {
      return NextResponse.json(
        { error: "scheduledFor must be a valid ISO date" },
        { status: 400 }
      );
    }
    if (t <= Date.now() + 30_000) {
      return NextResponse.json(
        { error: "scheduledFor must be at least ~30 seconds in the future" },
        { status: 400 }
      );
    }
    scheduledFor = new Date(t).toISOString();
  }

  const rawVoice = body.voiceProvider;
  const voiceProvider: CallVoiceProvider =
    rawVoice === "elevenlabs" ? "elevenlabs" : "gemini";

  const profile = await getProfile();
  const profileSnapshot = structuredClone(profile) as typeof profile;

  const sessionId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

  const incomingSignalAt = mode === "now" ? createdAt : null;

  await savePendingCall({
    sessionId,
    createdAt,
    expiresAt,
    scheduledFor,
    incomingSignalAt,
    profileSnapshot,
    callNotes: body.callNotes?.trim() || undefined,
    voiceProvider,
  });

  const q = encodeURIComponent(sessionId);
  const parentCallPath =
    voiceProvider === "elevenlabs"
      ? `/parent/call-elevenlabs?session=${q}`
      : `/parent/call?session=${q}`;
  const parentCallUrl = parentCallPath;
  const parentIncomingUrl = `/parent/incoming?session=${q}`;

  const response: StartCallResponse = {
    sessionId,
    status: "ringing",
    startedAt: createdAt,
    parentCallUrl,
    parentIncomingUrl,
    scheduledFor,
    voiceProvider,
  };

  console.log(
    `[call/start] ${mode} session ${sessionId} voice=${voiceProvider}` +
      (scheduledFor ? ` scheduledFor=${scheduledFor}` : "")
  );
  return NextResponse.json(response);
}
