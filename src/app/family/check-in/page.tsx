import Link from "next/link";
import FamilyCheckInPanel from "@/components/family/FamilyCheckInPanel";

export default function FamilyCheckInPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <header>
        <Link
          href="/family"
          className="text-sm text-muted hover:text-foreground"
        >
          ← Family dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          Start a check-in
        </h1>
        <p className="mt-2 max-w-xl text-muted">
          <strong>Check-in right now</strong> opens a second tab as the parent
          incoming screen (laptop demo). The assistant uses your saved care
          settings for the conversation.
        </p>
      </header>

      <FamilyCheckInPanel />
    </main>
  );
}
