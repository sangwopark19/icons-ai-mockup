import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

// Mock prisma
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    session: {
      create: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Mock config
vi.mock('../../config/index.js', () => ({
  config: {
    jwtSecret: 'test-secret-key-for-unit-tests-32-chars-long',
    jwtAccessExpiry: '1d',
    jwtRefreshExpiry: '7d',
  },
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

describe('AuthService - JWT role payload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should include role in the JWT access token payload for admin user', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { authService } = await import('../auth.service.js');

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

    vi.mocked(prisma.user.findUnique).mockResolvedValue(adminUser as any);
    vi.mocked(prisma.session.create).mockResolvedValue({} as any);
    vi.mocked(prisma.user.update).mockResolvedValue(adminUser as any);

    const { accessToken } = await authService.login('admin@example.com', 'admin1234!');

    const decoded = jwt.decode(accessToken) as any;
    expect(decoded).toBeDefined();
    expect(decoded.userId).toBe('user-123');
    expect(decoded.email).toBe('admin@example.com');
    expect(decoded.role).toBe('admin');
    expect(decoded.exp - decoded.iat).toBe(86_400);
  });

  it('should include role in the JWT access token payload for regular user', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { authService } = await import('../auth.service.js');

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

    vi.mocked(prisma.user.findUnique).mockResolvedValue(regularUser as any);
    vi.mocked(prisma.session.create).mockResolvedValue({} as any);
    vi.mocked(prisma.user.update).mockResolvedValue(regularUser as any);

    const { accessToken } = await authService.login('user@example.com', 'password123');

    const decoded = jwt.decode(accessToken) as any;
    expect(decoded).toBeDefined();
    expect(decoded.role).toBe('user');
  });

  it('should persist refresh session expiry from the refresh token exp claim', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { authService } = await import('../auth.service.js');

    const user = {
      id: 'user-789',
      email: 'session@example.com',
      name: '세션 사용자',
      passwordHash: 'hashed-password',
      role: 'user',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);
    vi.mocked(prisma.session.create).mockResolvedValue({} as any);
    vi.mocked(prisma.user.update).mockResolvedValue(user as any);

    const { refreshToken } = await authService.login('session@example.com', 'password123');
    const decoded = jwt.decode(refreshToken) as any;
    const createCall = vi.mocked(prisma.session.create).mock.calls[0]?.[0] as any;

    expect(decoded?.exp).toBeTypeOf('number');
    expect(createCall.data.token).toBe(refreshToken);
    expect(createCall.data.expiresAt.getTime()).toBe(decoded.exp * 1000);
  });
});
