import { prisma } from '../lib/prisma.js';
import type { UserRole } from '@mockup-ai/shared';

export class AdminService {
  /**
   * 시스템 통계 조회
   */
  async getStats() {
    const [
      totalUsers,
      totalProjects,
      totalGenerations,
      statusGroups,
      storageAggregate,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.generation.count(),
      prisma.generation.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.generatedImage.aggregate({
        _sum: { fileSize: true },
      }),
    ]);

    const generationsByStatus = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      ...Object.fromEntries(statusGroups.map((g) => [g.status, g._count])),
    };

    return {
      totalUsers,
      totalProjects,
      totalGenerations,
      generationsByStatus,
      storageUsageBytes: storageAggregate._sum.fileSize || 0,
    };
  }

  /**
   * 사용자 목록 조회 (페이지네이션 + 검색)
   */
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    isActive?: boolean;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.role) {
      where.role = params.role;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
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
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              projects: true,
              sessions: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 사용자 역할 변경
   */
  async updateUserRole(userId: string, role: UserRole, adminId: string) {
    // 자기 자신의 역할 변경 방지
    if (userId === adminId) {
      throw new Error('자기 자신의 역할을 변경할 수 없습니다');
    }

    // 트랜잭션으로 race condition 방지
    return prisma.$transaction(async (tx) => {
      // 마지막 관리자 제거 방지
      if (role === 'user') {
        const adminCount = await tx.user.count({ where: { role: 'admin' } });
        if (adminCount <= 1) {
          throw new Error('최소 1명의 관리자가 필요합니다');
        }
      }

      return tx.user.update({
        where: { id: userId },
        data: { role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      });
    });
  }

  /**
   * 사용자 활성/비활성
   */
  async toggleUserActive(userId: string, isActive: boolean, adminId: string) {
    // 자기 자신 비활성화 방지
    if (userId === adminId) {
      throw new Error('자기 자신을 비활성화할 수 없습니다');
    }

    return prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });
  }

  /**
   * 사용자 삭제
   */
  async deleteUser(userId: string, adminId: string) {
    // 자기 자신 삭제 방지
    if (userId === adminId) {
      throw new Error('자기 자신을 삭제할 수 없습니다');
    }

    // 트랜잭션으로 race condition 방지
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다');
      }

      // 관리자 삭제 시 마지막 관리자 체크
      if (user.role === 'admin') {
        const adminCount = await tx.user.count({ where: { role: 'admin' } });
        if (adminCount <= 1) {
          throw new Error('마지막 관리자는 삭제할 수 없습니다');
        }
      }

      // Cascade 삭제: Session, Project -> Generation -> GeneratedImage
      await tx.user.delete({
        where: { id: userId },
      });
    });
  }

  /**
   * 전체 생성 작업 조회 (필터)
   */
  async getGenerations(params: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.userId) {
      where.project = { userId: params.userId };
    }

    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) {
        where.createdAt.gte = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        where.createdAt.lte = new Date(params.dateTo);
      }
    }

    const [generations, total] = await Promise.all([
      prisma.generation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          },
          images: {
            where: { isSelected: true },
            take: 1,
          },
        },
      }),
      prisma.generation.count({ where }),
    ]);

    return {
      generations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 전체 프로젝트 조회
   */
  async getProjects(params: {
    page?: number;
    limit?: number;
    search?: string;
    userId?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          _count: {
            select: {
              generations: true,
              characters: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);

    return {
      projects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 프로젝트 삭제 (관리자용)
   */
  async deleteProject(projectId: string) {
    await prisma.project.delete({
      where: { id: projectId },
    });
  }
}

export const adminService = new AdminService();
