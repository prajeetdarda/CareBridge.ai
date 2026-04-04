import { NextResponse } from "next/server";
import type { EndCallRequest, EndCallResponse } from "@/lib/types";

/**
 * POST /api/call/end
 * Dev 1 owns this route.
 *
 * Request:  EndCallRequest  { sessionId, transcript }
 * Response: EndCallResponse { success, sessionId, endedAt }
 *
 * After this returns, Dev 1's frontend should POST to /api/summary
 * with the full SubmitSummaryRequest to hand off to Dev 2's pipeline.
 */
export async function POST(request: Request) {
  const body: EndCallRequest = await request.json();

  const response: EndCallResponse = {
    success: true,
    sessionId: body.sessionId,
    endedAt: new Date().toISOString(),
  };

  console.log(`[call/end] Session ${body.sessionId} ended, transcript length: ${body.transcript?.length ?? 0}`);
  return NextResponse.json(response);
}
