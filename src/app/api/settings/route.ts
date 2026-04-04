import { NextResponse } from "next/server";
import type { FamilyProfile } from "@/lib/types";

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
  return NextResponse.json({ profile: defaultProfile });
}

export async function PUT(request: Request) {
  const body = await request.json();
  return NextResponse.json({
    success: true,
    profile: { ...defaultProfile, ...body },
  });
}
