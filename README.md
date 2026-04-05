<p align="center">
  <strong style="font-size:2rem;">❤️ CareBridge.ai</strong>
</p>

<p align="center">
  <em>Bridging Distance with Empathetic AI</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Gemini_Live-API-4285F4?logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/ElevenLabs-Voice_AI-000?logo=elevenlabs" alt="ElevenLabs" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
</p>

---

## Overview

**CareBridge.ai** is a consent-based AI family care relay designed for immigrant families living far from aging parents or grandparents. It helps families stay continuously informed when distance, time zones, work, or travel make direct communication difficult.

This is **not** a replacement for human relationships — it is a **support layer** that maintains continuity of care through empathetic AI-powered check-ins, intelligent summarization, and smart escalation.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **AI Check-In Calls** | Family members trigger a check-in when they can't call. The AI speaks to the parent in their native language with a warm, familiar tone. |
| **Multi-Modal Updates** | Parents can share voice, text, image, or video updates anytime — no app to learn. |
| **Intelligent Summarization** | Conversations are analyzed by Gemini and distilled into structured care summaries with mood, health, and activity insights. |
| **3-Tier Urgency Triage** | Every interaction is classified: *Daily Digest*, *Care Alert*, or *Urgent Action* — each with appropriate notification behavior. |
| **Auto-Escalation** | Urgent concerns trigger cascading alerts to backup contacts (family members, local support, medical help). |
| **Multilingual Support** | Native language conversations with automatic English summaries for family members. Supports Hindi, Marathi, Gujarati, Tamil, and more. |
| **Family Dashboard** | A single pane of glass for summaries, alerts, care trends, and profile management. |
| **Medical Document Upload** | Upload prescriptions, reports, and reference files for caregiver context (demo). |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                          │
├──────────────────────┬──────────────────────────────────────┤
│   Parent-Side UX     │         Family-Side UX               │
│  ┌────────────────┐  │  ┌────────────────────────────────┐  │
│  │ Incoming Call   │  │  │ Dashboard (summaries, alerts)  │  │
│  │ Live Voice Call │  │  │ Check-In Trigger               │  │
│  │ Leave Update    │  │  │ Care Profile & Settings        │  │
│  └───────┬────────┘  │  └──────────────┬─────────────────┘  │
│          │           │                 │                     │
├──────────┴───────────┴─────────────────┴─────────────────────┤
│                      API Layer (Route Handlers)              │
│  /api/call/start · /api/call/end · /api/call/token           │
│  /api/summary · /api/alerts · /api/settings                  │
│  /api/elevenlabs/signed-url · /api/elevenlabs/voices         │
├──────────────────────────────────────────────────────────────┤
│                     Intelligence Layer                       │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │ Gemini Live  │  │ Gemini Text   │  │ ElevenLabs       │  │
│  │ (real-time   │  │ (summarize +  │  │ (conversational  │  │
│  │  voice)      │  │  classify)    │  │  voice agent)    │  │
│  └──────────────┘  └───────────────┘  └──────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│                  Local Storage (tmp/ + in-memory)            │
└──────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 + React 19 | Full-stack app with SSR and API routes |
| Styling | Tailwind CSS 4 | Utility-first styling with custom design system |
| Voice AI | Google Gemini Live API | Real-time multilingual voice conversations |
| Voice Agent | ElevenLabs Conversational AI | Alternative voice agent with natural TTS |
| Intelligence | Gemini 2.0 Flash | Post-call summarization, urgency classification, media analysis |
| Icons | Lucide React + Material Symbols | UI iconography |
| Language | TypeScript 5 | Type safety across the stack |
| Storage | In-memory + filesystem | Demo-grade persistence (no database required) |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A [Google AI Studio](https://aistudio.google.com/apikey) API key
- (Optional) An [ElevenLabs](https://elevenlabs.io) API key and Agent ID

### Installation

```bash
git clone https://github.com/prajeetdarda/CareBridge.ai.git
cd family-care-relay
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Required — Google Gemini
GOOGLE_API_KEY=your_google_api_key

# Optional — ElevenLabs Conversational AI
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page.

### LAN Access (for mobile testing)

```bash
npm run dev:lan
```

### HTTPS Tunnel (for mic access on remote devices)

```bash
npm run tunnel:cf    # Cloudflare tunnel
# or
npm run tunnel:lt    # LocalTunnel
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                      Landing page
│   ├── layout.tsx                    Root layout + fonts
│   ├── globals.css                   Design system + animations
│   ├── demo-signup/page.tsx          Demo onboarding flow
│   ├── parent/                       Parent-side experiences
│   │   ├── page.tsx                  Parent home (redirect)
│   │   ├── incoming/page.tsx         Incoming call screen
│   │   ├── call/page.tsx             Gemini Live voice call
│   │   ├── call-elevenlabs/page.tsx  ElevenLabs voice call
│   │   └── update/page.tsx           Leave an update (voice/photo/video)
│   ├── family/                       Family-side experiences
│   │   ├── page.tsx                  Family dashboard
│   │   ├── check-in/page.tsx         Trigger a check-in
│   │   ├── summaries/page.tsx        Summary history
│   │   ├── alerts/page.tsx           Urgent alerts
│   │   └── settings/page.tsx         Care profile & settings
│   └── api/                          Backend route handlers
│       ├── call/                     Call session management
│       ├── summary/route.ts          Summary pipeline (Gemini analysis)
│       ├── alerts/route.ts           Alert management
│       ├── settings/route.ts         Profile read/write
│       └── elevenlabs/               ElevenLabs integration
├── lib/
│   ├── types.ts                      Shared TypeScript interfaces
│   ├── gemini.ts                     Gemini Live API client
│   ├── audio.ts                      Browser mic/audio utilities
│   ├── intelligence.ts               Gemini text summarization + classification
│   ├── call-prompt.ts                AI conversation prompt engineering
│   ├── parent-i18n.ts                Multilingual parent-side translations
│   ├── storage.ts                    In-memory mock storage
│   └── server-url.ts                 Server URL resolution
├── components/
│   ├── family/                       Family dashboard components
│   │   ├── CarePageShell.tsx         Shared page shell with nav
│   │   ├── CareThemeContext.tsx       Theme provider (light/dark)
│   │   ├── FamilyDashboardClient.tsx  Main dashboard UI
│   │   ├── FamilyDashboardAttention.tsx  Alert attention states
│   │   ├── FamilyCheckInPanel.tsx     Check-in trigger panel
│   │   ├── IncomingCallCard.tsx       Incoming call notification
│   │   └── UrgentEmergencyDemo.tsx    Emergency escalation demo
│   └── dashboard/
│       ├── SummaryCard.tsx            Individual summary card
│       ├── SummariesExplorer.tsx      Summary list + filters
│       ├── AlertCard.tsx              Alert card component
│       └── SettingsForm.tsx           Care profile form
├── public/
│   ├── family-photos/                Background scroll images
│   ├── child-profile.png             Family member avatar
│   └── parent-profile.png            Loved one avatar
└── tmp/                              Runtime media storage
    ├── recordings/                   Call recordings (.webm)
    └── updates/                      Parent updates (voice/image/video)
```

---

## API Reference

All request/response types are defined in [`src/lib/types.ts`](src/lib/types.ts).

### Call Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/call/start` | POST | Start a new check-in call session |
| `/api/call/end` | POST | End a call and trigger summary pipeline |
| `/api/call/token` | GET | Get Gemini Live API session token |

### Intelligence Pipeline

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/summary` | POST | Submit transcript/media for AI analysis |
| `/api/summary` | GET | Retrieve all care summaries |

### Alerts & Settings

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/alerts` | POST | Create an alert (auto-triggered on urgency) |
| `/api/alerts` | GET | Retrieve all active alerts |
| `/api/settings` | GET | Get family care profile |
| `/api/settings` | PUT | Update family care profile |

### ElevenLabs Integration

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/elevenlabs/signed-url` | GET | Get signed URL for ElevenLabs session |
| `/api/elevenlabs/voices` | GET | List available ElevenLabs voices |

---

## Data Flow

```
Family member triggers check-in
         │
         ▼
   Parent receives call ──→ Live voice conversation (Gemini / ElevenLabs)
         │
         ▼
   Transcript captured
         │
         ▼
   POST /api/summary ──→ Gemini analyzes transcript + media
         │
         ├──→ Summary stored (mood, health, activity insights)
         ├──→ Urgency classified (summary_later / notify_soon / urgent_now)
         └──→ If urgent → POST /api/alerts → Escalation cascade
                                │
                                ▼
                    Family dashboard updated in real-time
```

---

## Urgency Classification

| Level | Behavior | Examples |
|-------|----------|---------|
| **Daily Digest** | Stored for next summary review | "I ate late today", "Walked in the garden" |
| **Care Alert** | Push notification to family | "Skipped medicine", "Feeling weak today" |
| **Urgent Action** | Immediate alert + escalation cascade | "Chest pain", "I fell down", "Can't stand" |

> The system **flags urgency** — it does not claim medical diagnosis.

---

## Ethical Design

CareBridge.ai is built with strong ethical guardrails:

- **Explicit consent** from both family members and loved ones
- **Clear AI disclosure** — the system always identifies itself as an AI care assistant
- **Support, not replacement** — augments human care, never substitutes it
- **Human-in-the-loop** — urgent matters always route to real people
- **Privacy-first** — no data leaves the local environment in demo mode
- **No medical claims** — urgency flagging, not diagnosis

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:lan` | Start with LAN access (0.0.0.0) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run tunnel:cf` | Cloudflare HTTPS tunnel |
| `npm run tunnel:lt` | LocalTunnel HTTPS tunnel |

---

## License

This project was built for [Google AI Hackathon 2026](https://googleai.devpost.com/). All rights reserved.

---

<p align="center">
  Built with care by <strong>Prajeet Darda</strong>
  <br/>
  Powered by <strong>Google Gemini</strong> &amp; <strong>ElevenLabs</strong>
</p>
