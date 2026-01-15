---
title: "How to recover encrypted data"
type: runbook
status: draft
last_updated: 2025-12-27
audience: support
tags:
  - recovery
  - encryption
  - data
related:
  - "../SSOT/04-security.md"
---

# How to recover encrypted data

TODO: This runbook is a stub. Content to be added.

## Prerequisites

- User's encryption password
- Access to localStorage
- Backup of encrypted data (if available)

## Recovery Steps

1. Access browser localStorage
2. Locate encrypted data keys:
   - `userState`
   - `documentScans`
   - `tasks`
   - `serviceOutline`
3. Use `decryptObject()` with password
4. Verify data integrity

## Common Issues

### Incorrect Password
- Cannot decrypt without correct password
- Zero-knowledge architecture means no recovery option

### Corrupted Data
- Check if data structure is valid
- May need to restore from backup

## Related

- [Security Reference](../SSOT/04-security.md)
- [Data Models](../SSOT/02-data-models.md)

<!--
SEARCH: data recovery encrypted decrypt password localstorage backup restore
-->
