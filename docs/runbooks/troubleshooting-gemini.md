---
title: "How to verify Gemini API connectivity and resolve API issues"
type: runbook
status: draft
last_updated: 2025-12-27
audience: support
tags:
  - gemini
  - api
  - troubleshooting
related:
  - "../SSOT/03-api-reference.md"
  - "../incidents/"
---

# How to verify Gemini API connectivity and resolve API issues

TODO: This runbook is a stub. Content to be added.

## Symptoms

- API calls failing
- Empty responses from Gemini
- Authentication errors
- Rate limit errors

## Troubleshooting Steps

1. Verify API key is set
2. Check API key validity
3. Verify network connectivity
4. Check rate limits
5. Review error messages

## Common Issues

### 401 Unauthorized
- API key is missing or invalid
- Check `GEMINI_API_KEY` environment variable

### 429 Rate Limit
- Too many requests
- Implement exponential backoff

### 500 Server Error
- Gemini API outage
- Check [Google Cloud Status](https://status.cloud.google.com/)

## Related

- [API Reference](../SSOT/03-api-reference.md)
- [Deployment Runbook](deployment.md)

<!--
SEARCH: gemini api troubleshooting connectivity error 401 429 500 rate limit
-->
