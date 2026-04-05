"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  Suspense,
} from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import type {
  CallVoiceProvider,
  GetIncomingStatusResponse,
} from "@/lib/types";

const voiceStorageKey = (sid: string) => `fc_relay_voice_${sid}`;

const answeredKey = (sid: string) => `fc_relay_incoming_answered_${sid}`;

function playBeep(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  g.gain.value = 0.12;
  osc.type = "sine";
  osc.frequency.value = 880;
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.28);
}

function ParentIncomingInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session")?.trim() ?? "";

  const [phase, setPhase] = useState<GetIncomingStatusResponse["phase"] | null>(
    null
  );
  const [scheduledFor, setScheduledFor] = useState<string | undefined>();
  const [alreadyAnswered, setAlreadyAnswered] = useState(false);
  const [silenced, setSilenced] = useState(false);
  const [voiceProvider, setVoiceProvider] =
    useState<CallVoiceProvider>("gemini");
  const [answeredVoice, setAnsweredVoice] =
    useState<CallVoiceProvider>("gemini");
  /**
   * True once Web Audio is actually running (or unsupported — we skip the hint).
   * Browsers usually start AudioContext "suspended" until a user gesture; we try
   * auto-resume when ringing, then show a tap fallback only if still blocked.
   */
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [showAudioHint, setShowAudioHint] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRinging = useCallback(() => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    try {
      if (sessionStorage.getItem(answeredKey(sessionId)) === "1") {
        setAlreadyAnswered(true);
        const v = sessionStorage.getItem(voiceStorageKey(sessionId));
        if (v === "elevenlabs" || v === "gemini") {
          setAnsweredVoice(v);
        }
      }
    } catch {
      // ignore
    }
  }, [sessionId]);

  useEffect(() => {
    setAudioUnlocked(false);
  }, [sessionId]);

  const unlockRingAudio = useCallback(async () => {
    const Ctx =
      typeof window !== "undefined" &&
      (window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext);
    if (!Ctx) {
      setAudioUnlocked(true);
      return;
    }
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      await ctx.resume();
      if (ctx.state === "running") {
        playBeep(ctx);
        setAudioUnlocked(true);
      }
    } catch {
      // still suspended until user gesture
    }
  }, []);

  /** Try to start the ringtone without a tap (works only in permissive cases). */
  useEffect(() => {
    if (phase !== "ringing" || silenced) return;
    void unlockRingAudio();
  }, [phase, silenced, unlockRingAudio]);

  useEffect(() => {
    if (phase !== "ringing" || silenced || audioUnlocked) {
      setShowAudioHint(false);
      return;
    }
    const id = window.setTimeout(() => setShowAudioHint(true), 500);
    return () => window.clearTimeout(id);
  }, [phase, silenced, audioUnlocked]);

  useEffect(() => {
    if (!sessionId || alreadyAnswered) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch(
          `/api/call/incoming-status?sessionId=${encodeURIComponent(sessionId)}`
        );
        const data = (await res.json()) as GetIncomingStatusResponse;
        if (cancelled) return;
        setPhase(data.phase);
        setScheduledFor(data.scheduledFor);
        if (data.voiceProvider === "elevenlabs" || data.voiceProvider === "gemini") {
          setVoiceProvider(data.voiceProvider);
        }
      } catch {
        if (!cancelled) setPhase("gone");
      }
    };

    tick();
    const id = setInterval(tick, 900);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [sessionId, alreadyAnswered]);

  useEffect(() => {
    if (alreadyAnswered || phase !== "ringing" || silenced) {
      stopRinging();
      return;
    }

    if (ringIntervalRef.current) return;

    const pulse = () => {
      const ctx = audioCtxRef.current;
      if (ctx?.state === "running") {
        try {
          playBeep(ctx);
        } catch {
          // ignore
        }
      }
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([180, 120, 180]);
        } catch {
          // ignore
        }
      }
    };
    pulse();
    ringIntervalRef.current = setInterval(pulse, 2600);
    return () => stopRinging();
  }, [alreadyAnswered, phase, silenced, stopRinging]);

  const callPathForVoice = useCallback((v: CallVoiceProvider) => {
    return v === "elevenlabs" ? "/parent/call-elevenlabs" : "/parent/call";
  }, []);

  const answer = useCallback(() => {
    setSilenced(false);
    stopRinging();
    try {
      sessionStorage.setItem(answeredKey(sessionId), "1");
      sessionStorage.setItem(voiceStorageKey(sessionId), voiceProvider);
    } catch {
      // ignore
    }
    const base = callPathForVoice(voiceProvider);
    router.push(`${base}?session=${encodeURIComponent(sessionId)}`);
  }, [sessionId, router, stopRinging, voiceProvider, callPathForVoice]);

  const decline = useCallback(() => {
    stopRinging();
    setSilenced(true);
  }, [stopRinging]);

  if (!sessionId) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted">Missing session. Use the link from the family check-in page.</p>
        <Link href="/parent/update" className="text-primary underline">
          Leave a message
        </Link>
      </main>
    );
  }

  if (alreadyAnswered) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-muted">You already answered this check-in.</p>
        <Link
          href={`${callPathForVoice(answeredVoice)}?session=${encodeURIComponent(sessionId)}`}
          className="rounded-full bg-primary px-8 py-3 font-semibold text-white"
        >
          Open call again
        </Link>
        <button
          type="button"
          className="text-sm text-muted underline"
          onClick={() => {
            try {
              sessionStorage.removeItem(answeredKey(sessionId));
              sessionStorage.removeItem(voiceStorageKey(sessionId));
            } catch {
              // ignore
            }
            setAlreadyAnswered(false);
            setPhase(null);
          }}
        >
          Wait for another ring (same link)
        </button>
        <Link href="/parent/update" className="text-sm text-primary">
          Leave a message
        </Link>
      </main>
    );
  }

  if (phase === "gone") {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted">This check-in link is no longer active or expired.</p>
        <Link href="/parent/update" className="text-primary underline">
          Leave a message
        </Link>
      </main>
    );
  }

  if (phase === "wait" && scheduledFor) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-5xl">🕐</div>
        <h1 className="text-xl font-bold">Scheduled check-in</h1>
        <p className="text-muted">
          The call will be available after{" "}
          <strong>{new Date(scheduledFor).toLocaleString()}</strong>
        </p>
        <p className="text-xs text-muted">
          You&apos;ll get vibration when it&apos;s time; sound plays if the browser
          allows it, or after you tap once on this tab.
        </p>
      </main>
    );
  }

  if (phase === "ringing") {
    return (
      <main
        className={`flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-6 text-center ${
          silenced ? "bg-card" : "animate-pulse bg-danger/10"
        }`}
      >
        <div className="text-6xl">📞</div>
        <h1 className="text-2xl font-bold">Incoming check-in</h1>
        <p className="text-muted">
          {silenced
            ? "Ring silenced — tap Answer when you are ready."
            : "Your family is reaching out — this tab vibrates; sound may need one tap below."}
        </p>
        {!silenced && showAudioHint && (
          <div className="w-full max-w-sm space-y-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <p className="text-xs text-muted">
              Websites can&apos;t autoplay sound in a new tab (browser anti-spam
              rule). Tap once to hear the ringtone too.
            </p>
            <button
              type="button"
              onClick={() => void unlockRingAudio()}
              className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-light"
            >
              Tap for ring sound
            </button>
          </div>
        )}
        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={answer}
            className="rounded-full bg-success py-4 text-lg font-semibold text-white"
          >
            Answer
          </button>
          {!silenced && (
            <button
              type="button"
              onClick={decline}
              className="rounded-full border border-card-border bg-card py-3 font-medium"
            >
              Silence ring
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-muted">Checking…</p>
    </main>
  );
}

export default function ParentIncomingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[40vh] items-center justify-center">
          <p className="text-muted">Loading…</p>
        </main>
      }
    >
      <ParentIncomingInner />
    </Suspense>
  );
}
