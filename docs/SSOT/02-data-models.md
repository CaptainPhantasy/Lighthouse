---
title: "Data Models Reference"
type: ssot
status: stable
last_updated: 2025-12-27
audience: developer
tags:
  - typescript
  - data-models
  - state
related:
  - "01-architecture.md"
  - "03-api-reference.md"
---

# Data Models Reference

## UserState

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

---

## IntakeStep (Enum)

```typescript
enum IntakeStep {
  SAFETY_CHECK = 'SAFETY_CHECK',    // Initial safety verification
  USER_INTRO = 'USER_INTRO',        // User introduces themselves
  IMMEDIATE_STATUS = 'IMMEDIATE_STATUS', // Location of deceased
  LEGAL_TRIAGE = 'LEGAL_TRIAGE',    // Death pronouncement status
  IDENTITY = 'IDENTITY',            // Deceased's name & veteran status
  BRAIN_FOG = 'BRAIN_FOG',          // Cognitive state assessment
  COMPLETE = 'COMPLETE'             // Intake complete
}
```

---

## DocumentScan

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

---

## Task

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

---

## ChatMessage

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}
```

---

## EncryptionResult

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

## Related

- [Architecture Reference](01-architecture.md)
- [API Reference](03-api-reference.md)
- [Security](04-security.md)

<!--
SEARCH: data models typescript interfaces userstate task document encryption localstorage
-->
