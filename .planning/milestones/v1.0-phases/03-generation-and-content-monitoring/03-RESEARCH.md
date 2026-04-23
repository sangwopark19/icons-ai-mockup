# Phase 3: Generation and Content Monitoring - Research

**Researched:** 2026-03-11
**Domain:** Admin monitoring UI (Fastify API + Next.js), BullMQ queue operations, filesystem delete
**Confidence:** HIGH

## Summary

Phase 3 extends the established Phase 2 admin patterns to cover two new domains: (1) generation job monitoring with retry capability, and (2) generated image content browsing with individual and bulk delete. Both are strictly additive — no schema changes, no new infrastructure. Every pattern needed already exists in the codebase and needs to be applied to new data surfaces.

The backend work is entirely confined to `AdminService` (new methods) and two new Fastify route files (`generations.routes.ts`, `content.routes.ts`) registered in `index.routes.ts`. The frontend splits the single `content/page.tsx` stub into a tabbed layout covering both sub-features, reusing `ConfirmDialog`, pagination logic from `UserTable`, the 30-second polling pattern from `DashboardPage`, and `adminApi` extension in `lib/api.ts`.

The only genuinely new concern compared to Phase 2 is the bulk-delete path: it must (a) count matching records before showing the confirmation modal, and (b) delete both DB records (`GeneratedImage`) and files on disk (via `fs.unlink`) while keeping `Generation` records intact for statistics.

**Primary recommendation:** Extend `AdminService` with four new methods, register two new route files, and build the content page as a tabbed client component that reuses existing UI primitives wholesale.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Generation job list/filter UI**
- Table columns: user email, mode (ip_change/sketch_to_real), status, created date, error message (on failure)
- Status filter: tab buttons above the table — "전체 | 대기중 | 처리중 | 완료 | 실패" with count badges per tab
- User email search bar placed next to the tabs (same pattern as Phase 2)
- Offset-based pagination — bottom page buttons, 20 rows per page (same as Phase 2)
- 30-second auto-polling (same interval as dashboard)

**Failed job diagnosis/retry**
- Clicking "상세보기" on a failed row opens a modal showing: error message, promptData, options, retryCount
- "재시도" button at the bottom of the modal
- Dual access: table row button + modal button
- Retry clicks directly re-enqueues via BullMQ with no confirmation dialog (low-risk action)
- After retry: status transitions failed → pending immediately; success toast shown

**Content browsing**
- Image grid layout — each card: thumbnail + username + date + project name (uses thumbnailPath)
- Top filter bar: user email search + date range picker + project dropdown — single row
- User history view is integrated into content page via user filter (no separate page)
- Image click opens lightbox with full-size preview + metadata (size, resolution, date, user, project) + delete button
- Offset-based pagination (below grid)

**Image delete (individual/bulk)**
- Individual: delete button in lightbox → modal confirmation dialog → execute
- Bulk: filter-based — deletes all images matching current filter (user/date/project)
- Bulk confirmation UX: modal shows "N건의 이미지를 삭제합니다" count + confirmation button
- Hard delete: DB record (GeneratedImage) + filesystem (image + thumbnail). Generation record KEPT (for statistics)
- After delete: grid auto-refreshes

### Claude's Discretion
- Grid card layout details (card size, spacing, responsive column count)
- Lightbox implementation approach (library vs. hand-rolled)
- Tab button styling (badge colors, active/inactive states)
- Date range picker UI implementation approach
- Error detail modal layout
- Bulk delete in-progress loading treatment
- Empty content state messages

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GEN-01 | Admin can view all generation jobs across all users with status filtering | New `AdminService.listGenerations()` method with status/email params; `GET /api/admin/generations` route; tab-based filter UI in frontend |
| GEN-02 | Admin can open a failed job and see its full error reason | Failed job detail modal; `errorMessage`, `promptData`, `options`, `retryCount` fields all present in existing `Generation` model |
| GEN-03 | Admin can trigger a retry of a failed job from admin UI | `AdminService.retryGeneration()` updates status to pending + calls `addGenerationJob`; `POST /api/admin/generations/:id/retry` |
| CONT-01 | Admin can browse all generated images searchable by user, date, project | New `AdminService.listGeneratedImages()` with filter params including project join for project name display |
| CONT-02 | Admin can delete an individual image (DB record + file) | `AdminService.deleteGeneratedImage()` calls `prisma.generatedImage.delete` + `fs.unlink` for filePath and thumbnailPath |
| CONT-03 | Admin can view a specific user's complete generation history | Covered by CONT-01 user email filter — no separate endpoint needed |
| CONT-04 | Admin can bulk-delete by filter (date/user/project) | `AdminService.bulkDeleteImages()` with same filter params + count preview endpoint (`GET /api/admin/content/images/count`) |
</phase_requirements>

---

## Standard Stack

### Core (all already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^6.2.0 | DB queries for Generation, GeneratedImage, Project, User | Already in use; schema has all needed fields |
| BullMQ | ^5.31.0 | Re-enqueue failed jobs via `addGenerationJob` | Already imported in `admin.service.ts`; `generationQueue` singleton exported from `lib/queue.ts` |
| Node `fs/promises` | built-in | Delete image + thumbnail files on disk | Already used in `GenerationService.deleteGeneration` — same pattern |
| Zod | ^3.24.1 | Query param + body validation on new routes | Already used on all admin routes |
| Next.js 16 + React 19 | current | Frontend client components | All admin pages use 'use client' with useState/useEffect |
| Tailwind CSS 4 | current | Styling all new components | CSS variable design tokens established in Phase 1/2 |
| lucide-react | ^0.468.0 | Icons (Filter, RefreshCw, Trash2, Eye, etc.) | Already imported in admin pages |

### Supporting (discretion areas — Claude chooses)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native HTML `<input type="date">` | built-in | Date range picker | Simplest option; no install needed for admin tool |
| CSS `aspect-ratio` + `object-fit` | built-in | Image grid card thumbnails | No library needed for simple grid |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native date inputs | react-datepicker or @shadcn/date-range | Library is heavier; native inputs work fine for admin tool where UX polish is secondary |
| Hand-rolled lightbox modal | yet-another-react-lightbox | Library adds ~40KB; a fixed-position overlay with Next.js `<Image>` is trivial here |

**Installation:** No new packages required. All dependencies already present.

---

## Architecture Patterns

### Project Structure — New Files

```
apps/api/src/
├── routes/admin/
│   ├── generations.routes.ts    # NEW — GEN-01, GEN-02, GEN-03
│   ├── content.routes.ts        # NEW — CONT-01, CONT-02, CONT-04
│   └── index.routes.ts          # MODIFY — register two new route files
├── services/
│   └── admin.service.ts         # MODIFY — add 5 new methods

apps/web/src/
├── app/admin/content/
│   └── page.tsx                 # REPLACE stub with tabbed implementation
├── components/admin/
│   ├── generation-table.tsx     # NEW — GEN-01 table + status tabs
│   ├── generation-detail-modal.tsx  # NEW — GEN-02 error detail + retry
│   ├── content-grid.tsx         # NEW — CONT-01 image grid + filters
│   └── image-lightbox.tsx       # NEW — CONT-02 lightbox + delete
├── lib/
│   └── api.ts                   # MODIFY — add adminApi generation/content methods
```

### Pattern 1: AdminService Method Extension

All new service methods follow the same structure as `listUsers`: parameter interface → Prisma query with `where` built dynamically → return typed result with pagination.

**Generations list query** — joins through `project.user` to get email:
```typescript
// Prisma query pattern for listGenerations (similar to listUsers in admin.service.ts)
const generations = await prisma.generation.findMany({
  where,
  skip,
  take: limit,
  orderBy: { createdAt: 'desc' },
  include: {
    project: {
      include: { user: { select: { email: true } } },
    },
  },
});
```

**Retry method** — updates status then re-enqueues. Uses existing `addGenerationJob` from `lib/queue.ts`. Must read `promptData` and `options` from the existing Generation record to reconstruct `GenerationJobData`:
```typescript
// In AdminService.retryGeneration(id: string)
const generation = await prisma.generation.findUnique({
  where: { id },
  include: { project: true },
});
// Reset status to pending
await prisma.generation.update({
  where: { id },
  data: { status: 'pending', errorMessage: null },
});
// Re-enqueue with original job data
await addGenerationJob({
  generationId: generation.id,
  userId: generation.project.userId,
  projectId: generation.projectId,
  mode: generation.mode,
  // ...extract from generation.promptData and generation.options (Json fields)
});
```

**Individual image delete** — matches the pattern already in `GenerationService.deleteGeneration`, but scoped to a single `GeneratedImage`. Uses `UploadService.deleteFile` (already has `deleteFile(relativePath)`) or direct `fs.unlink(path.join(config.uploadDir, relativePath))`:
```typescript
// In AdminService.deleteGeneratedImage(imageId: string)
const image = await prisma.generatedImage.findUnique({ where: { id: imageId } });
// Delete files
await uploadService.deleteFile(image.filePath);
if (image.thumbnailPath) await uploadService.deleteFile(image.thumbnailPath);
// Delete DB record (Generation record is preserved)
await prisma.generatedImage.delete({ where: { id: imageId } });
```

**Bulk delete** — same as individual but with `findMany` + loop, preceded by a count endpoint:
```typescript
// Count endpoint (GET /api/admin/content/images/count?userId=&startDate=&endDate=&projectId=)
const count = await prisma.generatedImage.count({ where: buildWhere(params) });

// Bulk delete endpoint (DELETE /api/admin/content/images with body filters)
const images = await prisma.generatedImage.findMany({ where, select: { id, filePath, thumbnailPath } });
for (const image of images) {
  await uploadService.deleteFile(image.filePath);
  if (image.thumbnailPath) await uploadService.deleteFile(image.thumbnailPath);
}
await prisma.generatedImage.deleteMany({ where });
```

### Pattern 2: Route File Registration

New route files registered in `index.routes.ts`:
```typescript
// apps/api/src/routes/admin/index.routes.ts — add two lines
fastify.register(generationsRoutes, { prefix: '/generations' });
fastify.register(contentRoutes, { prefix: '/content' });
```

### Pattern 3: Frontend Tab Layout

The `content/page.tsx` replaces the stub with a two-tab layout. Both tabs share a single `page.tsx` as the client component, with `activeTab` state switching between `GenerationTable` and `ContentGrid`:
```typescript
// apps/web/src/app/admin/content/page.tsx
'use client';
const [activeTab, setActiveTab] = useState<'generations' | 'content'>('generations');
// Render either <GenerationTable> or <ContentGrid> based on activeTab
```

### Pattern 4: 30-Second Polling

Same as `DashboardPage` and established in CONTEXT.md. Each tab independently uses `useEffect + setInterval(fetchData, 30_000)` with `mounted` guard:
```typescript
useEffect(() => {
  let mounted = true;
  const fetchData = async () => { if (!mounted) return; /* fetch */ };
  fetchData();
  const id = setInterval(fetchData, 30_000);
  return () => { mounted = false; clearInterval(id); };
}, [accessToken, /* filter deps */]);
```

### Anti-Patterns to Avoid

- **Deleting Generation records during content delete**: CONT-02 and CONT-04 must delete only `GeneratedImage` rows; `Generation` records must be preserved for statistics. This is the primary behavioral distinction from `GenerationService.deleteGeneration`.
- **Calling retry without resetting errorMessage**: The retry method must clear `errorMessage` and reset `retryCount` increment in the DB before re-enqueuing, otherwise the UI still shows the old error.
- **Fetching project list for dropdown without pagination**: Project count can be large. The project dropdown for content filters should either use a search-as-you-type pattern or limit to projects that have `generatedImages`.
- **Hard-coding uploadDir path**: Always use `config.uploadDir` as the base (already used in `UploadService` and `GenerationService`).
- **Sending Content-Type on DELETE requests with no body**: The existing `request()` helper in `lib/api.ts` already handles this correctly (only sets Content-Type when `options.body` is present).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pagination UI | Custom paginator | Copy `getPageNumbers` + pagination JSX from `UserTable` | Already handles ellipsis logic, active state, disabled arrows |
| Modal overlay | Custom modal system | Copy `ConfirmDialog` pattern | Already handles Escape key, stopPropagation, loading spinner, danger variant |
| Status badge styling | New badge component | Inline className conditionals (same as UserTable role/status badges) | No new abstraction needed; consistent with Phase 2 |
| File deletion error handling | Custom retry logic | `try/catch` silent ignore (same as `GenerationService.deleteGeneration`) | File may already be missing; proceed with DB delete regardless |
| Queue re-enqueueing | Custom queue interface | `addGenerationJob` from `lib/queue.ts` | Exports the exact function needed; already handles priority=1 |

**Key insight:** This phase is almost entirely reuse. The risk is writing new code where Phase 2 code already exists.

---

## Common Pitfalls

### Pitfall 1: Json field casting for retry

**What goes wrong:** `generation.promptData` and `generation.options` are Prisma `Json` fields — they arrive as `unknown` at runtime. Accessing `.sourceImagePath` without casting causes TypeScript errors or runtime crashes.

**Why it happens:** Prisma types Json as `Prisma.JsonValue` which doesn't expose nested properties.

**How to avoid:** Cast to `Record<string, unknown>` before reading, same as `GenerationService.regenerate`:
```typescript
const promptData = (generation.promptData as Record<string, unknown>) ?? {};
const options = (generation.options as Record<string, unknown>) ?? {};
```

**Warning signs:** TypeScript error "Property 'sourceImagePath' does not exist on type 'JsonValue'"

### Pitfall 2: GeneratedImage ↔ Generation cascade on delete

**What goes wrong:** The Prisma schema shows `GeneratedImage.generation` has `onDelete: Cascade` from Generation → GeneratedImage. If you delete the `Generation` record, all `GeneratedImage` records cascade-delete automatically. But CONT-02/CONT-04 should only delete images, not generations.

**Why it happens:** Confusing "delete images" with "delete generation" since `GenerationService.deleteGeneration` does both.

**How to avoid:** In `AdminService.deleteGeneratedImage` and `bulkDeleteImages`, only call `prisma.generatedImage.delete/deleteMany` — never touch the `Generation` table.

### Pitfall 3: Bulk delete count race condition

**What goes wrong:** The count shown in the confirmation modal is fetched right before the DELETE button appears. By the time the user confirms, new images may have been added/deleted, making the count stale.

**Why it happens:** Count and delete are two separate requests.

**How to avoid:** This is acceptable for an admin tool — document it as known behavior. The server performs the actual delete based on filters, not on a fixed count. The count in the modal is informational only.

### Pitfall 4: retryCount not incrementing in AdminService

**What goes wrong:** When admin retries a failed job, the `retryCount` field on the Generation stays at its old value. BullMQ's own retry mechanism increments a separate counter (in Redis). The DB `retryCount` is application-level.

**Why it happens:** `updateStatus` in `GenerationService` doesn't increment `retryCount` automatically.

**How to avoid:** The admin retry should increment `retryCount` explicitly:
```typescript
await prisma.generation.update({
  where: { id },
  data: {
    status: 'pending',
    errorMessage: null,
    retryCount: { increment: 1 },
  },
});
```

### Pitfall 5: Images served without auth in frontend

**What goes wrong:** `thumbnailPath` values are relative filesystem paths (e.g., `generations/userId/projectId/generationId/thumb_output_1.jpg`). If the Next.js app tries to render them as `<img src={thumbnailPath}>`, they won't load because the static file server is Fastify, not Next.js.

**Why it happens:** The existing app presumably serves static files from `config.uploadDir` via Fastify.

**How to avoid:** Prefix thumbnail paths with the API base URL: `${process.env.NEXT_PUBLIC_API_URL}/uploads/${image.thumbnailPath}`. Verify the static file serving endpoint by checking Fastify server config before implementation.

---

## Code Examples

### New AdminService method signatures

```typescript
// Append to AdminService class in admin.service.ts

export interface ListGenerationsParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  email?: string;
}

export interface ListGenerationsResult {
  generations: Array<{
    id: string;
    mode: string;
    status: string;
    errorMessage: string | null;
    retryCount: number;
    promptData: unknown;
    options: unknown;
    createdAt: Date;
    userEmail: string;
  }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
  statusCounts: Record<string, number>;
}

export interface ListImagesParams {
  page?: number;
  limit?: number;
  email?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
}
```

### New API route signatures

```
GET    /api/admin/generations              — list generations (GEN-01)
POST   /api/admin/generations/:id/retry   — retry failed job (GEN-03)
GET    /api/admin/content/images          — list generated images (CONT-01)
GET    /api/admin/content/images/count    — count for bulk delete confirmation
DELETE /api/admin/content/images/:id     — individual delete (CONT-02)
DELETE /api/admin/content/images          — bulk delete by filter (CONT-04)
```

### Status tab badge counts

Fetch status counts in a single query using `prisma.generation.groupBy`:
```typescript
const counts = await prisma.generation.groupBy({
  by: ['status'],
  _count: { _all: true },
});
// Returns: [{ status: 'pending', _count: { _all: 5 } }, ...]
```

### Frontend adminApi extensions

```typescript
// Append to adminApi in lib/api.ts

listGenerations: (token: string, params?: ListGenerationsParams) => ...
retryGeneration: (token: string, id: string) => ...
listImages: (token: string, params?: ListImagesParams) => ...
countImages: (token: string, params?: Omit<ListImagesParams, 'page' | 'limit'>) => ...
deleteImage: (token: string, id: string) => ...
bulkDeleteImages: (token: string, params: Omit<ListImagesParams, 'page' | 'limit'>) => ...
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 |
| Config file | `apps/api/vitest.config.ts` |
| Quick run command | `cd apps/api && npx vitest run src/services/__tests__/admin.service.test.ts` |
| Full suite command | `cd apps/api && npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GEN-01 | `listGenerations` returns paginated results with status filter | unit | `cd apps/api && npx vitest run src/services/__tests__/admin.service.test.ts` | Wave 0 (extend existing file) |
| GEN-01 | `listGenerations` returns statusCounts for tab badges | unit | same | Wave 0 |
| GEN-02 | Failed generation detail fields (errorMessage, promptData, retryCount) returned | unit | same | Wave 0 |
| GEN-03 | `retryGeneration` updates status to pending, clears errorMessage, increments retryCount | unit | same | Wave 0 |
| GEN-03 | `retryGeneration` calls `addGenerationJob` with correct data | unit | same | Wave 0 |
| CONT-01 | `listGeneratedImages` returns paginated results with email/date/project filters | unit | same | Wave 0 |
| CONT-02 | `deleteGeneratedImage` deletes DB record and calls deleteFile for filePath and thumbnailPath | unit | same | Wave 0 |
| CONT-02 | `deleteGeneratedImage` does NOT delete Generation record | unit | same | Wave 0 |
| CONT-04 | `bulkDeleteImages` deletes all matching GeneratedImage records | unit | same | Wave 0 |
| CONT-04 | `countImages` returns correct count matching filters | unit | same | Wave 0 |

### Sampling Rate

- **Per task commit:** `cd apps/api && npx vitest run src/services/__tests__/admin.service.test.ts`
- **Per wave merge:** `cd apps/api && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] New `describe` blocks in `apps/api/src/services/__tests__/admin.service.test.ts` — covers GEN-01 through CONT-04
  - Must mock `prisma.generation.findMany`, `prisma.generation.groupBy`, `prisma.generation.update`, `prisma.generatedImage.findMany`, `prisma.generatedImage.findUnique`, `prisma.generatedImage.delete`, `prisma.generatedImage.deleteMany`, `prisma.generatedImage.count`
  - Must mock `addGenerationJob` from `../../lib/queue.js`
  - Must mock `uploadService.deleteFile` from `../../services/upload.service.js`

*(No new test file is needed — extend the existing `admin.service.test.ts` file.)*

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate generation monitoring page | Tabbed content page (generation + content) | Phase 3 decision | Single `/admin/content` page handles both GEN and CONT requirements |
| User-scoped `GenerationService.regenerate` | Admin-scoped `AdminService.retryGeneration` | Phase 3 | Admin retry bypasses user ownership check; reads promptData directly from DB |

**No deprecated patterns introduced in this phase.**

---

## Open Questions

1. **Static file serving path for thumbnails**
   - What we know: `filePath` values are stored as relative paths (e.g., `generations/userId/...`) relative to `config.uploadDir`
   - What's unclear: What prefix does Fastify expose for static files? (e.g., `/uploads/`, `/files/`, `/static/`) — need to verify in `apps/api/src/server.ts`
   - Recommendation: Read `server.ts` during Wave 1 (API task) before implementing any image URL construction in the frontend

2. **Project dropdown population for content filter**
   - What we know: Content filter has a "project" dropdown per CONTEXT.md decisions
   - What's unclear: Should the dropdown list all projects in the system (could be thousands) or just projects that have generated images?
   - Recommendation: Use `prisma.project.findMany({ where: { generations: { some: { images: { some: {} } } } }, select: { id, name } })` — filters to projects with actual content; add a reasonable `take: 200` limit

---

## Sources

### Primary (HIGH confidence)
- Direct codebase reading — `apps/api/src/services/admin.service.ts`, `generation.service.ts`, `upload.service.ts`, `lib/queue.ts`
- Direct codebase reading — `apps/api/prisma/schema.prisma` — verified all model fields (status, retryCount, errorMessage, promptData, options, filePath, thumbnailPath)
- Direct codebase reading — `apps/api/src/services/__tests__/admin.service.test.ts` — vitest mock patterns confirmed
- Direct codebase reading — `apps/api/vitest.config.ts` — test include glob confirmed

### Secondary (MEDIUM confidence)
- BullMQ `addGenerationJob` signature inferred from `lib/queue.ts` source — matches `GenerationJobData` interface exactly

### Tertiary (LOW confidence)
- Static file serving endpoint path — not verified; requires reading `server.ts` before frontend image URL construction

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed in package.json; no new installs
- Architecture: HIGH — patterns verified by reading Phase 2 implementations directly
- Pitfalls: HIGH — identified from direct schema + service code analysis
- Test patterns: HIGH — existing test file read and structure confirmed

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (stable stack; no external API dependencies)
