import { NextResponse } from "next/server";
import type { StartCallRequest, StartCallResponse } from "@/lib/types";

/**
 * POST /api/call/start
 * Dev 1 owns this route.
 *
 * Request:  StartCallRequest  { lovedOneName, language }
 * Response: StartCallResponse { sessionId, status, startedAt }
 */
export async function POST(request: Request) {
  const body: StartCallRequest = await request.json();
  const { lovedOneName, language } = body;

  const response: StartCallResponse = {
    sessionId: crypto.randomUUID(),
    status: "ringing",
    startedAt: new Date().toISOString(),
  };

  console.log(`[call/start] New session for ${lovedOneName} (${language}):`, response.sessionId);
  return NextResponse.json(response);
}
