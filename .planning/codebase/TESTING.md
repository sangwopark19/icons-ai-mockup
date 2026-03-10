# Testing Patterns

**Analysis Date:** 2026-03-10

## Test Framework

**Runner:**
- Vitest 2.1.9 (configured but not actively used in codebase)
- Config: Not detected in apps (would be `vitest.config.ts` if present)

**Assertion Library:**
- Not configured (Vitest ships with built-in assertions via `expect()`)

**Run Commands:**
```bash
npm run test              # (Not configured in package.json scripts)
npm run type-check       # Type checking via TypeScript compiler
npm run lint             # Linting via ESLint
```

**Status:** The codebase does **not currently have unit or integration tests configured**. Vitest is in devDependencies but no test suite exists.

## Test File Organization

**Location:**
- Test files would be co-located: `src/services/auth.service.test.ts` next to `src/services/auth.service.ts`
- Or in separate directory: `tests/` at root (currently only contains `tests/fixtures/`)

**Naming:**
- Pattern would be: `*.test.ts` or `*.spec.ts`
- No active tests exist in codebase

**Structure:**
```
tests/
├── fixtures/          # Test data and factories
```

Currently only `tests/fixtures/` directory exists but is empty.

## Test Structure

No test suites currently exist. When tests are added, the pattern would follow:

**Typical Suite Organization:**
```typescript
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
  });

  describe('register', () => {
    it('should create user with hashed password', async () => {
      // Arrange
      const email = 'test@example.com';

      // Act
      const user = await service.register(email, 'password', 'Test User');

      // Assert
      expect(user.email).toBe(email);
      expect(user.passwordHash).not.toBe('password');
    });

    it('should reject duplicate email', async () => {
      // Arrange
      const email = 'test@example.com';
      await service.register(email, 'password', 'User 1');

      // Act & Assert
      await expect(
        service.register(email, 'password', 'User 2')
      ).rejects.toThrow('이미 등록된 이메일입니다');
    });
  });
});
```

**Patterns:**
- Setup: `beforeEach()` hook for test initialization
- Teardown: `afterEach()` hook would clean database (not implemented)
- Assertion: Vitest `expect()` API with `.toEqual()`, `.toThrow()`, `.resolves`, `.rejects`

## Mocking

**Framework:** Not configured

**Planned Approach:**
- Vitest `vi.mock()` for module mocking
- Mock Prisma client for database isolation
- Mock external services (Gemini API, Redis, file system)

**What to Mock:**
- Database layer (Prisma)
- External APIs (Google Gemini)
- File system operations
- Redis/caching layer
- JWT token validation

**What NOT to Mock:**
- Core business logic (services)
- Pure utility functions
- Type validation (Zod schemas)
- Error handling

## Fixtures and Factories

**Test Data:**
No fixtures or factories currently exist. When implementing, pattern would be:

```typescript
// tests/fixtures/users.ts
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  passwordHash: 'hashed-password',
  createdAt: new Date('2026-01-01'),
  lastLoginAt: null,
};

export const createMockUser = (overrides = {}) => ({
  ...mockUser,
  ...overrides,
});
```

**Location:**
- Would be `tests/fixtures/` with subdirectories per entity: `tests/fixtures/users/`, `tests/fixtures/projects/`

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
npm run test -- --coverage     # (if test script existed)
vitest run --coverage          # Manual command with Vitest
```

**Current Status:** No coverage tracking configured. Recommended minimum: 70% for services, 50% for routes.

## Test Types

**Unit Tests:**
- Scope: Individual service methods and pure functions
- Approach: Test single responsibility, mock dependencies
- Examples to implement:
  - `AuthService.register()` - validates input, hashes password, prevents duplicates
  - `ProjectService.findByIdWithStats()` - calculates counts correctly
  - Utility functions like `cn()` for class merging

**Integration Tests:**
- Scope: Service + database interactions, route + service chains
- Approach: Use real or in-memory database, mock external APIs
- Examples to implement:
  - Auth flow: register → login → refresh tokens
  - Project creation + character creation + generation
  - File upload → image generation pipeline

**E2E Tests:**
- Framework: Not configured (would use Playwright or Cypress)
- Status: Not implemented
- Scope would cover: Full user workflows from frontend through API to database

## Common Patterns

**Async Testing:**
```typescript
// Using async/await
it('should fetch user data', async () => {
  const user = await authService.getUserById('test-id');
  expect(user).toBeDefined();
});

// Using .resolves
await expect(service.login(email, password)).resolves.toHaveProperty('accessToken');

// Using .rejects for error cases
await expect(service.login(email, 'wrong')).rejects.toThrow();
```

**Error Testing:**
```typescript
it('should throw error for invalid email', async () => {
  await expect(
    authService.register('invalid-email', 'password', 'Name')
  ).rejects.toThrow('올바른 이메일 형식이 아닙니다');
});

it('should catch and transform errors', () => {
  try {
    throw new Error('Original error');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown';
    expect(message).toBe('Original error');
  }
});
```

## Database Testing

**Approach:** Would require:
- Prisma in-memory database or test database
- Test database setup/teardown via `beforeAll()` / `afterAll()`
- Seed data before each test suite
- Clean tables after tests

**Example pattern:**
```typescript
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Clean up and disconnect
  await prisma.$disconnect();
});

afterEach(async () => {
  // Clear test data
  await prisma.user.deleteMany();
});
```

## Testing Gaps

**Critical untested areas:**
- `apps/api/src/services/` - All service logic (auth, generation, project, upload, gemini)
- `apps/api/src/routes/` - All route handlers and request validation
- `apps/api/src/plugins/` - Authentication and error handling middleware
- `apps/web/src/lib/api.ts` - API client and request/response handling
- `apps/web/src/stores/auth.store.ts` - Zustand store logic
- Integration between API routes and services

**No test for:**
- JWT token generation and validation
- Bcrypt password hashing
- File upload handling and image processing
- Redis queue operations (BullMQ)
- Prisma database queries
- API error responses and edge cases

## Setting Up Tests

**Steps to implement:**
1. Keep Vitest 2.1.9 (already in devDependencies)
2. Create `vitest.config.ts` in both `apps/api` and `apps/web` (or root)
3. Add test scripts to package.json: `"test": "vitest", "test:coverage": "vitest run --coverage"`
4. Create `tests/` directory structure with fixtures and factories
5. Start with service unit tests (lowest-hanging fruit)
6. Add integration tests for critical user flows
7. Set up coverage thresholds in vitest config

**Example vitest.config.ts for API:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/'],
      lines: 70,
      functions: 70,
      branches: 50,
      statements: 70,
    },
  },
});
```

---

*Testing analysis: 2026-03-10*
