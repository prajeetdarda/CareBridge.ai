import { NextResponse } from "next/server";
import type {
  SubmitSummaryRequest,
  SubmitSummaryResponse,
  GetSummariesResponse,
  SummaryRecord,
} from "@/lib/types";
import { processTranscript } from "@/lib/intelligence";
import { addSummary, addAlert, getSummaries, getProfile } from "@/lib/storage";

/**
 * GET  /api/summary — returns all summaries (newest first)
 * POST /api/summary — transcript handoff from Dev 1: LLM pipeline + storage + alerts
 */
export async function GET() {
  const list = getSummaries()
    .slice()
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  const response: GetSummariesResponse = { summaries: list };
  return NextResponse.json(response);
}

export async function POST(request: Request) {
  let body: SubmitSummaryRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body?.sessionId ||
    typeof body.transcript !== "string" ||
    !body.initiatedBy
  ) {
    return NextResponse.json(
      { error: "sessionId, transcript, and initiatedBy are required" },
      { status: 400 }
    );
  }

  const { careTopics } = getProfile();
  const analyzed = await processTranscript(body, careTopics);

  const record: SummaryRecord = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    initiatedBy: body.initiatedBy,
    transcript: body.transcript,
    summary: analyzed.summary,
    urgencyLevel: analyzed.urgencyLevel,
    escalationReason: analyzed.escalationReason,
    mediaPath: analyzed.mediaPath,
    mediaType: analyzed.mediaType,
    language: analyzed.language,
    callDurationSeconds: analyzed.callDurationSeconds,
  };

  addSummary(record);

  if (analyzed.urgencyLevel !== "summary_later") {
    addAlert({
      id: crypto.randomUUID(),
      sessionId: body.sessionId,
      timestamp: new Date().toISOString(),
      urgencyLevel: analyzed.urgencyLevel,
      reason:
        analyzed.escalationReason ??
        `Check-in classified as ${analyzed.urgencyLevel.replace("_", " ")}`,
      transcript: body.transcript,
      acknowledged: false,
    });
  }

  const response: SubmitSummaryResponse = { summary: record };
  return NextResponse.json(response);
}
