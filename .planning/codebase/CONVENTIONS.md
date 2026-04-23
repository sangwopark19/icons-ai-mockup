# Coding Conventions

**Analysis Date:** 2026-03-10

## Naming Patterns

**Files:**
- PascalCase for React components: `Button.tsx`, `AuthProvider.tsx`
- camelCase for utilities and services: `auth.service.ts`, `api.ts`, `cn.ts`
- kebab-case for directories: `src/components/ui`, `src/stores`, `src/lib`
- Index files for barrel exports: `src/index.ts`, `src/types/index.ts`

**Functions:**
- camelCase for all functions: `registerPlugins()`, `generateAccessToken()`, `loadProject()`
- Prefix async functions with action words: `register()`, `login()`, `refresh()`, `create()`
- Private methods use underscore prefix: `_saveSession()`, `_generateRefreshToken()` (in classes, declared as private)

**Variables:**
- camelCase for all variables: `accessToken`, `isLoading`, `projectId`, `userData`
- Boolean variables prefix with `is` or `has`: `isAuthenticated`, `isLoading`, `hasError`
- Constants in UPPER_SNAKE_CASE: `BCRYPT_ROUNDS = 12`, `API_PORT`, `JWT_SECRET`

**Types:**
- PascalCase for all types and interfaces: `User`, `Project`, `AuthState`, `ButtonProps`
- Append `Props` suffix for component prop types: `ButtonProps`, `InputProps`
- Append `Input`, `Output`, `Schema` for request/response types: `CreateProjectInput`, `AuthResponse`

## Code Style

**Formatting:**
- Tool: Prettier 3.4.2
- Settings:
  - Semicolons: `true`
  - Single quotes: `true` (except JSX/TSX)
  - Tab width: 2 spaces
  - Trailing comma: `es5` (objects, arrays, but not function params)
  - Print width: 100 characters
  - Plugins: `prettier-plugin-tailwindcss` (for Tailwind class sorting)

**Linting:**
- Tool: ESLint 9.18.0
- No explicit `.eslintrc` found; using Next.js defaults for web app
- API app runs `eslint src/` via npm script

**TypeScript:**
- Strict mode: `true`
- Target: `ES2022`
- Module resolution: `NodeNext` (API), `bundler` (web)
- ES modules with `.js` extension in imports: `import auth from './auth.plugin.js'`

## Import Organization

**Order:**
1. External packages (React, Next.js, third-party): `import React from 'react'`, `import fastify from 'fastify'`
2. Internal utilities and types: `import { cn } from '@/lib/cn'`, `import { config } from './config'`
3. Service/component imports: `import authRoutes from './routes/auth.routes'`

**Path Aliases:**
- `@/*` maps to `src/*` (both web and API)
- `@mockup-ai/shared` maps to workspace package `../../packages/shared/src`

**Example from codebase:**
```typescript
// apps/api/src/server.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config/index.js';
import authPlugin from './plugins/auth.plugin.js';
```

## Error Handling

**Patterns:**
- Wrap async operations in try-catch blocks
- Re-throw or transform errors with descriptive messages in Korean
- Use error type guards: `if (error instanceof Error) { error.message }`
- Return error responses with structured format: `{ success: false, error: { code: 'ERROR_CODE', message: '...' } }`
- HTTP status codes: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 500 (server error)

**Example:**
```typescript
// apps/api/src/routes/auth.routes.ts
try {
  const user = await authService.register(body.email, body.password, body.name);
  return reply.code(201).send({ success: true, data: { user } });
} catch (error) {
  const message = error instanceof Error ? error.message : '회원가입에 실패했습니다';
  return reply.code(400).send({ success: false, error: { code: 'REGISTER_FAILED', message } });
}
```

## Logging

**Framework:** None configured; uses `console.log()` and Fastify's built-in logger

**Patterns:**
- Fastify server logs via `server.log.info()`, `server.log.error()`, `server.log.debug()`
- Development environment uses pino-pretty for colored, human-readable logs
- Prefix logs with emoji and context: `[CORS] ✅ ALLOWED:`, `🚀 서버가`, `❌ 환경 변수 검증 실패:`
- Console logs used for lifecycle events and errors: `console.log()`, `console.error()`

**Example:**
```typescript
// apps/api/src/server.ts
server.log.info(`🚀 서버가 http://localhost:${config.port} 에서 실행 중입니다`);
console.log(`[CORS] ✅ ALLOWED: ${origin}`);
```

## Comments

**When to Comment:**
- Document public functions and methods with JSDoc comments
- Explain non-obvious logic and complex algorithms
- Mark section boundaries with comment blocks
- Describe "why" not "what" (code shows what, comment explains why)

**JSDoc/TSDoc:**
- Use block comments with `/**` for functions, classes, and complex blocks
- Include description, @param, @returns tags for clarity
- Used extensively in API services and routes

**Example:**
```typescript
/**
 * 회원가입
 */
async register(email: string, password: string, name: string): Promise<User> {
  // 이메일 중복 확인
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('이미 등록된 이메일입니다');
  }
}
```

## Function Design

**Size:** Most functions keep to 20-50 lines; larger functions (100+ lines) break concerns into smaller helpers

**Parameters:**
- Prefer object parameters for multiple related values
- Use type-safe interfaces for input validation
- Explicit over implicit: `async register(email: string, password: string, name: string)`

**Return Values:**
- Services return plain objects or types (no wrappers): `Promise<User>`, `Promise<{ projects: Project[]; total: number }>`
- Routes return structured responses: `{ success: boolean, data?: T, error?: { code, message }, message?: string }`
- Use nullability deliberately: `Promise<User | null>` for optional lookups

## Module Design

**Exports:**
- Services export singleton instances: `export const authService = new AuthService()`
- Routes export as default: `export default authRoutes`
- Utilities export named functions: `export function cn(...)`, `export const projectApi = { ... }`
- Types exported with `export type` or `export interface`

**Barrel Files:**
- Used in shared package: `packages/shared/src/index.ts`
- API and web apps use direct imports over barrel files for tree-shaking

**Example:**
```typescript
// apps/api/src/services/auth.service.ts
export class AuthService { ... }
export const authService = new AuthService();

// apps/api/src/server.ts
import authPlugin from './plugins/auth.plugin.js';  // Direct import

// packages/shared/src/index.ts
export { ... } from './types/index.js';  // Barrel export
```

## Validation

**Framework:** Zod for runtime schema validation

**Pattern:**
- Define schemas at module level
- Use `z.object()` for request bodies
- Chain validation rules: `.min()`, `.max()`, `.email()` with error messages
- Parse in route handlers: `const body = RegisterSchema.parse(request.body)`
- Use `safeParse()` when handling optional fields

**Example:**
```typescript
const RegisterSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
});
```

## Component Patterns (React/Next.js)

**Client Components:**
- Mark with `'use client'` directive in web app
- Use React hooks for state: `useState()`, `useEffect()`
- Leverage Zustand for global state: `useAuthStore()`
- Use React Hook Form with Zod validation for forms

**Props:**
- Define explicit interface for all props: `interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>`
- Use CVA (class-variance-authority) for variant-based styling

**Styling:**
- Tailwind CSS with design tokens (CSS variables): `text-[var(--text-primary)]`, `bg-[var(--bg-elevated)]`
- Merge classes with `cn()` utility: `cn(buttonVariants({ variant, size, className }))`
- Theme variables: `--brand-500`, `--text-primary`, `--bg-tertiary`, `--border-default`

---

*Convention analysis: 2026-03-10*
