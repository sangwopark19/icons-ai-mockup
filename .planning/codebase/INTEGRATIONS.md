# External Integrations

**Analysis Date:** 2026-03-10

## APIs & External Services

**AI/Image Generation:**
- Google Gemini API (gemini-3-pro-image-preview model)
  - SDK/Client: `@google/genai` 1.0.0
  - Auth: Environment variable `GEMINI_API_KEY`
  - Usage: `apps/api/src/services/gemini.service.ts` - Image generation with multi-turn conversation support
  - Endpoints: IP change mockup generation, sketch-to-real conversion with style references and hardware preservation constraints

## Data Storage

**Databases:**
- PostgreSQL 16 (Alpine)
  - Connection: `DATABASE_URL` environment variable (format: `postgresql://user:password@host:5432/dbname?schema=public`)
  - Client: Prisma 6.2.0 ORM
  - Connection pool settings: 10 connections max, 20s timeout, 10s connect timeout
  - Location: `apps/api/prisma/schema.prisma` for schema definition
  - Health check: pg_isready command (10s interval, 5s timeout)

**File Storage:**
- Local filesystem
  - Path: Configurable via `UPLOAD_DIR` env var (default: `./data`)
  - Volume: `app_data` volume in Docker for persistence
  - Image processing: Sharp 0.33.5 for thumbnail generation and format conversion
  - Upload limits: Configurable via `MAX_FILE_SIZE` (default: 10MB)

**Caching:**
- Redis 7 (Alpine)
  - Connection: `REDIS_URL` environment variable (format: `redis://host:port`)
  - Client: ioredis 5.4.1
  - Usage: Job queue backend via BullMQ
  - Configuration: keepAlive (30s), exponential backoff retries, auto-resubscribe enabled
  - Health check: redis-cli ping command (10s interval, 5s timeout)

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication
  - Implementation: `apps/api/src/plugins/auth.plugin.ts`
  - Token signing: jsonwebtoken 9.0.2
  - Secret: `JWT_SECRET` env var (minimum 32 characters)
  - Access token expiry: 15 minutes (configurable via `JWT_ACCESS_EXPIRY`)
  - Refresh token expiry: 7 days (configurable via `JWT_REFRESH_EXPIRY`)
  - Password hashing: bcrypt 5.1.1 with salt rounds
  - Session storage: `Session` table in PostgreSQL
  - Middleware: @fastify/jwt plugin for Fastify

**Auth Routes:**
- `/api/auth/register` - User registration with email/password
- `/api/auth/login` - Login returns accessToken and refreshToken
- `/api/auth/refresh` - Token refresh endpoint
- `/api/auth/me` - Get authenticated user info
- `/api/auth/logout` - Logout (invalidates refresh token)

## Monitoring & Observability

**Error Tracking:**
- Not detected; no external error tracking service integrated

**Logs:**
- Pino 10.1.0 (installed as transitive dependency)
  - Development: `pino-pretty` with colorized output
  - Production: Standard JSON logging to stdout
  - Log level: debug in development, info in production
  - Logging: `apps/api/src/server.ts` Fastify logger configuration
  - CORS request logging: Timestamps and origin tracking for debugging

## CI/CD & Deployment

**Hosting:**
- Docker Compose (local/self-hosted)
- Containers:
  - `mockup-postgres` - PostgreSQL 16 database
  - `mockup-redis` - Redis 7 cache
  - `mockup-migrate` - One-time Prisma migration runner
  - `mockup-api` - Fastify API server (port 100.69.75.47:4000 via Tailscale)
  - `mockup-worker` - BullMQ job processor
  - `mockup-web` - Next.js frontend (port 100.69.75.47:3000 via Tailscale)

**CI Pipeline:**
- Not detected; no CI/CD service (GitHub Actions, GitLab CI, etc.) configured in codebase

**Build Process:**
- Dockerfile: `apps/api/Dockerfile` - Multi-stage build for API (build + migrate + runtime stages)
- Dockerfile.worker: `apps/api/Dockerfile.worker` - Worker container
- Dockerfile: `apps/web/Dockerfile` - Next.js production build
- Database migrations: Automated via migrate container using Prisma migrate

## Environment Configuration

**Required env vars:**
- `NODE_ENV` - Application environment (development/production)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret key for JWT signing (minimum 32 chars)
- `GEMINI_API_KEY` - Google Gemini API key (optional in development, required for image generation in production)
- `NEXT_PUBLIC_API_URL` - API endpoint URL (required for Next.js build, public)
- `API_PORT` - Server port (default: 4000)
- `CORS_ORIGIN` - Additional CORS origins (comma-separated, merged with defaults)
- `MAX_FILE_SIZE` - Maximum upload file size in bytes (default: 10MB)
- `UPLOAD_DIR` - File storage directory (default: ./data)

**Secrets location:**
- `.env` file (local development, not committed)
- Docker environment variables in `docker-compose.yml` (hardcoded for development, override in production)
- Hardcoded defaults for development in `apps/api/src/config/index.ts`

## Webhooks & Callbacks

**Incoming:**
- `/health` - Health check endpoint (used by Docker healthchecks)
- `/api` - API version/info endpoint

**Outgoing:**
- None detected; application is request-response based
- Async job processing via BullMQ queue (internal, not webhooks)
- Browser event dispatch for auth token expiration (`auth:token-expired` custom event)

## Job Queue System

**Framework:** BullMQ 5.31.0
- Queue name: `generation`
- Backend: Redis (ioredis)
- Job type: `GenerationJobData` (image generation tasks)
- Job options:
  - 3 retry attempts with exponential backoff (5s initial delay)
  - Auto-remove completed jobs (keep 100 most recent)
  - Auto-remove failed jobs (keep 50 most recent)
- Worker: `apps/api/src/worker.ts` - Separate process/container
- Job data structure: generationId, userId, projectId, mode, options, image paths

## API Contracts

**Response Format:**
```json
{
  "success": true,
  "data": { /* resource data */ },
  "message": "Optional message"
}
```

**Error Format:**
```json
{
  "error": {
    "message": "Error description"
  }
}
```

**Status Codes:**
- 201: Resource created
- 200: Success
- 400: Bad request (validation error)
- 401: Unauthorized (missing/invalid token)
- 404: Not found
- 500: Server error

---

*Integration audit: 2026-03-10*
