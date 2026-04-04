import { NextResponse } from "next/server";
import type {
  SubmitSummaryRequest,
  SubmitSummaryResponse,
  GetSummariesResponse,
  SummaryRecord,
} from "@/lib/types";

/**
 * GET  /api/summary — returns all summaries
 * POST /api/summary — receives transcript from Dev 1, runs LLM analysis, stores result
 *
 * Dev 2 owns this route.
 *
 * POST flow:
 *   1. Dev 1 calls this after a call ends or a parent leaves an update
 *   2. This handler runs LLM summarization (lib/intelligence.ts)
 *   3. Classifies urgency (summary_later / notify_soon / urgent_now)
 *   4. Stores the SummaryRecord (lib/storage.ts)
 *   5. If urgent, also creates an alert via /api/alerts logic
 *   6. Returns the completed SummaryRecord
 */
export async function GET() {
  const response: GetSummariesResponse = { summaries: [] };
  return NextResponse.json(response);
}

export async function POST(request: Request) {
  const body: SubmitSummaryRequest = await request.json();

  // TODO (Dev 2): Replace this stub with real LLM pipeline
  // 1. Call lib/intelligence.ts → summarizeTranscript(body.transcript)
  // 2. Call lib/intelligence.ts → classifyUrgency(body.transcript)
  // 3. Store via lib/storage.ts → addSummary(record)
  // 4. If urgencyLevel !== "summary_later", create alert

  const stub: SummaryRecord = {
    id: body.sessionId ?? crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    initiatedBy: body.initiatedBy,
    transcript: body.transcript ?? "",
    summary: "Stub — Dev 2 will implement LLM summarization here.",
    urgencyLevel: "summary_later",
    mediaPath: body.mediaPath,
    mediaType: body.mediaType,
    language: body.language,
    callDurationSeconds: body.callDurationSeconds,
  };

  const response: SubmitSummaryResponse = { summary: stub };
  return NextResponse.json(response);
}
