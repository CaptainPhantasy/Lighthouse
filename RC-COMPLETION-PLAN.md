# RC Completion Plan — Lighthouse
Generated: 2026-03-08
Current Stage: BETA
Target Stage: Release Candidate
Verdict: GO-WITH-RISKS

## Summary
Lighthouse is a compassionate AI grief companion. It has the most differentiated risk profile of the six
because the user population is emotionally vulnerable. Standard RC criteria apply, but two categories
get elevated severity here: accessibility and privacy. A grief app that crashes, leaks data, or locks
out a user with a screen reader is not just a bug — it is a harm.

The repo is solid: git remote configured, CI workflow present, lint/type-check/test scripts wired,
Mapbox integration, dual-path onboarding with voice, encryption tests present. Only 2 test files found
though — coverage needs verification.

---

## BLOCKING ITEMS

### Privacy and Data Handling (elevated severity for this use case)
- [ ] **Audit what user data is stored and where**
  - Files: src/utils/encryption.ts (exists — good), any localStorage or IndexedDB usage
  - Command: grep -r "localStorage\|sessionStorage\|IndexedDB" src/ --include="*.ts" --include="*.tsx"
  - Validate: All grief session data is encrypted at rest, no PII in plaintext storage
  - Effort: 2 hours

- [ ] **Create PRIVACY.md**
  - File: PRIVACY.md (create)
  - Content: What data is collected, where it is stored (local only vs cloud), retention policy,
    how to delete all user data, no third-party data selling statement
  - Why: Non-negotiable for an app that handles grief journaling
  - Effort: 3 hours

- [ ] **Verify Mapbox API key is server-side or restricted**
  - Command: grep -r "pk\.eyJ\|MAPBOX_TOKEN" src/ --include="*.ts" --include="*.tsx"
  - Mapbox public tokens are client-safe only if domain-restricted in Mapbox dashboard
  - Validation: Token is restricted to your domain in Mapbox account settings
  - Effort: 1 hour

### Accessibility (elevated severity — grieving users may have impaired motor/visual function)
- [ ] **Run full accessibility audit**
  - Tool: npm install -D @axe-core/playwright or axe DevTools browser extension
  - Command: npx playwright test --grep accessibility (or manual audit)
  - Required: All interactive elements keyboard-navigable, ARIA labels on icons, color contrast >= 4.5:1
  - Effort: 1 day

- [ ] **Ensure voice intro/onboarding has text fallback**
  - File: src routes for dual-path onboarding
  - Validation: User can complete full onboarding without audio
  - Effort: 2 hours

### Testing
- [ ] **Verify coverage and expand to 60%+**
  - Current: 2 test files found (encryption.test.ts, e2e-gemini.test.ts)
  - Command: npm run test:coverage
  - Add tests for: onboarding flow, session data encryption/decryption, crisis resource routing
  - Effort: 2-3 days

- [ ] **Add crisis resource routing test**
  - File: tests/crisisRouting.test.ts (create)
  - Validate: When specific trigger phrases detected, app surfaces crisis resources correctly
  - This is not optional — it is a safety test
  - Effort: 4 hours

### Security
- [ ] **Run npm audit**
  - Command: npm audit --audit-level=high
  - Validation: No HIGH or CRITICAL vulnerabilities
  - Effort: 1 hour

- [ ] **Create .env.example**
  - File: .env.example
  - Content: VITE_MAPBOX_TOKEN=, VITE_GEMINI_API_KEY=, VITE_ELEVENLABS_API_KEY=
  - Validation: .env in .gitignore, .env.example committed
  - Effort: 15 min

### Documentation
- [ ] **Create docs/DEPLOYMENT.md**
  - Content: Build steps, required env vars, static hosting config (Vercel/Netlify/self-hosted)
  - Effort: 1.5 hours

- [ ] **Update README with crisis resource disclaimer**
  - Add: This app is a supportive companion, not a replacement for professional grief counseling
  - Add: Crisis hotlines (988, Crisis Text Line) visible on README
  - Effort: 30 min

---

## STRONGLY RECOMMENDED

- [ ] **Add session data export / delete feature**
  - User should be able to export their journal entries and delete all local data
  - Effort: 4 hours

- [ ] **Add content warnings / safe exit button**
  - Standard trauma-informed design: quick exit button, content warnings before heavy prompts
  - Effort: 3 hours

- [ ] **Rate limit Gemini API calls**
  - Grief sessions can be long and frequent — protect against API cost overruns
  - File: src/utils/apiClient.ts
  - Effort: 2 hours

---

## NICE TO HAVE

- [ ] Offline mode (IndexedDB journaling without LLM)
- [ ] Multi-language support
- [ ] Therapist referral integration

---

## ORDERED EXECUTION SEQUENCE

1. Create .env.example
2. Audit data storage — confirm encryption is complete
3. Verify Mapbox token is domain-restricted
4. Run npm audit — fix HIGH/CRITICAL
5. Create PRIVACY.md
6. Add crisis resource routing test
7. Run accessibility audit
8. Fix all accessibility blockers
9. Expand test coverage to 60%
10. Update README with crisis disclaimer
11. Create docs/DEPLOYMENT.md
12. git tag -a v1.0.0-rc1 -m "Release Candidate 1"

---

## RISK REGISTER

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Unencrypted grief journal data | Critical | Unknown | Audit encryption coverage immediately |
| App crashes during crisis moment | Critical | Possible | Add error boundary + offline fallback |
| Inaccessible to screen reader users | High | Possible | Full a11y audit before RC |
| Mapbox token exposed without domain restriction | Medium | Possible | Restrict in Mapbox dashboard |
| No crisis routing test — silent failure | High | Possible | Write safety test before RC |

---

## VALIDATION GATE

- [ ] npm run test:coverage >= 60%
- [ ] Crisis resource routing test passes
- [ ] npm run lint clean
- [ ] npm run type-check clean
- [ ] npm audit --audit-level=high — no findings
- [ ] All grief session data encrypted at rest (verified by encryption.test.ts)
- [ ] Full onboarding completable without audio
- [ ] axe accessibility audit — zero critical violations
- [ ] PRIVACY.md exists and complete
- [ ] .env.example exists
- [ ] README has crisis resource disclaimer
- [ ] CI workflow passes on current branch
