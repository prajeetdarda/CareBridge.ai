import Link from "next/link";

export default function FamilyDashboardPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-20">
      <h1 className="text-3xl font-bold">Family Dashboard</h1>
      <p className="text-muted max-w-md text-center">
        Dev 2 builds here — this is the child/family member dashboard. Start
        check-ins, view summaries, see alerts, and manage settings.
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link
          href="/family/summaries"
          className="flex flex-col items-center gap-2 rounded-xl border border-card-border bg-card p-5 transition-all hover:shadow-md"
        >
          <span className="text-2xl">📋</span>
          <span className="text-sm font-medium">Summaries</span>
        </Link>
        <Link
          href="/family/alerts"
          className="flex flex-col items-center gap-2 rounded-xl border border-card-border bg-card p-5 transition-all hover:shadow-md"
        >
          <span className="text-2xl">🚨</span>
          <span className="text-sm font-medium">Alerts</span>
        </Link>
        <Link
          href="/family/settings"
          className="flex flex-col items-center gap-2 rounded-xl border border-card-border bg-card p-5 transition-all hover:shadow-md"
        >
          <span className="text-2xl">⚙️</span>
          <span className="text-sm font-medium">Settings</span>
        </Link>
        <button className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-primary bg-primary/5 p-5 transition-all hover:bg-primary/10">
          <span className="text-2xl">📞</span>
          <span className="text-sm font-medium text-primary">
            Start Check-In
          </span>
        </button>
      </div>

      <Link href="/" className="mt-4 text-sm text-muted hover:text-foreground">
        &larr; Back to role select
      </Link>
    </main>
  );
}
