# Stack Research

**Domain:** Admin panel extension for existing Next.js + Fastify monorepo (AI mockup generation app)
**Researched:** 2026-03-10
**Confidence:** MEDIUM — charting ecosystem has active React 19 compatibility issues requiring workarounds; all other areas are HIGH

## Context

This is an additive milestone. The existing stack is locked:
- Next.js 16.1.0 + React 19.0.0 + Tailwind CSS 4.0.0
- Fastify 5.1.0 + Prisma 6.2.0 + BullMQ 5.31.0
- pnpm 9.15.0 monorepo with Turbo 2.3.0
- shadcn/ui component pattern (CVA + tailwind-merge + clsx already installed)
- TanStack React Query 5.62.0 already in place

No new framework decisions needed. Research focuses only on admin-specific additions.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| shadcn/ui | latest CLI (no pinned npm version — copy-paste model) | Admin UI primitives: tables, dialogs, dropdowns, badges, forms | Already installed pattern in this project (CVA + tailwind-merge + clsx). Tailwind v4 + React 19 fully supported as of Feb 2025. Copy-paste model means no breaking upgrades. |
| @tanstack/react-table | 8.21.3 | Headless table engine for user list, content list, API key list | Already a TanStack shop (React Query 5.x installed). Headless means full Tailwind styling control. shadcn/ui data table is built on top of it. React 19 compatible. v9 is alpha — do not use. |
| recharts | 2.15.1 (pinned, NOT 3.x) | Charts for dashboard: usage stats, API key usage, queue metrics | shadcn/ui chart components are built on Recharts 2.x. Recharts 3.x has an active blank-chart regression with React 19 (issue #6857, reported Jan 2026, unresolved as of Mar 2026). Pin to 2.15.1. |
| react-is | 19.0.0 | Required peer dep fix for Recharts 2.x + React 19 | Recharts internally uses react-is but pins an old version. Must install react-is@19.0.0 and add pnpm override so Recharts picks up the correct version. Without this, charts render blank. |
| @bull-board/api + @bull-board/fastify | 6.20.3 | BullMQ queue monitoring dashboard embedded in Fastify | Official Fastify adapter exists. Exposes a pre-built UI at a configurable path (e.g. `/admin/queues`). Zero custom UI work needed for queue visibility. Actively maintained (published 9 days ago as of research date). |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.62.0 (already installed) | Server state for admin data fetching — users list, content list, stats | Use for all admin API calls. Provides loading/error states, pagination, refetch intervals for live queue status polling. |
| react-hook-form | 7.54.0 (already installed) | Forms in admin panel: API key creation, user role changes | Already installed. Use with zod + @hookform/resolvers for admin forms. |
| zod | 3.24.1 (already installed) | Schema validation for admin form inputs | Already installed. Use for API key forms, user management inputs. |
| sonner | latest | Toast notifications for admin actions (ban user, delete content, switch API key) | shadcn/ui deprecated its `toast` component in favor of `sonner` as of Feb 2025. Use sonner directly. |
| lucide-react | 0.468.0 (already installed) | Admin UI icons | Already installed. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Prisma 6.2.0 (already installed) | Schema migration for `role` field on User, new `ApiKey` table | Run `prisma migrate dev` for role enum addition and API key table. |
| pnpm overrides in root package.json | Force react-is@19.0.0 for Recharts compatibility | Must be at workspace root under `"pnpm": { "overrides": { "react-is": "$react-is" } }` |

---

## Installation

```bash
# In apps/web — admin UI additions
pnpm add recharts@2.15.1 react-is@19.0.0 sonner

# In apps/api — queue monitoring UI
pnpm add @bull-board/api @bull-board/fastify

# shadcn/ui components (copy-paste via CLI, not npm install)
# Run from apps/web:
npx shadcn@latest add chart table badge dialog select
```

**Root package.json pnpm override (required for Recharts + React 19):**
```json
{
  "pnpm": {
    "overrides": {
      "react-is": "$react-is"
    }
  }
}
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Recharts 2.15.1 (pinned) | Recharts 3.x | Only when Recharts team resolves React 19 blank-chart regression (issue #6857). Check before upgrading. |
| Recharts 2.15.1 (pinned) | Victory, Nivo, Chart.js via react-chartjs-2 | If Recharts becomes unmaintainable. Victory has React 19 support. Nivo is feature-rich but heavier. Chart.js adds canvas vs SVG context switch. Not worth switching since shadcn/ui chart components are already Recharts-based. |
| @bull-board/fastify | Custom queue status API endpoint | If Bull Board UI is too opinionated or adds too much bundle. Custom polling API is simpler but loses retry/remove job UI. Bull Board adds value for admin use. |
| TanStack Table v8 | AG Grid Community | Only if tables need 100k+ row virtual scrolling. AG Grid is heavier and has a different license model. For admin panels with <10k rows, TanStack Table + react-virtual is sufficient. |
| shadcn/ui copy-paste pattern | Tremor | Tremor is built on Recharts + Radix and provides pre-assembled chart+card components. But this project already has a shadcn/ui foundation. Mixing two component systems adds complexity. |
| Next.js middleware for /admin RBAC | next-auth / clerk | This project uses a custom JWT system on Fastify. Adding next-auth would duplicate the auth layer. Use Next.js `middleware.ts` to read the existing JWT from cookies/headers and check `role === 'admin'`. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Recharts 3.x | Active blank-chart regression with React 19 as of Jan 2026 (issue #6857). Downgrading to 3.3 is the only documented workaround, but shadcn/ui chart components are built on 2.x. | Recharts 2.15.1 with react-is pnpm override |
| Admin framework (AdminJS, React Admin, Refine) | Introduces a full framework on top of an existing Next.js app. Routing, auth, and data layer would conflict with the existing system. Significant lock-in. | Custom /admin routes in Next.js with shadcn/ui + TanStack Table |
| Separate Next.js app for admin | Out of scope per PROJECT.md. Duplicates auth, build config, and deployment complexity. | /admin/* routes in the existing apps/web Next.js app |
| localStorage for admin JWT | XSS vulnerability. The existing app already uses a cookie/header approach for JWT. | HTTP-only cookie or Authorization header pattern (match existing auth store) |
| TanStack Table v9 alpha | Pre-release (v9.0.0-alpha.17 as of Mar 2026). API is unstable. | TanStack Table v8.21.3 |
| shadcn/ui toast component | Deprecated in Feb 2025 in favor of sonner | sonner |

---

## Stack Patterns by Variant

**For the dashboard stats page:**
- Use shadcn/ui Chart (Recharts 2.15.1 wrapper) for usage graphs
- Use shadcn/ui Card for metric tiles (total users, jobs today, storage used)
- Use TanStack React Query with `refetchInterval: 30000` for live queue status polling

**For user management, content management, API key tables:**
- Use TanStack Table v8 for headless table logic (sorting, filtering, pagination)
- Use shadcn/ui Table primitives for rendering
- Use TanStack React Query for server-side data fetching
- Implement server-side pagination — do not fetch all rows client-side

**For queue monitoring:**
- Mount @bull-board/fastify at `/admin/queues` in Fastify
- Protect the route with an admin-only Fastify preHandler hook (check JWT role)
- Iframe or redirect from Next.js /admin to the Bull Board URL

**For /admin route protection in Next.js:**
- Use `middleware.ts` at the app root
- Decode the JWT (verify signature with JWT_SECRET)
- Check `payload.role === 'admin'`
- Redirect to `/` or `/403` if not admin
- This runs at the edge — no server round-trip needed

---

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| recharts@2.15.1 | React 19.0.0 | Requires react-is@19.0.0 pnpm override. Without override, charts render blank. |
| @tanstack/react-table@8.21.3 | React 19.0.0 | Fully compatible. React Compiler compatibility is not guaranteed but React Compiler is not used in this project. |
| @bull-board/fastify@6.20.3 | Fastify 5.x, BullMQ 5.x | Check peer deps on install — bull-board 6.x explicitly supports BullMQ 5.x. |
| shadcn/ui (CLI latest) | Tailwind CSS 4.0.0, React 19.0.0 | Full support since Feb 2025. OKLCH colors, tw-animate-css, no forwardRef. |
| sonner | React 19.0.0 | Designed for React 18+. React 19 compatible. |

---

## Sources

- [Recharts issue #6857 — blank chart with React 19.2.3](https://github.com/recharts/recharts/issues/6857) — confirmed active regression, unresolved Jan 2026 (LOW-MEDIUM confidence on current fix status)
- [Fix for Recharts + React 19 — pnpm override approach](https://www.bstefanski.com/blog/recharts-empty-chart-react-19) — MEDIUM confidence (2.x-specific fix, verified approach)
- [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) — confirms 3.x breaking changes
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — HIGH confidence (official docs, Feb 2025)
- [shadcn/ui React 19 docs](https://ui.shadcn.com/docs/react-19) — HIGH confidence (official docs)
- [TanStack Table releases — v8.21.3 stable, v9 alpha](https://github.com/TanStack/table/releases) — HIGH confidence
- [TanStack Table React 19 compatibility note](https://tanstack.dev/table/latest/docs/faq) — MEDIUM confidence (React Compiler caveat noted)
- [@bull-board/fastify npm](https://www.npmjs.com/package/@bull-board/fastify) — HIGH confidence (v6.20.3, actively maintained)
- [Bull Board GitHub — Fastify adapter confirmed](https://github.com/felixmosh/bull-board) — HIGH confidence

---
*Stack research for: Admin panel — Next.js 16 + Fastify 5 + React 19 + Tailwind 4 monorepo*
*Researched: 2026-03-10*
