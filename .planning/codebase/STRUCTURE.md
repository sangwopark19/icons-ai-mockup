# Codebase Structure

**Analysis Date:** 2026-03-10

## Directory Layout

```
icons-ai-mockup/
├── apps/
│   ├── api/                    # Fastify backend API server
│   │   ├── src/
│   │   │   ├── server.ts       # Main Fastify server entry point
│   │   │   ├── worker.ts       # BullMQ worker for async jobs
│   │   │   ├── config/         # Environment configuration
│   │   │   ├── lib/            # Database, queue, Redis clients
│   │   │   ├── plugins/        # Fastify plugins (JWT auth)
│   │   │   ├── routes/         # API route handlers
│   │   │   └── services/       # Business logic services
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Database schema
│   │   │   └── migrations/     # Database migrations
│   │   └── package.json        # API dependencies
│   │
│   └── web/                    # Next.js frontend application
│       ├── src/
│       │   ├── app/            # Next.js app router pages
│       │   ├── components/     # React components (UI, providers)
│       │   ├── lib/            # Frontend utilities and API client
│       │   └── stores/         # Zustand state stores
│       ├── public/             # Static assets
│       ├── tailwind.config.ts  # Tailwind CSS configuration
│       ├── tsconfig.json       # TypeScript configuration
│       └── package.json        # Frontend dependencies
│
├── packages/
│   └── shared/                 # Shared types and utilities
│       ├── src/
│       │   ├── types/          # TypeScript type definitions
│       │   ├── utils/          # Shared utility functions
│       │   ├── constants/      # Shared constants
│       │   └── index.ts        # Main export file
│       └── package.json
│
├── docs/                       # Documentation files
├── tests/                      # E2E or integration tests
├── docker-compose.yml          # Docker services (PostgreSQL, Redis)
├── package.json                # Root workspace package
├── pnpm-workspace.yaml         # PNPM workspace configuration
├── turbo.json                  # Turbo build orchestration
├── ecosystem.config.js         # PM2 process manager config
└── tsconfig.json               # Root TypeScript configuration
```

## Directory Purposes

**apps/api:**
- Purpose: Fastify REST API backend server
- Contains: Route handlers, services, plugins, database configuration
- Key files: `server.ts` (HTTP server), `worker.ts` (async job processor)

**apps/api/src/config:**
- Purpose: Centralized environment configuration and validation
- Contains: Zod schema for env vars, parsed config object
- Key files: `index.ts` - loads and validates all environment variables

**apps/api/src/lib:**
- Purpose: Shared infrastructure clients and utilities
- Contains: Prisma client singleton, Redis client, BullMQ queue setup
- Key files:
  - `prisma.ts` - PostgreSQL database client with connection pooling
  - `redis.ts` - Redis client with retry strategy and keepalive
  - `queue.ts` - BullMQ generation job queue configuration

**apps/api/src/plugins:**
- Purpose: Fastify plugins for cross-cutting concerns
- Contains: JWT authentication plugin
- Key files: `auth.plugin.ts` - validates JWT tokens, adds user to request

**apps/api/src/routes:**
- Purpose: HTTP route handlers for API endpoints
- Contains: Route definitions with Zod validation
- Key files:
  - `auth.routes.ts` - Login, register, token refresh
  - `generation.routes.ts` - Create generation, check status, list, select image
  - `project.routes.ts` - Create, list, update projects
  - `upload.routes.ts` - Upload image files
  - `character.routes.ts` - Manage IP characters
  - `image.routes.ts` - List, delete generated images
  - `edit.routes.ts` - Edit generation images

**apps/api/src/services:**
- Purpose: Business logic implementation
- Contains: Service classes handling domain operations
- Key files:
  - `auth.service.ts` - User registration, login, token management
  - `generation.service.ts` - Generation CRUD, job queueing, status tracking
  - `upload.service.ts` - File I/O, image processing, path management
  - `gemini.service.ts` - Google Generative AI API integration
  - `project.service.ts` - Project operations
  - `character.service.ts` - IP character operations
  - `image.service.ts` - Image operations

**apps/api/prisma:**
- Purpose: Database schema and migrations
- Contains: Prisma schema, migration history
- Key files:
  - `schema.prisma` - Data models (User, Project, Generation, GeneratedImage, etc.)
  - `migrations/` - SQL migration files for schema changes

**apps/web/src/app:**
- Purpose: Next.js app router with file-based routing
- Contains: Page components, layouts, route groups
- Structure:
  - `page.tsx` - Root page (redirects to /dashboard)
  - `layout.tsx` - Root layout with AuthProvider
  - `(auth)/` - Route group for login/register (shared layout)
  - `dashboard/` - User dashboard page
  - `projects/` - Project listing page
  - `projects/[id]/` - Project detail page
  - `projects/[id]/ip-change/` - IP change generation page
  - `projects/[id]/sketch-to-real/` - Sketch to real generation page
  - `projects/[id]/generations/` - Generation history
  - `projects/[id]/generations/[genId]/` - Generation detail with image selection

**apps/web/src/components:**
- Purpose: Reusable React components
- Contains: UI components and providers
- Subdirectories:
  - `ui/` - Base UI components (Button, Input, ImageUploader, etc.)
  - `providers/` - Context providers (AuthProvider)

**apps/web/src/lib:**
- Purpose: Frontend utilities and API integration
- Key files:
  - `api.ts` - API client functions for all endpoints (authApi, projectApi, generationApi, etc.)
  - `cn.ts` - Class name merging utility for Tailwind
  - `utils.ts` - General utility functions

**apps/web/src/stores:**
- Purpose: Zustand state management
- Key files: `auth.store.ts` - User authentication state with localStorage persistence

**packages/shared/src/types:**
- Purpose: Shared TypeScript type definitions
- Contains: Types used by both frontend and backend
- Examples: User, Project, Generation, GeneratedImage types

**packages/shared/src/utils:**
- Purpose: Shared utility functions
- Contains: Functions used by both frontend and backend

**packages/shared/src/constants:**
- Purpose: Shared constant values
- Contains: Enums, string constants, configuration values

## Key File Locations

**Entry Points:**
- Backend HTTP server: `apps/api/src/server.ts`
- Backend worker: `apps/api/src/worker.ts`
- Frontend app: `apps/web/src/app/layout.tsx`
- Shared exports: `packages/shared/src/index.ts`

**Configuration:**
- Backend config: `apps/api/src/config/index.ts`
- Frontend env: `apps/web/.env.local` (not in repo)
- Docker services: `docker-compose.yml`
- Turbo tasks: `turbo.json`
- TypeScript: `tsconfig.json` (root), `apps/api/tsconfig.json`, `apps/web/tsconfig.json`

**Core Logic:**
- Database models: `apps/api/prisma/schema.prisma`
- API routes: `apps/api/src/routes/*.ts`
- Services: `apps/api/src/services/*.ts`
- Auth flow: `apps/api/src/plugins/auth.plugin.ts`, `apps/api/src/services/auth.service.ts`
- Generation flow: `apps/api/src/services/generation.service.ts`, `apps/api/src/worker.ts`

**Testing:**
- Test directory: `tests/`
- No test files co-located; separate tests directory (Vitest/Jest configuration not found in explored files)

## Naming Conventions

**Files:**
- Route files: `[domain].routes.ts` (e.g., `auth.routes.ts`, `generation.routes.ts`)
- Service files: `[domain].service.ts` (e.g., `auth.service.ts`, `generation.service.ts`)
- Component files: PascalCase with `.tsx` extension (e.g., `AuthProvider.tsx`, `ImageUploader.tsx`)
- Page files: `page.tsx` for route pages, `layout.tsx` for layouts
- Store files: `[domain].store.ts` (e.g., `auth.store.ts`)
- Configuration: `index.ts` in config directories

**Directories:**
- Feature directories: kebab-case for routes (e.g., `ip-change/`, `sketch-to-real/`)
- Component directories: lowercase plural (e.g., `components/`, `routes/`, `services/`)
- Nested route groups: parentheses for shared layouts (e.g., `(auth)/`)

**TypeScript:**
- Enums: PascalCase (e.g., `GenerationMode`, `GenerationStatus`)
- Interfaces: PascalCase (e.g., `CreateGenerationInput`, `AuthState`)
- Types: PascalCase (e.g., `User`, `Project`, `Generation`)
- Functions: camelCase (e.g., `addGenerationJob`, `getUserFromToken`)
- Variables: camelCase (e.g., `generationId`, `accessToken`)
- Constants: UPPER_SNAKE_CASE for module-level (e.g., in shared constants)

## Where to Add New Code

**New Feature (Route + Service):**
- Primary code: `apps/api/src/routes/[feature].routes.ts` and `apps/api/src/services/[feature].service.ts`
- Frontend: `apps/web/src/app/[feature]/page.tsx` and related components in `apps/web/src/components/`
- Shared types: Add to `packages/shared/src/types/` if needed across both apps
- Database: Update `apps/api/prisma/schema.prisma` if new entities needed

**New Component/Module:**
- Frontend component: `apps/web/src/components/[domain]/[ComponentName].tsx`
- Reusable UI component: `apps/web/src/components/ui/[component-name].tsx`
- Backend middleware/plugin: `apps/api/src/plugins/[plugin-name].ts`

**Utilities:**
- Backend helpers: `apps/api/src/lib/[util-name].ts` or within service files
- Frontend helpers: `apps/web/src/lib/[util-name].ts`
- Shared helpers: `packages/shared/src/utils/[util-name].ts`

**State/Store:**
- New Zustand store: `apps/web/src/stores/[domain].store.ts`
- Follow same interface pattern as `auth.store.ts`

**Database Models:**
- Add model to `apps/api/prisma/schema.prisma`
- Create migration: `pnpm db:migrate --name add_[model_name]`
- Update related services with CRUD operations

## Special Directories

**apps/api/prisma/migrations/:**
- Purpose: Version control for database schema changes
- Generated: Yes (by Prisma migrate command)
- Committed: Yes (should be in git)

**apps/web/.next/:**
- Purpose: Next.js build output and cache
- Generated: Yes (by `next build`)
- Committed: No (in `.gitignore`)

**apps/web/public/:**
- Purpose: Static assets served at root URL
- Generated: No (manually added)
- Committed: Yes

**node_modules/ and .pnpm-store/:**
- Purpose: Package dependencies
- Generated: Yes (by pnpm install)
- Committed: No (in `.gitignore`)

**data/ directory:**
- Purpose: Uploaded and generated image storage (configured in config)
- Generated: Yes (by upload and worker services)
- Committed: No

---

*Structure analysis: 2026-03-10*
