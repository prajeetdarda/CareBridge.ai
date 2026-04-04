import { NextResponse } from "next/server";
import type { SummaryRecord } from "@/lib/types";

/**
 * GET /api/summary — returns all summaries
 * POST /api/summary — creates a new summary from a transcript
 *
 * Dev 2 owns this route.
 */
export async function GET() {
  const summaries: SummaryRecord[] = [];
  return NextResponse.json({ summaries });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { transcript, sessionId } = body;

  const stub: SummaryRecord = {
    id: sessionId ?? crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    initiatedBy: "family",
    transcript: transcript ?? "",
    summary: "Stub summary — Dev 2 will implement intelligence here.",
    urgencyLevel: "summary_later",
  };

  return NextResponse.json({ summary: stub });
}
