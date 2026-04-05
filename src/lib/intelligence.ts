import fs from "fs";
import path from "path";
import type { UrgencyLevel, SubmitSummaryRequest } from "./types";

/**
 * Intelligence engine.
 * Summarizes transcripts and classifies urgency via Gemini when
 * GOOGLE_API_KEY is set; otherwise uses a small heuristic fallback
 * so the app works in demos without a key.
 */

const GEMINI_MODEL = "gemini-2.5-flash";
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
    "This is an offline summary — add GOOGLE_API_KEY for AI-generated care insights (mood, meds, activity)."
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
  if (
    value === "urgent_now" ||
    value === "notify_soon" ||
    value === "summary_later"
  ) {
    return value;
  }
  return "summary_later";
}

async function callGeminiJson(
  prompt: string
): Promise<Record<string, unknown> | null> {
  const key = process.env.GOOGLE_API_KEY;
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

const MIME_FROM_EXT: Record<string, { audio: string; video: string; image: string }> = {
  ".webm": { audio: "audio/webm", video: "video/webm", image: "image/webp" },
  ".ogg":  { audio: "audio/ogg",  video: "video/ogg",  image: "image/png" },
  ".mp4":  { audio: "audio/mp4",  video: "video/mp4",  image: "image/jpeg" },
  ".mov":  { audio: "audio/mp4",  video: "video/quicktime", image: "image/jpeg" },
  ".jpg":  { audio: "audio/webm", video: "video/webm", image: "image/jpeg" },
  ".jpeg": { audio: "audio/webm", video: "video/webm", image: "image/jpeg" },
  ".png":  { audio: "audio/webm", video: "video/webm", image: "image/png" },
  ".webp": { audio: "audio/webm", video: "video/webm", image: "image/webp" },
};

/**
 * Reads the saved media file and sends it to Gemini multimodal for real analysis.
 * Returns null if the file is missing, too large, or Gemini fails.
 */
async function analyzeMediaFile(
  mediaPath: string,
  mediaType: "audio" | "image" | "video",
  careTopics?: string[]
): Promise<{
  transcription?: string;
  summary: string;
  urgencyLevel: UrgencyLevel;
  escalationReason?: string;
} | null> {
  const key = process.env.GOOGLE_API_KEY;
  if (!key) return null;

  const fullPath = path.join(process.cwd(), mediaPath);
  let fileBuffer: Buffer;
  try {
    fileBuffer = fs.readFileSync(fullPath);
  } catch {
    console.error("[intelligence] Cannot read media file:", fullPath);
    return null;
  }

  // Inline base64 limit is ~20 MB total request — skip large files
  if (fileBuffer.byteLength > 15 * 1024 * 1024) {
    console.warn("[intelligence] Media file too large for inline analysis:", fileBuffer.byteLength, "bytes");
    return null;
  }

  const ext = path.extname(mediaPath).toLowerCase();
  const mimeType =
    MIME_FROM_EXT[ext]?.[mediaType] ??
    (mediaType === "image" ? "image/jpeg" : mediaType === "video" ? "video/webm" : "audio/webm");

  const base64 = fileBuffer.toString("base64");
  const topicsHint =
    careTopics && careTopics.length > 0
      ? `Pay special attention to these themes if relevant: ${careTopics.join(", ")}.`
      : "";

  const SCHEMA = `{
  "transcription": "<transcription or visual description>",
  "summary": "<2-4 warm factual sentences for adult children>",
  "urgencyLevel": "summary_later" | "notify_soon" | "urgent_now",
  "escalationReason": "<one short reason if not summary_later, otherwise empty string>"
}`;

  const prompts: Record<"audio" | "image" | "video", string> = {
    audio: `You are a family care assistant. This is a voice message left by an elderly person for their family.
${topicsHint}

1. Transcribe exactly what was said.
2. Analyse for wellness signals: mood, medication, food, activity, social wellbeing, any concerns.

Return ONLY valid JSON matching this schema (no markdown fences):
${SCHEMA}

urgencyLevel rules:
- summary_later: routine and stable.
- notify_soon: missed meds, mild pain, loneliness, sleep issues.
- urgent_now: emergency (chest pain, fall, severe confusion, breathing problems).`,

    image: `You are a family care assistant. This photo was shared by an elderly person with their family.
${topicsHint}

1. Describe what you see (setting, person's appearance/activity if visible, surroundings).
2. Note any wellness or safety concerns.

Return ONLY valid JSON matching this schema (no markdown fences):
${SCHEMA}

urgencyLevel rules:
- summary_later: everything looks normal and safe.
- notify_soon: person appears unwell, unsafe environment, something needs attention.
- urgent_now: visible emergency or immediate safety risk.`,

    video: `You are a family care assistant. This short video was shared by an elderly person with their family.
${topicsHint}

1. Transcribe any speech.
2. Describe what you observe (setting, activity, mood, movement, any concerns).
3. Flag any wellness or safety signals.

Return ONLY valid JSON matching this schema (no markdown fences):
${SCHEMA}

urgencyLevel rules:
- summary_later: routine, stable, no safety concerns.
- notify_soon: unsteady movement, mentions missed meds, appears unwell.
- urgent_now: visible or audible emergency.`,
  };

  try {
    const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: base64 } },
              { text: prompts[mediaType] },
            ],
          },
        ],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
      }),
    });

    if (!res.ok) {
      console.error("[intelligence] Gemini media error", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = parseJsonObject(text);
    if (!parsed || typeof parsed.summary !== "string") return null;

    return {
      transcription: typeof parsed.transcription === "string" && parsed.transcription.trim()
        ? parsed.transcription.trim()
        : undefined,
      summary: parsed.summary.trim(),
      urgencyLevel: normalizeUrgency(parsed.urgencyLevel),
      escalationReason:
        typeof parsed.escalationReason === "string" && parsed.escalationReason.trim()
          ? parsed.escalationReason.trim()
          : undefined,
    };
  } catch (err) {
    console.error("[intelligence] Gemini media analysis threw:", err);
    return null;
  }
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
  aiTranscription?: string;
}> {
  const { transcript, language } = request;

  // Media-only loved-one update — run real multimodal Gemini analysis.
  if (
    request.initiatedBy === "loved_one" &&
    !transcript?.trim() &&
    request.mediaType &&
    request.mediaPath
  ) {
    const mediaResult = await analyzeMediaFile(request.mediaPath, request.mediaType, careTopics);
    if (mediaResult) {
      console.log(`[intelligence] Media analysis OK — urgency: ${mediaResult.urgencyLevel}`);
      return {
        summary: mediaResult.summary,
        urgencyLevel: mediaResult.urgencyLevel,
        escalationReason: mediaResult.escalationReason,
        aiTranscription: mediaResult.transcription,
      };
    }
    // Fallback if Gemini media call fails
    const label =
      request.mediaType === "audio"
        ? "voice message"
        : request.mediaType === "video"
          ? "video"
          : "photo";
    return {
      summary: `Your loved one shared a ${label}. Open the attachment to listen or view it.`,
      urgencyLevel: "summary_later",
    };
  }

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
  aiTranscription?: string;
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
