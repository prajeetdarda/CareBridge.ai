/**
 * GET /api/elevenlabs/voices
 * Lists all voices available in your ElevenLabs account.
 * Use this to find the right ELEVENLABS_VOICE_ID for .env.local
 */

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === "your_elevenlabs_api_key_here") {
    return Response.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });
  }

  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
  });

  if (!res.ok) {
    return Response.json({ error: `ElevenLabs error: ${res.status}` }, { status: res.status });
  }

  const data = await res.json();
  const voices = (data.voices ?? []).map((v: { voice_id: string; name: string; category: string }) => ({
    voice_id: v.voice_id,
    name: v.name,
    category: v.category,
  }));

  return Response.json({ voices });
}
