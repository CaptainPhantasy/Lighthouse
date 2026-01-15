---
title: "Deployment Reference"
type: ssot
status: stable
last_updated: 2025-12-27
audience: developer
tags:
  - deployment
  - build
  - environment
related:
  - "04-security.md"
  - "../runbooks/deployment.md"
---

# Deployment Reference

## Build Commands

```bash
# Development
npm run dev          # Start dev server on :3000

# Production
npm run build        # Build to ./dist
npm run preview      # Preview production build
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | - | Google Gemini API key |
| `VITE_SUPABASE_URL` | No | - | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No | - | Supabase anonymous key |

### Setup

```bash
# Create .env.local
echo "GEMINI_API_KEY=your_key_here" > .env.local
```

---

## Deployment Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| Vercel | ✅ Recommended | Auto-detects Vite config |
| Netlify | ✅ Supported | Use `dist` directory |
| Cloudflare Pages | ✅ Supported | Use `dist` directory |
| AWS S3 + CloudFront | ✅ Supported | Static site hosting |

---

## Platform-Specific Setup

### Vercel

1. Connect your GitHub repository
2. Import the project
3. Add `GEMINI_API_KEY` in environment variables
4. Deploy

### Netlify

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add `GEMINI_API_KEY` in environment variables
5. Deploy

### Cloudflare Pages

1. Create a new project
2. Connect your Git repository
3. Build command: `npm run build`
4. Build output directory: `dist`
5. Add `GEMINI_API_KEY` in environment variables
6. Deploy

### AWS S3 + CloudFront

1. Build locally: `npm run build`
2. Upload `dist/` contents to S3 bucket
3. Configure CloudFront distribution
4. Set up custom domain (optional)
5. Configure environment variables at build time

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npm test`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Environment variables configured
- [ ] Sensitive data not in code
- [ ] Bundle size acceptable

### Post-Deployment

- [ ] HTTPS enabled
- [ ] Error tracking configured (optional)
- [ ] Analytics configured (optional)
- [ ] Critical paths tested (intake, dashboard)

### Security Verification

- [ ] `GEMINI_API_KEY` set in environment
- [ ] No API keys in client code
- [ ] HTTPS enforced
- [ ] CSP headers configured (if applicable)

---

## Troubleshooting

### Build Failures

- Check Node.js version (use 22 LTS)
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for missing environment variables

### Runtime Issues

- Verify API keys are set
- Check browser console for errors
- Verify HTTPS is enabled
- Check localStorage permissions

---

## Related

- [Security Reference](04-security.md)
- [Deployment Runbook](../runbooks/deployment.md)
- [Developer Onboarding](../guides/developer-onboarding.md)

<!--
SEARCH: deployment build vercel netlify cloudflare aws environment variables production
-->
