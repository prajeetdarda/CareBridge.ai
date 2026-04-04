import { NextResponse } from "next/server";
import type {
  CreateAlertRequest,
  CreateAlertResponse,
  GetAlertsResponse,
  AlertRecord,
} from "@/lib/types";
import { addAlert, getAlerts, acknowledgeAlert } from "@/lib/storage";

/**
 * GET   /api/alerts — active (unacknowledged) alerts, newest first
 * POST  /api/alerts — create alert (also used internally by summary pipeline)
 * PATCH /api/alerts — body { alertId: string } — mark acknowledged
 */
export async function GET() {
  const active = getAlerts()
    .filter((a) => !a.acknowledged)
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  const response: GetAlertsResponse = { alerts: active };
  return NextResponse.json(response);
}

export async function POST(request: Request) {
  let body: CreateAlertRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    !body?.sessionId ||
    !body.urgencyLevel ||
    typeof body.reason !== "string"
  ) {
    return NextResponse.json(
      { error: "sessionId, urgencyLevel, and reason are required" },
      { status: 400 }
    );
  }

  const alert: AlertRecord = {
    id: crypto.randomUUID(),
    sessionId: body.sessionId,
    timestamp: new Date().toISOString(),
    urgencyLevel: body.urgencyLevel,
    reason: body.reason,
    transcript: body.transcript,
    acknowledged: false,
  };

  addAlert(alert);

  const response: CreateAlertResponse = { success: true, alert };
  return NextResponse.json(response);
}

export async function PATCH(request: Request) {
  let body: { alertId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.alertId) {
    return NextResponse.json({ error: "alertId is required" }, { status: 400 });
  }

  const ok = acknowledgeAlert(body.alertId);
  if (!ok) {
    return NextResponse.json({ error: "Alert not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
