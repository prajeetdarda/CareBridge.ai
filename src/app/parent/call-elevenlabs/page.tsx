"use client";

/**
 * Option 3 — ElevenLabs Conversational AI (fully managed)
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
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Conversation } from "@elevenlabs/client";
import { PhoneCall, PhoneOff, UserRound } from "lucide-react";
import { parentEnglish, parentPrimary } from "@/lib/parent-i18n";
import { ParentBilingual, ParentBilingualOnColor } from "@/components/parent/ParentBilingual";
import { useParentPreferredLanguage } from "@/components/parent/useParentPreferredLanguage";
import type { FamilyProfile } from "@/lib/types";

type CallState = "idle" | "connecting" | "active" | "ended";
type AgentMode = "speaking" | "listening";

interface Message {
  role: "user" | "agent";
  text: string;
  timestamp: Date;
}

function ElevenLabsCallInner() {
  const { lang, familyMemberName } = useParentPreferredLanguage();
  const searchParams = useSearchParams();
  const handoffSessionId = searchParams.get("session")?.trim() ?? "";
  const childName = familyMemberName || parentPrimary(lang, "yourFamily");

  const [callState, setCallState] = useState<CallState>("idle");
  const [, setAgentMode] = useState<AgentMode>("listening");
  const [error, setError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [saving, setSaving] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conversationRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const durationRef = useRef(0);
  const sessionIdRef = useRef("");

  const addLog = useCallback((msg: string) => {
    console.log("[elevenlabs]", msg);
  }, []);

  useEffect(() => {
    return () => {
      conversationRef.current?.endSession().catch(() => {});
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const saveTranscript = useCallback(async (msgs: Message[], durationSecs: number) => {
    if (msgs.length === 0) {
      setSaving(false);
      return;
    }
    setSaving(true);
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
        addLog("Summary saved to family dashboard");
      } else {
        addLog("Failed to save summary");
      }
    } catch {
      addLog("Error saving summary");
    } finally {
      setSaving(false);
    }
  }, [addLog]);

  const startCall = useCallback(async () => {
    setCallState("connecting");
    setError(null);
    messagesRef.current = [];
    setCallDuration(0);
    durationRef.current = 0;

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

      addLog("Loading family profile…");
      let profile: FamilyProfile | null = null;
      try {
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          profile = settingsData.profile ?? null;
        }
      } catch {
        addLog("Could not load profile — using defaults");
      }

      const lovedOne = profile?.lovedOneName?.trim() || "";
      const family = profile?.familyMemberName?.trim() || "";
      const prefLang = profile?.preferredLanguage?.trim() || "en";
      const topics = profile?.careTopics?.length
        ? profile.careTopics.join(", ")
        : "general wellbeing, medications, meals, activity, and mood";

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

      const callbacks = {
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
          saveTranscript(messagesRef.current, durationRef.current);
        },

        onMessage: ({ message, source }: { message: string; source: "user" | "ai" }) => {
          const role = source === "ai" ? "agent" : "user";
          addLog(`${role}: "${message.slice(0, 50)}"`);
          const newMsg: Message = { role, text: message, timestamp: new Date() };
          messagesRef.current = [...messagesRef.current, newMsg];
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
      };

      const conversation = await Conversation.startSession({
        signedUrl: data.signedUrl,
        dynamicVariables: {
          parent_name: lovedOne || "there",
          child_name: family || "your family",
          language: prefLang,
          topics,
        },
        ...callbacks,
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
    <main className="min-h-screen bg-[#f8f4f1] text-zinc-900">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-8 sm:py-10">
        <div className="w-full rounded-3xl border border-rose-100/80 bg-white p-6 shadow-[0_10px_30px_rgba(225,29,72,0.08)] sm:p-8">
          <div className="mb-6 flex flex-col items-center gap-3">
            <div
              className="h-40 w-40 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#fb923c] to-[#ec4899] p-1 shadow-[0_12px_40px_rgba(225,29,72,0.2)] sm:h-48 sm:w-48"
              role="img"
              aria-label={childName}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/child-profile.png" alt={childName} className="h-full w-full rounded-full object-cover" />
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
