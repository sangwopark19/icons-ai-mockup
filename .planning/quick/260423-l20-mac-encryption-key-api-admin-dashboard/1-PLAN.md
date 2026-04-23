---
phase: quick-260423-l20-mac-encryption-key-api-admin-dashboard
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - docker-compose.yml
  - apps/api/src/config/index.ts
  - apps/api/src/lib/crypto.ts
  - apps/api/src/lib/__tests__/crypto.test.ts
  - apps/api/src/services/admin.service.ts
  - apps/api/src/services/__tests__/admin.service.test.ts
  - apps/web/src/app/admin/dashboard/page.tsx
  - README.md
  - docs/QUICK_START.md
  - .gitignore
  - .env.example
autonomous: true
requirements: [DEPLOY-ENCRYPTION-KEY, ADMIN-DASHBOARD-RESILIENCE]
---

<objective>
Fix production admin API key registration failing with "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)" and prevent the admin dashboard from staying blank when one dashboard API request fails.
</objective>

<tasks>

<task type="auto">
  <name>Task 1: Wire and validate ENCRYPTION_KEY for production API key encryption</name>
  <files>
    docker-compose.yml
    apps/api/src/config/index.ts
    apps/api/src/lib/crypto.ts
    apps/api/src/lib/__tests__/crypto.test.ts
    README.md
    docs/QUICK_START.md
    .gitignore
    .env.example
  </files>
  <action>
    Pass ENCRYPTION_KEY into the api and worker containers, validate it as a 64-character hex string at startup, document how to generate it, and add a tracked .env.example.
  </action>
  <verify>
    <automated>pnpm --filter @mockup-ai/api test -- src/lib/__tests__/crypto.test.ts</automated>
  </verify>
</task>

<task type="auto">
  <name>Task 2: Keep admin dashboard visible when partial data loading fails</name>
  <files>
    apps/api/src/services/admin.service.ts
    apps/api/src/services/__tests__/admin.service.test.ts
    apps/web/src/app/admin/dashboard/page.tsx
  </files>
  <action>
    Make queue-depth lookup non-fatal for dashboard stats and split frontend stats/chart request handling so one failed request does not leave the whole dashboard in perpetual skeleton loading.
  </action>
  <verify>
    <automated>pnpm --filter @mockup-ai/api test -- src/services/__tests__/admin.service.test.ts</automated>
    <automated>pnpm --filter @mockup-ai/api type-check</automated>
    <automated>pnpm --filter @mockup-ai/web type-check</automated>
  </verify>
</task>

</tasks>

<success_criteria>

- docker compose injects ENCRYPTION_KEY into both api and worker services.
- API startup fails fast when ENCRYPTION_KEY is missing or not 64 hex characters.
- API key encryption rejects non-hex values deterministically.
- Dashboard stats still render if queue count lookup fails.
- Dashboard page shows a visible error state instead of staying blank/skeleton forever when stats or chart loading fails.
  </success_criteria>
