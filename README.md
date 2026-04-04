# Family Care Relay AI

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
      call/end/route.ts       — Dev 1: End call, post transcript
      summary/route.ts        — Dev 2: Create/fetch summaries
      alerts/route.ts         — Dev 2: Create/fetch alerts
      settings/route.ts       — Dev 2: Read/write settings
  lib/
    types.ts                  — Shared types (DO NOT edit without coordinating)
    gemini.ts                 — Dev 1: Gemini Live API
    audio.ts                  — Dev 1: Mic/audio helpers
    intelligence.ts           — Dev 2: Summary + urgency engine
    storage.ts                — Dev 2: Mock storage
  components/
    call/                     — Dev 1: Call UI components
    dashboard/                — Dev 2: Dashboard components
```

## Developer Ownership

| Area | Owner |
|------|-------|
| `app/parent/**`, `components/call/**`, `lib/gemini.ts`, `lib/audio.ts`, `api/call/**` | Dev 1 |
| `app/family/**`, `components/dashboard/**`, `lib/intelligence.ts`, `lib/storage.ts`, `api/summary/**`, `api/alerts/**`, `api/settings/**` | Dev 2 |
| `lib/types.ts`, `app/layout.tsx`, `app/page.tsx`, `globals.css` | Shared (frozen after setup) |

## API Contract

- `POST /api/call/start` → `{ sessionId, status, startedAt }`
- `POST /api/call/end` → `{ success, sessionId, endedAt }` (body: `{ sessionId, transcript }`)
- `GET /api/summary` → `{ summaries: SummaryRecord[] }`
- `POST /api/summary` → `{ summary: SummaryRecord }` (body: `{ transcript, sessionId }`)
- `GET /api/alerts` → `{ alerts: [] }`
- `POST /api/alerts` → `{ success, alert }` (body: alert data)
- `GET /api/settings` → `{ profile: FamilyProfile }`
- `PUT /api/settings` → `{ success, profile }` (body: partial FamilyProfile)
