import { NextResponse } from "next/server";

/**
 * POST /api/call/end
 * Dev 1 owns this route.
 * Ends the current call session and forwards the transcript to the summary API.
 *
 * Expected body: { sessionId: string, transcript: string }
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { sessionId, transcript } = body;

  return NextResponse.json({
    success: true,
    sessionId,
    endedAt: new Date().toISOString(),
    transcriptLength: transcript?.length ?? 0,
  });
}
