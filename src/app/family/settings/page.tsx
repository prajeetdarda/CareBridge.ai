import Link from "next/link";

export default function SettingsPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-20">
      <h1 className="text-2xl font-bold">Care Settings</h1>
      <p className="text-muted max-w-sm text-center">
        Dev 2 builds here — configure care topics, medication reminders, backup
        contacts, language preferences, and escalation rules.
      </p>
      <Link
        href="/family"
        className="mt-4 text-sm text-muted hover:text-foreground"
      >
        &larr; Back to dashboard
      </Link>
    </main>
  );
}
