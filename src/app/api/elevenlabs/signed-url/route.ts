/**
 * GET /api/elevenlabs/signed-url
 * Issues a short-lived signed WebSocket URL for ElevenLabs Conversational AI (Option 3).
 * The main API key stays server-side; the browser gets only a temporary URL.
 */

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;

  if (!apiKey || apiKey === "your_elevenlabs_api_key_here") {
    return Response.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });
  }
  if (!agentId || agentId === "your_elevenlabs_agent_id_here") {
    return Response.json({ error: "ELEVENLABS_AGENT_ID not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      {
        method: "GET",
        headers: { "xi-api-key": apiKey },
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("[api/elevenlabs/signed-url] Error:", res.status, errText);
      return Response.json(
        { error: `ElevenLabs API error ${res.status}: ${errText}` },
        { status: res.status }
      );
    }

    const { signed_url } = await res.json();
    return Response.json({ signedUrl: signed_url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to get signed URL";
    console.error("[api/elevenlabs/signed-url] Error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
