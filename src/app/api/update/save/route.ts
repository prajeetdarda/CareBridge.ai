/**
 * POST /api/update/save
 * Saves a parent/grandparent update (voice, image, or video) to tmp/updates/.
 * Dev 1 calls this when the grandparent submits an update from the Update page.
 * After this returns, Dev 1 also POSTs to /api/summary for Dev 2 to process.
 */

import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MIME_TO_EXT: Record<string, string> = {
  "audio/webm": ".webm",
  "audio/ogg": ".ogg",
  "audio/mp4": ".mp4",
  "video/webm": ".webm",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function mimeToExt(mimeType: string): string {
  const base = mimeType.split(";")[0].trim().toLowerCase();
  return MIME_TO_EXT[base] ?? ".bin";
}

function mimeToMediaType(mimeType: string): "audio" | "image" | "video" {
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  return "image";
}

interface UpdateSaveRequest {
  sessionId: string;
  mediaBase64: string;
  mimeType: string;
}

export async function POST(request: Request) {
  try {
    const body: UpdateSaveRequest = await request.json();
    const { sessionId, mediaBase64, mimeType } = body;

    if (!sessionId || !mediaBase64 || !mimeType) {
      return Response.json(
        { error: "sessionId, mediaBase64, mimeType are required" },
        { status: 400 }
      );
    }

    const ext = mimeToExt(mimeType);
    const mediaType = mimeToMediaType(mimeType);
    const dir = path.join(process.cwd(), "tmp", "updates");
    await mkdir(dir, { recursive: true });

    const filename = `${sessionId}${ext}`;
    const filePath = path.join(dir, filename);
    const buffer = Buffer.from(mediaBase64, "base64");
    await writeFile(filePath, buffer);

    const mediaPath = path.join("tmp", "updates", filename);
    console.log(
      `[update/save] Saved ${mediaType}: ${mediaPath} (${buffer.byteLength} bytes)`
    );

    return Response.json({ mediaPath, mediaType, sessionId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed";
    console.error("[update/save] Error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
