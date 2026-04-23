# Technology Stack

**Analysis Date:** 2026-03-10

## Languages

**Primary:**
- TypeScript 5.7.2 - Used across all applications (backend API, frontend web, shared packages)
- JavaScript (ES2022) - Runtime execution via Node.js ES modules

**Secondary:**
- SQL - PostgreSQL DDL/DML via Prisma ORM

## Runtime

**Environment:**
- Node.js >= 22.0.0 (ES modules support required)

**Package Manager:**
- pnpm 9.15.0
- Lockfile: `pnpm-lock.yaml` (present)

## Frameworks

**Core:**
- Next.js 16.1.0 - Frontend web application (`apps/web`)
- Fastify 5.1.0 - Backend API server (`apps/api`)

**Development:**
- Turbo 2.3.0 - Monorepo build orchestration
- tsx 4.19.2 - TypeScript execution for Node.js scripts

**Build/Dev:**
- tsc (TypeScript Compiler) - Used for production builds and type checking
- Turbopack (Next.js) - Development bundler with fast hot reload

## Key Dependencies

**Critical:**
- @prisma/client 6.2.0 - PostgreSQL ORM for data access (`apps/api/src/lib/prisma.ts`)
- @google/genai 1.0.0 - Google Gemini AI image generation API (`apps/api/src/services/gemini.service.ts`)
- bullmq 5.31.0 - Job queue for asynchronous image generation tasks (`apps/api/src/lib/queue.ts`)
- ioredis 5.4.1 - Redis client for job queue and caching (`apps/api/src/lib/redis.ts`)

**API & Web:**
- @fastify/cors 10.0.1 - CORS handling in Fastify
- @fastify/jwt 9.0.0 - JWT authentication plugin
- @fastify/multipart 9.0.0 - Multipart file upload handling
- sharp 0.33.5 - Image processing and thumbnail generation
- bcrypt 5.1.1 - Password hashing
- jsonwebtoken 9.0.2 - JWT creation and verification
- pino-pretty 13.0.0 - Formatted logging for development

**Frontend:**
- React 19.0.0 - UI framework
- react-dom 19.0.0 - React DOM binding
- @tanstack/react-query 5.62.0 - Server state management (not actively used in current pages, prepared for scale)
- zustand 5.0.2 - Client state management (`apps/web/src/stores/auth.store.ts`)
- react-hook-form 7.54.0 - Form state and validation
- @hookform/resolvers 4.1.0 - Schema validation integration

**UI/Styling:**
- tailwindcss 4.0.0 - Utility-first CSS framework
- @tailwindcss/postcss 4.1.18 - PostCSS plugin for Tailwind
- lucide-react 0.468.0 - Icon component library
- class-variance-authority 0.7.1 - Component variant generation
- tailwind-merge 2.6.0 - Intelligent Tailwind CSS class merging
- clsx 2.1.1 - Conditional className utility

**Validation & Configuration:**
- zod 3.24.1 - TypeScript-first schema validation (used in API routes and config)
- dotenv 16.4.5 - Environment variable loading

**Development Tools:**
- eslint 9.18.0 - Code linting
- prettier 3.4.2 - Code formatting
- prettier-plugin-tailwindcss 0.6.9 - Tailwind class sorting in Prettier
- @types/node 22.10.0 - Node.js type definitions
- @types/react 19.0.0 - React type definitions
- @types/react-dom 19.0.0 - React DOM type definitions
- @types/bcrypt 5.0.2 - bcrypt type definitions
- @types/jsonwebtoken 9.0.7 - jsonwebtoken type definitions
- prisma 6.2.0 - Prisma CLI and generator

## Configuration

**Environment:**
- Development: `.env` file (in `.gitignore`, not committed)
- Production: Docker environment variables via `docker-compose.yml`
- Config validation: `apps/api/src/config/index.ts` - Zod schema for env vars

**Required Environment Variables:**
- `NODE_ENV` - Environment mode (development/production)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Minimum 32 characters for token signing
- `GEMINI_API_KEY` - Google Gemini API key (optional in dev, required in prod)
- `NEXT_PUBLIC_API_URL` - API endpoint for Next.js frontend (required for build)
- `CORS_ORIGIN` - CORS allowed origins (merged with hardcoded defaults in config)

**Build Configuration:**
- `tsconfig.json` - TypeScript configuration in `apps/api/`, `apps/web/`, `packages/shared/`
- `pnpm-workspace.yaml` - Monorepo workspace definition
- `turbo.json` - Turbo build pipeline configuration

**Code Quality:**
- `.prettierrc` - Prettier formatting rules (100 char line width, trailing commas, single quotes)
- `.prettierignore` - Files to exclude from formatting
- `.eslintrc` - Not detected; using ESLint 9.x with possible flat config

## Platform Requirements

**Development:**
- Node.js 22.0.0 or higher
- pnpm 9.15.0 or compatible
- PostgreSQL 16+ (Docker)
- Redis 7+ (Docker)

**Production:**
- Deployment target: Docker containers orchestrated via `docker-compose.yml`
- Containers: API (Fastify), Web (Next.js), Worker (BullMQ), Database (PostgreSQL), Cache (Redis), Migration (Prisma)
- Networking: Tailscale VPN for external access (localhost ports exposed via Tailscale IP 100.69.75.47:3000 and 100.69.75.47:4000)
- No public ports exposed; all external traffic through VPN

---

*Stack analysis: 2026-03-10*
