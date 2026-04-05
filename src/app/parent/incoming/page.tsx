"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
} from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Phone, PhoneOff, UserRound } from "lucide-react";
import type {
  CallVoiceProvider,
  GetIncomingStatusResponse,
} from "@/lib/types";
import { parentEnglish, parentLocaleTag, parentPrimary } from "@/lib/parent-i18n";
import { ParentBilingual, ParentBilingualOnColor } from "@/components/parent/ParentBilingual";
import { useParentPreferredLanguage } from "@/components/parent/useParentPreferredLanguage";

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

const shell =
  "mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-8 sm:py-10";
const cardSurface =
  "w-full max-w-md rounded-3xl border border-rose-100/80 bg-white p-8 shadow-[0_10px_30px_rgba(225,29,72,0.08)]";

function ParentIncomingInner() {
  const { lang, familyMemberName } = useParentPreferredLanguage();
  const caregiverName = familyMemberName.trim();
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
    queueMicrotask(() => {
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
    });
  }, [sessionId]);

  const unlockRingAudio = useCallback(async () => {
    const Ctx =
      typeof window !== "undefined" &&
      (window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext);
    if (!Ctx) {
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
      }
    } catch {
      // still suspended until user gesture
    }
  }, []);

  useEffect(() => {
    if (phase !== "ringing" || silenced) return;
    void unlockRingAudio();
  }, [phase, silenced, unlockRingAudio]);

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
    setAlreadyAnswered(true);
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

  const onAccept = useCallback(() => {
    void unlockRingAudio();
    answer();
  }, [unlockRingAudio, answer]);

  const profileBlock = useMemo(
    () => (
      <div className="flex flex-col items-center gap-2">
        <div
          className="flex h-44 w-44 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fb923c] to-[#ec4899] shadow-[0_12px_40px_rgba(225,29,72,0.2)] sm:h-52 sm:w-52"
          role="img"
          aria-label={
            caregiverName || parentPrimary(lang, "ariaFamilyCalling")
          }
        >
          <UserRound
            className="h-28 w-28 text-white sm:h-32 sm:w-32"
            strokeWidth={1.25}
          />
        </div>
        {caregiverName ? (
          <p className="text-center text-lg font-semibold text-zinc-800 sm:text-xl">
            {caregiverName}
          </p>
        ) : null}
      </div>
    ),
    [lang, caregiverName]
  );

  if (!sessionId) {
    return (
      <main className="min-h-screen bg-[#f8f4f1] text-zinc-900">
        <div className={shell}>
          <div className={`${cardSurface} flex flex-col items-center gap-6 text-center`}>
            {profileBlock}
            <Link
              href="/parent/update"
              className="flex w-full flex-col items-center justify-center rounded-3xl bg-[#e11d48] py-5 text-xl font-semibold text-white"
            >
              <ParentBilingualOnColor
                lang={lang}
                primary={parentPrimary(lang, "update")}
                english={parentEnglish("update")}
                primaryClassName="block text-xl font-semibold"
              />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (alreadyAnswered) {
    return (
      <main className="min-h-screen bg-[#f8f4f1] text-zinc-900">
        <div className={shell}>
          <div className={`${cardSurface} flex flex-col items-center gap-6`}>
            {profileBlock}
            <Link
              href={`${callPathForVoice(answeredVoice)}?session=${encodeURIComponent(sessionId)}`}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-3xl bg-[#22c55e] py-6 text-2xl font-semibold text-white sm:flex-row sm:gap-3"
            >
              <Phone className="h-8 w-8 shrink-0" strokeWidth={2} />
              <ParentBilingualOnColor
                lang={lang}
                primary={parentPrimary(lang, "accept")}
                english={parentEnglish("accept")}
                primaryClassName="block text-2xl font-semibold"
              />
            </Link>
            <button
              type="button"
              className="w-full rounded-3xl border-2 border-zinc-200 bg-white py-4 text-base font-medium text-zinc-600"
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
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "waitNextCall")}
                english={parentEnglish("waitNextCall")}
                primaryClassName="block text-base font-medium text-zinc-700"
                englishClassName="text-xs text-zinc-500"
              />
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "gone") {
    return (
      <main className="min-h-screen bg-[#f8f4f1] text-zinc-900">
        <div className={shell}>
          <div className={`${cardSurface} flex flex-col items-center gap-6`}>
            {profileBlock}
            <Link
              href="/parent/update"
              className="flex w-full flex-col items-center justify-center rounded-3xl bg-[#e11d48] py-5 text-xl font-semibold text-white"
            >
              <ParentBilingualOnColor
                lang={lang}
                primary={parentPrimary(lang, "update")}
                english={parentEnglish("update")}
                primaryClassName="block text-xl font-semibold"
              />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "wait" && scheduledFor) {
    return (
      <main className="min-h-screen bg-[#f8f4f1] text-zinc-900">
        <div className={shell}>
          <div className={`${cardSurface} flex flex-col items-center gap-8`}>
            {profileBlock}
            <p className="text-center text-2xl font-semibold tabular-nums text-zinc-800">
              {new Date(scheduledFor).toLocaleString(parentLocaleTag(lang), {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            {lang !== "en" ? (
              <p className="text-center text-sm text-zinc-500">
                (
                {new Date(scheduledFor).toLocaleString("en-IN", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                )
              </p>
            ) : null}
          </div>
        </div>
      </main>
    );
  }

  if (phase === "ringing") {
    return (
      <main
        className="min-h-screen bg-[#f8f4f1] text-zinc-900"
        onPointerDown={() => void unlockRingAudio()}
      >
        <div className={`${shell} gap-10`}>
          {profileBlock}
          <div className="flex w-full max-w-md flex-col gap-4">
            <button
              type="button"
              onClick={onAccept}
              className="flex min-h-[7.5rem] w-full flex-col items-center justify-center gap-2 rounded-3xl bg-[#22c55e] px-4 text-white shadow-[0_10px_28px_rgba(34,197,94,0.35)] sm:min-h-32 sm:flex-row sm:gap-3 sm:text-[1.65rem]"
            >
              <Phone className="h-10 w-10 shrink-0 sm:h-12 sm:w-12" strokeWidth={2} />
              <ParentBilingualOnColor
                lang={lang}
                primary={parentPrimary(lang, "accept")}
                english={parentEnglish("accept")}
                primaryClassName="block text-2xl font-semibold"
              />
            </button>
            <button
              type="button"
              onClick={decline}
              className="flex min-h-[7.5rem] w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-rose-200 bg-white px-4 text-[#e11d48] shadow-[0_6px_20px_rgba(0,0,0,0.06)] sm:min-h-32 sm:flex-row sm:gap-3 sm:text-[1.65rem]"
            >
              <PhoneOff className="h-10 w-10 shrink-0 sm:h-12 sm:w-12" strokeWidth={2} />
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "decline")}
                english={parentEnglish("decline")}
                primaryClassName="block text-2xl font-semibold text-[#e11d48]"
                englishClassName="text-sm text-[#e11d48]/75"
              />
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4f1] text-zinc-900">
      <div className={shell}>
        <div className="h-12 w-12 rounded-full border-4 border-[#e11d48]/30 border-t-[#e11d48]" />
      </div>
    </main>
  );
}

export default function ParentIncomingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f8f4f1]">
          <div className="h-12 w-12 rounded-full border-4 border-[#e11d48]/30 border-t-[#e11d48]" />
        </main>
      }
    >
      <ParentIncomingInner />
    </Suspense>
  );
}
