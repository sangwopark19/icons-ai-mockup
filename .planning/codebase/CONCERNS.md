# Codebase Concerns

**Analysis Date:** 2026-03-10

## Tech Debt

**Type Unsafety in API Routes:**
- Issue: 57 instances of `any`, `unknown`, `@ts-ignore` casts throughout API codebase, particularly in request/response handling
- Files: `apps/api/src/routes/*.ts`, `apps/api/src/services/*.ts`
- Impact: Type checking failures, potential runtime errors in request validation and response serialization
- Fix approach: Replace `any` with proper type definitions, use TypeScript strict mode, add Zod validation schemas to route handlers

**Unsafe Random File Name Generation:**
- Issue: `Math.random().toString(36).substring(2, 8)` used for file naming in `apps/api/src/services/upload.service.ts:52`
- Files: `apps/api/src/services/upload.service.ts`
- Impact: Predictable file names reduce security for uploaded files, potential collision risk with concurrent uploads
- Fix approach: Replace with `crypto.randomBytes()` or use UUID v4 for file naming

**Scattered Console Logging:**
- Issue: Excessive `console.log()`, `console.warn()`, `console.error()` scattered throughout codebase instead of structured logging
- Files: `apps/api/src/server.ts`, `apps/api/src/lib/redis.ts`, `apps/api/src/lib/prisma.ts`, `apps/api/src/worker.ts`, `apps/api/src/config/index.ts`
- Impact: Hard to parse logs in production, no centralized log levels, performance overhead, security risk of logging sensitive data
- Fix approach: Replace all console calls with structured logger (e.g., Pino which is already available), configure appropriate log levels

**JSON Type Casting in Database Operations:**
- Issue: Multiple instances of casting database JSON fields to `Record<string, unknown>` or `any` without validation
- Files: `apps/api/src/services/generation.service.ts:238-240`, `apps/api/src/worker.ts:21-42`
- Impact: Runtime errors if JSON schema changes, difficult to track data transformations
- Fix approach: Create proper TypeScript types for `promptData`, `options`, and `thoughtSignatures` fields; add runtime validation with Zod

## Known Bugs

**Polling State Race Condition:**
- Symptoms: Frontend may attempt multiple simultaneous requests during polling, potential duplicate state updates
- Files: `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx:57-120`
- Trigger: Rapid re-renders or network delays during polling interval (2000ms)
- Workaround: Currently uses `isLoadingRef` to prevent concurrent requests, but `setIsPolling` state updates could still trigger extra requests
- Fix approach: Use a stable interval hook that doesn't re-create dependencies, consolidate loading state logic

**Token in URL Query Parameter:**
- Symptoms: Access token exposed in URL during image download
- Files: `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx:180`
- Trigger: Click download button, token visible in browser history
- Workaround: Token is short-lived, but still a security concern
- Fix approach: Use HTTP header-based authentication for download endpoint, or implement signed URLs

**Incomplete Regeneration Input Validation:**
- Symptoms: `validateRegenerationInputs()` normalizes to JSON strings then compares, but only validates presence/type of fields
- Files: `apps/api/src/services/generation.service.ts:274-318`
- Trigger: If invalid data structures are stored in `promptData` or `options`, comparison may silently fail
- Workaround: Basic type checking provided
- Fix approach: Use Zod schema validation before normalization, add unit tests for edge cases

**File Cleanup Partial Failure Handling:**
- Symptoms: Generation deletion continues even if file system operations fail, potentially leaving orphaned files
- Files: `apps/api/src/services/generation.service.ts:418-471`
- Trigger: File permissions issues or disk space problems during deletion
- Workaround: Errors are caught and ignored with empty catch blocks
- Fix approach: Log file deletion failures separately, implement cleanup job for orphaned files

## Security Considerations

**CORS Configuration Allows Wildcard:**
- Risk: Configured with `"*"` wildcard origin (mitigated by Tailscale VPN, but still overly permissive)
- Files: `apps/api/src/server.ts:46-73`, environment variable `CORS_ORIGINS`
- Current mitigation: Tailscale VPN restricts network access to authorized users only
- Recommendations: Even with Tailscale, limit CORS to specific allowed origins, remove wildcard after VPN verification

**No Input Sanitization on Gemini Prompts:**
- Risk: User instructions and hardware spec inputs passed directly to Gemini API without HTML/JS escaping
- Files: `apps/api/src/services/gemini.service.ts:441-445`, `apps/web/src/app/projects/[id]/ip-change/page.tsx` (user input form)
- Current mitigation: Gemini API is external service, but prompt injection attacks possible
- Recommendations: Add input validation/escaping for all user-provided text fields before passing to LLM

**Hardcoded Signature Bypass Token:**
- Risk: `signatureBypass = 'context_engineering_is_the_way_to_go'` used as fallback when Gemini thoughtSignature unavailable
- Files: `apps/api/src/services/gemini.service.ts:34`
- Current mitigation: Only used internally in service-to-service communication
- Recommendations: Use environment variable instead of hardcoded string, consider if bypass mechanism is necessary

**Path Traversal Risk in File Operations:**
- Risk: `relativePath` parameter in upload service used with `path.join()` without validation
- Files: `apps/api/src/services/upload.service.ts:219-233`
- Current mitigation: Paths come from internal services, not user input
- Recommendations: Add explicit validation that paths don't contain `../`, use allowlist approach for file operations

## Performance Bottlenecks

**Polling Interval on Generation Results Page:**
- Problem: Frontend polls every 2 seconds for generation status, creates 30 requests per minute per user
- Files: `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx:136`
- Cause: Client-side polling instead of server-sent events or WebSockets
- Improvement path: Implement Server-Sent Events (SSE) or WebSocket for real-time updates, reduces server load significantly

**Worker Concurrency Limited to 2:**
- Problem: Only 2 concurrent generation jobs allowed, queue can grow unbounded during peak load
- Files: `apps/api/src/worker.ts:225`
- Cause: Conservative default to avoid overwhelming Gemini API and file system
- Improvement path: Monitor Gemini API rate limits, implement adaptive concurrency, add queue size monitoring and alerting

**Database N+1 Queries in Generation History:**
- Problem: `getProjectHistory()` fetches generations then loads related `ipCharacter` data for each
- Files: `apps/api/src/services/generation.service.ts:477-514`
- Cause: Prisma `include` doesn't join efficiently for large result sets
- Improvement path: Add explicit pagination, use `select()` instead of `include()` to fetch only needed fields, consider denormalization

**Sharp Image Processing Sequential:**
- Problem: Thumbnail generation happens sequentially after original image is processed
- Files: `apps/api/src/services/upload.service.ts:70-94`, `apps/api/src/services/upload.service.ts:179-200`
- Cause: Image operations can be optimized to process in parallel
- Improvement path: Create pipeline that processes original and thumbnail simultaneously, reduces I/O wait time

## Fragile Areas

**Gemini Service Hardware Spec Parsing:**
- Files: `apps/api/src/services/gemini.service.ts:451-537`
- Why fragile: Complex regex-based parsing of user-provided hardware spec strings with multiple fallback paths; grammar not formally defined
- Safe modification: Add comprehensive unit tests for various input formats, create formal grammar documentation, add logging for parsing failures
- Test coverage: No visible unit tests for `parseHardwareSpecLine()`, `detectHardwareType()` methods

**Image Upload Validation:**
- Files: `apps/api/src/services/upload.service.ts:59-107`, `apps/api/src/routes/upload.routes.ts`
- Why fragile: Sharp metadata parsing assumes width/height always present; no file size limits validated before processing
- Safe modification: Add explicit MIME type whitelist, validate file size before processing, add image dimension constraints
- Test coverage: No visible validation of edge cases (corrupted images, zero-size images, extreme dimensions)

**Generation Status Polling Loop:**
- Files: `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx:56-146`
- Why fragile: Multiple state variables controlling polling (`isPolling`, `isLoadingRef`, `intervalRef`); complex dependency array; race conditions possible between cleanup and fetch
- Safe modification: Extract polling logic to custom hook, use `useCallback` with stable dependencies, add abort controller for fetch requests
- Test coverage: No visible integration tests for polling behavior, 401 error handling, or cleanup sequences

**Thought Signature Handling in Worker:**
- Files: `apps/api/src/worker.ts:21-43`, `apps/api/src/services/gemini.service.ts:299-320`
- Why fragile: Signature data stored as JSON in database without schema validation; extraction logic uses optional chaining with defaults that may hide failures
- Safe modification: Define Zod schema for `ThoughtSignatureData`, validate on storage and retrieval, add monitoring for missing signatures
- Test coverage: No visible tests for signature parsing edge cases

## Scaling Limits

**File System Storage Unbounded:**
- Current capacity: `uploadDir` configuration points to local disk; no quota management
- Limit: Disk fills up when many generation jobs run (each generates 2 outputs + thumbnails = ~4-6 files per job)
- Scaling path: Implement S3/object storage, add automatic cleanup of old generations, implement storage quota per user

**Database Connection Pool:**
- Current capacity: Prisma default connection pool (likely 4-8 connections)
- Limit: Concurrent requests to database may timeout under load
- Scaling path: Increase `connection_limit` in database URL, add PgBouncer connection pooling, monitor slow queries

**Redis Queue Memory:**
- Current capacity: Single Redis instance with default memory (unbounded)
- Limit: If generation jobs queue faster than worker processes, memory grows indefinitely
- Scaling path: Add Redis persistence, implement job timeout/cleanup, monitor queue depth with alerts

**Single Worker Process:**
- Current capacity: One worker process with 2 concurrent jobs
- Limit: Can only process 2 generation requests simultaneously
- Scaling path: Run multiple worker processes, implement horizontal scaling with job distribution

## Dependencies at Risk

**@google/genai SDK Stability:**
- Risk: Recently released SDK (`@google/genai`), not widely battle-tested in production; API contract may change
- Impact: Breaking changes would require rewrite of `apps/api/src/services/gemini.service.ts`
- Migration plan: Monitor release notes closely, maintain compatibility with older SDK versions, implement abstraction layer for API calls

**Sharp Library Security:**
- Risk: Image processing library handles untrusted input; potential buffer overflow vulnerabilities in underlying C bindings
- Impact: Could allow remote code execution through malformed image uploads
- Migration plan: Keep Sharp updated, implement strict image validation before processing, consider alternatives like libvips

**BullMQ Queue System:**
- Risk: Migrating from BullMQ would require significant refactoring of `apps/api/src/worker.ts` and queue initialization
- Impact: If Redis becomes unavailable, job queue stops entirely
- Migration plan: Add graceful degradation for Redis connection loss, implement fallback to in-memory queue, add circuit breaker

## Missing Critical Features

**Job Retry Mechanism:**
- Problem: Failed generation jobs are not retried, users see permanent failure
- Blocks: Production reliability, user experience with transient errors
- Impact: Even temporary network blips cause jobs to fail without retry attempts
- Fix approach: Implement exponential backoff retry in BullMQ, make retry count configurable, add max retry limits

**API Rate Limiting:**
- Problem: No rate limits on API endpoints, vulnerable to abuse and DoS
- Blocks: Production deployment, protection against malicious users
- Impact: Single user could overwhelm server with unlimited generation requests
- Fix approach: Implement rate limiting middleware (e.g., `@fastify/rate-limit`), set per-user limits, use token bucket algorithm

**Image Deletion Cascade Issues:**
- Problem: `fs.rmdir()` fails if directory not empty; no comprehensive cleanup of orphaned files
- Blocks: Cannot reliably delete old projects
- Impact: Disk space leaks accumulate over time
- Fix approach: Use `fs.rm()` with `recursive: true`, implement cleanup job to find/delete orphaned files, add storage audit

**API Documentation:**
- Problem: No OpenAPI/Swagger documentation for endpoints
- Blocks: Difficult for frontend team to discover and test endpoints
- Impact: Increased development friction, API changes can break frontend
- Fix approach: Generate OpenAPI spec from Fastify routes using `@fastify/swagger`, document all request/response schemas

## Test Coverage Gaps

**Untested Image Generation Edge Cases:**
- What's not tested: Empty images, corrupt images, unsupported MIME types, extreme dimensions, zero-byte files
- Files: `apps/api/src/services/upload.service.ts`, `apps/api/src/routes/upload.routes.ts`
- Risk: Could crash worker process or corrupt database with invalid metadata
- Priority: High

**Missing Worker Error Scenarios:**
- What's not tested: Gemini API timeouts, network failures during image download, Redis connection loss, concurrent job handling
- Files: `apps/api/src/worker.ts`
- Risk: Worker may hang or enter zombie state on error
- Priority: High

**No Frontend Polling Tests:**
- What's not tested: 401 auth failure handling, network timeout during polling, interval cleanup on unmount, race conditions with rapid navigation
- Files: `apps/web/src/app/projects/[id]/generations/[genId]/page.tsx`
- Risk: Silent failures, memory leaks from uncleaned intervals
- Priority: Medium

**Database Transaction Testing:**
- What's not tested: Concurrent writes to same generation, partial transaction failures, deadlock scenarios
- Files: `apps/api/src/services/generation.service.ts`
- Risk: Inconsistent database state, lost updates
- Priority: Medium

**Authentication/Authorization Coverage:**
- What's not tested: Token expiration during operation, cross-user access attempts, missing required headers, invalid token formats
- Files: `apps/api/src/plugins/auth.plugin.ts`, `apps/api/src/routes/*.ts`
- Risk: Privilege escalation, unauthorized access
- Priority: High

---

*Concerns audit: 2026-03-10*
