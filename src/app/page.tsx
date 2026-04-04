import Link from "next/link";

export default function RoleSelectPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Family Care Relay AI
        </h1>
        <p className="mt-3 max-w-md text-lg text-muted">
          Stay connected with your loved ones — even when distance, time zones,
          or life gets in the way.
        </p>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row">
        <Link
          href="/parent"
          className="flex h-40 w-64 flex-col items-center justify-center gap-3 rounded-2xl border border-card-border bg-card shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
        >
          <span className="text-4xl">🧓</span>
          <span className="text-lg font-semibold">
            I am the Parent / Grandparent
          </span>
          <span className="text-sm text-muted">Receive check-in calls</span>
        </Link>

        <Link
          href="/family"
          className="flex h-40 w-64 flex-col items-center justify-center gap-3 rounded-2xl border border-card-border bg-card shadow-sm transition-all hover:shadow-md hover:scale-[1.02]"
        >
          <span className="text-4xl">👨‍👩‍👧</span>
          <span className="text-lg font-semibold">
            I am the Child / Family
          </span>
          <span className="text-sm text-muted">Send check-ins & view updates</span>
        </Link>
      </div>
    </main>
  );
}
