/**
 * Gemini Live session manager — Dev 1 owns this file.
 * Connects to Gemini Live API via the @google/genai SDK in the browser.
 * Uses ephemeral tokens for secure client-to-server connection.
 */

import { GoogleGenAI, Modality, type LiveServerMessage } from "@google/genai";

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

const DEFAULT_SYSTEM_INSTRUCTION = `You are a warm, caring AI wellness check-in assistant for Family Care Relay AI.
You have been asked by a family member to check in on their loved one (parent or grandparent).

Guidelines:
- Start by introducing yourself clearly: "Hi, this is your family's care assistant calling to check in on behalf of your child."
- Speak in a warm, respectful, and culturally sensitive tone
- Ask about their day, how they're feeling, whether they took their medications, what they ate, and if they did any activity or exercise
- Listen carefully and respond naturally — this should feel like a caring conversation, not a medical questionnaire
- If they mention anything concerning (pain, dizziness, falls, chest issues, breathing problems), gently ask follow-up questions to understand the severity
- Be transparent that you are an AI assistant, not a real person
- Do not give medical advice or diagnose anything
- Be patient and speak clearly
- Keep the conversation warm and relatively brief (3-5 minutes)
- End by asking if there's anything else they'd like their family to know`;

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
    systemInstruction: systemInstruction || DEFAULT_SYSTEM_INSTRUCTION,
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
