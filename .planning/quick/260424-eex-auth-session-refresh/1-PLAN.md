---
phase: quick-260424-eex-auth-session-refresh
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
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
autonomous: true
requirements: [AUTH-SESSION-LIFETIME, AUTH-REFRESH-RESILIENCE]
---

<objective>
Investigate why users are being logged out too quickly on the Mac deployment, set the access token lifetime to one day, and make the web client use refresh tokens automatically so active sessions do not drop on normal access-token expiry.
</objective>

<diagnosis>

- `apps/api/src/config/index.ts` defaults `JWT_ACCESS_EXPIRY` to `15m`.
- The local `.env` currently sets `JWT_ACCESS_EXPIRY` to `60m`, but production mode does not load `.env` automatically.
- `ecosystem.config.js` starts the API with `NODE_ENV=production` and does not provide token lifetime env vars, so PM2-style starts can fall back to the 15-minute default unless the shell environment provides every value.
- `docker-compose.yml` passes `JWT_SECRET` but does not pass `JWT_ACCESS_EXPIRY` or `JWT_REFRESH_EXPIRY`, so compose deployments also fall back to code defaults.
- The web client dispatches logout on any API 401 and does not attempt `/api/auth/refresh`, so ordinary access-token expiry becomes a hard logout.
- Server-side refresh sessions are saved with a hard-coded seven-day DB expiry instead of deriving the expiry from the actual refresh token.

</diagnosis>

<tasks>

<task type="auto">
  <name>Task 1: Make server token lifetimes deployment-safe</name>
  <files>
    apps/api/src/config/index.ts
    apps/api/src/services/auth.service.ts
    apps/api/src/services/__tests__/auth.service.test.ts
    ecosystem.config.js
    docker-compose.yml
    .env.example
  </files>
  <action>
    Change the access-token default to one day, wire token expiry environment variables through production deployment config, and make session DB expiry follow the refresh token's JWT exp claim.
  </action>
  <verify>
    <automated>pnpm --filter @mockup-ai/api test -- src/services/__tests__/auth.service.test.ts</automated>
    <automated>pnpm --filter @mockup-ai/api type-check</automated>
  </verify>
</task>

<task type="auto">
  <name>Task 2: Refresh expired access tokens automatically in the web app</name>
  <files>
    apps/web/src/lib/api.ts
    apps/web/src/components/providers/auth-provider.tsx
    apps/web/src/stores/auth.store.ts
    apps/web/src/app/projects/[id]/history/page.tsx
    apps/web/src/app/projects/[id]/sketch-to-real/page.tsx
    apps/web/src/app/projects/[id]/ip-change/page.tsx
    apps/web/src/app/projects/[id]/generations/[genId]/page.tsx
  </files>
  <action>
    Add a shared authenticated fetch path that refreshes and retries once on 401, add an AuthProvider scheduler that refreshes shortly before access-token expiry, and move direct protected fetches onto the shared helper.
  </action>
  <verify>
    <automated>pnpm --filter @mockup-ai/web type-check</automated>
  </verify>
</task>

</tasks>

<success_criteria>

- Access tokens default to one day in app config and deployment examples.
- Production deployment configs explicitly pass `JWT_ACCESS_EXPIRY` and `JWT_REFRESH_EXPIRY`.
- Refresh session rows expire when the actual refresh JWT expires, avoiding drift from configuration.
- API requests that get a 401 refresh tokens and retry once before logging the user out.
- Hydrated browser sessions refresh before access-token expiry while the user keeps the app open.

</success_criteria>
