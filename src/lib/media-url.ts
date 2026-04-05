/**
 * Build same-origin URL for tmp media served by /api/media/[...path].
 */
export function publicMediaPath(mediaPath: string): string {
  const trimmed = mediaPath
    .trim()
    .replace(/^tmp\//, "")
    .replace(/^\.\/+/, "");
  const parts = trimmed.split("/").filter(Boolean);
  if (parts.length === 0) return "";
  return `/api/media/${parts.map(encodeURIComponent).join("/")}`;
}
