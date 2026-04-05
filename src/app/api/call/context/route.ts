import { NextResponse } from "next/server";
import type { GetCallContextResponse } from "@/lib/types";
import { getPendingCall } from "@/lib/storage";
import { buildCheckInSystemInstruction } from "@/lib/call-prompt";

/**
 * GET /api/call/context?sessionId=...
 * Parent device: fetch Gemini system instruction from pending handoff (care settings snapshot).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId query parameter is required" },
      { status: 400 }
    );
  }

  const pending = getPendingCall(sessionId);
  if (!pending) {
    return NextResponse.json(
      { error: "Unknown or expired check-in link" },
      { status: 404 }
    );
  }

  if (pending.scheduledFor) {
    const when = new Date(pending.scheduledFor).getTime();
    if (Date.now() < when) {
      return NextResponse.json(
        {
          error: "This check-in is not active yet",
          code: "scheduled_not_due",
          scheduledFor: pending.scheduledFor,
        },
        { status: 403 }
      );
    }
  }

  const systemInstruction = buildCheckInSystemInstruction(
    pending.profileSnapshot,
    { callNotes: pending.callNotes }
  );

  const response: GetCallContextResponse = { systemInstruction };
  return NextResponse.json(response);
}
