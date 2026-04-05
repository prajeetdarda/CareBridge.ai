"use client";

/**
 * Leave an Update — parent/grandparent side (minimal UI).
 * Voice: tap to record → tap stop → sends immediately.
 * Camera: photo or video → stop/capture → sends immediately. Intelligence runs server-side.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

type Screen =
  | "home"
  | "voice-recording"
  | "camera-live"
  | "camera-recording"
  | "sending"
  | "error";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function UpdatePage() {
  const [screen, setScreen] = useState<Screen>("home");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionIdRef = useRef(crypto.randomUUID());

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopCamStream = useCallback(() => {
    camStreamRef.current?.getTracks().forEach((t) => t.stop());
    camStreamRef.current = null;
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    stopCamStream();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    setRecordSeconds(0);
    setErrorMsg("");
    sessionIdRef.current = crypto.randomUUID();
    setScreen("home");
  }, [stopCamStream]);

  useEffect(() => {
    return () => {
      clearTimer();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      stopCamStream();
    };
  }, [stopCamStream]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const submit = useCallback(
    async (blob: Blob, mimeType: string) => {
      setScreen("sending");
      const sessionId = sessionIdRef.current;
      const mediaType = mimeType.startsWith("video/")
        ? "video"
        : mimeType.startsWith("audio/")
          ? "audio"
          : "image";
      try {
        const base64 = await blobToBase64(blob);
        const saveRes = await fetch("/api/update/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, mediaBase64: base64, mimeType }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) throw new Error(saveData.error || "Save failed");

        await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            transcript: "",
            initiatedBy: "loved_one",
            mediaPath: saveData.mediaPath,
            mediaType,
          }),
        });

        reset();
      } catch (e) {
        setErrorMsg(
          e instanceof Error ? e.message : "Something went wrong. Please try again."
        );
        setScreen("error");
      }
    },
    [reset]
  );

  // ── VOICE ──────────────────────────────────────────────────────────────────

  const startVoice = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType });
      audioRecorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
        clearTimer();
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        void submit(blob, mimeType);
      };
      rec.start(250);
      setRecordSeconds(0);
      setScreen("voice-recording");
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      setErrorMsg(
        "Could not access microphone. Please allow microphone permission and try again."
      );
      setScreen("error");
    }
  }, [submit]);

  const stopVoice = useCallback(() => {
    clearTimer();
    audioRecorderRef.current?.stop();
  }, []);

  // ── CAMERA ─────────────────────────────────────────────────────────────────

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      camStreamRef.current = stream;
      setScreen("camera-live");
      setTimeout(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          void liveVideoRef.current.play();
        }
      }, 100);
    } catch {
      setErrorMsg(
        "Could not access camera. Please allow camera permission and try again."
      );
      setScreen("error");
    }
  }, []);

  const takePhoto = useCallback(() => {
    const video = liveVideoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopCamStream();
        void submit(blob, "image/jpeg");
      },
      "image/jpeg",
      0.92
    );
  }, [stopCamStream, submit]);

  const startVideoRecord = useCallback(() => {
    const stream = camStreamRef.current;
    if (!stream) return;
    videoChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";
    const rec = new MediaRecorder(stream, { mimeType });
    videoRecorderRef.current = rec;
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) videoChunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      stopCamStream();
      clearTimer();
      const baseMime = mimeType.split(";")[0];
      const blob = new Blob(videoChunksRef.current, { type: baseMime });
      void submit(blob, baseMime);
    };
    rec.start(250);
    setRecordSeconds(0);
    setScreen("camera-recording");
    timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
  }, [stopCamStream, submit]);

  const stopVideoRecord = useCallback(() => {
    clearTimer();
    videoRecorderRef.current?.stop();
  }, []);

  // ── RENDER ─────────────────────────────────────────────────────────────────

  if (screen === "home")
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
        <Link
          href="/"
          className="self-start text-sm text-muted hover:text-foreground"
        >
          &larr; Back to role select
        </Link>
        <h1 className="text-4xl font-bold text-center">Leave a Message</h1>
        <div className="flex w-full max-w-sm flex-col gap-5 mt-4">
          <button
            type="button"
            onClick={startVoice}
            className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-primary py-12 text-white shadow-xl transition-transform active:scale-95"
          >
            <span className="text-7xl">🎤</span>
            <span className="text-3xl font-bold tracking-wide">VOICE</span>
          </button>
          <button
            type="button"
            onClick={openCamera}
            className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-accent py-12 text-white shadow-xl transition-transform active:scale-95"
          >
            <span className="text-7xl">📷</span>
            <span className="text-3xl font-bold tracking-wide">CAMERA</span>
          </button>
        </div>
      </main>
    );

  if (screen === "voice-recording")
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
        <p className="text-2xl font-semibold text-muted">Recording…</p>
        <p className="text-sm text-muted text-center max-w-xs">
          Tap stop when finished — your message sends right away.
        </p>
        <button
          type="button"
          onClick={stopVoice}
          className="relative flex h-52 w-52 items-center justify-center rounded-full bg-danger shadow-2xl transition-transform active:scale-95"
        >
          <span className="absolute inset-0 rounded-full bg-danger animate-ping opacity-30" />
          <span className="text-8xl">🎤</span>
        </button>
        <p className="text-5xl font-mono font-bold">{formatTime(recordSeconds)}</p>
        <button
          type="button"
          onClick={stopVoice}
          className="rounded-full border-4 border-danger px-12 py-4 text-2xl font-bold text-danger transition-transform active:scale-95"
        >
          Stop &amp; send
        </button>
      </main>
    );

  if (screen === "camera-live" || screen === "camera-recording") {
    const isRecording = screen === "camera-recording";
    return (
      <main className="flex flex-1 flex-col items-center gap-4 px-6 py-4 pb-8">
        {/* Capped preview so Photo / Video stay on screen without scrolling */}
        <div className="relative h-[min(42vh,360px)] w-full max-w-md shrink-0 overflow-hidden rounded-2xl bg-black shadow-lg">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={liveVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />

          {isRecording && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="flex items-center gap-3 rounded-full bg-black/50 px-6 py-3">
                <span className="h-4 w-4 animate-pulse rounded-full bg-danger" />
                <span className="font-mono text-2xl font-bold text-white sm:text-3xl">
                  {formatTime(recordSeconds)}
                </span>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex w-full max-w-sm shrink-0 gap-4">
          {!isRecording ? (
            <>
              <button
                type="button"
                onClick={takePhoto}
                className="flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl bg-accent py-6 text-white shadow-xl transition-transform active:scale-95"
              >
                <span className="text-5xl">📸</span>
                <span className="text-xl font-bold">Photo</span>
              </button>
              <button
                type="button"
                onClick={startVideoRecord}
                className="flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl bg-danger py-6 text-white shadow-xl transition-transform active:scale-95"
              >
                <span className="text-5xl">🎬</span>
                <span className="text-xl font-bold">Video</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={stopVideoRecord}
              className="flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl bg-danger py-6 text-white shadow-xl transition-transform active:scale-95"
            >
              <span className="text-5xl">⏹️</span>
              <span className="text-xl font-bold">Stop &amp; send</span>
            </button>
          )}
        </div>

        {!isRecording && (
          <button
            type="button"
            onClick={() => {
              stopCamStream();
              setScreen("home");
            }}
            className="shrink-0 text-lg text-muted hover:text-foreground"
          >
            Cancel
          </button>
        )}
      </main>
    );
  }

  if (screen === "sending")
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
        <div className="h-24 w-24 animate-spin rounded-full border-8 border-primary border-t-transparent" />
        <p className="text-xl font-semibold text-muted">Sending…</p>
      </main>
    );

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <span className="text-8xl">⚠️</span>
      <p className="text-2xl font-bold text-center text-danger">
        Something went wrong
      </p>
      <p className="text-lg text-muted text-center max-w-xs">{errorMsg}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-3xl bg-primary py-6 px-12 text-2xl font-bold text-white shadow-xl transition-transform active:scale-95"
      >
        Try again
      </button>
    </main>
  );
}
