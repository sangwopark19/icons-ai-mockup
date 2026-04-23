# Architecture

**Analysis Date:** 2026-03-10

## Pattern Overview

**Overall:** Monorepo with client-server separation and async job processing

**Key Characteristics:**
- Monorepo structure (Turbo) with separate Next.js frontend and Fastify backend
- Async job queue (BullMQ + Redis) for long-running AI generation tasks
- Shared type definitions and constants between frontend and backend
- Service-oriented architecture on backend with clear separation of concerns
- PostgreSQL database with Prisma ORM
- JWT-based authentication with token refresh mechanism

## Layers

**Presentation Layer (Frontend):**
- Purpose: User interface and client-side state management
- Location: `apps/web/src/`
- Contains: Next.js pages, React components, Zustand stores, API client
- Depends on: `@mockup-ai/shared` for types, Next.js, React Query
- Used by: End users via web browser

**API Gateway/Route Layer (Backend):**
- Purpose: HTTP request handling, input validation, authentication
- Location: `apps/api/src/routes/`
- Contains: Route handlers with Zod validation schemas
- Depends on: Fastify, services layer, auth plugin
- Used by: Frontend client, all API endpoints

**Business Logic/Service Layer (Backend):**
- Purpose: Core domain logic, database operations, external service calls
- Location: `apps/api/src/services/`
- Contains: Service classes (AuthService, GenerationService, UploadService, GeminiService, etc.)
- Depends on: Prisma client, queue system, external APIs (Gemini)
- Used by: Route handlers

**Data Access Layer (Backend):**
- Purpose: Database abstraction and query execution
- Location: Prisma models and client at `apps/api/src/lib/prisma.ts`
- Contains: Prisma schema, database migrations
- Depends on: PostgreSQL database
- Used by: Service layer

**Queue/Worker Layer (Backend):**
- Purpose: Asynchronous job processing for AI generation tasks
- Location: `apps/api/src/worker.ts`, `apps/api/src/lib/queue.ts`
- Contains: BullMQ worker for generation jobs, job definitions
- Depends on: Redis, services layer (generation, upload, gemini)
- Used by: Generation service enqueues jobs, worker processes them

**Infrastructure/Config Layer (Backend):**
- Purpose: Configuration, external service clients, plugins
- Location: `apps/api/src/config/`, `apps/api/src/plugins/`, `apps/api/src/lib/`
- Contains: Environment config, Redis client, JWT authentication plugin, CORS setup
- Depends on: Environment variables
- Used by: All layers

**Shared Layer:**
- Purpose: Common types, utilities, constants shared between frontend and backend
- Location: `packages/shared/`
- Contains: TypeScript type definitions, validation schemas, constants
- Depends on: Zod for validation
- Used by: Frontend and backend

## Data Flow

**Authentication Flow:**
1. User submits email/password via login form (`apps/web/src/app/(auth)/login/page.tsx`)
2. Frontend calls `authApi.login()` → POST `/api/auth/login`
3. Backend route validates input with Zod schema (`apps/api/src/routes/auth.routes.ts`)
4. AuthService verifies credentials against PostgreSQL users table
5. Backend returns access token and refresh token
6. Frontend stores tokens in Zustand store (`apps/web/src/stores/auth.store.ts`)
7. API client adds token to Authorization header for subsequent requests
8. Auth plugin (`apps/api/src/plugins/auth.plugin.ts`) validates token in each request

**Generation Request Flow:**
1. User uploads images and creates generation request in UI (`apps/web/src/app/projects/[id]/ip-change/page.tsx` or `sketch-to-real`)
2. Frontend sends POST to `/api/generations` with generation parameters
3. Generation route handler validates request with `CreateGenerationSchema` (Zod)
4. GenerationService creates Generation record in database with `pending` status
5. GenerationService adds job to BullMQ queue via `addGenerationJob()`
6. Response returns immediately with generation ID
7. Worker process picks up job from Redis queue
8. Worker calls GeminiService to generate images using Google Generative AI API
9. Worker saves generated images to filesystem using UploadService
10. Worker updates Generation record with generated images and `completed` status
11. Frontend polls `/api/generations/:id` to check status until completion
12. Frontend displays completed images and allows selection/editing

**Image Edit Flow:**
1. User selects generated image and requests edits via UI
2. Frontend sends PATCH request to `/api/generations/:id/edit` with edit parameters
3. EditService validates request, creates new Generation record referencing parent
4. New generation job added to queue with edit parameters
5. Worker processes edit job similar to generation flow
6. ImageHistory records created to track edit chain

**State Management:**
- Frontend: Zustand stores for auth state, persisted to localStorage
- Backend: PostgreSQL database for persistent state, Redis for job queue state
- Generation status: tracked in `generations` table with enum values (pending, processing, completed, failed)

## Key Abstractions

**Generation Service:**
- Purpose: Orchestrates image generation workflow
- Examples: `apps/api/src/services/generation.service.ts`
- Pattern: Class-based service with methods for CRUD operations and job queueing

**Gemini Service:**
- Purpose: Encapsulates Google Generative AI API interactions
- Examples: `apps/api/src/services/gemini.service.ts`
- Pattern: Methods like `generateIPChange()`, `generateSketchToReal()`, `generateWithStyleCopy()`

**Upload Service:**
- Purpose: Handles file I/O, image processing (thumbnails), path management
- Examples: `apps/api/src/services/upload.service.ts`
- Pattern: Static methods for file operations

**Auth Service:**
- Purpose: User authentication and token management
- Examples: `apps/api/src/services/auth.service.ts`
- Pattern: Password hashing with bcrypt, JWT token generation

**Zod Schemas:**
- Purpose: Input validation for API requests
- Examples: `CreateGenerationSchema`, `RegisterSchema` in route files
- Pattern: Declarative validation with clear error messages

## Entry Points

**Frontend:**
- Location: `apps/web/src/app/layout.tsx`
- Triggers: Browser request to web application
- Responsibilities: Root layout, auth provider setup, global CSS

**Backend Server:**
- Location: `apps/api/src/server.ts`
- Triggers: `npm run dev` or `node dist/server.js`
- Responsibilities: Initialize Fastify, register plugins (CORS, JWT, multipart), register routes, error handling

**Backend Worker:**
- Location: `apps/api/src/worker.ts`
- Triggers: `npm run dev:worker` or separate process running `node dist/worker.js`
- Responsibilities: Poll Redis queue for generation jobs, process jobs, save results

## Error Handling

**Strategy:** Hierarchical error handling with consistent JSON responses

**Patterns:**
- Route layer: Validates input with Zod, catches service errors, returns standardized error response
- Service layer: Throws descriptive Error objects, caught by routes
- Worker layer: Catches errors, updates Generation status to `failed`, logs error message
- Frontend: Catches fetch errors, checks response status, displays error messages to user
- Zod validation: Returns 400 with `VALIDATION_ERROR` code and details
- Authentication failures: Return 401 with `UNAUTHORIZED` code
- CORS violations: Return 403 with `CORS_FORBIDDEN` code

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Cross-Cutting Concerns

**Logging:**
- Backend: Pino logger via Fastify, configured in `apps/api/src/server.ts` with pretty formatting in development
- Frontend: Browser console via JavaScript console methods
- Worker: Console.log for job processing events

**Validation:**
- Backend: Zod schemas in every route handler, validates request body/params
- Frontend: React Hook Form with Zod resolver for client-side validation
- Database: Prisma schema enforces field types and relationships

**Authentication:**
- Backend: JWT tokens via `@fastify/jwt` plugin, token payload includes userId
- Frontend: Token stored in Zustand persistent store, passed in Authorization header
- Token refresh: Frontend can request new token via `/api/auth/refresh` before expiry
- Token validation: Auth plugin extracts and verifies token on protected routes

**CORS:**
- Configured in `apps/api/src/server.ts` with list of allowed origins
- Origins include localhost, internal IPs, and production domain
- Uses Tailscale VPN for security (as noted in comments)
- Credentials allowed, common HTTP methods enabled

---

*Architecture analysis: 2026-03-10*
