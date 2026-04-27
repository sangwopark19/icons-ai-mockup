import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    project: {
      findFirst: vi.fn(),
    },
    iPCharacter: {
      findFirst: vi.fn(),
    },
    generation: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    generatedImage: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('../../lib/queue.js', () => ({
  addGenerationJob: vi.fn(),
}));

vi.mock('../../services/upload.service.js', () => ({
  assertStoragePathWithinPrefixes: vi.fn((relativePath: string) => relativePath),
  uploadService: {
    fileExists: vi.fn().mockResolvedValue(true),
  },
}));

describe('GenerationService - provider contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects providerModel values that do not match the provider', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: 'proj1', userId: 'u1' } as any);

    await expect(
      generationService.create('u1', {
        projectId: 'proj1',
        mode: 'ip_change',
        provider: 'gemini',
        providerModel: 'gpt-image-2',
        sourceImagePath: 'uploads/u1/proj1/source.png',
        characterImagePath: 'characters/u1/character.png',
      })
    ).rejects.toThrow('providerModel이 provider와 일치하지 않습니다');

    expect(vi.mocked(prisma.generation.create)).not.toHaveBeenCalled();
    expect(vi.mocked(addGenerationJob)).not.toHaveBeenCalled();
  });

  it('rejects image paths outside the authenticated user/project boundary', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { assertStoragePathWithinPrefixes } = await import('../../services/upload.service.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: 'proj1', userId: 'u1' } as any);
    vi.mocked(assertStoragePathWithinPrefixes).mockImplementationOnce(() => {
      throw new Error('원본 이미지 경로 권한이 없습니다');
    });

    await expect(
      generationService.create('u1', {
        projectId: 'proj1',
        mode: 'sketch_to_real',
        sourceImagePath: 'uploads/other/proj1/source.png',
      })
    ).rejects.toThrow('원본 이미지 경로 권한이 없습니다');

    expect(vi.mocked(prisma.generation.create)).not.toHaveBeenCalled();
    expect(vi.mocked(addGenerationJob)).not.toHaveBeenCalled();
  });

  it('persists and enqueues OpenAI quality options', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: 'proj1', userId: 'u1' } as any);
    vi.mocked(prisma.generation.create).mockResolvedValue({
      id: 'gen1',
      projectId: 'proj1',
      status: 'pending',
      mode: 'ip_change',
      provider: 'openai',
      providerModel: 'gpt-image-2',
    } as any);

    await generationService.create('u1', {
      projectId: 'proj1',
      mode: 'ip_change',
      provider: 'openai',
      providerModel: 'gpt-image-2',
      sourceImagePath: 'uploads/u1/proj1/source.png',
      characterImagePath: 'characters/u1/character.png',
      options: {
        preserveStructure: true,
        transparentBackground: false,
        quality: 'high',
        outputCount: 2,
      },
    });

    expect(vi.mocked(prisma.generation.create).mock.calls[0][0].data.options).toMatchObject({
      quality: 'high',
      outputCount: 2,
    });
    expect(vi.mocked(addGenerationJob).mock.calls[0][0].options).toMatchObject({
      quality: 'high',
      outputCount: 2,
    });
  });

  it('rejects OpenAI non-IP modes before creating a doomed worker job', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: 'proj1', userId: 'u1' } as any);

    await expect(
      generationService.create('u1', {
        projectId: 'proj1',
        mode: 'sketch_to_real',
        provider: 'openai',
        providerModel: 'gpt-image-2',
        sourceImagePath: 'uploads/u1/proj1/source.png',
      })
    ).rejects.toThrow('OpenAI provider는 현재 IP 변경 v2만 지원합니다');

    expect(vi.mocked(prisma.generation.create)).not.toHaveBeenCalled();
    expect(vi.mocked(addGenerationJob)).not.toHaveBeenCalled();
  });

  it('rejects incomplete mode inputs before enqueueing guaranteed failures', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: 'proj1', userId: 'u1' } as any);

    await expect(
      generationService.create('u1', {
        projectId: 'proj1',
        mode: 'ip_change',
        characterImagePath: 'characters/u1/character.png',
      })
    ).rejects.toThrow('IP 변경에는 원본 이미지가 필요합니다');

    await expect(
      generationService.create('u1', {
        projectId: 'proj1',
        mode: 'ip_change',
        sourceImagePath: 'uploads/u1/proj1/source.png',
      })
    ).rejects.toThrow('IP 변경에는 캐릭터 이미지가 필요합니다');

    await expect(
      generationService.create('u1', {
        projectId: 'proj1',
        mode: 'sketch_to_real',
      })
    ).rejects.toThrow('스케치 실사화에는 원본 이미지가 필요합니다');

    expect(vi.mocked(prisma.generation.create)).not.toHaveBeenCalled();
    expect(vi.mocked(addGenerationJob)).not.toHaveBeenCalled();
  });

  it('rejects OpenAI transparent-background requests until v2 supports removal output', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: 'proj1', userId: 'u1' } as any);

    await expect(
      generationService.create('u1', {
        projectId: 'proj1',
        mode: 'ip_change',
        provider: 'openai',
        providerModel: 'gpt-image-2',
        sourceImagePath: 'uploads/u1/proj1/source.png',
        characterImagePath: 'characters/u1/character.png',
        options: {
          transparentBackground: true,
        },
      })
    ).rejects.toThrow('OpenAI IP 변경 v2는 투명 배경을 아직 지원하지 않습니다');

    expect(vi.mocked(prisma.generation.create)).not.toHaveBeenCalled();
    expect(vi.mocked(addGenerationJob)).not.toHaveBeenCalled();
  });

  it('updates OpenAI support metadata without raw response bodies', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { generationService } = await import('../generation.service.js');

    await generationService.updateOpenAIMetadata('gen1', {
      requestIds: ['req_1', 'req_2'],
      responseId: 'resp_1',
      imageCallIds: ['img_1', 'img_2'],
      revisedPrompt: 'revised prompt',
      providerTrace: {
        provider: 'openai',
        model: 'gpt-image-2',
        endpoint: 'images.edit',
      },
    });

    expect(vi.mocked(prisma.generation.update)).toHaveBeenCalledWith({
      where: { id: 'gen1' },
      data: {
        openaiRequestId: 'req_1,req_2',
        openaiResponseId: 'resp_1',
        openaiImageCallId: 'img_1,img_2',
        openaiRevisedPrompt: 'revised prompt',
        providerTrace: {
          provider: 'openai',
          model: 'gpt-image-2',
          endpoint: 'images.edit',
        },
      },
    });
  });
});

describe('GenerationService - selectImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null without clearing selection when image does not belong to the generation', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.generation.findFirst).mockResolvedValue({
      id: 'gen1',
      project: { userId: 'u1' },
      images: [],
    } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) =>
      callback({
        generatedImage: {
          findFirst: vi.fn().mockResolvedValue(null),
          updateMany: vi.fn(),
          update: vi.fn(),
        },
      })
    );

    await expect(generationService.selectImage('u1', 'gen1', 'other-img')).resolves.toBeNull();
  });

  it('updates only images scoped to the authorized generation', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { generationService } = await import('../generation.service.js');
    const tx = {
      generatedImage: {
        findFirst: vi.fn().mockResolvedValue({ id: 'img1', generationId: 'gen1' }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        update: vi.fn().mockResolvedValue({ id: 'img1', generationId: 'gen1', isSelected: true }),
      },
    };

    vi.mocked(prisma.generation.findFirst).mockResolvedValue({
      id: 'gen1',
      project: { userId: 'u1' },
      images: [],
    } as any);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback(tx));

    const result = await generationService.selectImage('u1', 'gen1', 'img1');

    expect(result).toEqual({ id: 'img1', generationId: 'gen1', isSelected: true });
    expect(tx.generatedImage.findFirst).toHaveBeenCalledWith({
      where: { id: 'img1', generationId: 'gen1' },
    });
    expect(tx.generatedImage.updateMany).toHaveBeenCalledWith({
      where: { generationId: 'gen1' },
      data: { isSelected: false },
    });
    expect(tx.generatedImage.update).toHaveBeenCalledWith({
      where: { id: 'img1' },
      data: { isSelected: true },
    });
  });
});

describe('GenerationService - copyStyle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects OpenAI v2 style copy before enqueueing a failing worker job', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.generation.findFirst).mockResolvedValue({
      id: 'gen1',
      project: { userId: 'u1' },
      images: [],
      provider: 'openai',
      mode: 'ip_change',
    } as any);

    await expect(
      generationService.copyStyle('u1', 'gen1', {
        characterImagePath: 'characters/u1/character.png',
      })
    ).rejects.toThrow('OpenAI IP 변경 v2는 스타일 복사를 지원하지 않습니다');

    expect(vi.mocked(prisma.generation.create)).not.toHaveBeenCalled();
    expect(vi.mocked(addGenerationJob)).not.toHaveBeenCalled();
  });
});
