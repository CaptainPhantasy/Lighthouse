---
title: "ADR 001 - AI-First Architecture"
type: decision
status: accepted
last_updated: 2025-12-27
audience: developer
tags:
  - architecture
  - ai
  - gemini
related:
  - "../SSOT/01-architecture.md"
---

# ADR 001 - AI-First Architecture

## Status

**Accepted**

## Context

Lighthouse serves grieving users who are experiencing cognitive impairment ("brain fog"), emotional overwhelm, and navigating complex legal/financial tasks they've never faced before.

Traditional apps assume users can:
- Read and process information quickly
- Navigate complex UIs
- Fill out forms accurately
- Remember multi-step processes

These assumptions don't hold for grieving users.

## Decision

Lighthouse will use an **AI-first architecture** where Google Gemini AI is the primary interface, not just a feature.

### Key Implications

1. **Voice-first interaction**: Speaking is easier than typing when grieving
2. **AI as guide**: The app feels like a companion, not a tool
3. **Progressive disclosure**: AI determines what to show based on context
4. **Cognitive burden on AI**: The AI does the heavy thinking, not the user

### Technical Choices

| Choice | Rationale |
|--------|-----------|
| Gemini 2.5 Flash | Fast, multimodal, cost-effective |
| Real-time voice API | Natural conversation flow |
| Context-aware responses | AI adapts to user's state |

## Consequences

### Positive

- Lower cognitive load for users
- More compassionate user experience
- AI can prioritize tasks dynamically
- Voice input reduces typing burden

### Negative

- Dependence on external AI service
- API costs at scale
- Potential for AI errors
- Requires internet connectivity

### Mitigations

- Graceful fallbacks for AI failures
- Cost monitoring and limits
- Clear indication when AI is uncertain
- Offline mode for critical functions (future)

## Alternatives Considered

### Traditional Form-Based UI
- **Rejected**: Too much cognitive burden
- **Reason**: Grieving users struggle with complex forms

### Menu-Driven Navigation
- **Rejected**: Requires users to know what they need
- **Reason**: Users don't know what's required after death

### Hybrid: AI + Traditional UI
- **Partially adopted**: AI guides, but UI remains accessible
- **Reason**: Some users prefer reading over listening

## Related

- [Voice-First Patterns](../guides/voice-first-patterns.md)
- [Comprehensive Overhaul Plan](../SSOT/01-architecture.md#comprehensive-overhaul-plan)

<!--
SEARCH: ai first architecture gemini voice decision adr why choices
-->
