import Link from "next/link";

export default function AlertsPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-20">
      <h1 className="text-2xl font-bold">Urgent Alerts</h1>
      <p className="text-muted max-w-sm text-center">
        Dev 2 builds here — urgent and &quot;notify soon&quot; alerts from
        check-ins and parent-initiated updates, with escalation details.
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
