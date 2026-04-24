import { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { generationQueue, addGenerationJob, type GenerationJobData } from '../lib/queue.js';
import { uploadService } from './upload.service.js';
import { encrypt, decrypt, getEncryptionKey } from '../lib/crypto.js';

export type ApiKeyProvider = 'gemini' | 'openai';

type ActiveApiKeyStats = { alias: string; callCount: number };

const API_KEY_PROVIDER_LABELS: Record<ApiKeyProvider, string> = {
  gemini: 'Gemini',
  openai: 'OpenAI',
};

const API_KEY_PUBLIC_SELECT = {
  id: true,
  provider: true,
  alias: true,
  maskedKey: true,
  isActive: true,
  callCount: true,
  lastUsedAt: true,
  createdAt: true,
} as const;

export interface DashboardStats {
  userCount: number;
  generationCount: number;
  failedJobCount: number;
  queueDepth: number;
  storageBytes: number;
  activeApiKeysByProvider: Record<ApiKeyProvider, ActiveApiKeyStats | null>;
  activeApiKeys?: ActiveApiKeyStats | null;
  userCountYesterday: number;
  generationCountYesterday: number;
  failedJobCountYesterday: number;
}

export interface ApiKeyListItem {
  id: string;
  provider: ApiKeyProvider;
  alias: string;
  maskedKey: string;
  isActive: boolean;
  callCount: number;
  lastUsedAt: Date | null;
  createdAt: Date;
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
    provider: ApiKeyProvider;
    providerModel: string;
    openaiRequestId: string | null;
    openaiResponseId: string | null;
    openaiImageCallId: string | null;
    openaiRevisedPrompt: string | null;
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

type DashboardJobCounts = Partial<Record<'waiting' | 'active' | 'delayed', number>>;

function getProviderMissingKeyMessage(provider: ApiKeyProvider): string {
  return `${API_KEY_PROVIDER_LABELS[provider]} API 키가 설정되지 않았습니다`;
}

function getProviderKeyNotFoundMessage(provider: ApiKeyProvider): string {
  return `${API_KEY_PROVIDER_LABELS[provider]} API 키를 찾을 수 없습니다`;
}

async function getDashboardJobCounts(): Promise<DashboardJobCounts> {
  try {
    return await generationQueue.getJobCounts('waiting', 'active', 'delayed');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Dashboard queue depth unavailable: ${message}`);
    return { waiting: 0, active: 0, delayed: 0 };
  }
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
      activeGeminiApiKeyRecord,
      activeOpenAiApiKeyRecord,
    ] = await Promise.all([
      prisma.user.count({ where: { status: { not: 'deleted' } } }),
      prisma.generation.count(),
      prisma.generation.count({
        where: { status: 'failed', createdAt: { gte: twentyFourHoursAgo } },
      }),
      prisma.generatedImage.aggregate({ _sum: { fileSize: true } }),
      getDashboardJobCounts(),
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
      prisma.apiKey.findFirst({
        where: { provider: 'gemini', isActive: true },
        select: { alias: true, callCount: true },
      }),
      prisma.apiKey.findFirst({
        where: { provider: 'openai', isActive: true },
        select: { alias: true, callCount: true },
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
      activeApiKeysByProvider: {
        gemini: activeGeminiApiKeyRecord ?? null,
        openai: activeOpenAiApiKeyRecord ?? null,
      },
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
        provider: g.provider,
        providerModel: g.providerModel,
        openaiRequestId: g.openaiRequestId,
        openaiResponseId: g.openaiResponseId,
        openaiImageCallId: g.openaiImageCallId,
        openaiRevisedPrompt: g.openaiRevisedPrompt,
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
      provider: generation.provider,
      providerModel: generation.providerModel,
      styleReferenceId: generation.styleReferenceId ?? undefined,
      sourceImagePath: promptData.sourceImagePath as string | undefined,
      characterImagePath: promptData.characterImagePath as string | undefined,
      textureImagePath: promptData.textureImagePath as string | undefined,
      prompt: promptData.userPrompt as string | undefined,
      options: {
        preserveStructure: (options.preserveStructure as boolean | undefined) ?? false,
        transparentBackground: (options.transparentBackground as boolean | undefined) ?? false,
        preserveHardware: (options.preserveHardware as boolean | undefined) ?? false,
        fixedBackground: (options.fixedBackground as boolean | undefined) ?? false,
        fixedViewpoint: (options.fixedViewpoint as boolean | undefined) ?? false,
        removeShadows: (options.removeShadows as boolean | undefined) ?? false,
        userInstructions: (options.userInstructions as string | undefined) ?? undefined,
        hardwareSpecInput: (options.hardwareSpecInput as string | undefined) ?? undefined,
        hardwareSpecs: options.hardwareSpecs as GenerationJobData['options']['hardwareSpecs'],
        outputCount: (options.outputCount as number | undefined) ?? 1,
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
        userEmail: img.generation?.project?.user?.email ?? '',
        projectName: img.generation?.project?.name ?? '',
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

  async listContentProjects(): Promise<Array<{ id: string; name: string }>> {
    return prisma.project.findMany({
      where: { generations: { some: { images: { some: {} } } } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: 200,
    });
  }

  async bulkDeleteImages(
    params: Omit<ListImagesParams, 'page' | 'limit'>
  ): Promise<{ deletedCount: number }> {
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

  // ─── Phase 4: API Key Management ─────────────────────────────────────────

  async listApiKeys(provider: ApiKeyProvider): Promise<ApiKeyListItem[]>;
  async listApiKeys(): Promise<ApiKeyListItem[]>;
  async listApiKeys(provider: ApiKeyProvider = 'gemini'): Promise<ApiKeyListItem[]> {
    const rows = await prisma.apiKey.findMany({
      where: { provider },
      orderBy: { createdAt: 'desc' },
      select: API_KEY_PUBLIC_SELECT,
    });
    // Ensure encryptedKey never leaks — strip any extra fields defensively
    return rows.map(
      ({ id, provider, alias, maskedKey, isActive, callCount, lastUsedAt, createdAt }) => ({
        id,
        provider,
        alias,
        maskedKey,
        isActive,
        callCount,
        lastUsedAt,
        createdAt,
      })
    );
  }

  async createApiKey(
    provider: ApiKeyProvider,
    alias: string,
    rawKey: string
  ): Promise<ApiKeyListItem>;
  async createApiKey(alias: string, rawKey: string): Promise<ApiKeyListItem>;
  async createApiKey(
    providerOrAlias: ApiKeyProvider | string,
    aliasOrRawKey: string,
    rawKey?: string
  ): Promise<ApiKeyListItem> {
    const provider: ApiKeyProvider = rawKey ? (providerOrAlias as ApiKeyProvider) : 'gemini';
    const alias = rawKey ? aliasOrRawKey : providerOrAlias;
    const keyToStore = rawKey ?? aliasOrRawKey;
    const maskedKey = keyToStore.slice(-4);
    const encryptedKey = encrypt(keyToStore, getEncryptionKey());

    const created = await prisma.apiKey.create({
      data: { provider, alias, encryptedKey, maskedKey, isActive: false },
      select: API_KEY_PUBLIC_SELECT,
    });

    return created;
  }

  async deleteApiKey(provider: ApiKeyProvider, id: string): Promise<void>;
  async deleteApiKey(id: string): Promise<void>;
  async deleteApiKey(providerOrId: ApiKeyProvider | string, id?: string): Promise<void> {
    const provider: ApiKeyProvider = id ? (providerOrId as ApiKeyProvider) : 'gemini';
    const keyId = id ?? providerOrId;
    const key = await prisma.apiKey.findFirst({ where: { id: keyId, provider } });

    if (!key) {
      throw new Error(getProviderKeyNotFoundMessage(provider));
    }
    if (key.isActive) {
      throw new Error('활성 키는 삭제할 수 없습니다');
    }

    await prisma.apiKey.deleteMany({ where: { id: keyId, provider } });
  }

  async activateApiKey(provider: ApiKeyProvider, id: string): Promise<ApiKeyListItem>;
  async activateApiKey(id: string): Promise<ApiKeyListItem>;
  async activateApiKey(
    providerOrId: ApiKeyProvider | string,
    id?: string
  ): Promise<ApiKeyListItem> {
    const provider: ApiKeyProvider = id ? (providerOrId as ApiKeyProvider) : 'gemini';
    const keyId = id ?? providerOrId;
    const key = await prisma.apiKey.findFirst({ where: { id: keyId, provider } });

    if (!key) {
      throw new Error(getProviderKeyNotFoundMessage(provider));
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.apiKey.updateMany({
        where: { provider, isActive: true },
        data: { isActive: false },
      });
      await tx.apiKey.updateMany({
        where: { id: keyId, provider },
        data: { isActive: true },
      });
      return tx.apiKey.findFirst({
        where: { id: keyId, provider },
        select: API_KEY_PUBLIC_SELECT,
      });
    });

    if (!updated) {
      throw new Error(getProviderKeyNotFoundMessage(provider));
    }

    return {
      id: updated.id,
      provider: updated.provider,
      alias: updated.alias,
      maskedKey: updated.maskedKey,
      isActive: updated.isActive,
      callCount: updated.callCount,
      lastUsedAt: updated.lastUsedAt,
      createdAt: updated.createdAt,
    };
  }

  async getActiveApiKey(provider: ApiKeyProvider = 'gemini'): Promise<{
    id: string;
    provider: ApiKeyProvider;
    key: string;
  }> {
    const activeKey = await prisma.apiKey.findFirst({ where: { provider, isActive: true } });

    if (!activeKey) {
      throw new Error(getProviderMissingKeyMessage(provider));
    }

    const decryptedKey = decrypt(activeKey.encryptedKey, getEncryptionKey());
    return { id: activeKey.id, provider: activeKey.provider, key: decryptedKey };
  }

  async incrementCallCount(provider: ApiKeyProvider, id: string): Promise<void>;
  async incrementCallCount(id: string): Promise<void>;
  async incrementCallCount(provider: ApiKeyProvider | string, id?: string): Promise<void> {
    const resolvedProvider: ApiKeyProvider = id ? (provider as ApiKeyProvider) : 'gemini';
    const resolvedId = id ?? provider;

    const result = await prisma.apiKey.updateMany({
      where: { id: resolvedId, provider: resolvedProvider },
      data: {
        callCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new Error(getProviderKeyNotFoundMessage(resolvedProvider));
    }
  }
}

export const adminService = new AdminService();
