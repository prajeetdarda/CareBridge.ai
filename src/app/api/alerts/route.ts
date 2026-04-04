import { NextResponse } from "next/server";

/**
 * GET /api/alerts — returns all active alerts
 * POST /api/alerts — creates a new alert (from escalation)
 *
 * Dev 2 owns this route.
 */
export async function GET() {
  return NextResponse.json({ alerts: [] });
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({
    success: true,
    alert: {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString(),
    },
  });
}
