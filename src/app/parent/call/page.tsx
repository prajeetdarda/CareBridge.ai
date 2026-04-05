"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PhoneCall, PhoneOff, UserRound } from "lucide-react";
import {
  parentEnglish,
  parentPrimary,
} from "@/lib/parent-i18n";
import { ParentBilingual, ParentBilingualOnColor } from "@/components/parent/ParentBilingual";
import { useParentPreferredLanguage } from "@/components/parent/useParentPreferredLanguage";
import { createAudioCapture, createAudioPlayer } from "@/lib/audio";
import { connectGeminiLive } from "@/lib/gemini";
import { CALL_START_USER_SIGNAL } from "@/lib/call-prompt";
import type { AudioCapture, AudioPlayer, AudioChunk } from "@/lib/audio";
import type { GeminiSession } from "@/lib/gemini";

type CallState = "idle" | "connecting" | "active" | "ended";

interface TranscriptEntry {
  role: "user" | "ai";
  text: string;
  timestamp: Date;
}

function LiveCallPageInner() {
  const { lang, familyMemberName } = useParentPreferredLanguage();
  const searchParams = useSearchParams();
  const handoffSessionId = searchParams.get("session")?.trim() ?? "";
  const childName = familyMemberName || parentPrimary(lang, "yourFamily");

  const [callState, setCallState] = useState<CallState>("idle");
  const [, setTranscript] = useState<TranscriptEntry[]>([]);
  const [, setCurrentAIText] = useState("");
  const [, setCurrentUserText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [saving, setSaving] = useState(false);

  const addLog = useCallback((msg: string) => {
    console.log("[call-debug]", msg);
  }, []);

  const sessionRef = useRef<GeminiSession | null>(null);
  const captureRef = useRef<AudioCapture | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const aiTextBuffer = useRef("");
  const userTextBuffer = useRef("");
  const recordedChunksRef = useRef<AudioChunk[]>([]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  function cleanup() {
    captureRef.current?.stop();
    playerRef.current?.close();
    sessionRef.current?.disconnect();
    if (timerRef.current) clearInterval(timerRef.current);
    captureRef.current = null;
    playerRef.current = null;
    sessionRef.current = null;
    timerRef.current = null;
  }

  const startCall = useCallback(async () => {
    setCallState("connecting");
    setError(null);
    setTranscript([]);
    setCurrentAIText("");
    setCurrentUserText("");
    setCallDuration(0);
    aiTextBuffer.current = "";
    userTextBuffer.current = "";
    recordedChunksRef.current = [];

    try {
      const sessionId = handoffSessionId || crypto.randomUUID();
      sessionIdRef.current = sessionId;

      let systemInstruction: string | undefined;
      if (handoffSessionId) {
        addLog("Loading check-in context from family…");
        const ctxRes = await fetch(
          `/api/call/context?sessionId=${encodeURIComponent(handoffSessionId)}`
        );
        const ctxData = (await ctxRes.json()) as {
          systemInstruction?: string;
          error?: string;
          code?: string;
          scheduledFor?: string;
        };
        if (ctxRes.status === 403 && ctxData.code === "scheduled_not_due") {
          const when = ctxData.scheduledFor
            ? new Date(ctxData.scheduledFor).toLocaleString()
            : "the scheduled time";
          throw new Error(
            `This check-in is not active yet. It opens after ${when}.`
          );
        }
        if (!ctxRes.ok) {
          addLog(`Context unavailable (${ctxData.error ?? ctxRes.status}) — using default prompt`);
        } else if (ctxData.systemInstruction) {
          systemInstruction = ctxData.systemInstruction;
          addLog("Using your family’s care settings for this call");
        }
      }

      addLog("Fetching ephemeral token...");
      const tokenRes = await fetch("/api/call/token");
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData.error || "Token fetch failed");
      addLog("Token received OK");

      addLog("Requesting mic access...");
      const capture = await createAudioCapture();
      captureRef.current = capture;
      addLog("Mic access granted");

      const player = createAudioPlayer();
      playerRef.current = player;

      addLog("Connecting to Gemini Live...");
      const session = await connectGeminiLive(tokenData.token, {
        onAudio: (base64) => {
          recordedChunksRef.current.push({ source: "ai", data: base64 });
          player.play(base64);
        },
        onOutputTranscript: (text) => {
          aiTextBuffer.current += text;
          setCurrentAIText(aiTextBuffer.current);
        },
        onInputTranscript: (text) => {
          userTextBuffer.current += text;
          setCurrentUserText(userTextBuffer.current);
        },
        onTurnComplete: () => {
          addLog("Turn complete");
          const aiText = aiTextBuffer.current.trim();
          if (aiText) {
            setTranscript((prev) => [
              ...prev,
              { role: "ai", text: aiText, timestamp: new Date() },
            ]);
          }
          aiTextBuffer.current = "";
          setCurrentAIText("");

          const userText = userTextBuffer.current.trim();
          if (userText && userText !== CALL_START_USER_SIGNAL) {
            setTranscript((prev) => [
              ...prev,
              { role: "user", text: userText, timestamp: new Date() },
            ]);
          }
          userTextBuffer.current = "";
          setCurrentUserText("");
        },
        onInterrupted: () => {
          addLog("AI interrupted by user");
          player.interrupt();
          const partial = aiTextBuffer.current.trim();
          if (partial) {
            setTranscript((prev) => [
              ...prev,
              { role: "ai", text: partial + " [interrupted]", timestamp: new Date() },
            ]);
          }
          aiTextBuffer.current = "";
          setCurrentAIText("");
        },
        onError: (e) => {
          addLog(`ERROR: ${e.message}`);
          setError(e.message);
        },
        onClose: () => {
          addLog("Session closed by server");
          setCallState("ended");
          if (timerRef.current) clearInterval(timerRef.current);
        },
      }, systemInstruction);

      sessionRef.current = session;
      addLog("Connected! Starting audio stream...");
      queueMicrotask(() => {
        session.sendText(CALL_START_USER_SIGNAL);
        addLog("Speak-first cue sent — assistant should open the call");
      });

      capture.setOnData((base64) => {
        recordedChunksRef.current.push({ source: "mic", data: base64 });
        session.sendAudio(base64);
      });

      timerRef.current = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);

      setCallState("active");
      addLog("Call active — assistant speaks first, then you can reply");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connection failed";
      addLog(`FAILED: ${msg}`);
      setError(msg);
      cleanup();
      setCallState("idle");
    }
  }, [addLog, handoffSessionId]);

  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    if (!handoffSessionId) return;
    // Delay a bit so Strict Mode's transient mount can clean up before
    // we attempt the real call start on the stable mount.
    let cancelled = false;
    const t = window.setTimeout(() => {
      if (!cancelled) void startCall();
    }, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [handoffSessionId, startCall]);

  const endCall = useCallback(async () => {
    // Flush any partial text
    const finalTranscript: TranscriptEntry[] = [];
    setTranscript((prev) => {
      finalTranscript.push(...prev);
      return prev;
    });

    const aiText = aiTextBuffer.current.trim();
    if (aiText) {
      const entry: TranscriptEntry = { role: "ai", text: aiText, timestamp: new Date() };
      finalTranscript.push(entry);
      setTranscript((prev) => [...prev, entry]);
    }
    const userText = userTextBuffer.current.trim();
    if (userText && userText !== CALL_START_USER_SIGNAL) {
      const entry: TranscriptEntry = { role: "user", text: userText, timestamp: new Date() };
      finalTranscript.push(entry);
      setTranscript((prev) => [...prev, entry]);
    }

    const audioChunks = [...recordedChunksRef.current];
    const duration = callDuration;
    const sessionId = sessionIdRef.current;

    cleanup();
    setCallState("ended");
    setSaving(true);
    addLog("Saving recording and transcript...");

    try {
      // 1. Save combined audio + transcript to disk
      addLog(`Uploading ${audioChunks.length} audio chunks...`);
      const saveRes = await fetch("/api/call/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          audioChunks,
          transcript: finalTranscript.map((e) => ({
            role: e.role,
            text: e.text,
            timestamp: e.timestamp.toISOString(),
          })),
          duration,
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error);
      addLog(`Saved: ${saveData.files.audio}`);

      // 2. POST transcript to /api/summary (handoff to Dev 2)
      const fullText = finalTranscript
        .map((e) => `${e.role === "ai" ? "AI" : "User"}: ${e.text}`)
        .join("\n");

      const summaryRes = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          transcript: fullText,
          initiatedBy: "family",
          mediaPath: saveData.mediaPath,
          mediaType: "audio",
          callDurationSeconds: duration,
        }),
      });
      const summaryData = await summaryRes.json();
      addLog(`Summary posted: urgency=${summaryData.summary?.urgencyLevel}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed";
      addLog(`Save error: ${msg}`);
    } finally {
      setSaving(false);
    }

    // Next call: reuse handoff session id if URL still has it (same link); else new id
    sessionIdRef.current = handoffSessionId || crypto.randomUUID();
  }, [callDuration, addLog, handoffSessionId]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <main className="min-h-screen bg-[#f8f4f1] text-zinc-900">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-8 sm:py-10">
        <div className="w-full rounded-3xl border border-rose-100/80 bg-white p-6 shadow-[0_10px_30px_rgba(225,29,72,0.08)] sm:p-8">
          <div className="mb-6 flex flex-col items-center gap-3">
            <div
              className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fb923c] to-[#ec4899] shadow-[0_12px_40px_rgba(225,29,72,0.2)] sm:h-48 sm:w-48"
              role="img"
              aria-label={childName}
            >
              <UserRound className="h-24 w-24 text-white sm:h-28 sm:w-28" strokeWidth={1.25} />
            </div>
            <p className="text-center text-xl font-semibold text-[#1f2937]">
              {childName}
            </p>
          </div>

      {callState === "idle" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <ParentBilingual
            lang={lang}
            primary={parentPrimary(lang, "checkInCall")}
            english={parentEnglish("checkInCall")}
            primaryClassName="block text-2xl font-semibold text-[#1f2937]"
          />
          {error && (
            <div className="w-full rounded-xl bg-[#ffe4e6] px-4 py-3 text-sm text-[#e11d48]">
              {error}
            </div>
          )}
          <button
            onClick={startCall}
            className="flex w-full items-center justify-center gap-3 rounded-3xl bg-[#22c55e] py-5 text-2xl font-semibold text-white shadow-[0_10px_28px_rgba(34,197,94,0.3)] transition hover:bg-[#16a34a]"
          >
            <PhoneCall className="h-8 w-8" />
            <ParentBilingualOnColor
              lang={lang}
              primary={parentPrimary(lang, "accept")}
              english={parentEnglish("accept")}
              primaryClassName="block text-2xl font-semibold"
            />
          </button>
        </div>
      )}

      {callState === "connecting" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#e11d48]/30 border-t-[#e11d48]" />
          <ParentBilingual
            lang={lang}
            primary={parentPrimary(lang, "connecting")}
            english={parentEnglish("connecting")}
            primaryClassName="block text-2xl font-semibold text-[#1f2937]"
          />
        </div>
      )}

      {callState === "active" && (
        <div className="flex flex-col items-center gap-6 text-center">
          <ParentBilingual
            lang={lang}
            primary={parentPrimary(lang, "liveCallActive")}
            english={parentEnglish("liveCallActive")}
            primaryClassName="block text-2xl font-semibold text-[#1f2937]"
          />
          <p className="text-6xl font-mono font-bold tabular-nums text-[#1f2937]">
            {formatDuration(callDuration)}
          </p>
          {error && (
            <div className="w-full rounded-xl bg-[#ffe4e6] px-4 py-3 text-sm text-[#e11d48]">
              {error}
            </div>
          )}
          <button
            onClick={endCall}
            className="flex w-full items-center justify-center gap-3 rounded-3xl bg-[#e11d48] py-5 text-2xl font-semibold text-white shadow-[0_10px_28px_rgba(225,29,72,0.3)] transition hover:bg-[#be123c]"
          >
            <PhoneOff className="h-8 w-8" />
            <ParentBilingualOnColor
              lang={lang}
              primary={parentPrimary(lang, "endCall")}
              english={parentEnglish("endCall")}
              primaryClassName="block text-2xl font-semibold"
            />
          </button>
        </div>
      )}

      {callState === "ended" && (
        <div className="flex flex-col items-center gap-5 text-center">
          <ParentBilingual
            lang={lang}
            primary={parentPrimary(lang, "callEnded")}
            english={parentEnglish("callEnded")}
            primaryClassName="block text-2xl font-semibold text-[#1f2937]"
          />
          <p className="text-base text-[#6b7280]">
            {parentPrimary(lang, "duration")}: {formatDuration(callDuration)}
          </p>
          {saving ? (
            <ParentBilingual
              lang={lang}
              primary={parentPrimary(lang, "savingRecording")}
              english={parentEnglish("savingRecording")}
              primaryClassName="block text-sm text-[#6b7280]"
              englishClassName="text-xs text-[#9ca3af]"
            />
          ) : (
            <Link
              href="/parent/update"
              className="flex w-full items-center justify-center rounded-3xl bg-[#e11d48] py-5 text-xl font-semibold text-white shadow-[0_10px_28px_rgba(225,29,72,0.3)] transition hover:bg-[#be123c]"
            >
              <ParentBilingualOnColor
                lang={lang}
                primary={parentPrimary(lang, "backToHome")}
                english={parentEnglish("backToHome")}
                primaryClassName="block text-xl font-semibold"
              />
            </Link>
          )}
        </div>
      )}
        </div>
      </div>
    </main>
  );
}

function CallPageLoadingFallback() {
  const { lang } = useParentPreferredLanguage();
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <ParentBilingual
        lang={lang}
        primary={parentPrimary(lang, "loading")}
        english={parentEnglish("loading")}
        primaryClassName="block text-muted-foreground"
        englishClassName="text-xs text-muted-foreground"
      />
    </main>
  );
}

export default function LiveCallPage() {
  return (
    <Suspense fallback={<CallPageLoadingFallback />}>
      <LiveCallPageInner />
    </Suspense>
  );
}
