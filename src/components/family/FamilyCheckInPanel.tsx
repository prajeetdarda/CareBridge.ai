"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { CallVoiceProvider, StartCallResponse } from "@/lib/types";

export default function FamilyCheckInPanel() {
  const [callNotes, setCallNotes] = useState("");
  const [voiceProvider, setVoiceProvider] =
    useState<CallVoiceProvider>("gemini");
  const [scheduledLocal, setScheduledLocal] = useState("");
  const [loading, setLoading] = useState<"now" | "schedule" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StartCallResponse | null>(null);
  const [copied, setCopied] = useState<"call" | "incoming" | null>(null);
  /** True when check-in succeeded but the parent tab could not be opened (popup blocker). */
  const [parentTabBlocked, setParentTabBlocked] = useState(false);
  const [schedulePanelOpen, setSchedulePanelOpen] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const fullCallUrl = result ? `${origin}${result.parentCallUrl}` : "";
  const fullIncomingUrl = result ? `${origin}${result.parentIncomingUrl}` : "";

  const startNow = useCallback(async () => {
    setError(null);
    setResult(null);
    setParentTabBlocked(false);
    setLoading("now");

    let placeholder: Window | null = null;
    try {
      placeholder = window.open("about:blank", "_blank");
    } catch {
      placeholder = null;
    }

    try {
      const res = await fetch("/api/call/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "now",
          callNotes: callNotes.trim() || undefined,
          voiceProvider,
        }),
      });
      const data = (await res.json()) as StartCallResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);

      const incomingFull = `${window.location.origin}${data.parentIncomingUrl}`;
      if (placeholder && !placeholder.closed) {
        placeholder.location.href = incomingFull;
      } else {
        setParentTabBlocked(true);
      }
    } catch (e) {
      if (placeholder && !placeholder.closed) {
        placeholder.close();
      }
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }, [callNotes, voiceProvider]);

  const startSchedule = useCallback(async () => {
    setError(null);
    setResult(null);
    setParentTabBlocked(false);
    if (!scheduledLocal) {
      setError("Pick a date and time for the check-in.");
      return;
    }
    const iso = new Date(scheduledLocal).toISOString();
    setLoading("schedule");
    try {
      const res = await fetch("/api/call/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "schedule",
          scheduledFor: iso,
          callNotes: callNotes.trim() || undefined,
          voiceProvider,
        }),
      });
      const data = (await res.json()) as StartCallResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
      setSchedulePanelOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }, [callNotes, scheduledLocal, voiceProvider]);

  const copyLink = useCallback(
    async (which: "call" | "incoming") => {
      const text = which === "call" ? fullCallUrl : fullIncomingUrl;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        setCopied(which);
        setTimeout(() => setCopied(null), 2000);
      } catch {
        setError("Could not copy — copy the link manually.");
      }
    },
    [fullCallUrl, fullIncomingUrl]
  );

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Care settings</h2>
        <p className="mt-1 text-sm text-muted">
          The check-in assistant uses names, topics, and language from{" "}
          <Link href="/family/settings" className="font-medium text-primary underline">
            Care settings
          </Link>
          . Update those first so each call uses the right context.
        </p>
      </section>

      <section className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <label className="block text-sm font-medium text-foreground">
          Optional note for this check-in only
        </label>
        <textarea
          value={callNotes}
          onChange={(e) => setCallNotes(e.target.value)}
          rows={3}
          placeholder="e.g. Ask how physical therapy went today"
          className="mt-2 w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
        />
      </section>

      <section className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <p className="mb-4 text-center text-sm text-muted">
          Opens a second tab for the incoming call. That tab vibrates; if there&apos;s
          no beep (browser autoplay rules), use <strong className="text-foreground">Tap for ring sound</strong>, then{" "}
          <strong className="text-foreground">Answer</strong>.
        </p>
        <button
          type="button"
          disabled={loading !== null}
          onClick={startNow}
          className="w-full rounded-2xl bg-primary py-5 text-lg font-bold text-white shadow-md transition-colors hover:bg-primary-light disabled:opacity-50"
        >
          {loading === "now" ? "Creating…" : "Check-in right now"}
        </button>
        <div className="mt-4 flex items-center justify-center gap-3">
          <label className="sr-only" htmlFor="voice-provider-select">
            Voice provider
          </label>
          <select
            id="voice-provider-select"
            value={voiceProvider}
            disabled={loading !== null}
            onChange={(e) =>
              setVoiceProvider(e.target.value as CallVoiceProvider)
            }
            className="min-w-[10rem] rounded-xl border border-card-border bg-background px-3 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            <option value="gemini">Gemini Live</option>
            <option value="elevenlabs">ElevenLabs</option>
          </select>
          <button
            type="button"
            disabled={loading !== null}
            aria-label="Schedule check-in"
            aria-expanded={schedulePanelOpen}
            onClick={() => setSchedulePanelOpen((o) => !o)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-card-border bg-background text-foreground transition-colors hover:bg-muted/30 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-muted">
          ElevenLabs needs agent keys in{" "}
          <code className="rounded bg-muted/30 px-1">.env.local</code>.
        </p>
        {schedulePanelOpen && (
          <div className="mt-4 space-y-3 rounded-xl border border-dashed border-card-border bg-background/50 p-4">
            <label className="block text-xs font-medium text-muted">
              Date and time
            </label>
            <input
              type="datetime-local"
              value={scheduledLocal}
              onChange={(e) => setScheduledLocal(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={loading !== null}
              onClick={startSchedule}
              className="w-full rounded-xl border border-card-border bg-card py-3 text-sm font-semibold transition-colors hover:bg-muted/30 disabled:opacity-50"
            >
              {loading === "schedule" ? "Scheduling…" : "Create scheduled check-in"}
            </button>
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {result && (
        <section className="rounded-xl border border-success/30 bg-success/5 p-6 space-y-5">
          <h3 className="font-semibold text-success">Links ready</h3>
          {!result.scheduledFor && (
            <p className="text-sm text-muted">
              <strong>Other tab:</strong> <strong>Tap for ring sound</strong> if you
              want audio, then <strong>Answer</strong>.
            </p>
          )}
          {parentTabBlocked && !result.scheduledFor && (
            <div className="rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">New tab was blocked</p>
              <p className="mt-1 text-muted">
                Open the parent incoming screen manually:
              </p>
              <a
                href={result.parentIncomingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light"
              >
                Open parent incoming tab
              </a>
            </div>
          )}
          {result.scheduledFor && (
            <p className="text-sm text-muted">
              Scheduled for{" "}
              <strong>{new Date(result.scheduledFor).toLocaleString()}</strong>{" "}
              — open the waiting link in another tab after that time (or use copy
              below).
            </p>
          )}
          <p className="text-sm text-muted">
            Voice stack:{" "}
            <strong>
              {result.voiceProvider === "elevenlabs" ? "ElevenLabs" : "Gemini Live"}
            </strong>
          </p>

          <div>
            <p className="text-xs font-semibold uppercase text-muted">
              1. Parent — waiting screen (incoming ring)
            </p>
            <p className="mt-1 break-all font-mono text-xs text-muted">
              {fullIncomingUrl}
            </p>
            <button
              type="button"
              onClick={() => copyLink("incoming")}
              className="mt-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90"
            >
              {copied === "incoming" ? "Copied" : "Copy waiting link"}
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-muted">
              2. Direct call (optional — same session)
            </p>
            <p className="mt-1 break-all font-mono text-xs text-muted">
              {fullCallUrl}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyLink("call")}
                className="rounded-lg border border-card-border bg-card px-4 py-2 text-sm font-medium hover:bg-background"
              >
                {copied === "call" ? "Copied" : "Copy call link"}
              </button>
              <a
                href={result.parentCallUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-card-border bg-card px-4 py-2 text-sm font-medium hover:bg-background"
              >
                Open call (this device)
              </a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
