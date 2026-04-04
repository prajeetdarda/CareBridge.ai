import { NextResponse } from "next/server";

/**
 * POST /api/call/start
 * Dev 1 owns this route.
 * Starts a new check-in call session.
 */
export async function POST() {
  const sessionId = crypto.randomUUID();
  return NextResponse.json({
    sessionId,
    status: "ringing",
    startedAt: new Date().toISOString(),
  });
}
