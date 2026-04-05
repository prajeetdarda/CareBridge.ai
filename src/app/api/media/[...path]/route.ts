import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

const ALLOWED_TOP = new Set(["recordings", "updates"]);

function contentTypeForFile(filePath: string, webmKind: string | null): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".webm") {
    return webmKind === "audio" ? "audio/webm" : "video/webm";
  }
  const map: Record<string, string> = {
    ".wav": "audio/wav",
    ".pcm": "audio/L16; rate=16000; channels=1",
    ".mp4": "video/mp4",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
  };
  return map[ext] ?? "application/octet-stream";
}

/**
 * Serves raw media from tmp/ for dashboard "play original" links.
 * Only recordings/* and updates/* are allowed; path traversal is rejected.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  if (!segments?.length) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (segments.some((s) => s.includes("..") || s === "")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const top = segments[0];
  if (!ALLOWED_TOP.has(top)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const tmpRoot = path.resolve(process.cwd(), "tmp");
  const abs = path.resolve(tmpRoot, ...segments);

  if (!abs.startsWith(tmpRoot + path.sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const webmKind = new URL(request.url).searchParams.get("kind");

  try {
    const buf = await readFile(abs);
    const contentType = contentTypeForFile(abs, webmKind);
    const range = request.headers.get("range");

    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
      if (!m) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${buf.length}` },
        });
      }
      const size = buf.length;
      let start = m[1] !== "" ? parseInt(m[1], 10) : 0;
      let end = m[2] !== "" ? parseInt(m[2], 10) : size - 1;
      if (Number.isNaN(start)) start = 0;
      if (Number.isNaN(end) || end >= size) end = size - 1;
      if (start >= size || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${size}` },
        });
      }
      const chunk = buf.subarray(start, end + 1);
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          "Content-Type": contentType,
          "Content-Range": `bytes ${start}-${end}/${size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunk.length),
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
        "Content-Length": String(buf.length),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
