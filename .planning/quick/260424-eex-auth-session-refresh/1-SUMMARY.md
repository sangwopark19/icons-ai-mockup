---
phase: quick-260424-eex-auth-session-refresh
plan: 01
status: complete
subsystem: auth-session
tags: [auth, jwt, refresh-token, deployment, bug-fix]
dependency_graph:
  requires: []
  provides: [one-day-access-token-lifetime, automatic-refresh-token-renewal]
  affects: [api-config, auth-service, web-api-client, deployment-config]
tech_stack:
  added: []
  patterns: [jwt exp based session expiry, single-flight refresh retry, proactive client refresh]
key_files:
  created: []
  modified:
    - ecosystem.config.js
    - docker-compose.yml
    - .env.example
    - apps/api/src/config/index.ts
    - apps/api/src/services/auth.service.ts
    - apps/api/src/services/__tests__/auth.service.test.ts
    - apps/web/src/lib/api.ts
    - apps/web/src/components/providers/auth-provider.tsx
    - apps/web/src/stores/auth.store.ts
    - apps/web/src/app/projects/[id]/history/page.tsx
    - apps/web/src/app/projects/[id]/sketch-to-real/page.tsx
    - apps/web/src/app/projects/[id]/ip-change/page.tsx
    - apps/web/src/app/projects/[id]/generations/[genId]/page.tsx
decisions:
  - Access token lifetime defaults to one day to avoid short production fallbacks when deployment env vars are omitted.
  - Refresh token lifetime remains seven days but is sliding because each successful refresh rotates the refresh token and persists a new session.
  - Session `expiresAt` now derives from the refresh JWT `exp` claim so DB state cannot drift from `JWT_REFRESH_EXPIRY`.
  - The web client refreshes once and retries the original request on 401 before ending the session.
  - AuthProvider refreshes shortly before token expiry and on focus/visibility return when the token is close to expiry.
metrics:
  duration: 25 min
  completed: 2026-04-24
---

# Quick 260424-eex Plan 01 Summary

**One-liner:** Raised access tokens to one day, made refresh sessions match JWT expiry, and added automatic refresh/retry in the web client.

## Investigation

- Production defaults were risky: `JWT_ACCESS_EXPIRY` defaulted to `15m`, while local `.env` had `60m`.
- `NODE_ENV=production` does not load `.env` inside API config, so PM2-style starts can fall back to code defaults unless the process environment explicitly provides token lifetimes.
- Docker Compose passed `JWT_SECRET` but not `JWT_ACCESS_EXPIRY` or `JWT_REFRESH_EXPIRY`, so container deployments also used code defaults.
- The web client treated any 401 as a hard logout and never called `/api/auth/refresh` before redirecting.
- Runtime check did not find this repo currently listening on ports 3000/4000, so the deployed server still needs restart/rebuild after this patch is applied.

## Tasks Completed

| Task | Name                                            | Commit  | Files                                                                                   |
| ---- | ----------------------------------------------- | ------- | --------------------------------------------------------------------------------------- |
| 1    | Deployment-safe JWT lifetime and session expiry | e41c6ba | config/index.ts, auth.service.ts, docker-compose.yml, ecosystem.config.js, .env.example |
| 2    | Automatic web refresh and protected fetch retry | e41c6ba | api.ts, auth-provider.tsx, auth.store.ts, protected project pages                       |

## Verification

- `pnpm --filter @mockup-ai/api test` passed: 65 tests.
- `pnpm --filter @mockup-ai/api type-check` passed.
- `pnpm --filter @mockup-ai/web type-check` passed.
- `docker compose config | rg "JWT_ACCESS_EXPIRY|JWT_REFRESH_EXPIRY"` confirmed API and worker receive `1d` and `7d`.

## Operational Note

The local ignored `.env` was also updated to `JWT_ACCESS_EXPIRY="1d"`. Apply the patch and restart the running Mac deployment so the new server config and web bundle are loaded.
