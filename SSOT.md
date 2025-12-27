# Lighthouse - Single Source of Truth (SSOT)

**Last Updated**: 2025-12-27
**Version**: 1.0.0

This document is the technical reference for the Lighthouse application. All architectural decisions, data structures, APIs, and workflows are documented here.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Data Models](#data-models)
5. [Application State](#application-state)
6. [Intake Flow](#intake-flow)
7. [AI Services](#ai-services)
8. [Security](#security)
9. [Environment Variables](#environment-variables)
10. [Component Reference](#component-reference)
11. [API Endpoints](#api-endpoints)
12. [Deployment](#deployment)

---

## Project Overview

**Lighthouse** is a compassionate AI-powered application designed to support individuals during the bereavement process. It helps users navigate the complex legal, logistical, and emotional tasks that follow the loss of a loved one.

**Key Design Principles**:
- Trauma-informed UI adapts to user's cognitive state
- Voice-first accessibility throughout
- Zero-knowledge encryption for sensitive data
- Progressive disclosure to reduce cognitive load

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React | 19.0 | UI framework |
| Language | TypeScript | 5.x | Type safety |
| Build | Vite | 6.x | Build tool & dev server |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Motion | Framer Motion | 12.x | Animations (`motion` package) |
| 3D Graphics | Three.js | - | 3D rendering (via React Three Fiber) |
| AI | Google Gemini API | 2.5 flash | Multimodal AI |
| Icons | Lucide React | - | Icon library |
| Icons | Tabler Icons | - | Additional icons |
| State | React hooks | - | useState, useEffect, useRef |
| Encryption | Web Crypto API | - | SubtleCrypto for encryption/decryption |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Lighthouse App                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│  │  IntakeFlow │──│ Transition  │──│    Dashboard        │    │
│  │             │  │    View     │  │                     │    │
│  └─────────────┘  └─────────────┘  │ ┌─────┬─────┬─────┐ │    │
│                                  │ │ Vault│Tasks│Assist│ │    │
│                                  │ └─────┴─────┴─────┘ │    │
│                                  └─────────────────────┘    │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                          Services Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ geminiService │  │   encryption  │  │ supportRequest     │   │
│  │              │  │   utils      │  │   Service          │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                          External APIs                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │   Gemini AI  │  │   Supabase   │  │   Google Search    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### UserState

```typescript
interface UserState {
  // Identity
  name?: string;

  // Deceased Information
  deceasedName?: string;
  deceasedLocation?: 'HOME' | 'HOSPITAL' | 'OUT_OF_STATE';
  deathPronounced?: boolean;
  isVeteran?: boolean;

  // Service Preferences
  servicePreference?: 'SECULAR' | 'RELIGIOUS' | 'SPIRITUAL';
  serviceOutline?: string;

  // Cognitive State
  brainFogLevel?: number; // 1-5 scale

  // Safety
  isSafe?: boolean;
}
```

### IntakeStep (Enum)

```typescript
enum IntakeStep {
  SAFETY_CHECK = 'SAFETY_CHECK',    // Initial safety verification
  USER_INTRO = 'USER_INTRO',        // User introduces themselves (NEW)
  IMMEDIATE_STATUS = 'IMMEDIATE_STATUS', // Location of deceased
  LEGAL_TRIAGE = 'LEGAL_TRIAGE',    // Death pronouncement status
  IDENTITY = 'IDENTITY',            // Deceased's name & veteran status
  BRAIN_FOG = 'BRAIN_FOG',          // Cognitive state assessment
  COMPLETE = 'COMPLETE'             // Intake complete
}
```

### DocumentScan

```typescript
interface DocumentScan {
  id: string;
  file: File | string;
  documentType?: 'WILL' | 'INSURANCE' | 'ID' | 'OBITUARY' | 'OTHER';
  extractedData?: any | EncryptionResult; // Can be encrypted
  entities?: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
  summary?: string;
  tasks?: Task[];
  timestamp: Date;
}
```

### Task

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  category?: string;
  dueDate?: Date;
  assignedTo?: string; // Support circle member
  createdAt: Date;
}
```

### ChatMessage

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}
```

### EncryptionResult

```typescript
interface EncryptionResult {
  encrypted: string;  // Base64 encrypted data
  iv: string;         // Initialization vector
  salt: string;       // Salt for key derivation
}
```

---

## Application State

### Views (AppView Enum)

```typescript
enum AppView {
  INTAKE = 'INTAKE',           // Multi-step onboarding flow
  TRANSITION = 'TRANSITION',   // Transition screen after intake
  DASHBOARD = 'DASHBOARD',     // Main application dashboard
  VOLUNTEER = 'VOLUNTEER'      // Volunteer view for support tasks
}
```

### LocalStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `lighthouse_view` | AppView | Current view |
| `lighthouse_intake_step` | IntakeStep | Current intake step |
| `lighthouse_intake_data` | UserState (partial) | Intake form data |
| `userState` | UserState (encrypted) | Complete user state |
| `documentScans` | DocumentScan[] (encrypted) | Uploaded documents |
| `tasks` | Task[] (encrypted) | User tasks |
| `serviceOutline` | string (encrypted) | Generated service outline |

---

## Intake Flow

### Step Sequence

1. **SAFETY_CHECK** → Verify user is safe (911 if not)
2. **USER_INTRO** → Collect user's name with voice input option
3. **IMMEDIATE_STATUS** → Location of deceased (HOME/HOSPITAL/OUT_OF_STATE)
4. **LEGAL_TRIAGE** → Death pronouncement status (Yes/No)
5. **IDENTITY** → Deceased's full legal name + veteran status
6. **BRAIN_FOG** → Cognitive state (1-5 scale)
7. **COMPLETE** → Transition to dashboard

### Brain Fog Levels

| Level | Description | UI Adaptation |
|-------|-------------|---------------|
| 1-3 | Clear | Full features visible |
| 4-5 | Foggy | Simplified UI, hidden categories (paperwork, financial) |

---

## AI Services

### Gemini API Functions

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

### ProbateInfo Response

```typescript
{
  requirements: string;    // Summary of requirements
  timeframe: string;        // Expected timeline
  documents: string[];      // Required documents
  notes?: string;          // Additional notes
}
```

### TransportLaws Response

```typescript
{
  faaRegulations: string;
  airlineRequirements: string;
  funeralHomeRole: string;
  shippingRestrictions: string[];
}
```

---

## Security

### Encryption Flow

1. **Key Derivation**: PBKDF2 with 100,000 iterations
2. **Encryption**: AES-GCM (Galois/Counter Mode)
3. **Storage**: Encrypted data stored in localStorage

### Encryption Functions

```typescript
// Encrypt any object
encryptObject(data: any, password: string): Promise<EncryptionResult>

// Decrypt encrypted object
decryptObject(result: EncryptionResult, password: string): Promise<any>

// Sanitize PII before storage
sanitizeData(data: any): any
```

### Security Best Practices

- All sensitive data encrypted before localStorage
- PII sanitized from memory after processing
- No API keys in client code (use environment variables)
- HTTPS required for all API calls

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | - | Google Gemini API key |
| `VITE_SUPABASE_URL` | No | - | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No | - | Supabase anonymous key |

### Setup

```bash
# Create .env.local
echo "GEMINI_API_KEY=your_key_here" > .env.local
```

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

## API Endpoints

### Supabase (Optional)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/support-requests` | POST | Create support request |
| `/support-requests/{id}` | GET | Fetch support request |
| `/support-requests/{id}` | PATCH | Update request status |

### Gemini Models Used

| Model | Purpose |
|-------|---------|
| `gemini-2.5-flash` | General chat, Google Maps integration |
| `gemini-2.5-flash-preview-tts` | Text-to-speech |
| `gemini-3-pro-preview` | Complex reasoning, probate info |
| `gemini-2.0-flash-exp` | Fast responses, transport laws |

---

## Deployment

### Build Commands

```bash
# Development
npm run dev          # Start dev server on :3000

# Production
npm run build        # Build to ./dist
npm run preview      # Preview production build
```

### Deployment Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| Vercel | ✅ Recommended | Auto-detects Vite config |
| Netlify | ✅ Supported | Use `dist` directory |
| Cloudflare Pages | ✅ Supported | Use `dist` directory |
| AWS S3 + CloudFront | ✅ Supported | Static site hosting |

### Deployment Checklist

- [ ] Set `GEMINI_API_KEY` environment variable
- [ ] Configure build output directory (`dist`)
- [ ] Enable HTTPS
- [ ] Set up error tracking (optional)
- [ ] Configure analytics (optional)

---

## File Structure

```
lighthouse/
├── components/           # React components
│   ├── Dashboard.tsx     # Main dashboard
│   ├── IntakeFlow.tsx    # Onboarding flow
│   ├── TransitionView.tsx # Transition screen
│   ├── CompassionateAssistant.tsx # AI chat
│   ├── DelegationHub.tsx # Task management
│   ├── SmartVault.tsx    # Document scanning
│   ├── TransportNavigator.tsx # Transport guide
│   ├── LocalLegalGuide.tsx # Probate info
│   ├── ResolutionReport.tsx # Completion
│   ├── SupportCircleDashboard.tsx # Support coordination
│   ├── ui/               # UI components
│   └── ...
├── services/             # API and business logic
│   ├── geminiService.ts  # Gemini API integration
│   ├── supportRequestService.ts # Support requests
│   ├── supabaseClient.ts # Supabase client
│   └── encryption.ts     # Moved to utils/encryption.ts
├── utils/                # Utility functions
│   └── encryption.ts     # Encryption utilities
├── hooks/                # React hooks
│   └── useSpeechToText.ts # Speech recognition
├── contexts/             # React contexts
│   └── ThemeContext.tsx  # Dark/light mode
├── types.ts              # TypeScript interfaces & enums
├── constants.ts          # App constants
├── App.tsx               # Root component
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
└── index.html            # Entry HTML
```

---

## Color Scheme

**Strict Rule**: NO purple, pink, indigo, violet, or colorful gradients

### Light Mode
- Background: `white` (#FFFFFF)
- Text: `black` (#000000)
- Secondary: `stone` grays (#d6d3d4, #a8a29e, #78716c, #44403c, #292524)

### Dark Mode
- Background: `black` (#000000)
- Text: `white` (#FFFFFF)
- Secondary: `stone` grays (#e7e5e4, #d6d3d4, #a8a29e, #78716c, #44403c)

### Accent Colors
- Success: Green (#22c55e)
- Warning: Amber (#f59e0b)
- Error: Red (#ef4444)
- Info: Blue (#3b82f6)

---

## Change Log

### Version 1.0.0 (2025-12-27)

**Added**:
- USER_INTRO step to intake flow
- TTS welcome in TransitionView
- Proactive OUT_OF_STATE messaging
- Share Message drafting with Gemini
- JSON-structured responses for probate and transport data

**Fixed**:
- SmartVault camera lock (removed `capture="environment"`)
- TransportNavigator brittle regex parsing
- CompassionateAssistant speech recognition (now uses hook)
- Multiple TypeScript type errors

---

*This SSOT is maintained alongside the codebase. Any structural changes should be reflected here.*
