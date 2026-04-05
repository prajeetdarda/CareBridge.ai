import { NextResponse } from "next/server";
import type { GetIncomingStatusResponse } from "@/lib/types";
import { getPendingCall } from "@/lib/storage";

/**
 * GET /api/call/incoming-status?sessionId=...
 * Parent "waiting" page polls this to know when to show incoming ring UI.
 */
export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required" },
      { status: 400 }
    );
  }

  const pending = getPendingCall(sessionId);
  if (!pending) {
    const body: GetIncomingStatusResponse = { phase: "gone" };
    return NextResponse.json(body);
  }

  const voiceProvider = pending.voiceProvider ?? "gemini";
  const now = Date.now();

  if (pending.scheduledFor) {
    const startAt = new Date(pending.scheduledFor).getTime();
    if (now < startAt) {
      const body: GetIncomingStatusResponse = {
        phase: "wait",
        scheduledFor: pending.scheduledFor,
        voiceProvider,
      };
      return NextResponse.json(body);
    }
    const body: GetIncomingStatusResponse = {
      phase: "ringing",
      scheduledFor: pending.scheduledFor,
      voiceProvider,
    };
    return NextResponse.json(body);
  }

  // Immediate check-in: ring once family created session (incomingSignalAt set)
  if (pending.incomingSignalAt) {
    const body: GetIncomingStatusResponse = {
      phase: "ringing",
      voiceProvider,
    };
    return NextResponse.json(body);
  }

  // Legacy rows without incomingSignalAt, no schedule → treat as active
  const body: GetIncomingStatusResponse = { phase: "ringing", voiceProvider };
  return NextResponse.json(body);
}
