import FamilyCheckInPanel from "@/components/family/FamilyCheckInPanel";
import CarePageShell from "@/components/family/CarePageShell";

export default function FamilyCheckInPage() {
  return (
    <CarePageShell pageTitle="Check-in">
      <FamilyCheckInPanel />
    </CarePageShell>
  );
}
