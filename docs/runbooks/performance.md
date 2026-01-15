---
title: "How to debug performance issues"
type: runbook
status: draft
last_updated: 2025-12-27
audience: support
tags:
  - performance
  - debugging
related:
  - "../SSOT/01-architecture.md"
---

# How to debug performance issues

TODO: This runbook is a stub. Content to be added.

## Symptoms

- Slow page loads
- Laggy interactions
- High memory usage
- Janky animations

## Debugging Steps

1. Open DevTools Performance tab
2. Record user interaction
3. Analyze flame graph
4. Identify bottlenecks

## Common Issues

### Large Bundle Size
- Code splitting not configured
- Large dependencies
- Unused imports

### Re-renders
- Missing React.memo
- Unnecessary state updates
- Props changing frequently

### API Latency
- Slow Gemini responses
- Network issues
- No caching implemented

## Related

- [Architecture Reference](../SSOT/01-architecture.md)
- [API Reference](../SSOT/03-api-reference.md)

<!--
SEARCH: performance debugging slow load laggy memory bundle optimization
-->
