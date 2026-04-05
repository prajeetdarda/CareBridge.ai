import { NextResponse } from "next/server";
import type {
  UpdateSettingsRequest,
  GetSettingsResponse,
  UpdateSettingsResponse,
} from "@/lib/types";
import { getProfile, updateProfile } from "@/lib/storage-adapter";

/**
 * GET /api/settings — family profile/preferences
 * PUT /api/settings — partial update merged into profile
 */
export async function GET() {
  const response: GetSettingsResponse = { profile: await getProfile() };
  return NextResponse.json(response);
}

export async function PUT(request: Request) {
  let body: UpdateSettingsRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const profile = await updateProfile(body);
  const response: UpdateSettingsResponse = { success: true, profile };
  return NextResponse.json(response);
}
