# Lighthouse - Single Source of Truth (SSOT)

**Last Updated**: 2025-12-27
**Version**: 2.0.0 - COMPREHENSIVE OVERHAUL PLAN INCLUDED

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
13. [Comprehensive Overhaul Plan](#comprehensive-overhaul-plan)

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

## Comprehensive Overhaul Plan

### Executive Summary

This plan addresses the fundamental issues with Lighthouse: broken theme system, lack of true AI-first/voice-first experience, and an onboarding flow that doesn't honor the grieving human experience. The goal is to rebuild this as a compassionate, voice-guided companion that uses Gemini AI to shoulder the cognitive burden during the most difficult time of a user's life.

---

### Part 1: Root Cause Analysis - Theme System

**The Problem:** Two disconnected theming systems
- **System A**: Tailwind's `dark:` prefix classes (require `<html class="dark">`)
- **System B**: Custom `ThemeContext` with `isDark` boolean (used in conditional `${isDark ? '...' : '...'}` expressions)

**What Happened:** The ThemeContext IS working correctly and DOES toggle the `dark` class on the HTML element. However, previous "fixes" replaced existing Tailwind `dark:` classes with manual conditionals that read from `useTheme()`. This created a race condition where some components use `dark:` classes (Tailwind native) and others use `${isDark ? ...}` conditionals (custom).

**The Real Fix:** Choose ONE system and apply it consistently. The correct approach is **Tailwind's native `dark:` prefix classes** because:
- The ThemeContext already manages the HTML `dark` class correctly
- It's simpler and more maintainable
- It's what Tailwind is designed for

```tsx
// REMOVE all manual ThemeContext conditionals like:
className={`${isDark ? 'bg-stone-800 text-white' : 'bg-white text-black'}`}

// REPLACE with Tailwind dark mode prefixes consistently:
className="bg-white dark:bg-stone-900 text-black dark:text-white"
```

**Files to Modify for Theme Fix:**
- `components/SmartVault.tsx`
- `components/CompassionateAssistant.tsx`
- `components/SupportCircleDashboard.tsx`
- `components/LocalLegalGuide.tsx`
- `components/ResolutionReport.tsx`
- `components/TransitionView.tsx`
- `components/IntakeFlow.tsx`
- `components/DelegationHub.tsx`
- `components/Dashboard.tsx`
- `components/ui/bento-grid.tsx`

---

### Part 2: User-Centered Design Philosophy

**A grieving user who just lost a loved one is experiencing:**
- Cognitive impairment ("brain fog") - difficulty processing complex information
- Emotional overwhelm - even small decisions feel impossible
- Time pressure - many arrangements must be made quickly
- Financial and legal complexity they've likely never navigated before
- Social expectations around funeral planning they may not understand

**What They Need:**
1. A **guide**, not a tool
2. **Voice-first** interaction - speaking is easier than typing when grieving
3. **Progressive disclosure** - only show what's necessary right now
4. **Compassionate AI** that understands context and adapts
5. **Minimal cognitive load** - the AI should do the heavy thinking

---

### Part 3: Reimagined Onboarding Flow

**Current State Problems:**
1. Too many abstract questions upfront - "brain fog level 1-5" feels clinical
2. No voice guidance - user has to read and type everything
3. No AI presence during onboarding - feels like a form, not a companion
4. Information asked but not used contextually

**New Onboarding Philosophy: "The AI Companion"**

#### Stage 1: Voice Greeting & Listening (AI-First Entry Point)

Instead of immediately asking questions, the AI should:
- Speak a greeting: "I'm Lighthouse. I'm here to help you through this difficult time. Whenever you're ready, you can speak to me. I'll listen, and I'll help you understand what needs to be done."
- Show pulsing microphone (always ready to listen)
- Allow natural speech input: "My mother passed away this morning at home."
- Respond compassionately: "I'm so sorry for your loss. Let me help you understand what's happening right now..."

#### Stage 2: Conversational Information Gathering (Guided Conversation)

The AI asks questions **conversationally** following a structured script while feeling natural. Each question is:
1. **Asked by voice** (text also shown)
2. **Answered by voice** (typing available as backup)
3. **Used immediately** to provide relevant guidance

**Required Questions (in conversational script):**

| Question | Why It Matters | AI Action |
|----------|----------------|-----------|
| "What was your loved one's name?" | Personalization | Use name throughout |
| "Where did they pass?" (home/hospital/elsewhere) | Immediate next steps | Provide specific guidance |
| "Has a doctor or medical professional confirmed the death?" | Legal requirement | Explain pronouncement process |
| "Are there any religious or cultural practices I should know about?" | Funeral planning | Suggest appropriate options |
| "Is there family who can help with decisions?" | Support network | Offer delegation features |

**Cognitive State Inference (NOT asked explicitly):**
- Monitor response latency
- Track voice pattern hesitations
- Observe task completion patterns
- Note if user asks for clarification repeatedly
- Detect signs of overwhelm (repeated same questions, long pauses)
- Automatically simplify UI when indicators suggest high cognitive load

#### Stage 3: Immediate Action Plan

Before entering the main app, the AI should provide:
```
"Based on what you've shared, here's what needs attention right now:

[Most Urgent] - Death pronouncement and documentation
[Within 24 hours] - Contact funeral home
[This Week] - Gather important documents

I'll help you with each of these. You can talk to me anytime by tapping
the microphone at the bottom. I'll be here."
```

---

### Part 4: AI-First / Voice-First Implementation

**What "AI-First" Actually Means:**
- **Current State:** AI is used as a feature (chat, document scan)
- **AI-First State:** AI is the primary interface

**Concrete Changes:**

1. **Persistent AI Presence**
   - AI avatar always visible (subtle, non-intrusive)
   - Voice greeting on app open: "I'm here. What do you need?"
   - Proactive check-ins: "It's been a few hours. How are you doing?"

2. **Voice-First Navigation**
   - "Show me what needs to be done today" → Shows prioritized tasks
   - "Help me find funeral homes near me" → Opens Transport Navigator
   - "Read me the task about insurance" → AI reads and explains
   - "I'm feeling overwhelmed" → AI simplifies view, shows breathing exercise

3. **Gemini AI as the "Brain"**
   - **Document Understanding**: Scan ANY document, AI explains what it is and what to do
   - **Task Prioritization**: AI dynamically adjusts task priority based on user's situation
   - **Eulogy Assistant**: AI gathers memories through conversation, drafts service outline
   - **Legal Guide**: AI explains probate/death certificate process in plain language
   - **Emotional Support**: AI recognizes distress, provides grounding techniques

---

### Part 5: Technical Implementation Plan

#### Phase 1: Fix Theme System (Week 1, 2-3 days)
- Replace all `${isDark ? ...}` with `dark:` prefixes
- Test thoroughly
- Verify toggle works everywhere

#### Phase 2: Redesign Onboarding as AI-First Experience (Week 2, 5 days)

**New File Structure:**
```
components/onboarding/
├── VoiceIntro.tsx          # Initial AI greeting, always-listening mic
├── ConversationFlow.tsx   # AI-driven conversational question asking
├── ImmediateGuidance.tsx  # AI's action plan based on situation
└── OnboardingComplete.tsx  # Handoff to main app
```

**Key Implementation:**
- **VoiceIntro.tsx**: Pulsing microphone, auto-starts listening, AI speaks greeting
- **ConversationFlow.tsx**: Uses Gemini `connectLiveSession` for real-time voice conversation
- Information extracted from conversation stored in UserState, no re-asking

#### Phase 3: Persistent AI Companion (Week 3, 5 days)

**New Component: `AIAvatar.tsx`**
- Subtle visual presence (not intrusive)
- Shows "thinking" when AI is processing
- Pulsing gently when listening
- Click to talk (opens voice input)

**Voice Command System:**
```typescript
// Commands to support:
"Show me my tasks" → Opens Plan tab
"Help me with {document type}" → Opens Smart Vault
"I need to delegate {task}" → Opens Delegation Hub
"Read me the checklist" → AI reads current priorities
"I'm overwhelmed" → Simplifies UI, shows breathing
"What do I do about {situation}" → AI provides specific guidance
```

#### Phase 4: AI-Powered Task Intelligence (Week 3-4)

**Enhance `geminiService.ts` with:**
```typescript
// Context-Aware Task Prioritization
export async function getPrioritizedGuidance(userState: UserState) {
  // AI analyzes entire situation and returns:
  // - What's most urgent right now
  // - What can wait
  // - What the user is forgetting
  // - What they don't know they need
}

// Proactive Notifications
export async function checkForProactiveGuidance(userState: UserState) {
  // AI checks if user is missing something important
  // Returns gentle reminder if needed
}

// Memory Gathering Service
export async function gatherMemories(conversation: string[]) {
  // AI extracts memories from conversation
  // Organizes by theme
  // Suggests eulogy content
}
```

#### Phase 5: Polish & Integration (Week 4, 5 days)
- End-to-end testing
- Compassionate language review
- Performance optimization
- Accessibility audit

---

### Part 6: Complete Feature Mapping

| Category | User Need | AI Solution |
|----------|-----------|-------------|
| **Immediate** | Death pronouncement | AI explains who to call, what forms needed |
| **Immediate** | Body transport | AI finds funeral homes, explains process |
| **Immediate** | Death certificates | AI provides county-specific info |
| **This Week** | Notify people | AI drafts notifications, tracks contacts |
| **This Week** | Funeral planning | AI gathers preferences, suggests options |
| **This Week** | Document gathering | AI scans & explains, creates checklist |
| **Ongoing** | Financial tasks | AI identifies accounts, explains claims |
| **Ongoing** | Legal/Probate | AI simplifies process, finds local resources |
| **Emotional** | Memories/Eulogy | AI gathers stories, drafts service |
| **Social** | Support coordination | AI helps delegate tasks to family |

---

### Part 7: Success Criteria

#### Theme System
- [ ] All components use Tailwind `dark:` prefix consistently
- [ ] Theme toggle works instantly across entire app
- [ ] No hardcoded colors without dark variants
- [ ] Tested in both light and dark modes

#### AI-First Experience
- [ ] AI speaks on first open
- [ ] Voice is primary input method
- [ ] AI proactively offers help
- [ ] Natural conversation, not form-filling

#### Onboarding
- [ ] No redundant questions
- [ ] Information collected once, used everywhere
- [ ] User understands what to do immediately
- [ ] Feels like a companion, not a tool

#### Compassionate UX
- [ ] Acknowledges grief throughout
- [ ] Simplifies when overwhelmed
- [ ] Never judgmental
- [ ] Respects user's pace

---

### Part 8: Files Requiring Major Changes

**Delete/Replace:**
- `components/IntakeFlow.tsx` → Replace with new onboarding flow
- `components/TransitionView.tsx` → Integrate into new onboarding

**Major Enhancements:**
- `components/CompassionateAssistant.tsx` → Make it the primary interface
- `services/geminiService.ts` → Add proactive AI features
- `components/Dashboard.tsx` → Add AI avatar, voice trigger

**Theme Fixes:**
- All component files (see Phase 1 list above)

---

### The Vision

Lighthouse should feel like **a knowledgeable friend sitting beside you**, someone who:
- Understands what you're going through
- Knows what needs to be done
- Does the heavy thinking for you
- Speaks when spoken to
- Never judges, never rushes

The technology (Gemini AI, voice, theme system) should be **invisible**. What the user experiences is **support**.

---

## Change Log

### Version 2.0.0 (2025-12-27)

**Added:**
- Comprehensive Overhaul Plan section documenting:
  - Theme system root cause analysis and fix strategy
  - User-centered design philosophy for grieving users
  - Reimagined AI-first, voice-first onboarding flow
  - Technical implementation plan across 5 phases
  - Complete feature mapping and success criteria

**Version 1.0.0 (2025-12-27)**

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
