import type { UrgencyLevel, SummaryRecord, SubmitSummaryRequest } from "./types";

/**
 * Intelligence engine — Dev 2 owns this file.
 *
 * This module will handle:
 * - Summarizing call transcripts via Gemini text API
 * - Extracting care signals (medication, mood, pain, etc.)
 * - Classifying urgency level
 * - Deciding escalation behavior
 */

export function summarizeTranscript(_transcript: string): string {
  // TODO (Dev 2): Call Gemini text API with a prompt like:
  // "Summarize this wellness check-in transcript.
  //  Extract: medication status, food, activity, mood.
  //  Return a concise family-friendly summary."
  return "Stub summary — Dev 2 will implement this";
}

export function classifyUrgency(_transcript: string): UrgencyLevel {
  // TODO (Dev 2): Call Gemini text API to classify:
  // summary_later = routine, nothing concerning
  // notify_soon = skipped meds, feeling weak, minor concern
  // urgent_now = chest pain, fall, dizziness, emergency signal
  return "summary_later";
}

export function processTranscript(
  request: SubmitSummaryRequest
): Partial<SummaryRecord> {
  // TODO (Dev 2): Full pipeline
  // 1. summarizeTranscript(request.transcript)
  // 2. classifyUrgency(request.transcript)
  // 3. Return assembled SummaryRecord fields
  return {
    summary: summarizeTranscript(request.transcript),
    urgencyLevel: classifyUrgency(request.transcript),
    mediaPath: request.mediaPath,
    mediaType: request.mediaType,
    language: request.language,
    callDurationSeconds: request.callDurationSeconds,
  };
}
