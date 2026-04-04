# Family Care Relay AI (CareBridge.ai)

A consent-based AI family care relay for immigrant families — stay informed about aging parents when distance, time zones, work, or travel make direct communication difficult.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the role-select screen.

## Project Structure

```
src/
  app/
    page.tsx                  — Role select (Parent vs Child)
    layout.tsx                — Shared layout
    parent/                   — Dev 1: Parent/grandparent screens
      page.tsx                — Parent home
      call/page.tsx           — Live call screen
      update/page.tsx         — Leave update screen
    family/                   — Dev 2: Child/family screens
      page.tsx                — Family dashboard
      summaries/page.tsx      — Summary history
      alerts/page.tsx         — Urgent alerts
      settings/page.tsx       — Care settings
    api/
      call/start/route.ts     — Dev 1: Start call session
      call/end/route.ts       — Dev 1: End call
      summary/route.ts        — Dev 2: Create/fetch summaries (LLM pipeline here)
      alerts/route.ts         — Dev 2: Create/fetch alerts
      settings/route.ts       — Dev 2: Read/write settings
  lib/
    types.ts                  — Shared types + API contracts (DO NOT edit alone)
    gemini.ts                 — Dev 1: Gemini Live API (real-time voice)
    audio.ts                  — Dev 1: Mic/audio helpers
    intelligence.ts           — Dev 2: Gemini text API (summarize + urgency)
    storage.ts                — Dev 2: In-memory mock storage
  components/
    call/                     — Dev 1: Call UI components
    dashboard/                — Dev 2: Dashboard components
  tmp/                        — Dev 1: Raw media files (recordings, updates)
    recordings/{sessionId}.webm
    updates/{updateId}.webm|jpg|mp4
```

## Developer Ownership

| Area | Owner |
|------|-------|
| `app/parent/**`, `components/call/**`, `lib/gemini.ts`, `lib/audio.ts`, `api/call/**` | Dev 1 |
| `app/family/**`, `components/dashboard/**`, `lib/intelligence.ts`, `lib/storage.ts`, `api/summary/**`, `api/alerts/**`, `api/settings/**` | Dev 2 |
| `lib/types.ts`, `app/layout.tsx`, `app/page.tsx`, `globals.css` | Shared (frozen after setup) |
| `tmp/` (raw media files) | Dev 1 writes, Dev 2 reads via mediaPath |

---

## API Contract (Full Reference)

All request/response types are defined in `src/lib/types.ts`.

### POST /api/call/start — Dev 1

Start a new check-in call session.

```
Request:  StartCallRequest  { lovedOneName: string, language: string }
Response: StartCallResponse { sessionId: string, status: "ringing", startedAt: string }
```

### POST /api/call/end — Dev 1

End a call session.

```
Request:  EndCallRequest  { sessionId: string, transcript: string }
Response: EndCallResponse { success: boolean, sessionId: string, endedAt: string }
```

### POST /api/summary — Dev 2 (THE KEY HANDOFF)

Dev 1 calls this after a call ends OR when a parent leaves an update.
Dev 2's handler receives it, runs LLM analysis, classifies urgency, and stores the result.

```
Request:  SubmitSummaryRequest {
            sessionId: string
            transcript: string
            initiatedBy: "family" | "loved_one"
            mediaPath?: string              — path to raw file in tmp/
            mediaType?: "audio" | "image" | "video"
            language?: string
            callDurationSeconds?: number
          }
Response: SubmitSummaryResponse { summary: SummaryRecord }
```

### GET /api/summary — Dev 2

Returns all past summaries for the dashboard.

```
Response: GetSummariesResponse { summaries: SummaryRecord[] }
```

### POST /api/alerts — Dev 2

Create an alert (triggered when urgency is notify_soon or urgent_now).

```
Request:  CreateAlertRequest {
            sessionId: string
            urgencyLevel: "notify_soon" | "urgent_now"
            reason: string
            transcript?: string
          }
Response: CreateAlertResponse { success: boolean, alert: AlertRecord }
```

### GET /api/alerts — Dev 2

Returns all active alerts.

```
Response: GetAlertsResponse { alerts: AlertRecord[] }
```

### GET /api/settings — Dev 2

Returns the family profile and preferences.

```
Response: GetSettingsResponse { profile: FamilyProfile }
```

### PUT /api/settings — Dev 2

Update the family profile.

```
Request:  UpdateSettingsRequest { ...partial FamilyProfile fields }
Response: UpdateSettingsResponse { success: boolean, profile: FamilyProfile }
```

---

## Data Flow: How Dev 1 and Dev 2 Connect

```
Dev 1: Call ends → save raw audio to tmp/ → POST /api/summary with transcript
                                                      ↓
Dev 2:                               /api/summary handler receives it
                                     → calls intelligence.ts (Gemini text API)
                                     → gets summary + urgency
                                     → stores in storage.ts
                                     → if urgent, creates alert via /api/alerts
                                     → returns SummaryRecord
                                                      ↓
Dev 2: Child dashboard → GET /api/summary → displays summaries
       Alerts page     → GET /api/alerts  → displays urgent items
```

---

## Raw Media Storage (tmp/)

Dev 1 saves raw recordings and update media to the `tmp/` folder at the project root.
Dev 2 can serve or link these files if they want a "play original" button on the dashboard.

```
tmp/
  recordings/
    {sessionId}.webm          — full call audio recording
  updates/
    {updateId}.webm           — parent voice update
    {updateId}.jpg            — parent image update
    {updateId}.mp4            — parent video update
```

The `mediaPath` field in SubmitSummaryRequest tells Dev 2 where to find the raw file.
