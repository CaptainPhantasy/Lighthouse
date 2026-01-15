---
title: "Architecture Reference"
type: ssot
status: stable
last_updated: 2025-12-27
audience: developer
tags:
  - architecture
  - react
  - components
related:
  - "../guides/adding-features.md"
  - "02-data-models.md"
---

# Architecture Reference

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

## System Architecture

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

## Related

- [Data Models](02-data-models.md)
- [API Reference](03-api-reference.md)
- [Security](04-security.md)

<!--
SEARCH: architecture tech stack file structure color scheme tailwind dark mode
-->
