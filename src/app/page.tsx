import Link from "next/link";

export default function RoleSelectPage() {
  return (
    <main className="care-hero-bg care-page-shell flex flex-1 flex-col items-center justify-center gap-10 px-6 py-14 sm:py-20">
      <div className="care-surface w-full max-w-4xl rounded-[2rem] border border-card-border/80 p-8 text-center shadow-lg sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Family Care Relay AI
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Keep your family close,
          <span className="care-heading-gradient block">even across distance.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted sm:text-lg">
          A caring bridge between parents and children with compassionate check-ins,
          updates, and urgent support when it matters most.
        </p>
      </div>

      <div className="grid w-full max-w-4xl gap-5 sm:grid-cols-2">
        <Link
          href="/parent/update"
          className="care-card care-hover-lift care-focus-ring flex min-h-52 flex-col items-center justify-center gap-3 rounded-3xl px-5 text-center"
        >
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-4xl">
            🧓
          </span>
          <span className="text-lg font-semibold">
            I am the Parent / Grandparent
          </span>
          <span className="text-sm text-muted">
            Share updates and join caring check-in calls
          </span>
        </Link>

        <Link
          href="/family"
          className="care-card care-hover-lift care-focus-ring flex min-h-52 flex-col items-center justify-center gap-3 rounded-3xl px-5 text-center"
        >
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-4xl">
            👨‍👩‍👧
          </span>
          <span className="text-lg font-semibold">
            I am the Child / Family
          </span>
          <span className="text-sm text-muted">
            Review care timeline, alerts, and start check-ins
          </span>
        </Link>
      </div>
    </main>
  );
}
