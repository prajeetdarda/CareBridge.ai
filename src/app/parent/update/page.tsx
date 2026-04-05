"use client";

/**
 * Leave an Update — parent/grandparent side.
 *
 * Two giant buttons: Voice | Camera
 *   Voice  → big pulsing mic → stop → audio preview → Send
 *   Camera → live camera view → "Take Photo" or "Record Video" → preview → Send
 */

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

type Screen =
  | "home"
  | "voice-recording"
  | "voice-preview"
  | "camera-live"           // live camera viewfinder
  | "camera-recording"      // actively recording video
  | "camera-preview"        // photo/video preview
  | "sending"
  | "sent"
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
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedMime, setCapturedMime] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const stopCamStream = useCallback(() => {
    camStreamRef.current?.getTracks().forEach((t) => t.stop());
    camStreamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      stopCamStream();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl, stopCamStream]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ── VOICE ──────────────────────────────────────────────────────────────────

  const startVoice = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      audioChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const rec = new MediaRecorder(stream, { mimeType });
      audioRecorderRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setScreen("voice-preview");
      };
      rec.start(250);
      setRecordSeconds(0);
      setScreen("voice-recording");
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      setErrorMsg("Could not access microphone. Please allow microphone permission and try again.");
      setScreen("error");
    }
  }, []);

  const stopVoice = useCallback(() => {
    clearTimer();
    audioRecorderRef.current?.stop();
  }, []);

  // ── CAMERA ─────────────────────────────────────────────────────────────────

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: true });
      camStreamRef.current = stream;
      setScreen("camera-live");
      // Attach stream to video element after render
      setTimeout(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          liveVideoRef.current.play();
        }
      }, 100);
    } catch {
      setErrorMsg("Could not access camera. Please allow camera permission and try again.");
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
    canvas.toBlob((blob) => {
      if (!blob) return;
      stopCamStream();
      setCapturedBlob(blob);
      setCapturedMime("image/jpeg");
      setPreviewUrl(URL.createObjectURL(blob));
      setScreen("camera-preview");
    }, "image/jpeg", 0.92);
  }, [stopCamStream]);

  const startVideoRecord = useCallback(() => {
    const stream = camStreamRef.current;
    if (!stream) return;
    videoChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "video/mp4";
    const rec = new MediaRecorder(stream, { mimeType });
    videoRecorderRef.current = rec;
    rec.ondataavailable = (e) => { if (e.data.size > 0) videoChunksRef.current.push(e.data); };
    rec.onstop = () => {
      stopCamStream();
      const baseMime = mimeType.split(";")[0];
      const blob = new Blob(videoChunksRef.current, { type: baseMime });
      setCapturedBlob(blob);
      setCapturedMime(baseMime);
      setPreviewUrl(URL.createObjectURL(blob));
      setScreen("camera-preview");
    };
    rec.start(250);
    setRecordSeconds(0);
    setScreen("camera-recording");
    timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
  }, [stopCamStream]);

  const stopVideoRecord = useCallback(() => {
    clearTimer();
    videoRecorderRef.current?.stop();
  }, []);

  // ── SUBMIT ─────────────────────────────────────────────────────────────────

  const submit = useCallback(async (blob: Blob, mimeType: string) => {
    setScreen("sending");
    const sessionId = sessionIdRef.current;
    const mediaType = mimeType.startsWith("video/") ? "video" : mimeType.startsWith("audio/") ? "audio" : "image";
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

      setScreen("sent");
      sessionIdRef.current = crypto.randomUUID();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setScreen("error");
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    stopCamStream();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setAudioBlob(null);
    setCapturedBlob(null);
    setCapturedMime("");
    setRecordSeconds(0);
    setErrorMsg("");
    sessionIdRef.current = crypto.randomUUID();
    setScreen("home");
  }, [previewUrl, stopCamStream]);

  // ── RENDER ─────────────────────────────────────────────────────────────────

  if (screen === "home") return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
      <Link href="/" className="self-start text-sm text-muted hover:text-foreground">
        &larr; Back to role select
      </Link>
      <h1 className="text-4xl font-bold text-center">Leave a Message</h1>
      <div className="flex w-full max-w-sm flex-col gap-5 mt-4">
        <button onClick={startVoice}
          className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-primary py-12 text-white shadow-xl active:scale-95 transition-transform">
          <span className="text-7xl">🎤</span>
          <span className="text-3xl font-bold tracking-wide">VOICE</span>
        </button>
        <button onClick={openCamera}
          className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-accent py-12 text-white shadow-xl active:scale-95 transition-transform">
          <span className="text-7xl">📷</span>
          <span className="text-3xl font-bold tracking-wide">CAMERA</span>
        </button>
      </div>
    </main>
  );

  if (screen === "voice-recording") return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <p className="text-2xl font-semibold text-muted">Recording...</p>
      <button onClick={stopVoice}
        className="relative flex h-52 w-52 items-center justify-center rounded-full bg-danger shadow-2xl active:scale-95 transition-transform">
        <span className="absolute inset-0 rounded-full bg-danger animate-ping opacity-30" />
        <span className="text-8xl">🎤</span>
      </button>
      <p className="text-5xl font-mono font-bold">{formatTime(recordSeconds)}</p>
      <button onClick={stopVoice}
        className="rounded-full border-4 border-danger px-12 py-4 text-2xl font-bold text-danger active:scale-95 transition-transform">
        Stop
      </button>
    </main>
  );

  if (screen === "voice-preview") return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <p className="text-2xl font-semibold">Listen back</p>
      {previewUrl && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio controls src={previewUrl} className="w-full max-w-sm rounded-xl" />
      )}
      <div className="flex w-full max-w-sm flex-col gap-4 mt-4">
        <button onClick={() => audioBlob && submit(audioBlob, audioBlob.type)}
          className="rounded-3xl bg-success py-8 text-3xl font-bold text-white shadow-xl active:scale-95 transition-transform">
          Send
        </button>
        <button onClick={reset}
          className="rounded-3xl border-4 border-muted py-6 text-2xl font-semibold text-muted active:scale-95 transition-transform">
          Record Again
        </button>
      </div>
    </main>
  );

  if (screen === "camera-live" || screen === "camera-recording") {
    const isRecording = screen === "camera-recording";
    return (
      <main className="flex flex-1 flex-col items-center justify-between pb-8">
        {/* Live camera — stays mounted in both states */}
        <div className="relative w-full flex-1 bg-black overflow-hidden">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={liveVideoRef} autoPlay playsInline muted
            className="h-full w-full object-cover" />

          {/* Recording overlay */}
          {isRecording && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
              {/* Red pulsing dot + timer */}
              <div className="flex items-center gap-3 rounded-full bg-black/50 px-6 py-3">
                <span className="h-4 w-4 animate-pulse rounded-full bg-danger" />
                <span className="font-mono text-3xl font-bold text-white">
                  {formatTime(recordSeconds)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Bottom controls */}
        <div className="flex w-full max-w-sm gap-4 px-6 pt-6">
          {!isRecording ? (
            <>
              <button onClick={takePhoto}
                className="flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl bg-accent py-6 text-white shadow-xl active:scale-95 transition-transform">
                <span className="text-5xl">📸</span>
                <span className="text-xl font-bold">Photo</span>
              </button>
              <button onClick={startVideoRecord}
                className="flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl bg-danger py-6 text-white shadow-xl active:scale-95 transition-transform">
                <span className="text-5xl">🎬</span>
                <span className="text-xl font-bold">Video</span>
              </button>
            </>
          ) : (
            <button onClick={stopVideoRecord}
              className="flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl bg-danger py-6 text-white shadow-xl active:scale-95 transition-transform">
              <span className="text-5xl">⏹️</span>
              <span className="text-xl font-bold">Stop</span>
            </button>
          )}
        </div>

        {!isRecording && (
          <button onClick={() => { stopCamStream(); setScreen("home"); }}
            className="mt-4 text-lg text-muted hover:text-foreground">
            Cancel
          </button>
        )}
      </main>
    );
  }

  if (screen === "camera-preview") return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <p className="text-2xl font-semibold">Your message</p>
      {previewUrl && capturedMime.startsWith("video/") && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={previewUrl} controls playsInline
          className="w-full max-w-sm rounded-2xl" />
      )}
      {previewUrl && !capturedMime.startsWith("video/") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Preview"
          className="w-full max-w-sm rounded-2xl object-cover" />
      )}
      <div className="flex w-full max-w-sm flex-col gap-4 mt-2">
        <button onClick={() => capturedBlob && submit(capturedBlob, capturedMime)}
          className="rounded-3xl bg-success py-8 text-3xl font-bold text-white shadow-xl active:scale-95 transition-transform">
          Send
        </button>
        <button onClick={reset}
          className="rounded-3xl border-4 border-muted py-6 text-2xl font-semibold text-muted active:scale-95 transition-transform">
          Try Again
        </button>
      </div>
    </main>
  );

  if (screen === "sending") return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      <div className="h-24 w-24 animate-spin rounded-full border-8 border-primary border-t-transparent" />
      <p className="text-3xl font-semibold">Sending...</p>
    </main>
  );

  if (screen === "sent") return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <div className="flex h-40 w-40 items-center justify-center rounded-full bg-success/20">
        <span className="text-8xl">✅</span>
      </div>
      <p className="text-4xl font-bold text-center">Message Sent!</p>
      <p className="text-xl text-muted text-center">Your family will see it soon.</p>
      <div className="flex w-full max-w-sm flex-col gap-4 mt-4">
        <button onClick={reset}
          className="rounded-3xl bg-primary py-8 text-2xl font-bold text-white shadow-xl active:scale-95 transition-transform">
          Send Another
        </button>
        <Link href="/"
          className="rounded-3xl border-4 border-muted py-6 text-center text-2xl font-semibold text-muted">
          Done
        </Link>
      </div>
    </main>
  );

  // error
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <span className="text-8xl">⚠️</span>
      <p className="text-2xl font-bold text-center text-danger">Something went wrong</p>
      <p className="text-lg text-muted text-center max-w-xs">{errorMsg}</p>
      <button onClick={reset}
        className="rounded-3xl bg-primary py-6 px-12 text-2xl font-bold text-white shadow-xl active:scale-95 transition-transform">
        Try Again
      </button>
    </main>
  );
}
