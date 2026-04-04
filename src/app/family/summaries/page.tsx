import Link from "next/link";

export default function SummariesPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-20">
      <h1 className="text-2xl font-bold">Check-In Summaries</h1>
      <p className="text-muted max-w-sm text-center">
        Dev 2 builds here — list of past check-in summaries with urgency labels,
        timestamps, and expandable transcript details.
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
