import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * POST /api/call/save
 * Dev 1 owns this route.
 *
 * Saves the full call recording (single combined PCM file) and transcript.
 * Audio chunks arrive in chronological order — mic (16kHz) and AI (24kHz)
 * are both resampled to 16kHz and merged into one continuous file.
 *
 * Body: {
 *   sessionId: string,
 *   audioChunks: { source: "mic" | "ai", data: string }[],
 *   transcript: { role: string, text: string, timestamp: string }[],
 *   duration: number
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, audioChunks, transcript, duration } = body;

    const tmpDir = path.join(process.cwd(), "tmp", "recordings");
    await mkdir(tmpDir, { recursive: true });

    // Merge all audio chunks into a single 16kHz PCM buffer
    const pcmBuffers: Buffer[] = [];
    for (const chunk of audioChunks ?? []) {
      const raw = Buffer.from(chunk.data, "base64");
      if (chunk.source === "ai") {
        pcmBuffers.push(resample24kTo16k(raw));
      } else {
        pcmBuffers.push(raw);
      }
    }

    const SAMPLE_RATE_HZ = 16000;
    const audioPath = path.join(tmpDir, `${sessionId}.wav`);
    const transcriptPath = path.join(tmpDir, `${sessionId}.json`);

    // Save combined audio as WAV (browsers cannot play raw .pcm in <audio>)
    if (pcmBuffers.length > 0) {
      const totalLen = pcmBuffers.reduce((s, b) => s + b.length, 0);
      const merged = Buffer.alloc(totalLen);
      let offset = 0;
      for (const buf of pcmBuffers) {
        buf.copy(merged, offset);
        offset += buf.length;
      }
      const wav = wrapPcm16LeMonoWav(merged, SAMPLE_RATE_HZ);
      await writeFile(audioPath, wav);
      console.log(
        `[call/save] Saved combined audio: ${audioPath} (${wav.length} bytes, ~${Math.round(merged.length / 32000)}s at 16kHz)`
      );
    }

    // Save transcript
    const transcriptData = {
      sessionId,
      duration,
      savedAt: new Date().toISOString(),
      entries: transcript,
    };
    await writeFile(transcriptPath, JSON.stringify(transcriptData, null, 2));
    console.log(`[call/save] Saved transcript: ${transcriptPath}`);

    const mediaPath = `tmp/recordings/${sessionId}.wav`;

    return NextResponse.json({
      success: true,
      sessionId,
      files: {
        audio: pcmBuffers.length > 0 ? mediaPath : null,
        transcript: `tmp/recordings/${sessionId}.json`,
      },
      mediaPath,
    });
  } catch (e) {
    console.error("[call/save] Failed:", e);
    return NextResponse.json(
      { error: "Failed to save recording" },
      { status: 500 }
    );
  }
}

/** 16-bit mono little-endian PCM → playable WAV (RIFF/WAVE). */
function wrapPcm16LeMonoWav(pcm: Buffer, sampleRate: number): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}

/**
 * Downsample 24kHz 16-bit PCM to 16kHz 16-bit PCM.
 * Ratio is 1.5:1 — for every 3 input samples, output 2.
 */
function resample24kTo16k(input: Buffer): Buffer {
  const inputSamples = input.length / 2;
  const outputSamples = Math.floor(inputSamples * (16000 / 24000));
  const output = Buffer.alloc(outputSamples * 2);
  const ratio = 24000 / 16000;

  for (let i = 0; i < outputSamples; i++) {
    const srcIdx = Math.min(Math.round(i * ratio), inputSamples - 1);
    const sample = input.readInt16LE(srcIdx * 2);
    output.writeInt16LE(sample, i * 2);
  }

  return output;
}
