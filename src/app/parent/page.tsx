import Link from "next/link";

interface VoiceOption {
  id: string;
  label: string;
  badge: string;
  badgeColor: string;
  icon: string;
  href: string;
  stack: string;
  pros: string[];
  cons: string[];
  cta: string;
  ctaColor: string;
}

const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "gemini-live",
    label: "Gemini Live",
    badge: "Option 1",
    badgeColor: "bg-primary/15 text-primary",
    icon: "🎙️",
    href: "/parent/call",
    stack: "Gemini Live API — real-time WebSocket",
    pros: ["Sub-200ms latency", "Barge-in / interruption support", "No extra API keys needed"],
    cons: ["Gemini voices only (Aoede, Kore, etc.)"],
    cta: "Test Gemini Live",
    ctaColor: "bg-primary hover:bg-primary-light",
  },
  {
    id: "elevenlabs",
    label: "ElevenLabs + Gemini",
    badge: "Option 2",
    badgeColor: "bg-success/15 text-success",
    icon: "🤖",
    href: "/parent/call-elevenlabs",
    stack: "ElevenLabs voice (WebRTC) + Gemini intelligence",
    pros: [
      "Ultra-natural ElevenLabs voice",
      "Gemini as the reasoning LLM",
      "Personalised prompts per grandparent",
    ],
    cons: ["Needs ElevenLabs Agent setup + API key"],
    cta: "Test ElevenLabs Agent",
    ctaColor: "bg-success hover:bg-success/90",
  },
];

export default function ParentHomePage() {
  return (
    <main className="flex flex-1 flex-col items-center gap-8 px-6 py-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Parent / Grandparent Home</h1>
        <p className="mt-2 text-muted max-w-md">
          Two voice AI options — pick the best one for the demo.
        </p>
      </div>

      {/* Voice option cards */}
      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        {VOICE_OPTIONS.map((opt) => (
          <div
            key={opt.id}
            className="flex flex-col rounded-2xl border border-card-border bg-card p-5 gap-4"
          >
            {/* Header */}
            <div className="flex items-start gap-3">
              <span className="text-3xl">{opt.icon}</span>
              <div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${opt.badgeColor}`}>
                  {opt.badge}
                </span>
                <h2 className="mt-1 text-base font-bold leading-tight">{opt.label}</h2>
                <p className="text-xs text-muted mt-0.5">{opt.stack}</p>
              </div>
            </div>

            {/* Pros / cons */}
            <div className="flex-1 space-y-1.5">
              {opt.pros.map((p) => (
                <div key={p} className="flex items-start gap-1.5 text-xs text-foreground">
                  <span className="mt-0.5 text-success">✓</span>
                  <span>{p}</span>
                </div>
              ))}
              {opt.cons.map((c) => (
                <div key={c} className="flex items-start gap-1.5 text-xs text-muted">
                  <span className="mt-0.5 text-danger">✗</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href={opt.href}
              className={`rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors ${opt.ctaColor}`}
            >
              {opt.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Other actions */}
      <Link
        href="/parent/update"
        className="rounded-xl border border-card-border bg-card px-6 py-3 font-medium transition-colors hover:bg-background"
      >
        Leave an Update
      </Link>

      <Link href="/" className="text-sm text-muted hover:text-foreground">
        &larr; Back to role select
      </Link>
    </main>
  );
}
