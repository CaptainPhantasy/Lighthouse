---
title: "Developer Onboarding"
type: guide
status: stable
last_updated: 2025-12-27
audience: developer
tags:
  - onboarding
  - setup
related:
  - "../SSOT/01-architecture.md"
  - "adding-features.md"
---

# Developer Onboarding

Welcome to Lighthouse! This guide will help you get set up and familiar with the codebase.

## Prerequisites

- **Node.js**: 22.x LTS (check with `node --version`)
- **npm**: 10.x or later (check with `npm --version`)
- **Git**: For version control

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd lighthouse
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root:

```bash
echo "GEMINI_API_KEY=your_key_here" > .env.local
```

You'll need a Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Project Structure

```
lighthouse/
├── components/       # React components
│   ├── Dashboard.tsx
│   ├── IntakeFlow.tsx
│   └── ...
├── services/         # API integrations
│   └── geminiService.ts
├── hooks/           # Custom React hooks
│   └── useSpeechToText.ts
├── utils/           # Utility functions
│   └── encryption.ts
├── contexts/        # React contexts
│   └── ThemeContext.tsx
├── types.ts         # TypeScript definitions
├── constants.ts     # App constants
└── App.tsx          # Root component
```

---

## Key Concepts

### Trauma-Informed Design

Lighthouse serves users during bereavement. Keep in mind:
- Users may have cognitive impairment ("brain fog")
- Even small decisions can feel overwhelming
- Compassionate language is essential
- Progressive disclosure reduces cognitive load

### AI-First Architecture

- Gemini AI is the primary interface, not just a feature
- Voice-first interaction is preferred over typing
- AI should shoulder the cognitive burden

### Color Scheme Constraints

**Critical**: No purple, pink, indigo, violet, or colorful gradients.

Use only:
- **Light mode**: white, black, stone grays
- **Dark mode**: black, white, stone grays
- **Accents**: green (success), amber (warning), red (error), blue (info)

---

## Development Workflow

### Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes following existing patterns
3. Test locally: `npm run dev`
4. Run tests: `npm test`
5. Commit and push

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add comments for complex logic
- Update documentation as needed

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests once
npx vitest run

# Run tests with coverage
npx vitest run --coverage
```

---

## Common Tasks

### Adding a New Component

1. Create in `components/`
2. Follow existing component patterns
3. Add TypeScript props interface
4. Support dark mode with `dark:` classes

### Adding a New API Function

1. Add to `services/geminiService.ts`
2. Export with proper types
3. Handle errors gracefully
4. Add to API Reference documentation

### Updating Types

1. Edit `types.ts`
2. Export new interfaces
3. Update related components
4. Update Data Models documentation

---

## Getting Help

- **Architecture questions**: See [SSOT/01-architecture.md](../SSOT/01-architecture.md)
- **API issues**: Check [SSOT/03-api-reference.md](../SSOT/03-api-reference.md)
- **Deployment problems**: Read [SSOT/05-deployment.md](../SSOT/05-deployment.md)
- **Troubleshooting**: See [Runbooks](../runbooks/)

---

## Related

- [Adding Features](adding-features.md)
- [Testing Guide](testing.md)
- [Voice-First Patterns](voice-first-patterns.md)

<!--
SEARCH: onboarding setup getting started development environment install
-->
