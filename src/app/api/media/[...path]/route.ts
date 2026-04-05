import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

const ALLOWED_TOP = new Set(["recordings", "updates"]);

function contentTypeForFile(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".webm": "audio/webm",
    ".mp4": "video/mp4",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
  };
  return map[ext] ?? "application/octet-stream";
}

/**
 * Serves raw media from tmp/ for dashboard "play original" links.
 * Only recordings/* and updates/* are allowed; path traversal is rejected.
 */
export async function GET(
  _request: Request,
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

  try {
    const buf = await readFile(abs);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentTypeForFile(abs),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
