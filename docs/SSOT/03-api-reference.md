---
title: "API Reference"
type: ssot
status: stable
last_updated: 2025-12-27
audience: developer
tags:
  - api
  - gemini
  - supabase
related:
  - "02-data-models.md"
  - "../runbooks/troubleshooting-gemini.md"
---

# API Reference

## Gemini API Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `analyzeDocument(file, context)` | Scan and analyze documents | Promise\<AnalysisResult\> |
| `streamChatResponse(history, message, onChunk)` | Chat with AI | Promise\<string\> |
| `generateSpeech(text)` | Convert text to audio | Promise\<AudioBuffer\> |
| `getLocalProbateRequirements(location)` | Get local probate info | Promise\<ProbateInfo\> |
| `getTransportLaws(location)` | Get transport regulations | Promise\<TransportLaws\> |
| `findFuneralHomes(lat, lng)` | Find nearby funeral homes | Promise\<FuneralHome[]\> |
| `generateServiceOutline(...)` | Generate funeral service | Promise\<string\> |
| `generateSupportShareMessage(...)` | Draft share message | Promise\<string\> |

---

## Response Types

### ProbateInfo

```typescript
{
  requirements: string;    // Summary of requirements
  timeframe: string;        // Expected timeline
  documents: string[];      // Required documents
  notes?: string;          // Additional notes
}
```

### TransportLaws

```typescript
{
  faaRegulations: string;
  airlineRequirements: string;
  funeralHomeRole: string;
  shippingRestrictions: string[];
}
```

---

## Gemini Models Used

| Model | Purpose |
|-------|---------|
| `gemini-2.5-flash` | General chat, Google Maps integration |
| `gemini-2.5-flash-preview-tts` | Text-to-speech |
| `gemini-3-pro-preview` | Complex reasoning, probate info |
| `gemini-2.0-flash-exp` | Fast responses, transport laws |

---

## Supabase Endpoints (Optional)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/support-requests` | POST | Create support request |
| `/support-requests/{id}` | GET | Fetch support request |
| `/support-requests/{id}` | PATCH | Update request status |

---

## Component Reference

### Main Components

| Component | Props | Purpose |
|-----------|-------|---------|
| `App` | - | Root component, manages view state |
| `SplashScreen` | `onComplete` | Loading screen with logo |
| `IntakeFlow` | `onComplete` | Multi-step onboarding form |
| `TransitionView` | `userState`, `onComplete` | Transition with TTS welcome |
| `Dashboard` | `userState`, `tasks`, `documentScans`, callbacks | Main app interface |

### Dashboard Tabs

| Tab | Component | Purpose |
|-----|-----------|---------|
| OVERVIEW | `BentoGridOverview` | Stats and quick actions |
| TASKS | `DelegationHub` | Task management |
| VAULT | `SmartVault` | Document scanning |
| ASSIST | `CompassionateAssistant` | AI chat interface |
| TRANSPORT | `TransportNavigator` | Transport regulations |
| RESOLUTION | `ResolutionReport` | Completion report |
| SUPPORT | `SupportCircleDashboard` | Support coordination |

### UI Components

| Component | Purpose |
|-----------|---------|
| `PlaceholdersAndVanishInput` | Animated text input with placeholders |
| `ColourfulText` | Animated gradient text |
| `AuroraBackground` | Animated aurora background |
| `FloatingDock` | Bottom navigation dock (mobile) |
| `BentoGrid` | Bento grid layout |
| `MultiStepLoader` | Loading animation |

---

## Related

- [Data Models](02-data-models.md)
- [Security](04-security.md)
- [Troubleshooting Gemini](../runbooks/troubleshooting-gemini.md)

<!--
SEARCH: api gemini endpoints functions models supabase components reference
-->
