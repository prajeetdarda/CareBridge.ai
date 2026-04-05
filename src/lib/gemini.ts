/**
 * Gemini Live session manager — Dev 1 owns this file.
 * Connects to Gemini Live API via the @google/genai SDK in the browser.
 * Uses ephemeral tokens for secure client-to-server connection.
 */

import { GoogleGenAI, Modality, type LiveServerMessage } from "@google/genai";
import { defaultSystemInstruction } from "@/lib/call-prompt";

const MODEL = "gemini-3.1-flash-live-preview";

export interface GeminiCallbacks {
  onAudio: (base64PCM: string) => void;
  onInputTranscript: (text: string) => void;
  onOutputTranscript: (text: string) => void;
  onTurnComplete: () => void;
  onInterrupted: () => void;
  onError: (error: Error) => void;
  onClose: () => void;
}

export interface GeminiSession {
  sendAudio: (base64PCM: string) => void;
  sendText: (text: string) => void;
  disconnect: () => void;
}

export async function connectGeminiLive(
  token: string,
  callbacks: GeminiCallbacks,
  systemInstruction?: string
): Promise<GeminiSession> {
  const ai = new GoogleGenAI({
    apiKey: token,
    httpOptions: { apiVersion: "v1alpha" },
  });

  const config = {
    responseModalities: [Modality.AUDIO],
    systemInstruction: systemInstruction || defaultSystemInstruction(),
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: "Aoede" },
      },
    },
    outputAudioTranscription: {},
    inputAudioTranscription: {},
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let session: any;

  try {
    session = await ai.live.connect({
      model: MODEL,
      config,
      callbacks: {
        onopen: () => {
          console.log("[gemini] Session opened");
        },
        onmessage: (message: LiveServerMessage) => {
          handleMessage(message, callbacks);
        },
        onerror: (e: ErrorEvent) => {
          console.error("[gemini] Error:", e.message);
          callbacks.onError(new Error(e.message || "Gemini connection error"));
        },
        onclose: () => {
          console.log("[gemini] Session closed");
          callbacks.onClose();
        },
      },
    });
  } catch (e) {
    throw new Error(
      `Failed to connect to Gemini Live: ${e instanceof Error ? e.message : e}`
    );
  }

  return {
    sendAudio: (base64PCM: string) => {
      try {
        session.sendRealtimeInput({
          audio: {
            data: base64PCM,
            mimeType: "audio/pcm;rate=16000",
          },
        });
      } catch (e) {
        console.error("[gemini] Failed to send audio:", e);
      }
    },
    sendText: (text: string) => {
      try {
        session.sendClientContent({
          turns: [{ role: "user", parts: [{ text }] }],
          turnComplete: true,
        });
      } catch (e) {
        console.error("[gemini] Failed to send text:", e);
      }
    },
    disconnect: () => {
      try {
        session.close();
      } catch (e) {
        console.error("[gemini] Failed to close:", e);
      }
    },
  };
}

function handleMessage(
  message: LiveServerMessage,
  callbacks: GeminiCallbacks
) {
  const content = message.serverContent;
  if (!content) return;

  if (content.interrupted) {
    callbacks.onInterrupted();
    return;
  }

  if (content.modelTurn?.parts) {
    for (const part of content.modelTurn.parts) {
      if (part.inlineData?.data) {
        callbacks.onAudio(part.inlineData.data);
      }
    }
  }

  if (content.outputTranscription?.text) {
    callbacks.onOutputTranscript(content.outputTranscription.text);
  }

  if (content.inputTranscription?.text) {
    callbacks.onInputTranscript(content.inputTranscription.text);
  }

  if (content.turnComplete) {
    callbacks.onTurnComplete();
  }
}
