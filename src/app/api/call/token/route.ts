import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

/**
 * GET /api/call/token
 * Dev 1 owns this route.
 *
 * Creates an ephemeral token for the browser to connect directly
 * to Gemini Live API without exposing the real API key.
 */
export async function GET() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    return NextResponse.json(
      { error: "GOOGLE_API_KEY not configured in .env.local" },
      { status: 500 }
    );
  }

  try {
    const client = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "v1alpha" },
    });

    const token = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(
          Date.now() + 2 * 60 * 1000
        ).toISOString(),
        httpOptions: { apiVersion: "v1alpha" },
      },
    });

    return NextResponse.json({ token: token.name });
  } catch (e) {
    console.error("[call/token] Failed to create ephemeral token:", e);
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}
