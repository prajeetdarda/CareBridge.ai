"use client";

/**
 * Leave an Update — parent/grandparent side (minimal UI).
 * Voice: tap to record → tap stop → sends immediately.
 * Camera: photo or video → stop/capture → sends immediately. Intelligence runs server-side.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  AlertTriangle,
  Camera,
  Mic,
  Square,
  UserRound,
  Video,
} from "lucide-react";
import { parentEnglish, parentPrimary } from "@/lib/parent-i18n";
import { ParentBilingual, ParentBilingualOnColor } from "@/components/parent/ParentBilingual";
import { useParentPreferredLanguage } from "@/components/parent/useParentPreferredLanguage";

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
  const { lang, familyMemberName } = useParentPreferredLanguage();
  const caregiverName = familyMemberName.trim();
  const [screen, setScreen] = useState<Screen>("home");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [errorEnglishHint, setErrorEnglishHint] = useState("");

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
    setErrorEnglishHint("");
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

  const pageShell = "mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-6 sm:py-8";
  const cardSurface =
    "rounded-3xl border border-rose-100/80 bg-white p-5 shadow-[0_10px_30px_rgba(225,29,72,0.08)]";

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
        if (!saveRes.ok) {
          throw new Error(saveData.error || "Save failed");
        }

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
        setErrorMsg(parentPrimary(lang, "genericTryAgain"));
        setErrorEnglishHint(
          e instanceof Error ? e.message : parentEnglish("genericTryAgain")
        );
        setScreen("error");
      }
    },
    [reset, lang]
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
      setErrorMsg(parentPrimary(lang, "micPermissionError"));
      setErrorEnglishHint(parentEnglish("micPermissionError"));
      setScreen("error");
    }
  }, [submit, lang]);

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
      setErrorMsg(parentPrimary(lang, "cameraPermissionError"));
      setErrorEnglishHint(parentEnglish("cameraPermissionError"));
      setScreen("error");
    }
  }, [lang]);

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
      <main className="min-h-screen bg-[#f8f4f1] text-zinc-900">
        <div className={pageShell}>
        <div className={`${cardSurface} flex flex-col gap-5`}>
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fb923c] to-[#ec4899] shadow-[0_12px_40px_rgba(225,29,72,0.2)] sm:h-48 sm:w-48"
              role="img"
              aria-label={
                caregiverName || parentPrimary(lang, "ariaFamilyProfile")
              }
            >
              <UserRound className="h-24 w-24 text-white sm:h-28 sm:w-28" strokeWidth={1.25} />
            </div>
            {caregiverName ? (
              <p className="text-center text-lg font-semibold text-zinc-800 sm:text-xl">
                {caregiverName}
              </p>
            ) : (
              <ParentBilingual
                lang={lang}
                primary={parentPrimary(lang, "yourFamily")}
                english={parentEnglish("yourFamily")}
                primaryClassName="block text-lg font-semibold text-zinc-800 sm:text-xl"
              />
            )}
          </div>
          <ParentBilingual
            lang={lang}
            primary={parentPrimary(lang, "shareUpdate")}
            english={parentEnglish("shareUpdate")}
            primaryClassName="block text-xl font-semibold tracking-tight text-zinc-800 sm:text-2xl"
          />
          <ParentBilingual
            lang={lang}
            primary={parentPrimary(lang, "chooseOption")}
            english={parentEnglish("chooseOption")}
            primaryClassName="block text-base text-zinc-700"
            englishClassName="text-sm text-zinc-500"
          />
          <button
            type="button"
            onClick={startVoice}
            className="grid min-h-32 w-full grid-cols-4 items-center gap-0 rounded-3xl bg-[#e11d48] py-4 pl-2 pr-5 text-white sm:min-h-36 sm:py-5"
          >
            <span className="col-span-1 flex items-center justify-center" aria-hidden>
              <Mic className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" strokeWidth={1.75} />
            </span>
            <span className="col-span-3 flex items-center justify-center px-1 text-center">
              <ParentBilingualOnColor
                lang={lang}
                primary={parentPrimary(lang, "voiceMessage")}
                english={parentEnglish("voiceMessage")}
                primaryClassName="block text-2xl font-semibold leading-tight sm:text-[1.65rem]"
              />
            </span>
          </button>
          <button
            type="button"
            onClick={openCamera}
            className="grid min-h-32 w-full grid-cols-4 items-center gap-0 rounded-3xl bg-[#a78bfa] py-4 pl-2 pr-5 text-white sm:min-h-36 sm:py-5"
          >
            <span className="col-span-1 flex items-center justify-center" aria-hidden>
              <Camera className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" strokeWidth={1.75} />
            </span>
            <span className="col-span-3 flex items-center justify-center px-1 text-center">
              <ParentBilingualOnColor
                lang={lang}
                primary={parentPrimary(lang, "photoOrVideo")}
                english={parentEnglish("photoOrVideo")}
                primaryClassName="block text-2xl font-semibold leading-tight sm:text-[1.65rem]"
              />
            </span>
          </button>
        </div>
        </div>
      </main>
    );

  if (screen === "voice-recording")
    return (
      <main className="min-h-screen bg-[#f8f4f1] text-zinc-900">
        <div className={`${pageShell} items-center justify-center`}>
          <div className={`${cardSurface} flex w-full flex-col items-center gap-6`}>
        <ParentBilingual
          lang={lang}
          primary={parentPrimary(lang, "recording")}
          english={parentEnglish("recording")}
          primaryClassName="block text-2xl font-semibold text-zinc-700"
        />
        <button
          type="button"
          onClick={stopVoice}
          className="flex h-48 w-48 items-center justify-center rounded-full bg-[#e11d48] text-white shadow-[0_14px_35px_rgba(225,29,72,0.3)]"
        >
          <Mic className="h-20 w-20" />
        </button>
        <p className="text-5xl font-mono font-bold text-zinc-800">{formatTime(recordSeconds)}</p>
        <button
          type="button"
          onClick={stopVoice}
          className="rounded-full border-2 border-[#e11d48] px-10 py-4 text-2xl font-bold text-[#e11d48]"
        >
          <ParentBilingual
            lang={lang}
            primary={parentPrimary(lang, "stopAndSend")}
            english={parentEnglish("stopAndSend")}
            primaryClassName="block"
            align="center"
            englishClassName="text-sm text-[#e11d48]/75"
          />
        </button>
          </div>
        </div>
      </main>
    );

  if (screen === "camera-live" || screen === "camera-recording") {
    const isRecording = screen === "camera-recording";
    return (
      <main className="min-h-screen bg-[#f8f4f1] text-zinc-900">
        <div className={`${pageShell} gap-4`}>
        <div className="mb-1">
          <ParentBilingual
            lang={lang}
            primary={
              isRecording
                ? parentPrimary(lang, "recordingVideo")
                : parentPrimary(lang, "cameraReady")
            }
            english={
              isRecording
                ? parentEnglish("recordingVideo")
                : parentEnglish("cameraReady")
            }
            primaryClassName="block text-center text-xl font-semibold text-zinc-700"
          />
        </div>
        {/* Capped preview so Photo / Video stay on screen without scrolling */}
        <div className="relative h-[min(42vh,360px)] w-full overflow-hidden rounded-2xl bg-black shadow-lg">
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
                <span className="h-4 w-4 rounded-full bg-[#e11d48]" />
                <span className="font-mono text-2xl font-bold text-white sm:text-3xl">
                  {formatTime(recordSeconds)}
                </span>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex w-full shrink-0 gap-4">
          {!isRecording ? (
            <>
              <button
                type="button"
                onClick={takePhoto}
                className="flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl bg-[#a78bfa] py-6 text-white shadow-[0_10px_25px_rgba(167,139,250,0.35)]"
              >
                <Camera className="h-8 w-8" />
                <span className="text-center">
                  <ParentBilingualOnColor
                    lang={lang}
                    primary={parentPrimary(lang, "takePhoto")}
                    english={parentEnglish("takePhoto")}
                    primaryClassName="block text-xl font-bold"
                  />
                </span>
              </button>
              <button
                type="button"
                onClick={startVideoRecord}
                className="flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl bg-[#e11d48] py-6 text-white shadow-[0_10px_25px_rgba(225,29,72,0.35)]"
              >
                <Video className="h-8 w-8" />
                <span className="text-center">
                  <ParentBilingualOnColor
                    lang={lang}
                    primary={parentPrimary(lang, "recordVideo")}
                    english={parentEnglish("recordVideo")}
                    primaryClassName="block text-xl font-bold"
                  />
                </span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={stopVideoRecord}
              className="flex flex-1 flex-col items-center justify-center gap-2 rounded-3xl bg-[#e11d48] py-6 text-white shadow-[0_10px_25px_rgba(225,29,72,0.35)]"
            >
              <Square className="h-8 w-8" />
              <span className="text-center">
                <ParentBilingualOnColor
                  lang={lang}
                  primary={parentPrimary(lang, "stopAndSend")}
                  english={parentEnglish("stopAndSend")}
                  primaryClassName="block text-xl font-bold"
                />
              </span>
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
            className="shrink-0 rounded-full border border-zinc-300 bg-white px-5 py-2 text-lg text-zinc-700"
          >
            <ParentBilingual
              lang={lang}
              primary={parentPrimary(lang, "cancel")}
              english={parentEnglish("cancel")}
              primaryClassName="block text-lg font-medium text-zinc-700"
              englishClassName="text-xs text-zinc-500"
            />
          </button>
        )}
        </div>
      </main>
    );
  }

  if (screen === "sending")
    return (
      <main className="min-h-screen bg-[#f8f4f1] text-zinc-900">
        <div className={`${pageShell} items-center justify-center`}>
          <div className={`${cardSurface} w-full text-center`}>
        <ParentBilingual
          lang={lang}
          primary={parentPrimary(lang, "sendingUpdate")}
          english={parentEnglish("sendingUpdate")}
          primaryClassName="block text-xl font-semibold text-zinc-700"
        />
        <ParentBilingual
          lang={lang}
          primary={parentPrimary(lang, "pleaseWait")}
          english={parentEnglish("pleaseWait")}
          primaryClassName="mt-2 block text-base text-zinc-600"
          englishClassName="text-sm text-zinc-500"
        />
          </div>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-[#f8f4f1] text-zinc-900">
      <div className={`${pageShell} items-center justify-center`}>
        <div className={`${cardSurface} flex w-full flex-col items-center gap-5 text-center`}>
      <AlertTriangle className="h-14 w-14 text-[#e11d48]" />
      {lang === "en" ? (
        <p className="max-w-sm text-2xl font-bold text-[#e11d48]">{errorMsg}</p>
      ) : (
        <>
          <p className="max-w-sm text-2xl font-bold text-zinc-800">{errorMsg}</p>
          {errorEnglishHint ? (
            <p className="max-w-sm text-sm text-zinc-500">({errorEnglishHint})</p>
          ) : null}
        </>
      )}
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-[#e11d48] px-10 py-4 text-2xl font-bold text-white"
      >
        <ParentBilingualOnColor
          lang={lang}
          primary={parentPrimary(lang, "tryAgain")}
          english={parentEnglish("tryAgain")}
          primaryClassName="block text-2xl font-bold"
        />
      </button>
        </div>
      </div>
    </main>
  );
}
