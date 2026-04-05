import type { AlertRecord } from "@/lib/types";

/** Query value for `/family/summaries?tab=` */
export type SummariesTabQuery = "later" | "notify" | "urgent";

export function parseSummariesTabParam(
  raw: string | string[] | undefined
): SummariesTabQuery {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "urgent" || v === "notify" || v === "later") return v;
  return "later";
}

export function summariesTabFromAlertUrgency(
  level: AlertRecord["urgencyLevel"]
): SummariesTabQuery {
  return level === "urgent_now" ? "urgent" : "notify";
}

export function summariesPageHrefForAlert(
  level: AlertRecord["urgencyLevel"]
): string {
  const tab = summariesTabFromAlertUrgency(level);
  return `/family/summaries?tab=${tab}`;
}
