# Phase 7: Provider Foundation and Key Separation - Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 14
**Analogs found:** 14 / 14

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `apps/api/prisma/schema.prisma` | schema | persistence | `apps/api/prisma/schema.prisma` | exact |
| `packages/shared/src/types/index.ts` | shared types | transform | `packages/shared/src/types/index.ts` | exact |
| `apps/api/src/lib/queue.ts` | queue contract | event-driven | `apps/api/src/lib/queue.ts` | exact |
| `apps/api/src/services/admin.service.ts` | service | CRUD + request-response | `apps/api/src/services/admin.service.ts` | exact |
| `apps/api/src/routes/admin/api-keys.routes.ts` | route | request-response | `apps/api/src/routes/admin/api-keys.routes.ts` | exact |
| `apps/api/src/routes/admin/generations.routes.ts` | route | request-response | `apps/api/src/routes/admin/generations.routes.ts` | exact |
| `apps/api/src/services/generation.service.ts` | service | CRUD + queue orchestration | `apps/api/src/services/generation.service.ts` | exact |
| `apps/api/src/routes/generation.routes.ts` | route | request-response | `apps/api/src/routes/generation.routes.ts` | exact |
| `apps/api/src/routes/edit.routes.ts` | route | request-response | `apps/api/src/routes/edit.routes.ts` | exact |
| `apps/api/src/worker.ts` | worker | event-driven | `apps/api/src/worker.ts` | exact |
| `apps/web/src/lib/api.ts` | client API | request-response | `apps/web/src/lib/api.ts` | exact |
| `apps/web/src/app/admin/api-keys/page.tsx` | page component | request-response | `apps/web/src/app/admin/api-keys/page.tsx` | exact |
| `apps/web/src/app/admin/dashboard/page.tsx` | page component | polling dashboard | `apps/web/src/app/admin/dashboard/page.tsx` | exact |
| `apps/web/src/components/admin/generation-table.tsx` | component | polling table | `apps/web/src/components/admin/generation-table.tsx` | exact |
| `apps/web/src/components/admin/generation-detail-modal.tsx` | component | modal detail | `apps/web/src/components/admin/generation-detail-modal.tsx` | exact |

## Pattern Assignments

### `apps/api/prisma/schema.prisma` (schema, persistence)

**Analog:** `apps/api/prisma/schema.prisma`

**Pattern to copy**
- Follow the existing enum-first style used by `GenerationMode`, `GenerationStatus`, and `ImageType`.
- Keep snake_case DB names through `@map(...)` and table names through `@@map(...)`.
- Add supporting indexes the same way current `Generation` and `ApiKey` fields do.

**Concrete cues**
- `enum GenerationMode { ... @@map("generation_mode") }`
- `model Generation { ... @@index([projectId, createdAt(sort: Desc)]) ... }`
- `model ApiKey { ... @@index([isActive]) @@map("api_keys") }`

### `packages/shared/src/types/index.ts` (shared types, transform)

**Analog:** `packages/shared/src/types/index.ts`

**Pattern to copy**
- Define provider enums with Zod first, then export inferred TypeScript types.
- Extend existing generation contracts rather than creating parallel shadow types.
- Keep API response shapes typed via `z.object(...)` when the value is shared between API and web.

**Concrete cues**
- `export const GenerationModeEnum = z.enum(['ip_change', 'sketch_to_real']);`
- `export const GenerationSchema = z.object({ ... })`
- `export interface ApiResponse<T> { success: true; data: T; }`

### `apps/api/src/lib/queue.ts` (queue contract, event-driven)

**Analog:** `apps/api/src/lib/queue.ts`

**Pattern to copy**
- Extend the existing `GenerationJobData` interface instead of inventing a second queue type.
- Keep `generationQueue` and `addGenerationJob(...)` as the single queue entrypoint.
- Add required fields directly on the payload and preserve the current `options` nesting.

**Concrete cues**
- `export interface GenerationJobData { generationId; userId; projectId; mode; ... options: { ... } }`
- `export async function addGenerationJob(data: GenerationJobData): Promise<Job<GenerationJobData>>`

### `apps/api/src/services/admin.service.ts` (service, CRUD + request-response)

**Analog:** `apps/api/src/services/admin.service.ts`

**Pattern to copy**
- Service methods build Prisma `where` objects inline, then return typed plain objects.
- `getDashboardStats()` uses `Promise.all(...)` and combines DB + queue-derived data.
- API key methods already enforce active-row invariants and strip secrets defensively; Phase 7 should generalize that logic by provider, not replace it.

**Concrete cues**
- `async listUsers(params: ListUsersParams): Promise<ListUsersResult> { ... }`
- `async listApiKeys(): Promise<ApiKeyListItem[]> { ... }`
- `async activateApiKey(id: string): Promise<ApiKeyListItem> { ... prisma.$transaction(...) ... }`
- `async retryGeneration(id: string)` is the existing place to preserve provider/model on requeue

### `apps/api/src/routes/admin/api-keys.routes.ts` (route, request-response)

**Analog:** `apps/api/src/routes/admin/api-keys.routes.ts`

**Pattern to copy**
- Keep per-route `try/catch` blocks returning `{ success, data/error }`.
- Validate request params/body with local Zod schemas in the route file.
- Use explicit error-code branches for known service errors, same as the delete route already does.

**Concrete cues**
- `const createApiKeyBodySchema = z.object({ alias: z.string().min(1).max(50), apiKey: z.string().min(1) });`
- `return reply.code(400).send({ success: false, error: { code: 'ACTIVE_KEY_CANNOT_BE_DELETED', message } });`

### `apps/api/src/routes/admin/generations.routes.ts` and `apps/api/src/routes/generation.routes.ts` (routes, request-response)

**Analogs:** current files themselves

**Pattern to copy**
- Keep route-local Zod schemas and explicit `reply.code(...).send(...)` responses.
- For Phase 7, extend the returned payload shape rather than creating new endpoints unless the existing surface truly cannot carry provider metadata.
- Preserve the current REST structure for create/get/regenerate/retry.

**Concrete cues**
- `const listGenerationsQuerySchema = z.object({ page, limit, status, email })`
- `return reply.code(201).send({ success: true, data: { id, status, mode, createdAt } })`

### `apps/api/src/services/generation.service.ts` (service, CRUD + queue orchestration)

**Analog:** `apps/api/src/services/generation.service.ts`

**Pattern to copy**
- `create(...)` owns persistence plus queue enqueue; keep that orchestration-centered role.
- `regenerate(...)` reconstructs new generation inputs from persisted `promptData` and `options`; Phase 7 should copy provider/model using the same pattern.
- Use Prisma JSON fields the way the service already does for `promptData`, `options`, and `thoughtSignatures`.

**Concrete cues**
- `const generation = await prisma.generation.create({ data: { ... } })`
- `await addGenerationJob({ generationId: generation.id, ... })`
- `async regenerate(userId, generationId)` reads the original generation and rebuilds input fields

### `apps/api/src/worker.ts` (worker, event-driven)

**Analog:** `apps/api/src/worker.ts`

**Pattern to copy**
- Worker startup already does a top-level dispatch on `mode`; Phase 7 should insert provider dispatch before that mode branching.
- Keep generation status transitions and error handling centralized in this file.
- Continue incrementing call counts immediately before vendor calls.

**Concrete cues**
- `await generationService.updateStatus(generationId, 'processing');`
- `await adminService.incrementCallCount(activeKeyId);`
- `if (mode === 'ip_change') { ... } else if (mode === 'sketch_to_real') { ... } else { throw new Error(...) }`

### `apps/web/src/lib/api.ts` (client API, request-response)

**Analog:** `apps/web/src/lib/api.ts`

**Pattern to copy**
- Keep all client contracts in this file as plain TS interfaces plus small helper methods.
- Use `URLSearchParams` for provider-aware admin queries just like current list methods do.
- Preserve the shared `request<T>(...)` helper instead of hand-writing fetch logic in admin pages.

**Concrete cues**
- `export interface AdminApiKey { ... }`
- `export const adminApi = { listGenerations: ..., listApiKeys: ..., createApiKey: ... }`

### `apps/web/src/app/admin/api-keys/page.tsx` and `apps/web/src/app/admin/dashboard/page.tsx` (page components, request-response/polling)

**Analogs:** current files themselves

**Pattern to copy**
- Use local `useState` for selected provider tab, confirm action, and toast state.
- Keep the fixed top-right toast pattern and existing `ConfirmDialog`.
- Dashboard polling follows the existing `Promise.allSettled(...)` and `setInterval(...)` pattern; Phase 7 should extend the payload, not change the polling model.

**Concrete cues**
- `const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);`
- `<ConfirmDialog ... />`
- `const id = setInterval(fetchData, 30_000);`

### `apps/web/src/components/admin/generation-table.tsx` and `generation-detail-modal.tsx` (components, polling table + modal detail)

**Analogs:** current files themselves

**Pattern to copy**
- Keep provider/model additions as incremental column/detail extensions.
- Preserve existing retry button behavior and 30-second polling.
- For support metadata, follow the current detail modal structure: metadata block + JSON/detail blocks + action footer.

**Concrete cues**
- `STATUS_TABS`, `STATUS_BADGE_CLASSES`, `STATUS_LABELS`
- `setSelectedGeneration(gen)` and `<GenerationDetailModal ... />`
- modal sections rendered as small titled panels

## Shared Patterns

### Service-layer authority

**Source:** `apps/api/src/services/admin.service.ts`, `apps/api/src/services/generation.service.ts`

- Keep business rules in services, not routes.
- Routes validate and translate errors; services decide provider-scoped behavior and queue payload shape.

### Existing admin UI primitives

**Source:** `apps/web/src/app/admin/api-keys/page.tsx`, `apps/web/src/components/admin/generation-table.tsx`, `apps/web/src/components/admin/confirm-dialog.tsx`

- Reuse the current toast pattern, `ConfirmDialog`, table spacing, and button sizing.
- Do not introduce new component libraries or one-off modal systems for Phase 7.

### Polling and refresh behavior

**Source:** `apps/web/src/app/admin/dashboard/page.tsx`, `apps/web/src/components/admin/generation-table.tsx`

- Use `useEffect + setInterval` with a mounted guard.
- Keep loading scoped to the table/card region instead of blocking the whole page.

### Secret handling

**Source:** `apps/api/src/services/admin.service.ts`, `apps/api/src/routes/admin/api-keys.routes.ts`

- Continue stripping `encryptedKey` from all returned data.
- Extend the same redaction mindset to OpenAI trace metadata: curate safe fields, do not dump raw payloads.
