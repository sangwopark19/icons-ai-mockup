import { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { generationQueue } from '../lib/queue.js';

export interface DashboardStats {
  userCount: number;
  generationCount: number;
  failedJobCount: number;
  queueDepth: number;
  storageBytes: number;
  activeApiKeys: null; // Phase 4 -- ApiKey model does not exist yet
  userCountYesterday: number;
  generationCountYesterday: number;
  failedJobCountYesterday: number;
}

export interface HourlyChartPoint {
  hour: string;
  count: number;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
}

export interface ListUsersResult {
  users: Array<{
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt: Date | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const [
      userCount,
      generationCount,
      failedJobCount,
      imageAggregate,
      jobCounts,
      userCountYesterday,
      generationCountYesterday,
      failedJobCountYesterday,
    ] = await Promise.all([
      prisma.user.count({ where: { status: { not: 'deleted' } } }),
      prisma.generation.count(),
      prisma.generation.count({
        where: { status: 'failed', createdAt: { gte: twentyFourHoursAgo } },
      }),
      prisma.generatedImage.aggregate({ _sum: { fileSize: true } }),
      generationQueue.getJobCounts('waiting', 'active', 'delayed'),
      prisma.user.count({
        where: { createdAt: { gte: fortyEightHoursAgo, lt: twentyFourHoursAgo } },
      }),
      prisma.generation.count({
        where: { createdAt: { gte: fortyEightHoursAgo, lt: twentyFourHoursAgo } },
      }),
      prisma.generation.count({
        where: {
          status: 'failed',
          createdAt: { gte: fortyEightHoursAgo, lt: twentyFourHoursAgo },
        },
      }),
    ]);

    const queueDepth =
      (jobCounts.waiting ?? 0) + (jobCounts.active ?? 0) + (jobCounts.delayed ?? 0);

    return {
      userCount,
      generationCount,
      failedJobCount,
      queueDepth,
      storageBytes: imageAggregate._sum.fileSize ?? 0,
      activeApiKeys: null, // Phase 4 -- ApiKey model does not exist yet
      userCountYesterday,
      generationCountYesterday,
      failedJobCountYesterday,
    };
  }

  async getHourlyFailureChart(): Promise<HourlyChartPoint[]> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const rows = await prisma.$queryRaw<Array<{ hour: Date; count: bigint }>>`
      SELECT
        date_trunc('hour', created_at) AS hour,
        COUNT(*) AS count
      FROM generations
      WHERE status = 'failed'
        AND created_at >= ${twentyFourHoursAgo}
      GROUP BY hour
      ORDER BY hour ASC
    `;

    return rows.map((row) => ({
      hour: row.hour.toISOString(),
      count: Number(row.count),
    }));
  }

  async listUsers(params: ListUsersParams): Promise<ListUsersResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.email) {
      where.email = { contains: params.email, mode: 'insensitive' };
    }
    if (params.role) {
      where.role = params.role;
    }
    if (params.status) {
      where.status = params.status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateUserStatus(id: string, status: 'active' | 'suspended') {
    return prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  async updateUserRole(id: string, role: 'admin' | 'user') {
    return prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async softDeleteUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: {
        status: 'deleted',
        email: `deleted_${id}@anon`,
        name: '삭제된 사용자',
        passwordHash: 'DELETED',
      },
    });
  }
}

export const adminService = new AdminService();
