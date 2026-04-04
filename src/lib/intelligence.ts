import type { UrgencyLevel, SummaryRecord } from "./types";

/**
 * Intelligence engine — Dev 2 owns this file.
 *
 * This module will handle:
 * - Summarizing call transcripts
 * - Extracting care signals (medication, mood, pain, etc.)
 * - Classifying urgency level
 * - Deciding escalation behavior
 */

export function summarizeTranscript(_transcript: string): string {
  // TODO: Use LLM to generate a structured summary
  return "Stub summary — Dev 2 will implement this";
}

export function classifyUrgency(_transcript: string): UrgencyLevel {
  // TODO: Analyze transcript for urgency signals
  return "summary_later";
}

export function processTranscript(
  _transcript: string,
  _sessionId: string
): Partial<SummaryRecord> {
  // TODO: Full pipeline — summarize + classify + extract signals
  return {
    summary: summarizeTranscript(_transcript),
    urgencyLevel: classifyUrgency(_transcript),
  };
}
