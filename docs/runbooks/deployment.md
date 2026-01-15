---
title: "How to deploy and rollback Lighthouse"
type: runbook
status: draft
last_updated: 2025-12-27
audience: support
tags:
  - deployment
  - rollback
related:
  - "../SSOT/05-deployment.md"
---

# How to deploy and rollback Lighthouse

TODO: This runbook is a stub. Content to be added.

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Bundle size acceptable
- [ ] No sensitive data in code

## Deployment Steps

### Vercel
1. Push to main branch
2. Auto-deployment triggers
3. Verify deployment

### Rollback Steps

1. Go to Vercel dashboard
2. Find previous successful deployment
3. Click "Promote to Production"

## Related

- [Deployment Reference](../SSOT/05-deployment.md)
- [Testing Guide](../guides/testing.md)

<!--
SEARCH: deployment rollback vercel netlify publish production
-->
