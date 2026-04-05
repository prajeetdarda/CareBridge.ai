"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, HeartPulse, MapPin, MessageSquareText } from "lucide-react";
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

const DEMO_PROGRESS_MS = 4200;

function perContactBar(
  overallPct: number,
  index: number,
  total: number
): { fill: number; notified: boolean } {
  if (total <= 0) return { fill: 100, notified: true };
  const start = (index / total) * 100;
  const end = ((index + 1) / total) * 100;
  if (overallPct >= end) return { fill: 100, notified: true };
  if (overallPct <= start) return { fill: 0, notified: false };
  const fill = ((overallPct - start) / (end - start)) * 100;
  return { fill: Math.min(100, Math.max(0, fill)), notified: false };
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
  const [demoProgress, setDemoProgress] = useState(0);
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

  /** Simulated notification progress when escalation modal opens */
  useEffect(() => {
    if (!showEscalation) {
      setDemoProgress(0);
      return;
    }
    setDemoProgress(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DEMO_PROGRESS_MS);
      setDemoProgress(Math.round(t * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [showEscalation]);

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

  const contactCount = displayNames.length;
  const allContactsNotified =
    contactCount > 0 && demoProgress >= 100;

  if (resolved) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        className="sticky top-0 z-40 border-b border-zinc-200/70 bg-[#fff7f8]/95 px-4 py-3 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90"
        role="status"
        aria-live="assertive"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#e11d48] dark:text-rose-300">
              Urgent alert — action required
            </p>
            {!showEscalation && secondsLeft > 0 && (
              <p className="mt-0.5 text-xs text-[#6b7280] dark:text-zinc-400">
                Simulated auto-escalation in{" "}
                <span className="font-mono font-semibold tabular-nums text-[#1f2937] dark:text-zinc-200">
                  {secondsLeft}
                </span>
                s if not acknowledged
              </p>
            )}
            {!showEscalation && secondsLeft === 0 && escalationDismissed && (
              <p className="mt-0.5 text-xs text-[#6b7280] dark:text-zinc-400">
                Demo escalation was shown. Acknowledge to clear alerts.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {soundNeedsTap && (
              <button
                type="button"
                onClick={() => void unlockSound()}
                className="rounded-full border border-rose-200/80 bg-white px-3 py-1.5 text-xs font-medium text-[#6b7280] transition hover:bg-rose-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Tap to enable alert sound
              </button>
            )}
            <Link
              href="/family/alerts"
              className="rounded-full border border-zinc-200/80 bg-white px-3 py-1.5 text-xs font-medium text-[#6b7280] transition hover:bg-[#f8f4f1] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              Open alerts
            </Link>
            <button
              type="button"
              disabled={busy}
              onClick={() => void acknowledgeAll()}
              className="rounded-full bg-[#e11d48] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#be123c] disabled:opacity-50"
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
          <div className="demo-escalation-panel relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.25rem] border border-zinc-200/60 bg-white p-5 shadow-[0_8px_28px_rgba(0,0,0,0.12)] dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-rose-600">
              Simulated for demo
            </p>
            <h2
              id="demo-escalation-title"
              className="demo-escalation-title text-center text-xl font-semibold text-[#1f2937] dark:text-zinc-100 sm:text-2xl"
            >
              Emergency escalation in progress
            </h2>
            <p className="mt-2 text-center text-sm text-[#6b7280] dark:text-zinc-400">
              Sharing location, medical context, and escalation message to
              emergency contacts.
            </p>

            <ul className="mt-4 grid gap-2 sm:grid-cols-3">
              <li className="demo-escalation-contact flex items-center gap-2 rounded-lg border border-zinc-200/70 bg-[#f8f4f1] px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800/70">
                <MapPin className="h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                <span>
                  <span className="font-semibold text-foreground">Location</span>
                  <span className="text-muted-foreground"> · Last known area</span>
                </span>
              </li>
              <li className="demo-escalation-contact flex items-center gap-2 rounded-lg border border-zinc-200/70 bg-[#f8f4f1] px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800/70">
                <HeartPulse className="h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                <span>
                  <span className="font-semibold text-foreground">Medical</span>
                  <span className="text-muted-foreground"> · Care profile summary</span>
                </span>
              </li>
              <li className="demo-escalation-contact flex items-center gap-2 rounded-lg border border-zinc-200/70 bg-[#f8f4f1] px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800/70 sm:col-span-1">
                <MessageSquareText className="h-4 w-4 shrink-0 text-rose-500" aria-hidden />
                <span>
                  <span className="font-semibold text-foreground">Message</span>
                  <span className="text-muted-foreground"> · AI escalation note</span>
                </span>
              </li>
            </ul>

            <p className="mt-4 text-sm font-semibold text-[#1f2937] dark:text-zinc-100">
              Emergency contacts
            </p>
            <ul className="mt-2 space-y-2.5">
              {displayNames.map((name, i) => {
                const { fill, notified } = perContactBar(
                  demoProgress,
                  i,
                  contactCount
                );
                return (
                  <li
                    key={`${name}-${i}`}
                    className="demo-escalation-contact rounded-lg border border-zinc-200/70 bg-[#f8f4f1] px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800/70"
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-semibold text-foreground">
                        {name}
                      </span>
                      {notified ? (
                        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" aria-hidden />
                          Notified
                        </span>
                      ) : null}
                    </div>
                    {!notified ? (
                      <div
                        className="demo-escalation-progress-track mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/50 dark:bg-zinc-700/80"
                        aria-hidden
                      >
                        <div
                          className="demo-escalation-progress-bar h-full duration-100 ease-linear"
                          style={{ width: `${fill}%` }}
                        />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            {allContactsNotified ? (
              <p className="demo-escalation-subtle mt-3 text-center text-xs text-muted-foreground">
                Demo complete: all contacts notified.
              </p>
            ) : null}

            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  setShowEscalation(false);
                  setEscalationDismissed(true);
                }}
                className="rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm font-medium"
              >
                Close demo
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void acknowledgeAll()}
                className="rounded-xl bg-[#e11d48] px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-[#be123c] disabled:opacity-50"
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
