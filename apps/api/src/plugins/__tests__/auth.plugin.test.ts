import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';

const TEST_JWT_SECRET = 'test-secret-key-for-unit-tests-32-chars-long';

// Mock config before importing the plugin
vi.mock('../../config/index.js', () => ({
  config: {
    jwtSecret: TEST_JWT_SECRET,
    jwtAccessExpiry: '15m',
    jwtRefreshExpiry: '7d',
  },
}));

// Mock authService so getUserFromToken returns controlled users
vi.mock('../../services/auth.service.js', () => ({
  authService: {
    getUserFromToken: vi.fn(),
  },
}));

async function buildTestApp(): Promise<FastifyInstance> {
  const { authPlugin } = await import('../auth.plugin.js');
  const app = Fastify({ logger: false });

  await app.register(authPlugin);

  // A test route protected by requireAdmin
  app.get('/protected', { preHandler: [(app as any).requireAdmin] }, async (_req, reply) => {
    return reply.code(200).send({ success: true, data: { status: 'ok' } });
  });

  await app.ready();
  return app;
}

describe('requireAdmin middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when no Authorization header is present', async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/protected' });
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    await app.close();
  });

  it('should return 401 when token is invalid', async () => {
    const app = await buildTestApp();
    const { authService } = await import('../../services/auth.service.js');
    vi.mocked(authService.getUserFromToken).mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: 'Bearer invalid-token' },
    });
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    await app.close();
  });

  it('should return 403 when authenticated user has role=user', async () => {
    const app = await buildTestApp();
    const { authService } = await import('../../services/auth.service.js');

    const regularUser = {
      id: 'user-456',
      email: 'user@example.com',
      name: '사용자',
      passwordHash: 'hashed-password',
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };
    vi.mocked(authService.getUserFromToken).mockResolvedValue(regularUser as any);

    const token = jwt.sign(
      { userId: 'user-456', email: 'user@example.com', role: 'user' },
      TEST_JWT_SECRET,
      { expiresIn: '15m' }
    );

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(403);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN');
    await app.close();
  });

  it('should pass through when authenticated user has role=admin', async () => {
    const app = await buildTestApp();
    const { authService } = await import('../../services/auth.service.js');

    const adminUser = {
      id: 'user-123',
      email: 'admin@example.com',
      name: '관리자',
      passwordHash: 'hashed-password',
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };
    vi.mocked(authService.getUserFromToken).mockResolvedValue(adminUser as any);

    const token = jwt.sign(
      { userId: 'user-123', email: 'admin@example.com', role: 'admin' },
      TEST_JWT_SECRET,
      { expiresIn: '15m' }
    );

    const response = await app.inject({
      method: 'GET',
      url: '/protected',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    await app.close();
  });
});
