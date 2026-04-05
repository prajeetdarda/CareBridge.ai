"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  parentEnglish,
  parentPrimary,
  type ParentLang,
} from "@/lib/parent-i18n";
import { ParentBilingual, ParentBilingualOnColor } from "@/components/parent/ParentBilingual";
import { useParentPreferredLanguage } from "@/components/parent/useParentPreferredLanguage";
import { createAudioCapture, createAudioPlayer } from "@/lib/audio";
import { connectGeminiLive } from "@/lib/gemini";
import { CALL_START_USER_SIGNAL } from "@/lib/call-prompt";
import type { AudioCapture, AudioPlayer, AudioChunk } from "@/lib/audio";
import type { GeminiSession } from "@/lib/gemini";

/** Prevents duplicate auto-start when React Strict Mode runs effects twice. */
const autostartedGeminiSessions = new Set<string>();

type CallState = "idle" | "connecting" | "active" | "ended";

interface TranscriptEntry {
  role: "user" | "ai";
  text: string;
  timestamp: Date;
}

function LiveCallPageInner() {
  const { lang } = useParentPreferredLanguage();
  const searchParams = useSearchParams();
  const handoffSessionId = searchParams.get("session")?.trim() ?? "";

  const [callState, setCallState] = useState<CallState>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentAIText, setCurrentAIText] = useState("");
  const [currentUserText, setCurrentUserText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    console.log("[call-debug]", msg);
    setDebugLogs((prev) => [...prev.slice(-20), `${new Date().toLocaleTimeString()} ${msg}`]);
  }, []);

  const sessionRef = useRef<GeminiSession | null>(null);
  const captureRef = useRef<AudioCapture | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const aiTextBuffer = useRef("");
  const userTextBuffer = useRef("");
  const recordedChunksRef = useRef<AudioChunk[]>([]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, currentAIText, currentUserText]);

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
    setDebugLogs([]);
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!handoffSessionId) return;
    if (autostartedGeminiSessions.has(handoffSessionId)) return;
    autostartedGeminiSessions.add(handoffSessionId);
    void startCall();
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
    <main className="flex flex-1 flex-col items-center px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="w-full max-w-lg">
        <Link
          href="/parent/update"
          className="text-sm text-muted hover:text-foreground"
        >
          <ParentBilingual
            lang={lang}
            primary={`← ${parentPrimary(lang, "back")}`}
            english={`← ${parentEnglish("back")}`}
            align="left"
            primaryClassName="block"
            englishClassName="text-xs opacity-80"
          />
        </Link>
      </div>

      {/* Idle State */}
      {callState === "idle" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/10">
            <span className="text-6xl">📞</span>
          </div>
          {handoffSessionId ? (
            <>
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "checkInCall")}
                english={parentEnglish("checkInCall")}
                primaryClassName="block text-xl font-bold"
              />
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "checkInAutoStart")}
                english={parentEnglish("checkInAutoStart")}
                primaryClassName="block max-w-sm text-center text-sm text-muted-foreground"
                englishClassName="text-xs text-muted-foreground"
              />
            </>
          ) : (
            <>
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "liveVoiceDemo")}
                english={parentEnglish("liveVoiceDemo")}
                primaryClassName="block text-2xl font-bold"
              />
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "testGeminiBlurb")}
                english={parentEnglish("testGeminiBlurb")}
                primaryClassName="block max-w-sm text-center text-muted-foreground"
                englishClassName="text-xs text-muted-foreground"
              />
            </>
          )}
          {error && (
            <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}
          <button
            onClick={startCall}
            className="rounded-full bg-success px-10 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-success/90 hover:shadow-xl active:scale-95"
          >
            <ParentBilingualOnColor
              lang={lang}
              primary={
                handoffSessionId
                  ? parentPrimary(lang, "retryCheckInCall")
                  : parentPrimary(lang, "startTestCall")
              }
              english={
                handoffSessionId
                  ? parentEnglish("retryCheckInCall")
                  : parentEnglish("startTestCall")
              }
              primaryClassName="block text-lg font-semibold"
            />
          </button>
        </div>
      )}

      {/* Connecting State */}
      {callState === "connecting" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="flex h-28 w-28 animate-pulse items-center justify-center rounded-full bg-primary/20">
            <span className="text-6xl">📡</span>
          </div>
          <ParentBilingual
            lang={lang}
            primary={parentPrimary(lang, "connecting")}
            english={parentEnglish("connecting")}
            primaryClassName="block text-xl font-semibold"
          />
          <ParentBilingual
            lang={lang}
            primary={parentPrimary(lang, "settingUpSession")}
            english={parentEnglish("settingUpSession")}
            primaryClassName="block text-sm text-muted-foreground"
            englishClassName="text-xs text-muted-foreground"
          />
        </div>
      )}

      {/* Active Call State */}
      {callState === "active" && (
        <div className="flex w-full max-w-lg flex-1 flex-col gap-4 pt-4">
          {/* Call header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
                <span className="text-2xl">🎙️</span>
                <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-pulse rounded-full bg-success" />
              </div>
              <div>
                <ParentBilingual
                  lang={lang}
                  primary={parentPrimary(lang, "liveCallActive")}
                  english={parentEnglish("liveCallActive")}
                  primaryClassName="block font-semibold"
                  align="left"
                  englishClassName="text-xs text-muted-foreground"
                />
                <p className="text-sm text-muted">
                  {formatDuration(callDuration)}
                </p>
              </div>
            </div>
            <button
              onClick={endCall}
              className="rounded-full bg-danger px-6 py-2.5 font-medium text-white transition-colors hover:bg-danger/80"
            >
              <ParentBilingualOnColor
                lang={lang}
                primary={parentPrimary(lang, "endCall")}
                english={parentEnglish("endCall")}
                primaryClassName="block font-medium"
              />
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Transcript */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-card-border bg-card p-4">
            {transcript.length === 0 && !currentAIText && !currentUserText && (
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "assistantSpeaksFirst")}
                english={parentEnglish("assistantSpeaksFirst")}
                primaryClassName="block text-center text-sm text-muted-foreground"
                englishClassName="text-xs text-muted-foreground"
              />
            )}

            {transcript.map((entry, i) => (
              <TranscriptBubble key={i} entry={entry} lang={lang} />
            ))}

            {currentUserText && (
              <TranscriptBubble
                entry={{
                  role: "user",
                  text: currentUserText,
                  timestamp: new Date(),
                }}
                isPartial
                lang={lang}
              />
            )}

            {currentAIText && (
              <TranscriptBubble
                entry={{
                  role: "ai",
                  text: currentAIText,
                  timestamp: new Date(),
                }}
                isPartial
                lang={lang}
              />
            )}

            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* Ended State */}
      {callState === "ended" && (
        <div className="flex w-full max-w-lg flex-1 flex-col gap-6 pt-4">
          <div className="text-center">
            <ParentBilingual
              lang={lang}
              primary={parentPrimary(lang, "callEnded")}
              english={parentEnglish("callEnded")}
              primaryClassName="block text-2xl font-bold"
            />
            <p className="text-muted-foreground">
              {parentPrimary(lang, "duration")}: {formatDuration(callDuration)}
              {lang !== "en" ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  ({parentEnglish("duration")}: {formatDuration(callDuration)})
                </span>
              ) : null}
            </p>
            {saving && (
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "savingRecording")}
                english={parentEnglish("savingRecording")}
                primaryClassName="mt-2 block animate-pulse text-sm text-primary"
                englishClassName="text-xs text-muted-foreground"
              />
            )}
          </div>

          {/* Full transcript */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-card-border bg-card p-4">
            <ParentBilingual
              lang={lang}
              primary={parentPrimary(lang, "fullTranscript")}
              english={parentEnglish("fullTranscript")}
              align="left"
              primaryClassName="block text-sm font-semibold text-muted-foreground"
              englishClassName="text-xs text-muted-foreground"
            />
            {transcript.length === 0 ? (
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "noTranscript")}
                english={parentEnglish("noTranscript")}
                align="left"
                primaryClassName="block text-sm text-muted-foreground"
                englishClassName="text-xs text-muted-foreground"
              />
            ) : (
              transcript.map((entry, i) => (
                <TranscriptBubble key={i} entry={entry} lang={lang} />
              ))
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setCallState("idle");
                setError(null);
              }}
              className="flex-1 rounded-xl bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-light"
            >
              <ParentBilingualOnColor
                lang={lang}
                primary={parentPrimary(lang, "startAnotherCall")}
                english={parentEnglish("startAnotherCall")}
                primaryClassName="block font-medium"
              />
            </button>
            <Link
              href="/parent/update"
              className="flex-1 rounded-xl border border-card-border bg-card px-6 py-3 text-center font-medium transition-colors hover:bg-background"
            >
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "backToHome")}
                english={parentEnglish("backToHome")}
                primaryClassName="block font-medium"
                englishClassName="text-xs text-muted-foreground"
              />
            </Link>
          </div>
        </div>
      )}
      {/* Debug Logs */}
      {debugLogs.length > 0 && (
        <div className="mt-4 w-full max-w-lg">
          <details className="rounded-lg border border-card-border bg-card">
            <summary className="cursor-pointer px-4 py-2 text-xs font-medium text-muted">
              Debug Logs ({debugLogs.length})
            </summary>
            <div className="max-h-40 overflow-y-auto px-4 pb-3">
              {debugLogs.map((log, i) => (
                <p key={i} className="font-mono text-[10px] text-muted">
                  {log}
                </p>
              ))}
            </div>
          </details>
        </div>
      )}
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

function TranscriptBubble({
  entry,
  isPartial = false,
  lang,
}: {
  entry: TranscriptEntry;
  isPartial?: boolean;
  lang: ParentLang;
}) {
  const isAI = entry.role === "ai";
  const rolePrimary = isAI
    ? parentPrimary(lang, "aiAssistant")
    : parentPrimary(lang, "you");
  const roleEnglish = isAI
    ? parentEnglish("aiAssistant")
    : parentEnglish("you");
  const partialPrimary = isPartial ? parentPrimary(lang, "speaking") : "";
  const partialEnglish = isPartial ? parentEnglish("speaking") : "";
  return (
    <div className={`flex ${isAI ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isAI
            ? "bg-primary/10 text-foreground"
            : "bg-foreground/10 text-foreground"
        } ${isPartial ? "opacity-60" : ""}`}
      >
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          <span className="block">{rolePrimary}{isPartial ? ` ${partialPrimary}` : ""}</span>
          {lang !== "en" ? (
            <span className="block text-[10px] opacity-80">
              ({roleEnglish}{isPartial ? ` ${partialEnglish}` : ""})
            </span>
          ) : null}
        </div>
        {entry.text}
      </div>
    </div>
  );
}
