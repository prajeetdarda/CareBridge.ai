import { NextResponse } from "next/server";
import type {
  SubmitSummaryRequest,
  SubmitSummaryResponse,
  GetSummariesResponse,
  SummaryRecord,
} from "@/lib/types";
import { processTranscript } from "@/lib/intelligence";
import { addSummary, addAlert, getSummaries, getProfile } from "@/lib/storage-adapter";
import {
  extractEscalationRecipients,
  sendUrgentEscalationEmails,
} from "@/lib/escalation-email";

/**
 * GET  /api/summary — returns all summaries (newest first)
 * POST /api/summary — transcript handoff from Dev 1: LLM pipeline + storage + alerts
 */
export async function GET() {
  const list = (await getSummaries())
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

  const profile = await getProfile();
  const { careTopics } = profile;
  const analyzed = await processTranscript(body, careTopics);

  const storedTranscript = analyzed.aiTranscription ?? body.transcript;

  let actionTaken: string | undefined;
  if (analyzed.urgencyLevel === "urgent_now") {
    try {
      const recipients = extractEscalationRecipients(profile.backupContacts);
      const sendResult = await sendUrgentEscalationEmails({
        recipients,
        lovedOneName: profile.lovedOneName || "Loved one",
        familyMemberName: profile.familyMemberName || "Family",
        reason: analyzed.escalationReason ?? "Urgent wellness concern flagged by AI analysis.",
        urgencyLevel: analyzed.urgencyLevel,
        timestampIso: new Date().toISOString(),
        sessionId: body.sessionId,
      });

      if (sendResult.sentCount > 0) {
        actionTaken = `Escalation email sent to ${sendResult.sentCount} support contact${sendResult.sentCount > 1 ? "s" : ""}.`;
      } else {
        actionTaken = "Urgent alert created, but no valid support-contact email was configured.";
      }
    } catch (err) {
      console.error("[summary] escalation email failed:", err);
      actionTaken = "Urgent alert created, but escalation email failed to send.";
    }
  }

  const record: SummaryRecord = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    initiatedBy: body.initiatedBy,
    transcript: storedTranscript,
    summary: analyzed.summary,
    urgencyLevel: analyzed.urgencyLevel,
    escalationReason: analyzed.escalationReason,
    actionTaken,
    mediaPath: analyzed.mediaPath,
    mediaType: analyzed.mediaType,
    language: analyzed.language,
    callDurationSeconds: analyzed.callDurationSeconds,
  };

  await addSummary(record);

  if (analyzed.urgencyLevel !== "summary_later") {
    await addAlert({
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
