import { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { generationQueue, addGenerationJob } from '../lib/queue.js';
import { uploadService } from './upload.service.js';

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
  startDate?: Date | string;
  endDate?: Date | string;
  ids?: string[];
}

export interface ListImagesResult {
  images: Array<{
    id: string;
    generationId: string;
    filePath: string;
    thumbnailPath: string | null;
    type: string;
    width: number;
    height: number;
    fileSize: number;
    createdAt: Date;
    userEmail: string;
    projectName: string;
  }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

function buildImageWhere(params: Omit<ListImagesParams, 'page' | 'limit'>) {
  const where: Record<string, unknown> = {};

  const generationIs: Record<string, unknown> = {};

  if (params.email) {
    generationIs.project = {
      is: {
        user: {
          is: {
            email: { contains: params.email, mode: 'insensitive' },
          },
        },
      },
    };
  }
  if (params.projectId) {
    generationIs.projectId = params.projectId;
  }
  if (Object.keys(generationIs).length > 0) {
    where.generation = { is: generationIs };
  }

  if (params.startDate || params.endDate) {
    const createdAt: Record<string, unknown> = {};
    if (params.startDate) createdAt.gte = params.startDate;
    if (params.endDate) createdAt.lte = params.endDate;
    where.createdAt = createdAt;
  }

  if (params.ids) {
    where.id = { in: params.ids };
  }

  return where;
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

  async listGenerations(params: ListGenerationsParams): Promise<ListGenerationsResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.status) {
      where.status = params.status;
    }
    if (params.email) {
      where.project = {
        is: {
          user: {
            is: {
              email: { contains: params.email, mode: 'insensitive' },
            },
          },
        },
      };
    }

    const [generations, total, groupByResult] = await Promise.all([
      prisma.generation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            include: { user: { select: { email: true } } },
          },
        },
      }),
      prisma.generation.count({ where }),
      prisma.generation.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const row of groupByResult) {
      statusCounts[row.status] = row._count._all;
    }

    return {
      generations: generations.map((g) => ({
        id: g.id,
        mode: g.mode,
        status: g.status,
        errorMessage: g.errorMessage,
        retryCount: g.retryCount,
        promptData: g.promptData,
        options: g.options,
        createdAt: g.createdAt,
        userEmail: g.project.user.email,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      statusCounts,
    };
  }

  async retryGeneration(id: string) {
    const generation = await prisma.generation.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!generation) {
      throw new Error('Generation not found');
    }
    if (generation.status !== 'failed') {
      throw new Error('Only failed generations can be retried');
    }

    const updated = await prisma.generation.update({
      where: { id },
      data: {
        status: 'pending',
        errorMessage: null,
        retryCount: { increment: 1 },
      },
    });

    const promptData = (generation.promptData as Record<string, unknown>) ?? {};
    const options = (generation.options as Record<string, unknown>) ?? {};

    await addGenerationJob({
      generationId: generation.id,
      userId: generation.project.userId,
      projectId: generation.projectId,
      mode: generation.mode as 'ip_change' | 'sketch_to_real',
      sourceImagePath: promptData.sourceImagePath as string | undefined,
      characterImagePath: promptData.characterImagePath as string | undefined,
      textureImagePath: promptData.textureImagePath as string | undefined,
      prompt: promptData.prompt as string | undefined,
      options: {
        preserveStructure: (options.preserveStructure as boolean) ?? false,
        transparentBackground: (options.transparentBackground as boolean) ?? false,
        outputCount: (options.outputCount as number) ?? 1,
      },
    });

    return updated;
  }

  async listGeneratedImages(params: ListImagesParams): Promise<ListImagesResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = buildImageWhere(params);

    const [images, total] = await Promise.all([
      prisma.generatedImage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          generation: {
            include: {
              project: {
                select: {
                  name: true,
                  user: { select: { email: true } },
                },
              },
            },
          },
        },
      }),
      prisma.generatedImage.count({ where }),
    ]);

    return {
      images: images.map((img) => ({
        id: img.id,
        generationId: img.generationId,
        filePath: img.filePath,
        thumbnailPath: img.thumbnailPath,
        type: img.type,
        width: img.width,
        height: img.height,
        fileSize: img.fileSize,
        createdAt: img.createdAt,
        userEmail: img.generation.project.user.email,
        projectName: img.generation.project.name,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteGeneratedImage(imageId: string): Promise<void> {
    const image = await prisma.generatedImage.findUnique({ where: { id: imageId } });

    if (!image) {
      throw new Error('Image not found');
    }

    try {
      await uploadService.deleteFile(image.filePath);
    } catch {
      // File may already be missing; proceed with DB delete
    }
    if (image.thumbnailPath) {
      try {
        await uploadService.deleteFile(image.thumbnailPath);
      } catch {
        // File may already be missing; proceed with DB delete
      }
    }

    await prisma.generatedImage.delete({ where: { id: imageId } });
  }

  async countImages(params: Omit<ListImagesParams, 'page' | 'limit'>): Promise<number> {
    const where = buildImageWhere(params);
    return prisma.generatedImage.count({ where });
  }

  async bulkDeleteImages(params: Omit<ListImagesParams, 'page' | 'limit'>): Promise<{ deletedCount: number }> {
    const where = buildImageWhere(params);

    const images = await prisma.generatedImage.findMany({
      where,
      select: { id: true, filePath: true, thumbnailPath: true },
    });

    for (const image of images) {
      try {
        await uploadService.deleteFile(image.filePath);
      } catch {
        // File may already be missing
      }
      if (image.thumbnailPath) {
        try {
          await uploadService.deleteFile(image.thumbnailPath);
        } catch {
          // File may already be missing
        }
      }
    }

    await prisma.generatedImage.deleteMany({ where });

    return { deletedCount: images.length };
  }
}

export const adminService = new AdminService();
