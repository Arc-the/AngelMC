# AngelMC (Mission Control) - Implementation Instructions

## Product Goal

Build **AngelMC (Mission Control)**, a React + TypeScript + Vite web app with a small TypeScript backend.

This is a hackathon MVP for a voice AI assistant that helps an on-call venue engineer during a live FIFA World Cup watch party or stadium event. The engineer has tools in hand and cannot type easily, so they use voice to ask about blueprints, equipment locations, breaker panels, network racks, and safety playbooks.

The app should feel like a hands-free operations copilot for venue engineers, not a generic chatbot.

## Target Hackathon Track

Prioritize **Best Project Using Voice AI**.

Track rule: **No typing allowed during build or demo.**

Build and demo the product as a voice-first system:

- Use ElevenLabs for both speech-to-text and text-to-speech.
- Use a mission-control agent/model for reasoning and decision-making.
- Use ElevenLabs for voice replies.
- Keep text input only as a hidden/debug fallback for local troubleshooting. Do not use it in the submitted demo video.
- Quick actions are allowed only if they can be triggered by voice commands or hidden behind a debug mode that is not part of the judged demo.

## Core Voice Loop

Keep the architecture simple:

```txt
User speaks
-> ElevenLabs speech-to-text turns voice into text
-> Agent/model acts as mission control
   -> loads venue context from a folder at session start
   -> reasons over assets, playbooks, incidents, and safety rules
   -> produces a concise operator response
-> ElevenLabs turns response text into voice
-> User hears the reply
```

Backend shape:

```txt
Frontend microphone capture
-> backend /api/stt
-> ElevenLabs speech-to-text
-> backend /api/agent/ask
-> model + loaded context folder
-> backend /api/tts
-> ElevenLabs
-> frontend audio playback
```

Important:

- Do not put ElevenLabs or model API keys in frontend code.
- The backend owns all secrets.
- The judged demo must work without typing.
- The frontend may include text fallback for development, but it must not be the primary user flow.
- The assistant response should always be safe, concise, and operational.

## Demo Scenario

It is halftime during a FIFA World Cup watch party. The projector in Zone B goes down.

The engineer asks:

```txt
Where is the breaker for Projector B?
```

Expected assistant behavior:

```txt
Projector B is in Zone B. It is powered by Electrical Panel EP-2 in the Electrical Room. The breaker is number 14. Before touching the panel, check AV Controller AC-2 and confirm there is no visible damage, smoke, or burning smell.
```

Suggested spoken reply:

```txt
Go to the AV Booth first and check AC-2. If the controller is normal and you are authorized, inspect Electrical Panel EP-2 breaker 14.
```

## Frontend

Use:

- React
- TypeScript
- Vite
- Tailwind CSS

### Main Layout

Build a dark operations dashboard with:

- Top bar
- Left panel: Venue Blueprint Map
- Middle panel: Live Incident Feed
- Right panel: Voice Assistant
- Incident Report section

Desktop should use a three-column dashboard layout. Mobile can stack panels.

### Top Bar

Display:

- App title: `AngelMC`
- Subtitle: `Hands-free blueprint and incident support for live event engineers`
- Status badge: `Live Event Mode`
- Event label: `FIFA Watch Party - Halftime`

### Venue Blueprint Map

Create a simple interactive SVG or div-based floor map.

Locations:

- Main Hall
- Zone A
- Zone B
- AV Booth
- Network Room
- Electrical Room
- Gate 1
- Gate 2
- Gate 3 Corridor
- First Aid
- Security Desk

Sanity check:

- The original scenario mentions a smoke alarm near Gate 3, so the map must include `Gate 3 Corridor`.

Behavior:

- Show locations as colored blocks/cards arranged like a basic floor plan.
- Highlight locations returned by the agent.
- Use warning styling for smoke, fire, alarm, and electrical hazard scenarios.

### Live Incident Feed

Initial logs:

```txt
[19:42] Crowd level high near Zone B
[19:44] Projector B signal lost
[19:45] AV Controller reports HDMI timeout
[19:46] Network Rack NR-1 status normal
[19:47] Electrical Panel EP-2 voltage normal
```

Buttons:

- `Simulate Projector Failure`
- `Simulate Network Rack Alert`
- `Simulate Smoke Detector Alert`

Simulation behavior:

- Add realistic incident logs.
- Update active map highlights.
- Smoke detector scenario must trigger safety-first language and escalation to authorized safety/fire personnel.

### Voice Assistant Panel

Required controls:

- Large `Start Voice Input` button
- Transcript display
- Assistant response card
- Voice reply toggle
- `Ask Assistant` button
- Hidden/debug text fallback

Voice input behavior:

- Preferred path: record microphone audio and send it to backend `/api/stt`.
- If ElevenLabs speech-to-text access is available, backend uses ElevenLabs for transcription.
- If ElevenLabs is unavailable, use browser `SpeechRecognition`.
- The submitted demo should not rely on typed input.

Voice output behavior:

- Preferred path: frontend calls backend `/api/tts` with assistant speech text.
- Backend calls ElevenLabs and returns playable audio.
- If ElevenLabs is unavailable, fallback to browser `speechSynthesis`.

### Voice Demo Commands

Support these demo phrases by voice:

- `Where is the breaker for Projector B?`
- `What should I check for the AV failure?`
- `Where is Network Rack NR-1?`
- `Smoke alarm near Gate 3, what should I do?`

Optional debug quick-action buttons may exist only behind a visible `Debug Mode` toggle. Do not use them in the judged demo.

### Incident Report

Add:

- `Generate Incident Report` button
- Report display area
- `Copy Report` button

Report content:

- Event mode
- User question/transcript
- Assistant diagnosis
- Relevant assets
- Last 5 incident logs
- Recommended next action
- Safety warning if applicable

## Backend

Use a small Node + Express + TypeScript backend.

The backend is mission control. It owns:

- API secrets
- Context loading
- Agent/model calls
- ElevenLabs speech-to-text integration
- ElevenLabs TTS integration
- Mock incident state
- Report generation
- Safety guardrails

### Backend Endpoints

```txt
GET  /api/health
POST /api/session/start
GET  /api/incidents
POST /api/incidents/simulate
POST /api/stt
POST /api/agent/ask
POST /api/tts
POST /api/reports
```

### `GET /api/health`

Return backend status and provider configuration.

```json
{
  "ok": true,
  "providers": {
    "elevenLabsSpeechToTextConfigured": true,
    "elevenLabsTextToSpeechConfigured": true,
    "modelConfigured": true
  }
}
```

### `POST /api/session/start`

Starts an assistant session.

Backend behavior:

- Read files from `server/context/`.
- Load venue assets, playbooks, safety rules, map notes, and demo scenario notes.
- Return a `sessionId`.
- Cache the loaded context for that session.

Example response:

```json
{
  "sessionId": "demo-session-001",
  "loadedContextFiles": [
    "venue-assets.md",
    "safety-playbooks.md",
    "floor-map.md",
    "event-brief.md"
  ]
}
```

### `POST /api/stt`

Transcribes microphone audio.

Preferred behavior:

- Accept browser-recorded audio.
- Convert to the format required by ElevenLabs speech-to-text if needed.
- Send to ElevenLabs.
- Return cleaned transcript text.

Fallback behavior:

- If ElevenLabs speech-to-text is not configured, return a provider-unavailable response so the frontend can use browser speech recognition.
- The judged demo should still avoid manual typing.

### `POST /api/agent/ask`

Runs the mission-control agent.

Request:

```ts
type AgentAskRequest = {
  sessionId: string;
  transcript: string;
  incidentLogs: IncidentLog[];
};
```

Response:

```ts
type AgentResponse = {
  situation: string;
  relevantLocation: string;
  blueprintPath: string;
  nextSafeChecks: string[];
  escalationRule: string;
  suggestedSpokenInstruction: string;
  highlightedLocations: string[];
  relevantAssets: string[];
  safetyWarning?: string;
};
```

Agent responsibilities:

- Use context loaded from `server/context/`.
- Decide which assets, map locations, and playbooks matter.
- Return structured data for the UI.
- Produce one short spoken instruction for ElevenLabs.
- Apply safety guardrails before returning.

The model should not invent venue facts. If a fact is missing, it should say what is known and what needs confirmation.

### `POST /api/tts`

Converts assistant text into voice using ElevenLabs.

Request:

```json
{
  "text": "Go to the AV Booth first and check AC-2 before touching the electrical panel."
}
```

Backend behavior:

- Call ElevenLabs text-to-speech.
- Return playable audio to the frontend.
- If ElevenLabs is not configured, return a typed fallback response.

### `POST /api/incidents/simulate`

Request:

```json
{
  "scenario": "projector_failure"
}
```

Supported scenarios:

- `projector_failure`
- `network_rack_alert`
- `smoke_detector_alert`

Response should include:

- Updated logs
- Highlighted map locations
- Optional safety warning

### `POST /api/reports`

Generate a plain-text incident report suitable for copying into Devpost/demo notes or an incident ticket.

## Model Behavior

Use a model for decision-making and mission control.

The model input should include:

- System instruction for safe venue operations
- Loaded session context from `server/context/`
- Latest transcript
- Current incident logs
- Required JSON response schema

The model output must be parsed into structured JSON. If parsing fails, return a safe fallback response.

### Required Response Shape

Every answer should include:

- Situation
- Relevant Location
- Blueprint Path
- Next 3 Safe Checks
- Escalation Rule
- Suggested Spoken Instruction

Example:

```md
Situation:
Projector B appears to have lost signal during the live event.

Relevant Location:
Zone B ceiling mount, AV Booth, and Electrical Room.

Blueprint Path:
Projector B -> AV Controller AC-2 -> Electrical Panel EP-2 -> Breaker 14.

Next 3 Safe Checks:
1. Check whether AV Controller AC-2 is powered on.
2. Confirm HDMI/source input is active.
3. If authorized, inspect Electrical Panel EP-2 breaker 14.

Escalation Rule:
If there is visible damage, smoke, burning smell, or repeated breaker trip, stop troubleshooting and escalate to safety staff.

Suggested Spoken Instruction:
Go to the AV Booth first and check AC-2 before touching the electrical panel.
```

## Context Folder

Create a `server/context/` folder. The agent reads this folder at session start.

Suggested files:

```txt
server/context/
  event-brief.md
  venue-assets.md
  floor-map.md
  safety-playbooks.md
  incident-playbooks.md
```

### `event-brief.md`

Include:

- Event name: FIFA Watch Party
- Event phase: Halftime
- Operational mode: Live Event Mode
- Primary operator role: on-call venue engineer
- Goal: resolve issues quickly without unsafe actions

### `venue-assets.md`

Include:

```txt
Projector B
- zone: Zone B
- connectedTo: AV Controller AC-2
- powerPanel: EP-2
- breaker: 14
- location: Ceiling mount above Zone B
- safeChecks: Check AV controller, check HDMI input, check power indicator, check breaker only if authorized

AV Controller AC-2
- location: AV Booth
- connectedTo: Projector B
- network: Network Rack NR-1

Network Rack NR-1
- location: Network Room
- supports: AV system, ticket scanner, staff Wi-Fi

Electrical Panel EP-2
- location: Electrical Room
- supports: Projector B, Zone B lighting, AV Booth outlets

Smoke Detector SD-G3
- location: Gate 3 Corridor
- safetyInstruction: Do not silence or bypass alarms. Verify area safety and escalate to fire/safety staff.
```

### `floor-map.md`

Include all map locations:

- Main Hall
- Zone A
- Zone B
- AV Booth
- Network Room
- Electrical Room
- Gate 1
- Gate 2
- Gate 3 Corridor
- First Aid
- Security Desk

### `safety-playbooks.md`

Safety rules:

- Never tell the user to bypass alarms.
- Never tell the user to silence alarms.
- Never tell the user to ignore safety procedures.
- Never tell the user to disable safety equipment.
- Never give unsafe electrical instructions.
- Breaker inspection or reset may only be mentioned with "if authorized".
- For fire, smoke, alarm, burning smell, visible damage, electrical hazard, or repeated breaker trip: stop troubleshooting and escalate to authorized safety/fire personnel.

### `incident-playbooks.md`

Include playbooks for:

- Projector failure
- Network rack alert
- Power panel issue
- Smoke detector alert
- Crowd flow issue

## Environment Variables

Backend `.env`:

```txt
PORT=8787

MODEL_API_KEY=
MODEL_NAME=

ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_STT_MODEL_ID=scribe_v2
```

Frontend `.env`:

```txt
VITE_API_BASE_URL=http://localhost:8787
```

Do not prefix backend secrets with `VITE_`.

## Suggested File Structure

```txt
client/
  index.html
  package.json
  src/
    App.tsx
    main.tsx
    index.css
    components/
      TopBar.tsx
      BlueprintMap.tsx
      IncidentFeed.tsx
      VoiceAssistant.tsx
      IncidentReport.tsx
      StatusBadge.tsx
    hooks/
      useVoiceInput.ts
      useAudioPlayback.ts
    lib/
      api.ts
      types.ts

server/
  package.json
  src/
    index.ts
    contextLoader.ts
    routes/
      session.ts
      stt.ts
      agent.ts
      tts.ts
      incidents.ts
      reports.ts
    services/
      missionAgent.ts
      elevenLabs.ts
      incidentSimulator.ts
      reportGenerator.ts
      safetyGuardrails.ts
    types.ts
  context/
    event-brief.md
    venue-assets.md
    floor-map.md
    safety-playbooks.md
    incident-playbooks.md

package.json
README.md
```

## UI Style

- Dark dashboard style.
- Clear typography.
- Strong visual hierarchy.
- Rounded panels and compact controls.
- Highlight active map location.
- Use alert colors for safety scenarios.
- Keep it looking like an operations control dashboard, not a landing page.

## Acceptance Criteria

- Frontend and backend run locally.
- Session start loads files from `server/context/`.
- User can ask via voice when ElevenLabs speech-to-text access is configured.
- Demo flow works without typing.
- Hidden/debug text fallback exists only for development recovery.
- Agent/model returns structured mission-control responses.
- ElevenLabs voice reply works when configured.
- Browser speech synthesis fallback works when ElevenLabs is unavailable.
- Map highlights update from agent output.
- Incident simulation buttons work.
- Smoke/alarm/electrical scenarios always include safety-first escalation.
- Incident report generation and copy work.
- No API keys are exposed in frontend code.
