---
title: "Test Reports"
type: test-report
status: stable
last_updated: 2025-12-27
audience: developer
tags:
  - testing
  - reports
---

# Test Reports

This section contains test execution reports and results.

## Reports

| Date | Description | Status |
|------|-------------|--------|
| 2025-12-27 | [E2E Gemini AI Service Tests](2025-12-27-e2e-gemini.md) | ✅ Passed (10/10) |

## Running Tests

```bash
# Run all tests
npm test

# Run E2E tests
npx vitest tests/e2e-gemini.test.ts

# Run with coverage
npx vitest run --coverage
```

<!--
SEARCH: test reports e2e results coverage testing
-->
