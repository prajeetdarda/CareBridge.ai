import type { UrgencyLevel, SubmitSummaryRequest } from "./types";

/**
 * Intelligence engine — Dev 2.
 * Summarizes transcripts and classifies urgency via Gemini when
 * GEMINI_API_KEY is set; otherwise uses a small heuristic fallback
 * so the app works in demos without a key.
 */

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const URGENT_SIGNALS = [
  "chest pain",
  "heart attack",
  "can't breathe",
  "cannot breathe",
  "choking",
  "unconscious",
  "passed out",
  "fallen",
  "i fell",
  "bleeding",
  "ambulance",
  "emergency",
  "stroke",
  "suicide",
];

const NOTIFY_SIGNALS = [
  "dizzy",
  "weak",
  "forgot",
  "missed my",
  "skipped",
  "pain",
  "worried",
  "haven't eaten",
  "havent eaten",
  "not sleeping",
  "feel alone",
  "confused",
];

function heuristicUrgency(transcript: string): UrgencyLevel {
  const t = transcript.toLowerCase();
  if (URGENT_SIGNALS.some((s) => t.includes(s))) return "urgent_now";
  if (NOTIFY_SIGNALS.some((s) => t.includes(s))) return "notify_soon";
  return "summary_later";
}

function heuristicSummary(transcript: string, language?: string): string {
  const trimmed = transcript.trim();
  if (!trimmed) {
    return "No transcript was provided for this check-in.";
  }
  const lang = language ? ` (language code: ${language})` : "";
  const preview =
    trimmed.length > 280 ? `${trimmed.slice(0, 280)}…` : trimmed;
  return (
    `Check-in note${lang}: ${preview}\n\n` +
    "This is an offline summary — add GEMINI_API_KEY for AI-generated care insights (mood, meds, activity)."
  );
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as Record<
          string,
          unknown
        >;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function normalizeUrgency(value: unknown): UrgencyLevel {
  if (value === "urgent_now" || value === "notify_soon" || value === "summary_later") {
    return value;
  }
  return "summary_later";
}

async function callGeminiJson(prompt: string): Promise<Record<string, unknown> | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    console.error("[intelligence] Gemini error", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;
  return parseJsonObject(text);
}

/**
 * Full analysis for a submitted transcript (call or async update).
 * @param careTopics — optional topics from family settings to emphasize
 */
export async function analyzeTranscript(
  request: SubmitSummaryRequest,
  careTopics?: string[]
): Promise<{
  summary: string;
  urgencyLevel: UrgencyLevel;
  escalationReason?: string;
}> {
  const { transcript, language } = request;
  const langHint = language
    ? `The conversation may be in language/locale: ${language}. Still respond in clear English for the family dashboard.`
    : "";

  const topicsHint =
    careTopics && careTopics.length > 0
      ? `The family asked to pay special attention to these themes when relevant: ${careTopics.join(", ")}.`
      : "";

  const prompt = `You are a clinical-adjacent family care assistant (NOT a doctor). Analyze this wellness check-in transcript from an aging parent or loved one.

${langHint}
${topicsHint}

Transcript:
"""
${transcript}
"""

Return ONLY valid JSON with this exact shape (no markdown):
{
  "summary": "2-4 short sentences for adult children: mood, sleep, food/meds if mentioned, activity, social connection. Warm and factual.",
  "urgencyLevel": "summary_later" | "notify_soon" | "urgent_now",
  "escalationReason": "If urgency is not summary_later, one short reason for the family. Otherwise omit or use empty string."
}

Rules:
- summary_later: routine, stable, no safety concerns.
- notify_soon: missed meds, mild pain, sadness/isolation, sleep issues, needs follow-up soon.
- urgent_now: possible emergency (chest pain, fall injury, confusion, severe breathlessness, bleeding, suicidal ideation, etc.).

Be conservative: if unsure between notify_soon and urgent_now, choose notify_soon unless clear emergency language.`;

  const parsed = await callGeminiJson(prompt);

  if (parsed && typeof parsed.summary === "string") {
    const urgencyLevel = normalizeUrgency(parsed.urgencyLevel);
    const escalationRaw = parsed.escalationReason;
    const escalationReason =
      typeof escalationRaw === "string" && escalationRaw.trim()
        ? escalationRaw.trim()
        : urgencyLevel !== "summary_later"
          ? "Flagged by AI review of the check-in."
          : undefined;

    return {
      summary: parsed.summary.trim(),
      urgencyLevel,
      escalationReason,
    };
  }

  return {
    summary: heuristicSummary(transcript, language),
    urgencyLevel: heuristicUrgency(transcript),
    escalationReason:
      heuristicUrgency(transcript) !== "summary_later"
        ? "Heuristic keyword scan (no Gemini key or API error)."
        : undefined,
  };
}

export async function processTranscript(
  request: SubmitSummaryRequest,
  careTopics?: string[]
): Promise<{
  summary: string;
  urgencyLevel: UrgencyLevel;
  escalationReason?: string;
  mediaPath?: string;
  mediaType?: "audio" | "image" | "video";
  language?: string;
  callDurationSeconds?: number;
}> {
  const analysis = await analyzeTranscript(request, careTopics);
  return {
    ...analysis,
    mediaPath: request.mediaPath,
    mediaType: request.mediaType,
    language: request.language,
    callDurationSeconds: request.callDurationSeconds,
  };
}
