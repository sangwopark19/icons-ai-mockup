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
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      groupBy: vi.fn(),
    },
    generatedImage: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    apiKey: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
  },
}));

// Mock crypto module (so AdminService tests can control encryption behavior)
vi.mock('../../lib/crypto.js', () => ({
  encrypt: vi.fn().mockReturnValue('mock-iv:mock-tag:mock-data'),
  decrypt: vi.fn().mockReturnValue('decrypted-key'),
  getEncryptionKey: vi.fn().mockReturnValue(Buffer.from('0'.repeat(64), 'hex')),
}));

// Mock generationQueue and addGenerationJob
vi.mock('../../lib/queue.js', () => ({
  generationQueue: {
    getJobCounts: vi.fn(),
  },
  addGenerationJob: vi.fn(),
}));

// Mock uploadService
vi.mock('../../services/upload.service.js', () => ({
  assertStoragePathWithinPrefixes: vi.fn((relativePath: string) => relativePath),
  uploadService: {
    deleteFile: vi.fn(),
    fileExists: vi.fn().mockResolvedValue(true),
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
    expect(stats.activeApiKeysByProvider).toEqual({ gemini: null, openai: null });
    expect(stats.userCountYesterday).toBe(5);
    expect(stats.generationCountYesterday).toBe(80);
    expect(stats.failedJobCountYesterday).toBe(8);
  });

  it('should return active key stats independently by provider', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { generationQueue } = await import('../../lib/queue.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(prisma.generation.count).mockResolvedValue(0);
    vi.mocked(prisma.generatedImage.aggregate).mockResolvedValue({
      _sum: { fileSize: null },
    } as any);
    vi.mocked(generationQueue.getJobCounts).mockResolvedValue({
      waiting: 0,
      active: 0,
      delayed: 0,
    } as any);
    vi.mocked(prisma.apiKey.findFirst)
      .mockResolvedValueOnce({ alias: 'Gemini Primary', callCount: 12 } as any)
      .mockResolvedValueOnce({ alias: 'OpenAI Primary', callCount: 7 } as any);

    const stats = await adminService.getDashboardStats();

    expect(stats.activeApiKeysByProvider).toEqual({
      gemini: { alias: 'Gemini Primary', callCount: 12 },
      openai: { alias: 'OpenAI Primary', callCount: 7 },
    });
    expect(vi.mocked(prisma.apiKey.findFirst)).toHaveBeenCalledWith({
      where: { provider: 'gemini', isActive: true },
      select: { alias: true, callCount: true },
    });
    expect(vi.mocked(prisma.apiKey.findFirst)).toHaveBeenCalledWith({
      where: { provider: 'openai', isActive: true },
      select: { alias: true, callCount: true },
    });
  });

  it('should exclude deleted users from userCount', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { generationQueue } = await import('../../lib/queue.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(prisma.generation.count).mockResolvedValue(0);
    vi.mocked(prisma.generatedImage.aggregate).mockResolvedValue({
      _sum: { fileSize: null },
    } as any);
    vi.mocked(generationQueue.getJobCounts).mockResolvedValue({
      waiting: 0,
      active: 0,
      delayed: 0,
    } as any);

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
    vi.mocked(prisma.generatedImage.aggregate).mockResolvedValue({
      _sum: { fileSize: null },
    } as any);
    vi.mocked(generationQueue.getJobCounts).mockResolvedValue({
      waiting: 0,
      active: 0,
      delayed: 0,
    } as any);

    const stats = await adminService.getDashboardStats();
    expect(stats.storageBytes).toBe(0);
  });

  it('should keep stats available when queue depth lookup fails', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { generationQueue } = await import('../../lib/queue.js');
    const { adminService } = await import('../admin.service.js');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.mocked(prisma.user.count).mockResolvedValue(0);
    vi.mocked(prisma.generation.count).mockResolvedValue(0);
    vi.mocked(prisma.generatedImage.aggregate).mockResolvedValue({
      _sum: { fileSize: null },
    } as any);
    vi.mocked(generationQueue.getJobCounts).mockRejectedValue(new Error('redis unavailable'));

    try {
      const stats = await adminService.getDashboardStats();
      expect(stats.queueDepth).toBe(0);
      expect(warn).toHaveBeenCalledWith('Dashboard queue depth unavailable: redis unavailable');
    } finally {
      warn.mockRestore();
    }
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
      {
        id: 'u1',
        email: 'a@a.com',
        name: 'A',
        role: 'user',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      },
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

// ─── Phase 3: Generation Monitoring Tests ───────────────────────────────────

const mockGeneration = {
  id: 'gen1',
  projectId: 'proj1',
  mode: 'ip_change',
  status: 'failed',
  errorMessage: 'timeout',
  retryCount: 1,
  provider: 'gemini',
  providerModel: 'gemini-3-pro-image-preview',
  providerTrace: null,
  openaiRequestId: null,
  openaiResponseId: null,
  openaiImageCallId: null,
  openaiRevisedPrompt: null,
  styleReferenceId: 'style-gen1',
  promptData: {
    sourceImagePath: 'uploads/u1/proj1/img.png',
    characterImagePath: 'characters/u1/character.png',
    textureImagePath: 'uploads/u1/proj1/texture.png',
    userPrompt: 'retry this prompt',
  },
  options: {
    preserveStructure: true,
    transparentBackground: false,
    preserveHardware: true,
    fixedBackground: true,
    fixedViewpoint: false,
    removeShadows: true,
    userInstructions: 'keep the zipper',
    hardwareSpecInput: 'zipper: silver',
    hardwareSpecs: {
      items: [
        {
          type: 'zipper',
          material: 'metal',
          color: 'silver',
          position: 'front',
        },
      ],
    },
    outputCount: 2,
  },
  createdAt: new Date(),
  completedAt: null,
  project: { id: 'proj1', userId: 'u1', user: { email: 'test@example.com' } },
};

const mockGeneratedImage = {
  id: 'img1',
  generationId: 'gen1',
  filePath: 'generations/u1/proj1/gen1/output_1.jpg',
  thumbnailPath: 'generations/u1/proj1/gen1/thumb_output_1.jpg',
  type: 'output',
  isSelected: false,
  hasTransparency: false,
  width: 1024,
  height: 1024,
  fileSize: 512000,
  createdAt: new Date(),
  generation: {
    id: 'gen1',
    project: {
      name: 'Test Project',
      user: { email: 'test@example.com' },
    },
  },
};

describe('AdminService - listGenerations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated generation list with userEmail from project.user join', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generation.findMany).mockResolvedValue([mockGeneration] as any);
    vi.mocked(prisma.generation.count).mockResolvedValue(1);
    vi.mocked(prisma.generation.groupBy).mockResolvedValue([] as any);

    const result = await adminService.listGenerations({});

    expect(result.generations).toHaveLength(1);
    expect(result.generations[0]).toMatchObject({ id: 'gen1' });
    expect(result.pagination).toMatchObject({ page: 1, limit: 20, total: 1 });
  });

  it('should apply status filter when provided', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generation.findMany).mockResolvedValue([]);
    vi.mocked(prisma.generation.count).mockResolvedValue(0);
    vi.mocked(prisma.generation.groupBy).mockResolvedValue([] as any);

    await adminService.listGenerations({ status: 'failed' as any });

    expect(vi.mocked(prisma.generation.findMany).mock.calls[0][0]).toMatchObject({
      where: expect.objectContaining({ status: 'failed' }),
    });
  });

  it('should apply email filter (case-insensitive) when provided', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generation.findMany).mockResolvedValue([]);
    vi.mocked(prisma.generation.count).mockResolvedValue(0);
    vi.mocked(prisma.generation.groupBy).mockResolvedValue([] as any);

    await adminService.listGenerations({ email: 'test@example.com' });

    const callArg = vi.mocked(prisma.generation.findMany).mock.calls[0][0] as any;
    const whereClause = JSON.stringify(callArg?.where ?? {});
    expect(whereClause).toContain('test@example.com');
  });

  it('should return statusCounts from prisma.generation.groupBy', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generation.findMany).mockResolvedValue([]);
    vi.mocked(prisma.generation.count).mockResolvedValue(0);
    vi.mocked(prisma.generation.groupBy).mockResolvedValue([
      { status: 'completed', _count: { id: 10 } },
      { status: 'failed', _count: { id: 3 } },
    ] as any);

    const result = await adminService.listGenerations({});

    expect(result.statusCounts).toBeDefined();
    expect(vi.mocked(prisma.generation.groupBy)).toHaveBeenCalled();
  });

  it('should default to page=1, limit=20 when not provided', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generation.findMany).mockResolvedValue([]);
    vi.mocked(prisma.generation.count).mockResolvedValue(0);
    vi.mocked(prisma.generation.groupBy).mockResolvedValue([] as any);

    const result = await adminService.listGenerations({});

    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(20);
  });

  it('maps safe OpenAI request-accounting fields from providerTrace', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');
    const openAIGeneration = {
      ...mockGeneration,
      provider: 'openai',
      providerModel: 'gpt-image-2',
      openaiRequestId: 'req_1',
      openaiResponseId: 'resp_1',
      openaiImageCallId: 'img_1,img_2',
      openaiRevisedPrompt: 'safe revised prompt',
      providerTrace: {
        provider: 'openai',
        endpoint: 'images.edit',
        externalRequestCount: 1,
        outputCount: 2,
        sdkMaxRetries: 0,
        queueAttempts: 1,
        rawVendorResponse: { shouldNotLeak: true },
      },
    };

    vi.mocked(prisma.generation.findMany).mockResolvedValue([openAIGeneration] as any);
    vi.mocked(prisma.generation.count).mockResolvedValue(1);
    vi.mocked(prisma.generation.groupBy).mockResolvedValue([] as any);

    const result = await adminService.listGenerations({});

    expect(result.generations[0]).toMatchObject({
      openaiExternalRequestCount: 1,
      openaiOutputCount: 2,
      openaiSdkMaxRetries: 0,
      openaiQueueAttempts: 1,
    });
    expect(JSON.stringify(result.generations[0])).not.toContain('rawVendorResponse');
  });
});

describe('AdminService - retryGeneration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import('../../lib/prisma.js');
    vi.mocked(prisma.generation.updateMany).mockResolvedValue({ count: 1 } as any);
  });

  it('should update status to pending, clear errorMessage, increment retryCount', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generation.findUnique).mockResolvedValue(mockGeneration as any);
    vi.mocked(prisma.generation.update).mockResolvedValue({
      ...mockGeneration,
      status: 'pending',
      errorMessage: null,
      retryCount: 2,
    } as any);

    await adminService.retryGeneration('gen1');

    expect(vi.mocked(prisma.generation.updateMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'gen1', status: 'failed' },
        data: expect.objectContaining({
          status: 'pending',
          errorMessage: null,
          retryCount: { increment: 1 },
        }),
      })
    );
  });

  it('should call addGenerationJob with correct GenerationJobData', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generation.findUnique).mockResolvedValue(mockGeneration as any);
    vi.mocked(prisma.generation.update).mockResolvedValue({
      ...mockGeneration,
      status: 'pending',
    } as any);
    vi.mocked(addGenerationJob).mockResolvedValue({} as any);

    await adminService.retryGeneration('gen1');

    expect(vi.mocked(addGenerationJob)).toHaveBeenCalledWith(
      expect.objectContaining({
        generationId: 'gen1',
        userId: 'u1',
        projectId: 'proj1',
        mode: 'ip_change',
        provider: 'gemini',
        providerModel: 'gemini-3-pro-image-preview',
        styleReferenceId: 'style-gen1',
        sourceImagePath: 'uploads/u1/proj1/img.png',
        characterImagePath: 'characters/u1/character.png',
        textureImagePath: 'uploads/u1/proj1/texture.png',
        prompt: 'retry this prompt',
        options: expect.objectContaining({
          preserveStructure: true,
          transparentBackground: false,
          preserveHardware: true,
          fixedBackground: true,
          fixedViewpoint: false,
          removeShadows: true,
          userInstructions: 'keep the zipper',
          hardwareSpecInput: 'zipper: silver',
          hardwareSpecs: mockGeneration.options.hardwareSpecs,
          outputCount: 2,
        }),
      })
    );
  });

  it('requeues failed OpenAI style-copy retry with persisted continuation metadata', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { adminService } = await import('../admin.service.js');
    const openAIStyleCopyGeneration = {
      ...mockGeneration,
      provider: 'openai',
      providerModel: 'gpt-image-2',
      styleReferenceId: 'source-style-generation',
      promptData: {
        ...mockGeneration.promptData,
        copyTarget: 'ip-change',
        selectedImageId: 'style-source-image-2',
      },
    };

    vi.mocked(prisma.generation.findUnique).mockResolvedValue(openAIStyleCopyGeneration as any);
    vi.mocked(prisma.generation.update).mockResolvedValue({
      ...openAIStyleCopyGeneration,
      status: 'pending',
    } as any);
    vi.mocked(addGenerationJob).mockResolvedValue({} as any);

    await adminService.retryGeneration('gen1');

    expect(vi.mocked(addGenerationJob)).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'openai',
        providerModel: 'gpt-image-2',
        styleReferenceId: 'source-style-generation',
        copyTarget: 'ip-change',
        selectedImageId: 'style-source-image-2',
      })
    );
  });

  it('preserves OpenAI sketch_to_real options when retrying a failed generation', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { adminService } = await import('../admin.service.js');
    const openAISketchGeneration = {
      ...mockGeneration,
      mode: 'sketch_to_real',
      provider: 'openai',
      providerModel: 'gpt-image-2',
      styleReferenceId: null,
      promptData: {
        sourceImagePath: 'uploads/u1/proj1/sketch.png',
        textureImagePath: 'uploads/u1/proj1/texture.png',
        productCategory: '머그',
        productCategoryOther: 'wide mug',
        materialPreset: '세라믹',
        materialOther: 'glossy ceramic',
      },
      options: {
        preserveStructure: true,
        transparentBackground: true,
        userInstructions: 'keep the handle angle',
        productCategory: '머그',
        productCategoryOther: 'wide mug',
        materialPreset: '세라믹',
        materialOther: 'glossy ceramic',
        quality: 'high',
      },
    };

    vi.mocked(prisma.generation.findUnique).mockResolvedValue(openAISketchGeneration as any);
    vi.mocked(prisma.generation.update).mockResolvedValue({
      ...openAISketchGeneration,
      status: 'pending',
    } as any);
    vi.mocked(addGenerationJob).mockResolvedValue({} as any);

    await adminService.retryGeneration('gen1');

    expect(vi.mocked(addGenerationJob)).toHaveBeenCalledWith(
      expect.objectContaining({
        generationId: 'gen1',
        mode: 'sketch_to_real',
        provider: 'openai',
        providerModel: 'gpt-image-2',
        sourceImagePath: 'uploads/u1/proj1/sketch.png',
        characterImagePath: undefined,
        textureImagePath: 'uploads/u1/proj1/texture.png',
        options: expect.objectContaining({
          preserveStructure: true,
          transparentBackground: true,
          fixedBackground: true,
          fixedViewpoint: true,
          userInstructions: 'keep the handle angle',
          productCategory: '머그',
          productCategoryOther: 'wide mug',
          materialPreset: '세라믹',
          materialOther: 'glossy ceramic',
          quality: 'high',
          outputCount: 2,
        }),
      })
    );
  });

  it('rolls status back to failed when queue enqueue fails', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generation.findUnique).mockResolvedValue(mockGeneration as any);
    vi.mocked(prisma.generation.update)
      .mockResolvedValueOnce({ ...mockGeneration, status: 'pending', errorMessage: null } as any)
      .mockResolvedValueOnce({ ...mockGeneration, status: 'failed', errorMessage: 'queue down' } as any);
    vi.mocked(addGenerationJob).mockRejectedValue(new Error('queue down'));

    await expect(adminService.retryGeneration('gen1')).rejects.toThrow('queue down');

    expect(vi.mocked(prisma.generation.update)).toHaveBeenLastCalledWith({
      where: { id: 'gen1' },
      data: { status: 'failed', errorMessage: 'queue down' },
    });
  });

  it('should not enqueue when another retry already claimed the generation', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generation.findUnique).mockResolvedValue(mockGeneration as any);
    vi.mocked(prisma.generation.updateMany).mockResolvedValue({ count: 0 } as any);

    await expect(adminService.retryGeneration('gen1')).rejects.toThrow(
      'Only failed generations can be retried'
    );

    expect(vi.mocked(addGenerationJob)).not.toHaveBeenCalled();
  });

  it('should throw error if generation not found', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generation.findUnique).mockResolvedValue(null);

    await expect(adminService.retryGeneration('nonexistent')).rejects.toThrow();
  });

  it('should throw error if generation status is not failed', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generation.findUnique).mockResolvedValue({
      ...mockGeneration,
      status: 'completed',
    } as any);

    await expect(adminService.retryGeneration('gen1')).rejects.toThrow();
  });
});

// ─── Phase 3: Content Management Tests ──────────────────────────────────────

describe('AdminService - listGeneratedImages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated image list with generation.project.user.email join', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generatedImage.findMany).mockResolvedValue([mockGeneratedImage] as any);
    vi.mocked(prisma.generatedImage.count).mockResolvedValue(1);

    const result = await adminService.listGeneratedImages({});

    expect(result.images).toHaveLength(1);
    expect(result.pagination).toMatchObject({ page: 1, limit: 20, total: 1 });
  });

  it('should apply email filter through nested project.user relation', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generatedImage.findMany).mockResolvedValue([]);
    vi.mocked(prisma.generatedImage.count).mockResolvedValue(0);

    await adminService.listGeneratedImages({ email: 'filter@example.com' });

    const callArg = vi.mocked(prisma.generatedImage.findMany).mock.calls[0][0] as any;
    const whereStr = JSON.stringify(callArg?.where ?? {});
    expect(whereStr).toContain('filter@example.com');
  });

  it('should apply date range filter (startDate, endDate)', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generatedImage.findMany).mockResolvedValue([]);
    vi.mocked(prisma.generatedImage.count).mockResolvedValue(0);

    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-03-01');
    await adminService.listGeneratedImages({ startDate, endDate });

    const callArg = vi.mocked(prisma.generatedImage.findMany).mock.calls[0][0] as any;
    expect(callArg?.where).toBeDefined();
  });

  it('should apply projectId filter', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generatedImage.findMany).mockResolvedValue([]);
    vi.mocked(prisma.generatedImage.count).mockResolvedValue(0);

    await adminService.listGeneratedImages({ projectId: 'proj1' });

    const callArg = vi.mocked(prisma.generatedImage.findMany).mock.calls[0][0] as any;
    const whereStr = JSON.stringify(callArg?.where ?? {});
    expect(whereStr).toContain('proj1');
  });
});

describe('AdminService - deleteGeneratedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete DB record via prisma.generatedImage.delete', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { uploadService } = await import('../../services/upload.service.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generatedImage.findUnique).mockResolvedValue(mockGeneratedImage as any);
    vi.mocked(prisma.generatedImage.delete).mockResolvedValue(mockGeneratedImage as any);
    vi.mocked(uploadService.deleteFile).mockResolvedValue(undefined);

    await adminService.deleteGeneratedImage('img1');

    expect(vi.mocked(prisma.generatedImage.delete)).toHaveBeenCalledWith({
      where: { id: 'img1' },
    });
  });

  it('should call uploadService.deleteFile for filePath and thumbnailPath', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { uploadService } = await import('../../services/upload.service.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generatedImage.findUnique).mockResolvedValue(mockGeneratedImage as any);
    vi.mocked(prisma.generatedImage.delete).mockResolvedValue(mockGeneratedImage as any);
    vi.mocked(uploadService.deleteFile).mockResolvedValue(undefined);

    await adminService.deleteGeneratedImage('img1');

    expect(vi.mocked(uploadService.deleteFile)).toHaveBeenCalledWith(mockGeneratedImage.filePath);
    expect(vi.mocked(uploadService.deleteFile)).toHaveBeenCalledWith(
      mockGeneratedImage.thumbnailPath
    );
  });

  it('should NOT call prisma.generation.delete (Generation preserved)', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { uploadService } = await import('../../services/upload.service.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generatedImage.findUnique).mockResolvedValue(mockGeneratedImage as any);
    vi.mocked(prisma.generatedImage.delete).mockResolvedValue(mockGeneratedImage as any);
    vi.mocked(uploadService.deleteFile).mockResolvedValue(undefined);

    await adminService.deleteGeneratedImage('img1');

    // prisma.generation.delete is not in the mock — we verify it wasn't called
    // by checking only generatedImage.delete was called (not generation.delete)
    expect(vi.mocked(prisma.generatedImage.delete)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(prisma.generatedImage.delete)).toHaveBeenCalledWith({
      where: { id: 'img1' },
    });
  });

  it('should throw error if image not found', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generatedImage.findUnique).mockResolvedValue(null);

    await expect(adminService.deleteGeneratedImage('nonexistent')).rejects.toThrow();
  });
});

describe('AdminService - countImages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return count matching filter params', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.generatedImage.count).mockResolvedValue(42);

    const result = await adminService.countImages({});

    expect(result).toBe(42);
    expect(vi.mocked(prisma.generatedImage.count)).toHaveBeenCalled();
  });
});

describe('AdminService - bulkDeleteImages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete all matching GeneratedImage records via deleteMany', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { uploadService } = await import('../../services/upload.service.js');
    const { adminService } = await import('../admin.service.js');

    const images = [
      mockGeneratedImage,
      { ...mockGeneratedImage, id: 'img2', filePath: 'path2.jpg', thumbnailPath: null },
    ];
    vi.mocked(prisma.generatedImage.findMany).mockResolvedValue(images as any);
    vi.mocked(prisma.generatedImage.deleteMany).mockResolvedValue({ count: 2 });
    vi.mocked(uploadService.deleteFile).mockResolvedValue(undefined);

    await adminService.bulkDeleteImages({ ids: ['img1', 'img2'] });

    expect(vi.mocked(prisma.generatedImage.deleteMany)).toHaveBeenCalled();
  });

  it('should call uploadService.deleteFile for each image filePath and thumbnailPath', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { uploadService } = await import('../../services/upload.service.js');
    const { adminService } = await import('../admin.service.js');

    const images = [
      mockGeneratedImage,
      { ...mockGeneratedImage, id: 'img2', filePath: 'path2.jpg', thumbnailPath: 'thumb2.jpg' },
    ];
    vi.mocked(prisma.generatedImage.findMany).mockResolvedValue(images as any);
    vi.mocked(prisma.generatedImage.deleteMany).mockResolvedValue({ count: 2 });
    vi.mocked(uploadService.deleteFile).mockResolvedValue(undefined);

    await adminService.bulkDeleteImages({ ids: ['img1', 'img2'] });

    // Each image should have its filePath deleted
    expect(vi.mocked(uploadService.deleteFile)).toHaveBeenCalledWith(mockGeneratedImage.filePath);
    expect(vi.mocked(uploadService.deleteFile)).toHaveBeenCalledWith('path2.jpg');
    // thumbnailPaths should also be deleted
    expect(vi.mocked(uploadService.deleteFile)).toHaveBeenCalledWith(
      mockGeneratedImage.thumbnailPath
    );
    expect(vi.mocked(uploadService.deleteFile)).toHaveBeenCalledWith('thumb2.jpg');
  });
});

// ─── Phase 4: API Key Management Tests ──────────────────────────────────────

describe('AdminService - listApiKeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return list without encryptedKey field (KEY-01)', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.findMany).mockResolvedValue([
      {
        id: 'k1',
        provider: 'gemini',
        alias: 'Primary',
        maskedKey: '****ABCD',
        isActive: true,
        callCount: 42,
        lastUsedAt: new Date(),
        createdAt: new Date(),
        encryptedKey: 'should-not-appear',
      },
    ] as any);

    const result = await adminService.listApiKeys('gemini');

    expect(result[0]).not.toHaveProperty('encryptedKey');
    expect(result[0].maskedKey).toBe('****ABCD');
    expect(result[0].provider).toBe('gemini');
    expect(vi.mocked(prisma.apiKey.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: { provider: 'gemini' } })
    );
  });

  it('should return all expected fields (alias, maskedKey, isActive, callCount)', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.findMany).mockResolvedValue([
      {
        id: 'k1',
        provider: 'openai',
        alias: 'Primary',
        maskedKey: '****ABCD',
        isActive: true,
        callCount: 42,
        lastUsedAt: null,
        createdAt: new Date(),
        encryptedKey: 'encrypted-blob',
      },
    ] as any);

    const result = await adminService.listApiKeys('openai');

    expect(result[0]).toMatchObject({
      id: 'k1',
      provider: 'openai',
      alias: 'Primary',
      maskedKey: '****ABCD',
      isActive: true,
      callCount: 42,
    });
  });
});

describe('AdminService - createApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should store encrypted key and plain maskedKey (last 4 chars) (KEY-02)', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    const rawKey = 'AIzaSyD-testkey-ABCD';
    vi.mocked(prisma.apiKey.create).mockResolvedValue({
      id: 'k1',
      provider: 'openai',
      alias: 'Test',
      maskedKey: 'ABCD',
      isActive: false,
      callCount: 0,
      lastUsedAt: null,
      createdAt: new Date(),
    } as any);

    await adminService.createApiKey('openai', 'Test', rawKey);

    const callArg = vi.mocked(prisma.apiKey.create).mock.calls[0][0] as any;
    expect(callArg.data.provider).toBe('openai');
    // maskedKey should be last 4 chars only
    expect(callArg.data.maskedKey).toBe('ABCD');
    // encryptedKey must not be the raw key
    expect(callArg.data.encryptedKey).not.toBe(rawKey);
  });

  it('should call encrypt to store the key securely', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { encrypt } = await import('../../lib/crypto.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.create).mockResolvedValue({
      id: 'k1',
      provider: 'gemini',
      alias: 'Test',
      maskedKey: '1234',
      isActive: false,
      callCount: 0,
      lastUsedAt: null,
      createdAt: new Date(),
    } as any);

    await adminService.createApiKey('gemini', 'Test', 'AIzaSyD-key-1234');

    expect(vi.mocked(encrypt)).toHaveBeenCalled();
  });
});

describe('AdminService - deleteApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw if key is active (KEY-03)', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue({
      id: 'k1',
      provider: 'openai',
      isActive: true,
    } as any);

    await expect(adminService.deleteApiKey('openai', 'k1')).rejects.toThrow();
  });

  it('should delete if key is not active (KEY-03)', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue({
      id: 'k1',
      provider: 'openai',
      isActive: false,
    } as any);
    vi.mocked(prisma.apiKey.deleteMany).mockResolvedValue({ count: 1 });

    await adminService.deleteApiKey('openai', 'k1');

    expect(vi.mocked(prisma.apiKey.deleteMany)).toHaveBeenCalledWith({
      where: { id: 'k1', provider: 'openai' },
    });
  });

  it('should throw if key is not found', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(null);

    await expect(adminService.deleteApiKey('openai', 'nonexistent')).rejects.toThrow(
      'OpenAI API 키를 찾을 수 없습니다'
    );
  });
});

describe('AdminService - activateApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use prisma.$transaction to deactivate-all then activate-target (KEY-04)', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.findFirst)
      .mockResolvedValueOnce({
        id: 'k2',
        provider: 'openai',
        isActive: false,
      } as any)
      .mockResolvedValueOnce({
        id: 'k2',
        provider: 'openai',
        isActive: true,
        alias: 'New',
        maskedKey: 'EFGH',
        callCount: 0,
        lastUsedAt: null,
        createdAt: new Date(),
      } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) =>
      callback(prisma as any)
    );
    vi.mocked(prisma.apiKey.updateMany).mockResolvedValue({ count: 1 });

    await adminService.activateApiKey('openai', 'k2');

    expect(vi.mocked(prisma.$transaction)).toHaveBeenCalled();
    expect(vi.mocked(prisma.apiKey.updateMany)).toHaveBeenNthCalledWith(1, {
      where: { provider: 'openai', isActive: true },
      data: { isActive: false },
    });
    expect(vi.mocked(prisma.apiKey.updateMany)).toHaveBeenNthCalledWith(2, {
      where: { id: 'k2', provider: 'openai' },
      data: { isActive: true },
    });
  });

  it('should not deactivate the other provider when activating a key', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.findFirst)
      .mockResolvedValueOnce({
        id: 'g2',
        provider: 'gemini',
        isActive: false,
      } as any)
      .mockResolvedValueOnce({
        id: 'g2',
        provider: 'gemini',
        isActive: true,
        alias: 'Gemini New',
        maskedKey: 'EFGH',
        callCount: 0,
        lastUsedAt: null,
        createdAt: new Date(),
      } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) =>
      callback(prisma as any)
    );
    vi.mocked(prisma.apiKey.updateMany).mockResolvedValue({ count: 1 });

    await adminService.activateApiKey('gemini', 'g2');

    expect(vi.mocked(prisma.apiKey.updateMany)).toHaveBeenNthCalledWith(1, {
      where: { provider: 'gemini', isActive: true },
      data: { isActive: false },
    });
    expect(vi.mocked(prisma.apiKey.updateMany)).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    );
  });

  it('should return activated provider-scoped key data', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.findFirst)
      .mockResolvedValueOnce({
        id: 'k2',
        provider: 'openai',
        isActive: false,
      } as any)
      .mockResolvedValueOnce({
        id: 'k2',
        provider: 'openai',
        isActive: true,
        alias: 'New',
        maskedKey: 'EFGH',
        callCount: 0,
        lastUsedAt: null,
        createdAt: new Date(),
      } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) =>
      callback(prisma as any)
    );
    vi.mocked(prisma.apiKey.updateMany).mockResolvedValue({ count: 1 });

    const result = await adminService.activateApiKey('openai', 'k2');

    expect(result).toMatchObject({
      id: 'k2',
      provider: 'openai',
      alias: 'New',
      isActive: true,
    });
  });
});

describe('AdminService - getActiveApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return decrypted key string when active key exists (KEY-05)', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { decrypt } = await import('../../lib/crypto.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue({
      id: 'k1',
      provider: 'openai',
      encryptedKey: 'mock-iv:mock-tag:mock-data',
      isActive: true,
    } as any);

    // decrypt mock returns 'decrypted-key' by default
    const result = await adminService.getActiveApiKey('openai');
    expect(vi.mocked(decrypt)).toHaveBeenCalled();
    expect(result).toEqual({ id: 'k1', provider: 'openai', key: 'decrypted-key' });
    expect(vi.mocked(prisma.apiKey.findFirst)).toHaveBeenCalledWith({
      where: { provider: 'openai', isActive: true },
    });
  });

  it('should throw if no active key exists (KEY-05)', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.findFirst).mockResolvedValue(null);

    await expect(adminService.getActiveApiKey('openai')).rejects.toThrow(
      'OpenAI API 키가 설정되지 않았습니다'
    );
  });
});

describe('AdminService - incrementCallCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should increment callCount and set lastUsedAt (KEY-06)', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.updateMany).mockResolvedValue({ count: 1 });

    await adminService.incrementCallCount('openai', 'k1');

    expect(vi.mocked(prisma.apiKey.updateMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'k1', provider: 'openai' },
        data: expect.objectContaining({
          callCount: { increment: 1 },
          lastUsedAt: expect.any(Date),
        }),
      })
    );
  });

  it('should increment callCount by an explicit amount', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { adminService } = await import('../admin.service.js');

    vi.mocked(prisma.apiKey.updateMany).mockResolvedValue({ count: 1 });

    await adminService.incrementCallCount('openai', 'k1', 3);

    expect(vi.mocked(prisma.apiKey.updateMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'k1', provider: 'openai' },
        data: expect.objectContaining({
          callCount: { increment: 3 },
          lastUsedAt: expect.any(Date),
        }),
      })
    );
  });
});
