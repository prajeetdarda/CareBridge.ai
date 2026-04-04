import Link from "next/link";

export default function ParentHomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-20">
      <h1 className="text-3xl font-bold">Parent / Grandparent Home</h1>
      <p className="text-muted max-w-md text-center">
        This is where incoming check-in calls will appear. When your family
        member triggers a check-in, you will see the call screen here.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/parent/call"
          className="rounded-xl bg-primary px-6 py-3 text-white font-medium transition-colors hover:bg-primary-light"
        >
          Simulate Incoming Call
        </Link>
        <Link
          href="/parent/update"
          className="rounded-xl border border-card-border bg-card px-6 py-3 font-medium transition-colors hover:bg-background"
        >
          Leave an Update
        </Link>
      </div>

      <Link href="/" className="mt-4 text-sm text-muted hover:text-foreground">
        &larr; Back to role select
      </Link>
    </main>
  );
}
