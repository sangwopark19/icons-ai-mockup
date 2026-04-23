---
phase: quick-260423-l20-mac-encryption-key-api-admin-dashboard
plan: 01
status: complete
subsystem: admin-deployment
tags: [admin, deployment, encryption, dashboard, bug-fix]
dependency_graph:
  requires: []
  provides: [production-encryption-key-wiring, resilient-admin-dashboard]
  affects: [docker-compose, api-config, admin-dashboard, api-key-management]
tech_stack:
  added: []
  patterns: [startup env validation, partial request failure handling]
key_files:
  created:
    - .env.example
  modified:
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
decisions:
  - ENCRYPTION_KEY is required in production and must be 64 hex chars, matching AES-256-GCM's 32-byte key requirement.
  - Queue-depth lookup failure no longer fails the whole dashboard stats response; it logs a warning and reports depth 0.
  - Dashboard stats and chart requests are handled independently so one failed request does not keep the entire dashboard in loading skeletons.
metrics:
  duration: 20 min
  completed: 2026-04-23
---

# Quick 260423-l20 Plan 01 Summary

**One-liner:** Wired `ENCRYPTION_KEY` into production containers, validated it at startup, hardened hex validation, and made the admin dashboard tolerate partial data failures.

## Tasks Completed

| Task | Name                                            | Commit  | Files                                                       |
| ---- | ----------------------------------------------- | ------- | ----------------------------------------------------------- |
| 1    | Production ENCRYPTION_KEY wiring and validation | 6de9087 | docker-compose.yml, config/index.ts, crypto.ts, docs        |
| 2    | Admin dashboard partial-failure handling        | 6de9087 | admin.service.ts, admin.service.test.ts, dashboard/page.tsx |

## Verification

- `pnpm --filter @mockup-ai/api test` passed: 64 tests.
- `pnpm --filter @mockup-ai/api type-check` passed.
- `pnpm --filter @mockup-ai/web type-check` passed.
- `docker compose config` confirmed both API and worker receive a 64-character `ENCRYPTION_KEY` from the local `.env`.

## Operational Note

On the deployed Mac server, generate a key and paste it into `.env` before rebuilding:

```bash
openssl rand -hex 32
# .env
# ENCRYPTION_KEY=<64-character-output>
docker compose up -d --build
```

The value must remain stable after API keys are registered. Changing it later will make existing encrypted API keys undecryptable.
