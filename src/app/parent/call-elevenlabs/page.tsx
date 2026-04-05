"use client";

/**
 * Option 3 — ElevenLabs Conversational AI (fully managed)
 *
 * ElevenLabs handles everything end-to-end:
 *   STT (their speech recognition) → their LLM → their TTS voice
 *
 * Setup required:
 *   1. Create an ElevenLabs account at https://elevenlabs.io
 *   2. Go to https://elevenlabs.io/app/conversational-ai
 *   3. Create an agent — configure the system prompt to be the care assistant
 *   4. Copy the Agent ID and add ELEVENLABS_AGENT_ID + ELEVENLABS_API_KEY to .env.local
 *
 * Architecture:
 *   Browser → GET /api/elevenlabs/signed-url → ElevenLabs SDK → WebRTC agent session
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { Conversation } from "@elevenlabs/client";
import Link from "next/link";
import { parentEnglish, parentPrimary, type ParentLang } from "@/lib/parent-i18n";
import { ParentBilingual, ParentBilingualOnColor } from "@/components/parent/ParentBilingual";
import { useParentPreferredLanguage } from "@/components/parent/useParentPreferredLanguage";

const autostartedElevenLabsSessions = new Set<string>();

type CallState = "idle" | "connecting" | "active" | "ended";
type AgentMode = "speaking" | "listening";
type SaveState = "idle" | "saving" | "saved" | "error";

interface Message {
  role: "user" | "agent";
  text: string;
  timestamp: Date;
}

function ElevenLabsCallInner() {
  const { lang } = useParentPreferredLanguage();
  const searchParams = useSearchParams();
  const handoffSessionId = searchParams.get("session")?.trim() ?? "";

  const [callState, setCallState] = useState<CallState>("idle");
  const [agentMode, setAgentMode] = useState<AgentMode>("listening");
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversationRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  // Use refs so onDisconnect closure always sees latest values
  const messagesRef = useRef<Message[]>([]);
  const durationRef = useRef(0);
  const sessionIdRef = useRef("");

  const addLog = useCallback((msg: string) => {
    console.log("[elevenlabs]", msg);
    setDebugLogs((prev) => [...prev.slice(-20), `${new Date().toLocaleTimeString()} ${msg}`]);
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      conversationRef.current?.endSession().catch(() => {});
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const saveTranscript = useCallback(async (msgs: Message[], durationSecs: number) => {
    if (msgs.length === 0) return;
    setSaveState("saving");
    const transcript = msgs
      .map((m) => `${m.role === "agent" ? "Agent" : "Grandparent"}: ${m.text}`)
      .join("\n");
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          transcript,
          initiatedBy: "ai_agent",
          callDurationSeconds: durationSecs,
          language: "en",
        }),
      });
      if (res.ok) {
        setSaveState("saved");
        addLog("Summary saved to family dashboard");
      } else {
        setSaveState("error");
        addLog("Failed to save summary");
      }
    } catch {
      setSaveState("error");
      addLog("Error saving summary");
    }
  }, [addLog]);

  const startCall = useCallback(async () => {
    setCallState("connecting");
    setError(null);
    setMessages([]);
    messagesRef.current = [];
    setCallDuration(0);
    durationRef.current = 0;
    setSaveState("idle");
    setDebugLogs([]);

    const sessionId = handoffSessionId || crypto.randomUUID();
    sessionIdRef.current = sessionId;

    try {
      if (handoffSessionId) {
        addLog("Verifying check-in session…");
        const ctxRes = await fetch(
          `/api/call/context?sessionId=${encodeURIComponent(handoffSessionId)}`
        );
        const ctxData = (await ctxRes.json()) as {
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
          throw new Error(ctxData.error || "Invalid or expired check-in link");
        }
        addLog("Check-in session OK");
      }

      addLog("Requesting microphone access...");
      await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog("Mic granted");

      addLog("Fetching signed URL...");
      const res = await fetch("/api/elevenlabs/signed-url");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get signed URL");
      }

      addLog("Got signed URL — connecting to ElevenLabs agent...");

      const conversation = await Conversation.startSession({
        signedUrl: data.signedUrl,

        onConnect: () => {
          addLog("Connected to ElevenLabs agent");
          setCallState("active");
          timerRef.current = setInterval(() => {
            durationRef.current += 1;
            setCallDuration((d) => d + 1);
          }, 1000);
        },

        onDisconnect: () => {
          addLog("Disconnected from agent");
          setCallState("ended");
          if (timerRef.current) clearInterval(timerRef.current);
          // Save transcript after session ends
          saveTranscript(messagesRef.current, durationRef.current);
        },

        onMessage: ({ message, source }: { message: string; source: "user" | "ai" }) => {
          const role = source === "ai" ? "agent" : "user";
          addLog(`${role}: "${message.slice(0, 50)}"`);
          const newMsg: Message = { role, text: message, timestamp: new Date() };
          messagesRef.current = [...messagesRef.current, newMsg];
          setMessages((prev) => [...prev, newMsg]);
        },

        onModeChange: ({ mode }: { mode: AgentMode }) => {
          addLog(`Mode: ${mode}`);
          setAgentMode(mode);
        },

        onError: (errorMsg: string | Error) => {
          const msg = typeof errorMsg === "string" ? errorMsg : errorMsg.message;
          addLog(`Error: ${msg}`);
          setError(msg);
        },
      });

      conversationRef.current = conversation;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connection failed";
      addLog(`FAILED: ${msg}`);
      setError(msg);
      setCallState("idle");
    }
  }, [addLog, handoffSessionId, saveTranscript]);

  useEffect(() => {
    if (!handoffSessionId) return;
    if (autostartedElevenLabsSessions.has(handoffSessionId)) return;
    autostartedElevenLabsSessions.add(handoffSessionId);
    void startCall();
  }, [handoffSessionId, startCall]);

  const endCall = useCallback(async () => {
    addLog("Ending call...");
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await conversationRef.current?.endSession();
    } catch {
      // ignore
    }
    conversationRef.current = null;
    setCallState("ended");
  }, [addLog]);

  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-lg">
        <Link href="/parent/update" className="text-sm text-muted hover:text-foreground">
          <ParentBilingual
            lang={lang}
            primary={`← ${parentPrimary(lang, "back")}`}
            english={`← ${parentEnglish("back")}`}
            align="left"
            primaryClassName="block"
            englishClassName="text-xs opacity-80"
          />
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
            Option 3
          </span>
          <ParentBilingual
            lang={lang}
            primary={parentPrimary(lang, "elevenLabsProduct")}
            english="ElevenLabs Conversational AI"
            primaryClassName="block text-lg font-bold"
            englishClassName="text-xs text-muted-foreground"
          />
        </div>
      </div>

      {/* Idle */}
      {callState === "idle" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-success/10">
            <span className="text-6xl">🤖</span>
          </div>
          {handoffSessionId ? (
            <div className="text-center">
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "elevenLabsCheckIn")}
                english={parentEnglish("elevenLabsCheckIn")}
                primaryClassName="block text-xl font-bold"
              />
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "checkInStartingAuto")}
                english={parentEnglish("checkInStartingAuto")}
                primaryClassName="mt-1 block max-w-sm text-center text-sm text-muted-foreground"
                englishClassName="text-xs text-muted-foreground"
              />
            </div>
          ) : (
            <>
              <div className="text-center">
                <ParentBilingual
                  lang={lang}
                  primary={parentPrimary(lang, "elevenLabsDemo")}
                  english={parentEnglish("elevenLabsDemo")}
                  primaryClassName="block text-2xl font-bold"
                />
                <ParentBilingual
                  lang={lang}
                  primary={parentPrimary(lang, "elevenLabsDemoDesc")}
                  english={parentEnglish("elevenLabsDemoDesc")}
                  primaryClassName="mt-1 block max-w-sm text-center text-muted-foreground"
                  englishClassName="text-xs text-muted-foreground"
                />
              </div>
              <div className="w-full max-w-sm rounded-xl border border-card-border bg-card p-4 text-sm">
                <ParentBilingual
                  lang={lang}
                  primary={parentPrimary(lang, "setupRequired")}
                  english={parentEnglish("setupRequired")}
                  align="left"
                  primaryClassName="mb-3 block font-semibold text-muted-foreground"
                  englishClassName="text-xs text-muted-foreground"
                />
                <ol className="space-y-1.5 text-muted list-decimal list-inside">
                  <li>
                    Create a free account at{" "}
                    <a
                      href="https://elevenlabs.io"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      elevenlabs.io
                    </a>
                  </li>
                  <li>
                    Go to{" "}
                    <a
                      href="https://elevenlabs.io/app/conversational-ai"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      Conversational AI
                    </a>{" "}
                    → Create Agent
                  </li>
                  <li>Paste the care assistant system prompt into the agent</li>
                  <li>
                    Copy Agent ID + API key → add to{" "}
                    <code className="text-xs">.env.local</code>
                  </li>
                </ol>
              </div>
            </>
          )}

          {error && (
            <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger max-w-sm">
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

      {/* Connecting */}
      {callState === "connecting" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="flex h-28 w-28 animate-pulse items-center justify-center rounded-full bg-success/20">
            <span className="text-6xl">🔗</span>
          </div>
          <ParentBilingual
            lang={lang}
            primary={parentPrimary(lang, "connectingElevenLabs")}
            english={parentEnglish("connectingElevenLabs")}
            primaryClassName="block text-xl font-semibold"
          />
          <ParentBilingual
            lang={lang}
            primary={parentPrimary(lang, "establishingWebRtc")}
            english={parentEnglish("establishingWebRtc")}
            primaryClassName="block text-sm text-muted-foreground"
            englishClassName="text-xs text-muted-foreground"
          />
        </div>
      )}

      {/* Active */}
      {callState === "active" && (
        <div className="flex w-full max-w-lg flex-1 flex-col gap-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
                <span className="text-2xl">
                  {agentMode === "speaking" ? "🔊" : "🎤"}
                </span>
                <span
                  className={`absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-pulse rounded-full ${
                    agentMode === "speaking" ? "bg-success" : "bg-danger"
                  }`}
                />
              </div>
              <div>
                <ParentBilingual
                  lang={lang}
                  primary={
                    agentMode === "speaking"
                      ? parentPrimary(lang, "agentSpeaking")
                      : parentPrimary(lang, "listeningToYou")
                  }
                  english={
                    agentMode === "speaking"
                      ? parentEnglish("agentSpeaking")
                      : parentEnglish("listeningToYou")
                  }
                  align="left"
                  primaryClassName="block font-semibold"
                  englishClassName="text-xs text-muted-foreground"
                />
                <p className="text-sm text-muted">{formatDuration(callDuration)}</p>
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
            <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
          )}

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-card-border bg-card p-4">
            {messages.length === 0 && (
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "agentGreetSoon")}
                english={parentEnglish("agentGreetSoon")}
                primaryClassName="block text-center text-sm text-muted-foreground"
                englishClassName="text-xs text-muted-foreground"
              />
            )}
            {messages.map((msg, i) => (
              <ELBubble key={i} msg={msg} lang={lang} />
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}

      {/* Ended */}
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
            {saveState === "saving" && (
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "savingSummary")}
                english={parentEnglish("savingSummary")}
                primaryClassName="mt-2 block animate-pulse text-sm text-muted-foreground"
                englishClassName="text-xs text-muted-foreground"
              />
            )}
            {saveState === "saved" && (
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "summarySaved")}
                english={parentEnglish("summarySaved")}
                primaryClassName="mt-2 block text-sm font-medium text-success"
                englishClassName="text-xs text-muted-foreground"
              />
            )}
            {saveState === "error" && (
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "summarySaveFailed")}
                english={parentEnglish("summarySaveFailed")}
                primaryClassName="mt-2 block text-sm text-danger"
                englishClassName="text-xs text-muted-foreground"
              />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-xl border border-card-border bg-card p-4">
            <ParentBilingual
              lang={lang}
              primary={parentPrimary(lang, "transcript")}
              english={parentEnglish("transcript")}
              align="left"
              primaryClassName="block text-sm font-semibold text-muted-foreground"
              englishClassName="text-xs text-muted-foreground"
            />
            {messages.length === 0 ? (
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "noTranscript")}
                english={parentEnglish("noTranscript")}
                align="left"
                primaryClassName="block text-sm text-muted-foreground"
                englishClassName="text-xs text-muted-foreground"
              />
            ) : (
              messages.map((msg, i) => <ELBubble key={i} msg={msg} lang={lang} />)
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setCallState("idle");
                setError(null);
                setMessages([]);
                setSaveState("idle");
              }}
              className="flex-1 rounded-xl bg-success px-6 py-3 font-medium text-white transition-colors hover:bg-success/90"
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

      {/* Debug logs */}
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

function ElevenLabsLoadingFallback() {
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

export default function ElevenLabsCallPage() {
  return (
    <Suspense fallback={<ElevenLabsLoadingFallback />}>
      <ElevenLabsCallInner />
    </Suspense>
  );
}

function ELBubble({ msg, lang }: { msg: Message; lang: ParentLang }) {
  const isAgent = msg.role === "agent";
  const rolePrimary = isAgent
    ? parentPrimary(lang, "aiAssistant")
    : parentPrimary(lang, "you");
  const roleEnglish = isAgent
    ? `${parentEnglish("aiAssistant")} (ElevenLabs)`
    : parentEnglish("you");
  return (
    <div className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isAgent ? "bg-success/10 text-foreground" : "bg-foreground/10 text-foreground"
        }`}
      >
        <div className="mb-1 text-xs font-medium text-muted-foreground">
          <span className="block">{rolePrimary}</span>
          {lang !== "en" ? (
            <span className="block text-[10px] opacity-80">({roleEnglish})</span>
          ) : null}
        </div>
        {msg.text}
      </div>
    </div>
  );
}
