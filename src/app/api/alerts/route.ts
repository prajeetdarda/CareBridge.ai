import { NextResponse } from "next/server";
import type {
  CreateAlertRequest,
  CreateAlertResponse,
  GetAlertsResponse,
  AlertRecord,
} from "@/lib/types";

/**
 * GET  /api/alerts — returns all active alerts
 * POST /api/alerts — creates a new alert (triggered by urgency classification)
 *
 * Dev 2 owns this route.
 */
export async function GET() {
  const response: GetAlertsResponse = { alerts: [] };
  return NextResponse.json(response);
}

export async function POST(request: Request) {
  const body: CreateAlertRequest = await request.json();

  const alert: AlertRecord = {
    id: crypto.randomUUID(),
    sessionId: body.sessionId,
    timestamp: new Date().toISOString(),
    urgencyLevel: body.urgencyLevel,
    reason: body.reason,
    transcript: body.transcript,
    acknowledged: false,
  };

  const response: CreateAlertResponse = { success: true, alert };
  return NextResponse.json(response);
}
