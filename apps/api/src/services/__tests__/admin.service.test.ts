import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    generation: {
      count: vi.fn(),
    },
    generatedImage: {
      aggregate: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

// Mock generationQueue
vi.mock('../../lib/queue.js', () => ({
  generationQueue: {
    getJobCounts: vi.fn(),
  },
}));

describe('AdminService - getDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return dashboard stats with all required fields', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { generationQueue } = await import('../../lib/queue.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.user.count)
      .mockResolvedValueOnce(42) // current userCount
      .mockResolvedValueOnce(5); // yesterday userCountYesterday
    vi.mocked(prisma.generation.count)
      .mockResolvedValueOnce(100) // generationCount
      .mockResolvedValueOnce(10) // failedJobCount
      .mockResolvedValueOnce(80) // generationCountYesterday
      .mockResolvedValueOnce(8); // failedJobCountYesterday
    vi.mocked(prisma.generatedImage.aggregate).mockResolvedValue({
      _sum: { fileSize: 1024000 },
    } as any);
    vi.mocked(generationQueue.getJobCounts).mockResolvedValue({
      waiting: 2,
      active: 1,
      delayed: 0,
    } as any);

    const stats = await adminService.getDashboardStats();

    expect(stats.userCount).toBe(42);
    expect(stats.generationCount).toBe(100);
    expect(stats.failedJobCount).toBe(10);
    expect(stats.storageBytes).toBe(1024000);
    expect(stats.queueDepth).toBe(3); // waiting + active + delayed
    expect(stats.activeApiKeys).toBeNull();
    expect(stats.userCountYesterday).toBe(5);
    expect(stats.generationCountYesterday).toBe(80);
    expect(stats.failedJobCountYesterday).toBe(8);
  });

  it('should exclude deleted users from userCount', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { generationQueue } = await import('../../lib/queue.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(prisma.generation.count).mockResolvedValue(0);
    vi.mocked(prisma.generatedImage.aggregate).mockResolvedValue({ _sum: { fileSize: null } } as any);
    vi.mocked(generationQueue.getJobCounts).mockResolvedValue({ waiting: 0, active: 0, delayed: 0 } as any);

    await adminService.getDashboardStats();

    // First call should have status: { not: 'deleted' } filter
    expect(vi.mocked(prisma.user.count).mock.calls[0][0]).toMatchObject({
      where: { status: { not: 'deleted' } },
    });
  });

  it('should handle null storageBytes when no images exist', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { generationQueue } = await import('../../lib/queue.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(prisma.generation.count).mockResolvedValue(0);
    vi.mocked(prisma.generatedImage.aggregate).mockResolvedValue({ _sum: { fileSize: null } } as any);
    vi.mocked(generationQueue.getJobCounts).mockResolvedValue({ waiting: 0, active: 0, delayed: 0 } as any);

    const stats = await adminService.getDashboardStats();
    expect(stats.storageBytes).toBe(0);
  });
});

describe('AdminService - getHourlyFailureChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return array of hourly failure chart data', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    const mockRows = [
      { hour: new Date('2026-03-11T10:00:00Z'), count: BigInt(3) },
      { hour: new Date('2026-03-11T11:00:00Z'), count: BigInt(5) },
    ];
    vi.mocked(prisma.$queryRaw).mockResolvedValue(mockRows);

    const chart = await adminService.getHourlyFailureChart();

    expect(chart).toHaveLength(2);
    expect(chart[0]).toMatchObject({ hour: expect.any(String), count: 3 });
    expect(chart[1]).toMatchObject({ hour: expect.any(String), count: 5 });
  });

  it('should convert bigint count to number', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      { hour: new Date('2026-03-11T10:00:00Z'), count: BigInt(99) },
    ]);

    const chart = await adminService.getHourlyFailureChart();
    expect(typeof chart[0].count).toBe('number');
    expect(chart[0].count).toBe(99);
  });
});

describe('AdminService - listUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated user list with pagination metadata', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    const mockUsers = [
      { id: 'u1', email: 'a@a.com', name: 'A', role: 'user', status: 'active', createdAt: new Date(), updatedAt: new Date(), lastLoginAt: null },
    ];
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any);
    vi.mocked(prisma.user.count).mockResolvedValue(1);

    const result = await adminService.listUsers({ page: 1, limit: 20 });

    expect(result.users).toHaveLength(1);
    expect(result.pagination).toMatchObject({ page: 1, limit: 20, total: 1, totalPages: 1 });
  });

  it('should use default page=1, limit=20 when not provided', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    const result = await adminService.listUsers({});

    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(20);
  });

  it('should apply case-insensitive email filter', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    await adminService.listUsers({ email: 'test@example.com' });

    expect(vi.mocked(prisma.user.findMany).mock.calls[0][0]).toMatchObject({
      where: expect.objectContaining({
        email: { contains: 'test@example.com', mode: 'insensitive' },
      }),
    });
  });

  it('should apply role filter', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.count).mockResolvedValue(0);

    await adminService.listUsers({ role: 'admin' as any });

    expect(vi.mocked(prisma.user.findMany).mock.calls[0][0]).toMatchObject({
      where: expect.objectContaining({ role: 'admin' }),
    });
  });
});

describe('AdminService - updateUserStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should suspend a user', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    const mockUser = { id: 'u1', status: 'suspended' };
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    const result = await adminService.updateUserStatus('u1', 'suspended');

    expect(vi.mocked(prisma.user.update)).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { status: 'suspended' },
    });
    expect(result).toEqual(mockUser);
  });

  it('should reactivate a user', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    const mockUser = { id: 'u1', status: 'active' };
    vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any);

    await adminService.updateUserStatus('u1', 'active');

    expect(vi.mocked(prisma.user.update)).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { status: 'active' },
    });
  });
});

describe('AdminService - updateUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should promote user to admin', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'u1', role: 'admin' } as any);

    await adminService.updateUserRole('u1', 'admin');

    expect(vi.mocked(prisma.user.update)).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { role: 'admin' },
    });
  });

  it('should demote admin to user', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.user.update).mockResolvedValue({ id: 'u1', role: 'user' } as any);

    await adminService.updateUserRole('u1', 'user');

    expect(vi.mocked(prisma.user.update)).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { role: 'user' },
    });
  });
});

describe('AdminService - softDeleteUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should anonymize user PII on soft delete', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    await adminService.softDeleteUser('u1');

    expect(vi.mocked(prisma.user.update)).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: {
        status: 'deleted',
        email: 'deleted_u1@anon',
        name: '삭제된 사용자',
        passwordHash: 'DELETED',
      },
    });
  });

  it('should NOT call prisma.user.delete', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.user.update).mockResolvedValue({} as any);

    await adminService.softDeleteUser('u1');

    // prisma.user has no delete mock - if it were called the test would detect it
    // We verify update was called instead
    expect(vi.mocked(prisma.user.update)).toHaveBeenCalledTimes(1);
  });
});
