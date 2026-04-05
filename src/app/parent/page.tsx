import { redirect } from "next/navigation";

/**
 * Grandparent landing: go straight to leave-a-message. Check-in calls use
 * /parent/incoming and /parent/call (or ElevenLabs) directly.
 */
export default function ParentHomePage() {
  redirect("/parent/update");
}
