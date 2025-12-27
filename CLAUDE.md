# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lighthouse is a compassionate AI-powered application designed to support individuals during the bereavement process. It helps users navigate the complex legal, logistical, and emotional tasks that follow the loss of a loved one.

## Architecture

### Tech Stack
- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Motion**: Framer Motion (`motion` package)
- **3D Graphics**: Three.js with React Three Fiber
- **API Integration**: Google Gemini AI API
- **Icons**: Lucide React & Tabler Icons

### Project Structure
```
lighthouse 2/
├── components/           # React components
│   ├── Dashboard.tsx     # Main dashboard view with tabs
│   ├── IntakeFlow.tsx    # Multi-step onboarding flow
│   ├── SmartVault.tsx    # Document management
│   ├── CompassionateAssistant.tsx  # AI chat interface
│   └── DelegationHub.tsx # Task delegation system
├── services/
│   └── geminiService.ts  # Gemini API integration
├── types.ts              # TypeScript interfaces and enums
├── constants.ts          # Application constants and mock data
├── App.tsx               # Main application component
└── vite.config.ts        # Vite configuration with environment variables
```

### Key Components

1. **App.tsx**: Root component managing view state (INTAKE vs DASHBOARD) and user state
2. **IntakeFlow**: Multi-step form collecting user information with trauma-informed design
3. **Dashboard**: Tabbed interface with three main sections:
   - Smart Vault: Document management and scanning
   - Restoration Plan: Task management with prioritization
   - Compassionate Guide: AI-powered chat assistant

### State Management
- User state is managed through React useState hooks
- Application state includes:
  - User information (name, relationship, safety status)
  - Deceased details (name, location, veteran status)
  - User's cognitive state (brain fog level 1-5)
  - Tasks and documents

## Development Commands

### From root directory:
```bash
cd "lighthouse 2"
npm install           # Install dependencies
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Environment Setup
- Create `.env.local` file in the `lighthouse 2` directory
- Set `GEMINI_API_KEY` with your Google Gemini API key
- The vite.config.ts automatically loads this environment variable

### Key Features
- **Trauma-informed UI**: Adjusts complexity based on user's cognitive state
- **AI Integration**: Uses Gemini API for document analysis and chat assistance
- **Task Management**: Categorizes tasks by priority (URGENT, HIGH, NORMAL, LOW)
- **Document Processing**: Scans and analyzes legal documents
- **Delegation System**: Allows task delegation to support network

## Important Notes

- The application uses `@` path alias for imports (configured in vite.config.ts)
- All AI API calls go through `geminiService.ts`
- User's brain fog level (1-5) affects UI complexity and task prioritization
- The app follows a progressive disclosure pattern to reduce cognitive load