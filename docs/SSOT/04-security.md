---
title: "Security Reference"
type: ssot
status: stable
last_updated: 2025-12-27
audience: developer
tags:
  - security
  - encryption
  - privacy
related:
  - "02-data-models.md"
  - "05-deployment.md"
  - "../runbooks/data-recovery.md"
---

# Security Reference

## Encryption Flow

1. **Key Derivation**: PBKDF2 with 100,000 iterations
2. **Encryption**: AES-GCM (Galois/Counter Mode)
3. **Storage**: Encrypted data stored in localStorage

---

## Encryption Functions

```typescript
// Encrypt any object
encryptObject(data: any, password: string): Promise<EncryptionResult>

// Decrypt encrypted object
decryptObject(result: EncryptionResult, password: string): Promise<any>

// Sanitize PII before storage
sanitizeData(data: any): any
```

---

## Key Derivation

The encryption key is derived using PBKDF2 (Password-Based Key Derivation Function 2):

- **Algorithm**: PBKDF2
- **Iterations**: 100,000
- **Hash function**: SHA-256
- **Salt**: Randomly generated for each encryption

### Key Derivation Process

1. Generate random salt (16 bytes)
2. Derive key from password + salt using PBKDF2
3. Use derived key for AES-GCM encryption

---

## AES-GCM Encryption

- **Mode**: Gallois/Counter Mode (GCM)
- **Key length**: 256 bits
- **IV (Initialization Vector)**: 12 bytes, randomly generated
- **Authentication tag**: 16 bytes (built into GCM)

### Encryption Result Structure

```typescript
interface EncryptionResult {
  encrypted: string;  // Base64 encrypted data + auth tag
  iv: string;         // Base64 initialization vector
  salt: string;       // Base64 salt for key derivation
}
```

---

## Security Best Practices

### Data Protection

- All sensitive data encrypted before localStorage
- PII sanitized from memory after processing
- No API keys in client code (use environment variables)
- HTTPS required for all API calls

### Password Handling

- Never store passwords in plain text
- Use derived keys, not the original password
- Clear password from memory after use

### API Security

| Practice | Implementation |
|----------|----------------|
| API Key Storage | Environment variables only |
| Data Transmission | HTTPS enforced |
| Sensitive Data | Encrypted before API calls |
| Logging | No sensitive data in logs |

---

## LocalStorage Security

### Encrypted Items

| Key | Content Type | Encrypted |
|-----|-------------|-----------|
| `userState` | Complete user state | Yes |
| `documentScans` | Uploaded documents | Yes |
| `tasks` | User tasks | Yes |
| `serviceOutline` | Generated service outline | Yes |
| `lighthouse_view` | Current view | No |
| `lighthouse_intake_step` | Current step | No |
| `lighthouse_intake_data` | Partial intake data | No |

### Data Sanitization

The `sanitizeData()` function removes sensitive fields before logging or processing:

- Names, addresses, phone numbers
- Financial information
- Medical information
- Deceased details

---

## Compliance Considerations

### Data Privacy

- Zero-knowledge encryption: server never sees plaintext
- Data stays client-side unless explicitly shared
- Users control their encryption keys

### Bereavement-Specific Considerations

- Death certificate information is sensitive
- Financial/insurance documents require protection
- Family contact information is private

---

## Related

- [Data Models](02-data-models.md)
- [Deployment](05-deployment.md)
- [Data Recovery Runbook](../runbooks/data-recovery.md)

<!--
SEARCH: security encryption aes-gcm pbkdf2 key derivation privacy zeroknowledge
-->
