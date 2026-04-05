import type { SummaryRecord } from "./types";

/**
 * Build same-origin URL for tmp media served by /api/media/[...path].
 * `mediaType` lets .webm resolve to audio/webm vs video/webm for correct <audio>/<video> playback.
 */
export function publicMediaPath(
  mediaPath: string,
  mediaType?: SummaryRecord["mediaType"]
): string {
  const trimmed = mediaPath
    .trim()
    .replace(/^tmp\//, "")
    .replace(/^\.\/+/, "");
  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length === 0) return "";
  const base = `/api/media/${parts.map(encodeURIComponent).join("/")}`;
  const leaf = parts[parts.length - 1]?.toLowerCase() ?? "";
  if (leaf.endsWith(".webm") && mediaType === "audio") {
    return `${base}?kind=audio`;
  }
  if (leaf.endsWith(".webm") && mediaType === "video") {
    return `${base}?kind=video`;
  }
  return base;
}
