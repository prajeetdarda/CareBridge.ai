import { NextResponse } from "next/server";
import type {
  FamilyProfile,
  UpdateSettingsRequest,
  GetSettingsResponse,
  UpdateSettingsResponse,
} from "@/lib/types";

const defaultProfile: FamilyProfile = {
  familyMemberName: "Anjali",
  lovedOneName: "Amma",
  preferredLanguage: "hi",
  relationshipLabel: "daughter",
  careTopics: ["medication", "food", "activity", "mood"],
  reminderRules: [],
  backupContacts: [],
};

/**
 * GET /api/settings — returns the family profile/preferences
 * PUT /api/settings — updates the family profile
 *
 * Dev 2 owns this route.
 */
export async function GET() {
  const response: GetSettingsResponse = { profile: defaultProfile };
  return NextResponse.json(response);
}

export async function PUT(request: Request) {
  const body: UpdateSettingsRequest = await request.json();
  const response: UpdateSettingsResponse = {
    success: true,
    profile: { ...defaultProfile, ...body },
  };
  return NextResponse.json(response);
}
