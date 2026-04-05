"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { CallVoiceProvider, StartCallResponse } from "@/lib/types";
import { useCareTheme } from "./CareThemeContext";

export default function FamilyCheckInPanel() {
  const { isDark, cursorGlowClass, handlePointerMove } = useCareTheme();
  const [callNotes, setCallNotes] = useState("");
  const [voiceProvider, setVoiceProvider] = useState<CallVoiceProvider>("gemini");
  const [scheduledLocal, setScheduledLocal] = useState("");
  const [loading, setLoading] = useState<"now" | "schedule" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StartCallResponse | null>(null);
  const [copied, setCopied] = useState<"call" | "incoming" | null>(null);
  const [parentTabBlocked, setParentTabBlocked] = useState(false);
  const [schedulePanelOpen, setSchedulePanelOpen] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const fullCallUrl = result ? `${origin}${result.parentCallUrl}` : "";
  const fullIncomingUrl = result ? `${origin}${result.parentIncomingUrl}` : "";

  const cardBase = isDark
    ? "border-zinc-800 bg-[rgba(24,24,30,0.7)]"
    : "border-zinc-200/60 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)]";
  const cardCls = `relative overflow-hidden rounded-[1.25rem] border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:p-6 ${cursorGlowClass} ${cardBase}`;
  const inputCls = isDark
    ? "w-full rounded-xl border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-[#e11d48]/30"
    : "w-full rounded-xl border border-zinc-200/60 bg-[#f8f4f1] px-3 py-2 text-sm text-[#1f2937] outline-none focus:ring-2 focus:ring-[#e11d48]/20";
  const headText = isDark ? "text-zinc-100" : "text-[#1f2937]";
  const mutedText = isDark ? "text-zinc-400" : "text-[#6b7280]";
  const surfaceBg = isDark ? "border-zinc-700 bg-zinc-800/60" : "border-zinc-100 bg-[#f8f4f1]";

  const startNow = useCallback(async () => {
    setError(null);
    setResult(null);
    setParentTabBlocked(false);
    setLoading("now");

    let placeholder: Window | null = null;
    try { placeholder = window.open("about:blank", "_blank"); } catch { placeholder = null; }

    try {
      const res = await fetch("/api/call/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "now", callNotes: callNotes.trim() || undefined, voiceProvider }),
      });
      const data = (await res.json()) as StartCallResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
      const incomingFull = `${window.location.origin}${data.parentIncomingUrl}`;
      if (placeholder && !placeholder.closed) { placeholder.location.href = incomingFull; } else { setParentTabBlocked(true); }
    } catch (e) {
      if (placeholder && !placeholder.closed) placeholder.close();
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally { setLoading(null); }
  }, [callNotes, voiceProvider]);

  const startSchedule = useCallback(async () => {
    setError(null); setResult(null); setParentTabBlocked(false);
    if (!scheduledLocal) { setError("Pick a date and time."); return; }
    setLoading("schedule");
    try {
      const res = await fetch("/api/call/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "schedule", scheduledFor: new Date(scheduledLocal).toISOString(), callNotes: callNotes.trim() || undefined, voiceProvider }),
      });
      const data = (await res.json()) as StartCallResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
      setSchedulePanelOpen(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong"); } finally { setLoading(null); }
  }, [callNotes, scheduledLocal, voiceProvider]);

  const copyLink = useCallback(async (which: "call" | "incoming") => {
    const text = which === "call" ? fullCallUrl : fullIncomingUrl;
    if (!text) return;
    try { await navigator.clipboard.writeText(text); setCopied(which); setTimeout(() => setCopied(null), 2000); } catch { setError("Could not copy."); }
  }, [fullCallUrl, fullIncomingUrl]);

  return (
    <div className="space-y-4">
      <section onPointerMove={handlePointerMove} className={cardCls}>
        <h2 className={`text-base font-semibold ${headText}`}>Care profile</h2>
        <p className={`mt-2 text-sm ${mutedText}`}>
          The assistant uses your{" "}
          <Link href="/family/settings" className="font-medium text-[#e11d48] underline hover:no-underline">profile</Link>
          {" "}for personalised check-ins.
        </p>
      </section>

      <section onPointerMove={handlePointerMove} className={cardCls}>
        <label className={`block text-sm font-medium ${headText}`}>Optional intention</label>
        <textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)} rows={3} placeholder="e.g. Ask about today's medication and mood" className={`mt-2 ${inputCls}`} />
      </section>

      <section onPointerMove={handlePointerMove} className={cardCls}>
        <button
          type="button"
          disabled={loading !== null}
          onClick={startNow}
          className="w-full rounded-full bg-[#e11d48] py-5 text-lg font-bold text-white shadow-[0_16px_50px_-12px_rgba(225,29,72,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-12px_rgba(225,29,72,0.45)] disabled:opacity-50"
        >
          {loading === "now" ? "Preparing call..." : "Start check-in now"}
        </button>
        <div className="mt-4 flex items-center justify-center gap-3">
          <select
            value={voiceProvider}
            disabled={loading !== null}
            onChange={(e) => setVoiceProvider(e.target.value as CallVoiceProvider)}
            className={`min-w-[10rem] rounded-xl border px-3 py-2.5 text-sm font-medium disabled:opacity-50 ${
              isDark ? "border-zinc-700 bg-zinc-900 text-zinc-200" : "border-zinc-200/60 bg-white text-[#1f2937] shadow-sm"
            }`}
          >
            <option value="gemini">Gemini Live</option>
            <option value="elevenlabs">ElevenLabs</option>
          </select>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => setSchedulePanelOpen((o) => !o)}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all disabled:opacity-50 ${
              isDark ? "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700" : "border-zinc-200/60 bg-white text-[#1f2937] shadow-sm hover:shadow-md"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
        </div>
        {schedulePanelOpen && (
          <div className={`mt-4 space-y-3 rounded-xl border border-dashed p-4 ${surfaceBg}`}>
            <label className={`block text-xs font-medium ${mutedText}`}>Date and time</label>
            <input type="datetime-local" value={scheduledLocal} onChange={(e) => setScheduledLocal(e.target.value)} className={inputCls} />
            <button
              type="button"
              disabled={loading !== null}
              onClick={startSchedule}
              className={`w-full rounded-full border py-3 text-sm font-semibold transition-all disabled:opacity-50 ${
                isDark ? "border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700" : "border-zinc-200/60 bg-white text-[#1f2937] shadow-sm hover:shadow-md"
              }`}
            >
              {loading === "schedule" ? "Scheduling..." : "Schedule check-in"}
            </button>
          </div>
        )}
      </section>

      {error && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? "border-red-800/40 bg-red-900/20 text-red-300" : "border-[#e11d48]/25 bg-[#ffe4e6] text-[#e11d48]"}`}>
          {error}
        </div>
      )}

      {result && (
        <section className={`space-y-5 rounded-[1.25rem] border p-5 sm:p-6 ${isDark ? "border-emerald-800/40 bg-emerald-900/20" : "border-emerald-200 bg-emerald-50"}`}>
          <h3 className={isDark ? "text-lg font-semibold text-emerald-300" : "text-lg font-semibold text-emerald-700"}>Links ready</h3>
          {parentTabBlocked && !result.scheduledFor && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? "border-red-800/40 bg-red-900/20" : "border-[#e11d48]/30 bg-[#ffe4e6]"}`}>
              <p className={`font-medium ${headText}`}>Tab blocked</p>
              <a href={result.parentIncomingUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block rounded-full bg-[#e11d48] px-4 py-2 text-sm font-semibold text-white">Open incoming tab</a>
            </div>
          )}
          {result.scheduledFor && <p className={`text-sm ${mutedText}`}>Scheduled: <strong>{new Date(result.scheduledFor).toLocaleString()}</strong></p>}
          <p className={`text-sm ${mutedText}`}>Voice: <strong>{result.voiceProvider === "elevenlabs" ? "ElevenLabs" : "Gemini Live"}</strong></p>
          <div>
            <p className={`text-xs font-semibold uppercase ${mutedText}`}>Parent incoming</p>
            <p className={`mt-1 break-all font-mono text-xs ${mutedText}`}>{fullIncomingUrl}</p>
            <button type="button" onClick={() => copyLink("incoming")} className={`mt-2 rounded-full px-4 py-2 text-sm font-semibold text-white ${isDark ? "bg-emerald-700 hover:bg-emerald-600" : "bg-emerald-600 hover:bg-emerald-700"}`}>
              {copied === "incoming" ? "Copied" : "Copy link"}
            </button>
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase ${mutedText}`}>Direct call</p>
            <p className={`mt-1 break-all font-mono text-xs ${mutedText}`}>{fullCallUrl}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => copyLink("call")} className={`rounded-full border px-4 py-2 text-sm font-semibold ${isDark ? "border-zinc-700 bg-zinc-800 text-zinc-200" : "border-zinc-200/60 bg-white text-[#1f2937] shadow-sm"}`}>
                {copied === "call" ? "Copied" : "Copy"}
              </button>
              <a href={result.parentCallUrl} target="_blank" rel="noreferrer" className={`rounded-full border px-4 py-2 text-sm font-semibold ${isDark ? "border-zinc-700 bg-zinc-800 text-zinc-200" : "border-zinc-200/60 bg-white text-[#1f2937] shadow-sm"}`}>
                Open call
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
