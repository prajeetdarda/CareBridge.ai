"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AlertRecord } from "@/lib/types";

function getAudioContextClass(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  return Ctx ?? null;
}

export default function UrgentEmergencyDemo({
  children,
  backupContactNames = [],
}: {
  children: ReactNode;
  /** Optional names for fake “contacting …” lines in the demo overlay */
  backupContactNames?: string[];
}) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [resolved, setResolved] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [escalationDismissed, setEscalationDismissed] = useState(false);
  const [soundNeedsTap, setSoundNeedsTap] = useState(false);
  const [busy, setBusy] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const beepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAudioLoop = useCallback(() => {
    if (beepIntervalRef.current != null) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }
    const ctx = ctxRef.current;
    if (ctx && ctx.state !== "closed") void ctx.close();
    ctxRef.current = null;
  }, []);

  const playBeep = useCallback(() => {
    try {
      const Ctx = getAudioContextClass();
      if (!Ctx) return;
      if (!ctxRef.current || ctxRef.current.state === "closed") {
        ctxRef.current = new Ctx();
      }
      const ctx = ctxRef.current;
      void ctx.resume().then(() => setSoundNeedsTap(false));
      if (ctx.state === "suspended") {
        setSoundNeedsTap(true);
        return;
      }
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.18, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.type = "square";
      osc.frequency.value = 920;
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {
      // ignore
    }
  }, []);

  const startAudioLoop = useCallback(() => {
    if (beepIntervalRef.current != null) return;
    playBeep();
    beepIntervalRef.current = setInterval(playBeep, 480);
  }, [playBeep]);

  useEffect(() => {
    if (resolved || showEscalation) {
      stopAudioLoop();
      return;
    }
    startAudioLoop();
    return () => {
      stopAudioLoop();
    };
  }, [resolved, showEscalation, startAudioLoop, stopAudioLoop]);

  useEffect(() => {
    if (resolved || showEscalation) return;
    if (secondsLeft <= 0) {
      setShowEscalation(true);
      return;
    }
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, resolved, showEscalation]);

  const unlockSound = useCallback(async () => {
    const Ctx = getAudioContextClass();
    if (!Ctx) return;
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new Ctx();
    }
    await ctxRef.current.resume();
    setSoundNeedsTap(false);
    if (!resolved && !showEscalation) startAudioLoop();
  }, [resolved, showEscalation, startAudioLoop]);

  async function acknowledgeAll() {
    setBusy(true);
    try {
      const res = await fetch("/api/alerts", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { alerts: AlertRecord[] };
      const ids = (data.alerts ?? [])
        .filter((a) => a.urgencyLevel === "urgent_now")
        .map((a) => a.id);
      if (ids.length === 0) {
        setResolved(true);
        setShowEscalation(false);
        stopAudioLoop();
        await router.refresh();
        return;
      }
      for (const id of ids) {
        const patchRes = await fetch("/api/alerts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alertId: id }),
        });
        if (!patchRes.ok) return;
      }
      setResolved(true);
      setShowEscalation(false);
      stopAudioLoop();
      await router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const displayNames =
    backupContactNames.length > 0
      ? backupContactNames.slice(0, 4)
      : ["Emergency contact A", "Emergency contact B"];

  if (resolved) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        className="sticky top-0 z-40 border-b-2 border-danger/50 bg-danger/15 px-4 py-3 backdrop-blur-sm dark:bg-danger/25"
        role="status"
        aria-live="assertive"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-danger">
              Urgent alert — action required
            </p>
            {!showEscalation && secondsLeft > 0 && (
              <p className="mt-0.5 text-xs text-foreground/90">
                Simulated auto-escalation in{" "}
                <span className="font-mono font-bold tabular-nums">
                  {secondsLeft}
                </span>
                s if not acknowledged
              </p>
            )}
            {!showEscalation && secondsLeft === 0 && escalationDismissed && (
              <p className="mt-0.5 text-xs text-muted">
                Demo escalation was shown. Acknowledge to clear alerts.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {soundNeedsTap && (
              <button
                type="button"
                onClick={() => void unlockSound()}
                className="rounded-lg border border-danger/40 bg-card px-3 py-1.5 text-xs font-medium"
              >
                Tap to enable alert sound
              </button>
            )}
            <Link
              href="/family/alerts"
              className="rounded-lg border border-card-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-background/80"
            >
              Open alerts
            </Link>
            <button
              type="button"
              disabled={busy}
              onClick={() => void acknowledgeAll()}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {busy ? "…" : "Acknowledge urgent"}
            </button>
          </div>
        </div>
      </div>

      {children}

      {showEscalation && (
        <div
          className="demo-escalation-backdrop fixed inset-0 z-50 flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-escalation-title"
        >
          <div className="demo-escalation-panel relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-danger/40 bg-card p-8 shadow-2xl">
            <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-muted">
              Simulated for demo
            </p>
            <h2
              id="demo-escalation-title"
              className="demo-escalation-title text-center text-xl font-bold text-danger"
            >
              Emergency escalation in progress
            </h2>
            <p className="mt-3 text-center text-sm text-muted">
              The AI care agent is reaching out to your immediate family
              contacts. This is a visual simulation only — no messages are sent.
            </p>

            <div
              className="demo-escalation-progress-track mt-6 h-2 overflow-hidden rounded-full bg-muted/30"
              aria-hidden
            >
              <div className="demo-escalation-progress-bar h-full rounded-full bg-danger" />
            </div>

            <ul className="mt-6 space-y-3">
              {displayNames.map((name, i) => (
                <li
                  key={`${name}-${i}`}
                  className="demo-escalation-contact flex items-center gap-2 rounded-lg border border-card-border bg-background/60 px-3 py-2 text-sm"
                  style={{ animationDelay: `${i * 0.35}s` }}
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-success demo-escalation-ping" />
                  <span>
                    Notifying: <strong>{name}</strong>
                  </span>
                </li>
              ))}
            </ul>

            <p className="demo-escalation-subtle mt-6 text-center text-xs text-muted">
              Relaying situation summary · Stand by…
            </p>

            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  setShowEscalation(false);
                  setEscalationDismissed(true);
                }}
                className="rounded-lg border border-card-border bg-background px-4 py-2 text-sm font-medium"
              >
                Close demo
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void acknowledgeAll()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Acknowledge urgent
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
