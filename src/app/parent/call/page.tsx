import Link from "next/link";

export default function LiveCallPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-20">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
        <span className="text-5xl">📞</span>
      </div>
      <h1 className="text-2xl font-bold">Live Call Screen</h1>
      <p className="text-muted max-w-sm text-center">
        Dev 1 builds here — live voice conversation with Gemini Live API, mic
        capture, audio playback, and real-time transcript display.
      </p>
      <Link
        href="/parent"
        className="mt-4 text-sm text-muted hover:text-foreground"
      >
        &larr; Back to parent home
      </Link>
    </main>
  );
}
