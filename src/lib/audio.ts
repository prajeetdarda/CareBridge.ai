/**
 * Browser audio utilities — Dev 1 owns this file.
 * Handles mic capture (downsampled to 16kHz PCM) and AI audio playback (24kHz PCM).
 */

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

// --- Helpers ---

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    const chunk = bytes.subarray(i, Math.min(i + 8192, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function float32ToInt16(float32: Float32Array): Int16Array {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16;
}

function downsample(
  samples: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  if (fromRate === toRate) return samples;
  const ratio = fromRate / toRate;
  const outputLen = Math.floor(samples.length / ratio);
  const output = new Float32Array(outputLen);
  for (let i = 0; i < outputLen; i++) {
    output[i] = samples[Math.round(i * ratio)];
  }
  return output;
}

// --- Mic Capture ---

export interface AudioChunk {
  source: "mic" | "ai";
  data: string;
}

export interface AudioCapture {
  setOnData: (cb: (base64PCM: string) => void) => void;
  stop: () => void;
}

export async function createAudioCapture(): Promise<AudioCapture> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const processor = audioCtx.createScriptProcessor(4096, 1, 1);
  const nativeRate = audioCtx.sampleRate;

  let onData: ((base64PCM: string) => void) | null = null;

  processor.onaudioprocess = (e) => {
    if (!onData) return;
    const raw = e.inputBuffer.getChannelData(0);
    const downsampled = downsample(raw, nativeRate, INPUT_SAMPLE_RATE);
    const int16 = float32ToInt16(downsampled);
    onData(arrayBufferToBase64(int16.buffer as ArrayBuffer));
  };

  source.connect(processor);
  processor.connect(audioCtx.destination);

  return {
    setOnData: (cb) => {
      onData = cb;
    },
    stop: () => {
      onData = null;
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      audioCtx.close();
    },
  };
}

// --- Audio Playback ---

export interface AudioPlayer {
  play: (base64PCM: string) => void;
  interrupt: () => void;
  close: () => void;
}

export function createAudioPlayer(): AudioPlayer {
  const audioCtx = new AudioContext();
  let scheduledSources: AudioBufferSourceNode[] = [];
  let nextStartTime = 0;

  return {
    play: (base64PCM: string) => {
      const raw = base64ToArrayBuffer(base64PCM);
      const int16 = new Int16Array(raw);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768;
      }

      const buffer = audioCtx.createBuffer(
        1,
        float32.length,
        OUTPUT_SAMPLE_RATE
      );
      buffer.getChannelData(0).set(float32);

      const src = audioCtx.createBufferSource();
      src.buffer = buffer;
      src.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      if (nextStartTime < now) nextStartTime = now;
      src.start(nextStartTime);
      nextStartTime += buffer.duration;

      scheduledSources.push(src);
      src.onended = () => {
        scheduledSources = scheduledSources.filter((s) => s !== src);
      };
    },

    interrupt: () => {
      for (const src of scheduledSources) {
        try {
          src.stop();
        } catch {
          /* already stopped */
        }
      }
      scheduledSources = [];
      nextStartTime = audioCtx.currentTime;
    },

    close: () => {
      for (const src of scheduledSources) {
        try {
          src.stop();
        } catch {
          /* already stopped */
        }
      }
      scheduledSources = [];
      audioCtx.close();
    },
  };
}
