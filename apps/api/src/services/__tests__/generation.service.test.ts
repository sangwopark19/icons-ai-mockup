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
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    imageHistory: {
      deleteMany: vi.fn(),
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
    deleteFile: vi.fn().mockResolvedValue(undefined),
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

  it('rejects continuation-only metadata on direct source generation create', async () => {
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
        copyTarget: 'ip-change',
        selectedImageId: '00000000-0000-0000-0000-000000000111',
      })
    ).rejects.toThrow('스타일 복사 continuation metadata가 불완전합니다');

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

  it('marks a created generation failed when queue enqueue fails', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: 'proj1', userId: 'u1' } as any);
    vi.mocked(prisma.generation.create).mockResolvedValue({
      id: 'gen-enqueue-failed',
      projectId: 'proj1',
      status: 'pending',
      mode: 'ip_change',
      provider: 'gemini',
      providerModel: 'gemini-3-pro-image-preview',
    } as any);
    vi.mocked(addGenerationJob).mockRejectedValueOnce(new Error('redis unavailable'));

    await expect(
      generationService.create('u1', {
        projectId: 'proj1',
        mode: 'ip_change',
        sourceImagePath: 'uploads/u1/proj1/source.png',
        characterImagePath: 'characters/u1/character.png',
      })
    ).rejects.toThrow('redis unavailable');

    expect(vi.mocked(prisma.generation.update)).toHaveBeenCalledWith({
      where: { id: 'gen-enqueue-failed' },
      data: {
        status: 'failed',
        errorMessage: 'redis unavailable',
        completedAt: expect.any(Date),
      },
    });
  });

  it('accepts OpenAI sketch_to_real with product and material options', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: 'proj1', userId: 'u1' } as any);
    vi.mocked(prisma.generation.create).mockResolvedValue({
      id: 'gen1',
      projectId: 'proj1',
      status: 'pending',
      mode: 'sketch_to_real',
      provider: 'openai',
      providerModel: 'gpt-image-2',
    } as any);

    await generationService.create('u1', {
      projectId: 'proj1',
      mode: 'sketch_to_real',
      provider: 'openai',
      providerModel: 'gpt-image-2',
      sourceImagePath: 'uploads/u1/proj1/source.png',
      textureImagePath: 'uploads/u1/proj1/texture.png',
      prompt: 'make it production ready',
      options: {
        preserveStructure: true,
        fixedBackground: true,
        fixedViewpoint: true,
        transparentBackground: true,
        productCategory: 'mug',
        productCategoryOther: 'wide ceramic mug',
        materialPreset: 'ceramic',
        materialOther: 'glossy glaze',
        quality: 'high',
        outputCount: 2,
      },
    });

    expect(vi.mocked(prisma.generation.create).mock.calls[0][0].data.promptData).toMatchObject({
      sourceImagePath: 'uploads/u1/proj1/source.png',
      textureImagePath: 'uploads/u1/proj1/texture.png',
      productCategory: 'mug',
      productCategoryOther: 'wide ceramic mug',
      materialPreset: 'ceramic',
      materialOther: 'glossy glaze',
    });
    expect(vi.mocked(prisma.generation.create).mock.calls[0][0].data.options).toMatchObject({
      preserveStructure: true,
      fixedBackground: true,
      fixedViewpoint: true,
      transparentBackground: true,
      productCategory: 'mug',
      productCategoryOther: 'wide ceramic mug',
      materialPreset: 'ceramic',
      materialOther: 'glossy glaze',
      quality: 'high',
      outputCount: 2,
    });
    expect(vi.mocked(addGenerationJob).mock.calls[0][0]).toMatchObject({
      mode: 'sketch_to_real',
      provider: 'openai',
      providerModel: 'gpt-image-2',
      sourceImagePath: 'uploads/u1/proj1/source.png',
      textureImagePath: 'uploads/u1/proj1/texture.png',
      options: expect.objectContaining({
        productCategory: 'mug',
        materialPreset: 'ceramic',
        transparentBackground: true,
        outputCount: 2,
      }),
    });
  });

  it('rejects OpenAI sketch_to_real without product and material options', async () => {
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
        options: {
          outputCount: 2,
        },
      })
    ).rejects.toThrow('OpenAI 스케치 실사화 v2에는 제품 종류가 필요합니다');

    expect(vi.mocked(prisma.generation.create)).not.toHaveBeenCalled();
    expect(vi.mocked(addGenerationJob)).not.toHaveBeenCalled();
  });

  it('rejects OpenAI sketch_to_real 기타 options without detail text', async () => {
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
        options: {
          productCategory: '기타',
          materialPreset: '기타',
          outputCount: 2,
        },
      })
    ).rejects.toThrow('기타 제품 종류를 선택한 경우 상세 내용을 입력해주세요');

    expect(vi.mocked(prisma.generation.create)).not.toHaveBeenCalled();
    expect(vi.mocked(addGenerationJob)).not.toHaveBeenCalled();
  });

  it('uses shared lock defaults when fixed background and viewpoint are omitted', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: 'proj1', userId: 'u1' } as any);
    vi.mocked(prisma.generation.create).mockResolvedValue({
      id: 'gen1',
      projectId: 'proj1',
      status: 'pending',
      mode: 'sketch_to_real',
      provider: 'openai',
      providerModel: 'gpt-image-2',
    } as any);

    await generationService.create('u1', {
      projectId: 'proj1',
      mode: 'sketch_to_real',
      provider: 'openai',
      providerModel: 'gpt-image-2',
      sourceImagePath: 'uploads/u1/proj1/source.png',
      options: {
        productCategory: 'mug',
        materialPreset: 'ceramic',
      },
    });

    expect(vi.mocked(prisma.generation.create).mock.calls[0][0].data.options).toMatchObject({
      fixedBackground: true,
      fixedViewpoint: true,
    });
    expect(vi.mocked(addGenerationJob).mock.calls[0][0].options).toMatchObject({
      fixedBackground: true,
      fixedViewpoint: true,
    });
  });

  it('rejects OpenAI sketch_to_real when providerModel is wrong', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: 'proj1', userId: 'u1' } as any);

    await expect(
      generationService.create('u1', {
        projectId: 'proj1',
        mode: 'sketch_to_real',
        provider: 'openai',
        providerModel: 'not-gpt-image-2',
        sourceImagePath: 'uploads/u1/proj1/source.png',
      })
    ).rejects.toThrow('providerModel이 provider와 일치하지 않습니다');

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

  it('rejects OpenAI sketch_to_real outputCount values outside the v2 two-candidate contract', async () => {
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
        options: {
          outputCount: 4,
        },
      })
    ).rejects.toThrow('OpenAI v2는 후보 2개 생성만 지원합니다');

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
        externalRequestCount: 1,
        outputCount: 2,
        sdkMaxRetries: 0,
        queueAttempts: 1,
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
          externalRequestCount: 1,
          outputCount: 2,
          sdkMaxRetries: 0,
          queueAttempts: 1,
        },
      },
    });
  });
});

describe('GenerationService - getById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns generated images in stable candidate order by output file index', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.generation.findFirst).mockResolvedValue({
      id: 'gen1',
      project: { userId: 'u1' },
      images: [
        {
          id: 'img2',
          filePath: 'generations/u1/gen1/output_2.png',
          createdAt: new Date('2026-04-28T00:00:00.000Z'),
        },
        {
          id: 'img1',
          filePath: 'generations/u1/gen1/output_1.png',
          createdAt: new Date('2026-04-28T00:00:01.000Z'),
        },
      ],
    } as any);

    const generation = await generationService.getById('u1', 'gen1');

    expect(generation?.images.map((image) => image.filePath)).toEqual([
      'generations/u1/gen1/output_1.png',
      'generations/u1/gen1/output_2.png',
    ]);
  });
});

describe('GenerationService - saveGeneratedImage', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import('../../lib/prisma.js');
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) =>
      callback({
        imageHistory: prisma.imageHistory,
        generatedImage: prisma.generatedImage,
      })
    );
  });

  it('keeps the old signature backward-compatible with hasTransparency false', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.generatedImage.create).mockResolvedValue({
      id: 'img1',
      generationId: 'gen1',
      hasTransparency: false,
    } as any);

    await generationService.saveGeneratedImage(
      'gen1',
      'generations/u1/proj1/gen1/output_1.png',
      'generations/u1/proj1/gen1/thumb_output_1.jpg',
      { width: 128, height: 128, size: 1024 }
    );

    expect(vi.mocked(prisma.generatedImage.create)).toHaveBeenCalledWith({
      data: expect.objectContaining({
        generationId: 'gen1',
        hasTransparency: false,
      }),
    });
  });

  it('persists hasTransparency true when explicitly provided', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.generatedImage.create).mockResolvedValue({
      id: 'img1',
      generationId: 'gen1',
      hasTransparency: true,
    } as any);

    await generationService.saveGeneratedImage(
      'gen1',
      'generations/u1/proj1/gen1/output_1.png',
      'generations/u1/proj1/gen1/thumb_output_1.jpg',
      { width: 128, height: 128, size: 1024 },
      { hasTransparency: true }
    );

    expect(vi.mocked(prisma.generatedImage.create)).toHaveBeenCalledWith({
      data: expect.objectContaining({
        generationId: 'gen1',
        hasTransparency: true,
      }),
    });
  });

  it('can persist the first generated candidate as selected', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.generatedImage.create).mockResolvedValue({
      id: 'img1',
      generationId: 'gen1',
      isSelected: true,
    } as any);

    await generationService.saveGeneratedImage(
      'gen1',
      'generations/u1/proj1/gen1/output_1.png',
      'generations/u1/proj1/gen1/thumb_output_1.jpg',
      { width: 128, height: 128, size: 1024 },
      { isSelected: true }
    );

    expect(vi.mocked(prisma.generatedImage.create)).toHaveBeenCalledWith({
      data: expect.objectContaining({
        generationId: 'gen1',
        isSelected: true,
      }),
    });
  });
});

describe('GenerationService - deleteGeneratedOutputImages', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { prisma } = await import('../../lib/prisma.js');
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) =>
      callback({
        imageHistory: prisma.imageHistory,
        generatedImage: prisma.generatedImage,
      })
    );
  });

  it('removes existing output image records and files before a retry save pass', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { uploadService } = await import('../../services/upload.service.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.generatedImage.findMany).mockResolvedValue([
      {
        id: 'img1',
        filePath: 'generations/u1/proj1/gen1/output_1.png',
        thumbnailPath: 'generations/u1/proj1/gen1/thumb_output_1.jpg',
      },
      {
        id: 'img2',
        filePath: 'generations/u1/proj1/gen1/output_2.png',
        thumbnailPath: null,
      },
    ] as any);

    await generationService.deleteGeneratedOutputImages('gen1');

    expect(vi.mocked(prisma.generatedImage.findMany)).toHaveBeenCalledWith({
      where: { generationId: 'gen1', type: 'output' },
      select: { id: true, filePath: true, thumbnailPath: true },
    });
    expect(vi.mocked(prisma.imageHistory.deleteMany)).toHaveBeenCalledWith({
      where: { imageId: { in: ['img1', 'img2'] } },
    });
    expect(vi.mocked(prisma.generatedImage.deleteMany)).toHaveBeenCalledWith({
      where: { generationId: 'gen1', type: 'output' },
    });
    expect(vi.mocked(uploadService.deleteFile)).toHaveBeenCalledWith(
      'generations/u1/proj1/gen1/output_1.png'
    );
    expect(vi.mocked(uploadService.deleteFile)).toHaveBeenCalledWith(
      'generations/u1/proj1/gen1/thumb_output_1.jpg'
    );
    expect(vi.mocked(uploadService.deleteFile)).toHaveBeenCalledWith(
      'generations/u1/proj1/gen1/output_2.png'
    );
  });

  it('does nothing when there are no existing output records', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { uploadService } = await import('../../services/upload.service.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.generatedImage.findMany).mockResolvedValue([]);

    await generationService.deleteGeneratedOutputImages('gen1');

    expect(vi.mocked(prisma.$transaction)).not.toHaveBeenCalled();
    expect(vi.mocked(uploadService.deleteFile)).not.toHaveBeenCalled();
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

  it('creates OpenAI style copy for ip-change with selected image id and two candidates', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: 'proj1', userId: 'u1' } as any);
    vi.mocked(prisma.generation.findFirst).mockResolvedValue({
      id: 'gen1',
      projectId: 'proj1',
      project: { userId: 'u1' },
      images: [
        {
          id: '00000000-0000-0000-0000-000000000111',
          filePath: 'generations/u1/proj1/gen1/output_1.png',
          type: 'output',
          createdAt: new Date('2026-04-28T00:00:00.000Z'),
        },
      ],
      provider: 'openai',
      providerModel: 'gpt-image-2',
      mode: 'ip_change',
      ipCharacterId: 'character-old',
      userInstructions: null,
      promptData: {
        sourceImagePath: 'uploads/u1/proj1/source.png',
        characterImagePath: 'characters/u1/original-character.png',
        userPrompt: 'copy the approved treatment',
      },
      options: {
        preserveStructure: true,
        transparentBackground: false,
        quality: 'high',
      },
    } as any);
    vi.mocked(prisma.generation.create).mockResolvedValue({
      id: 'style1',
      projectId: 'proj1',
      status: 'pending',
      mode: 'ip_change',
      provider: 'openai',
      providerModel: 'gpt-image-2',
    } as any);

    await generationService.copyStyle('u1', 'gen1', {
      copyTarget: 'ip-change',
      selectedImageId: '00000000-0000-0000-0000-000000000111',
      characterImagePath: 'characters/u1/new-character.png',
      userInstructions: '  make the mascot blue  ',
    });

    expect(vi.mocked(prisma.generation.create).mock.calls[0][0].data).toMatchObject({
      provider: 'openai',
      providerModel: 'gpt-image-2',
      styleReferenceId: 'gen1',
      ipCharacterId: null,
      promptData: expect.objectContaining({
        sourceImagePath: 'uploads/u1/proj1/source.png',
        characterImagePath: 'characters/u1/new-character.png',
        copyTarget: 'ip-change',
        selectedImageId: '00000000-0000-0000-0000-000000000111',
      }),
      options: expect.objectContaining({
        userInstructions: 'make the mascot blue',
        outputCount: 2,
      }),
    });
    expect(vi.mocked(addGenerationJob).mock.calls[0][0]).toMatchObject({
      provider: 'openai',
      providerModel: 'gpt-image-2',
      styleReferenceId: 'gen1',
      copyTarget: 'ip-change',
      selectedImageId: '00000000-0000-0000-0000-000000000111',
      sourceImagePath: 'uploads/u1/proj1/source.png',
      characterImagePath: 'characters/u1/new-character.png',
      options: expect.objectContaining({
        outputCount: 2,
        userInstructions: 'make the mascot blue',
      }),
    });
  });

  it('creates OpenAI style copy for new-product with selected image id and two candidates', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: 'proj1', userId: 'u1' } as any);
    vi.mocked(prisma.generation.findFirst).mockResolvedValue({
      id: 'gen1',
      projectId: 'proj1',
      project: { userId: 'u1' },
      images: [
        {
          id: '00000000-0000-0000-0000-000000000222',
          filePath: 'generations/u1/proj1/gen1/output_2.png',
          type: 'output',
          createdAt: new Date('2026-04-28T00:00:00.000Z'),
        },
      ],
      provider: 'openai',
      providerModel: 'gpt-image-2',
      mode: 'ip_change',
      ipCharacterId: 'character-old',
      userInstructions: 'original instruction',
      promptData: {
        sourceImagePath: 'uploads/u1/proj1/original-product.png',
        characterImagePath: 'characters/u1/original-character.png',
        userPrompt: 'copy the approved treatment',
      },
      options: {
        preserveStructure: true,
        transparentBackground: false,
        userInstructions: 'original option instruction',
        quality: 'medium',
      },
    } as any);
    vi.mocked(prisma.generation.create).mockResolvedValue({
      id: 'style2',
      projectId: 'proj1',
      status: 'pending',
      mode: 'ip_change',
      provider: 'openai',
      providerModel: 'gpt-image-2',
    } as any);

    await generationService.copyStyle('u1', 'gen1', {
      copyTarget: 'new-product',
      selectedImageId: '00000000-0000-0000-0000-000000000222',
      sourceImagePath: 'uploads/u1/proj1/new-product.png',
    });

    expect(vi.mocked(prisma.generation.create).mock.calls[0][0].data).toMatchObject({
      provider: 'openai',
      providerModel: 'gpt-image-2',
      styleReferenceId: 'gen1',
      ipCharacterId: 'character-old',
      promptData: expect.objectContaining({
        sourceImagePath: 'uploads/u1/proj1/new-product.png',
        characterImagePath: 'characters/u1/original-character.png',
        copyTarget: 'new-product',
        selectedImageId: '00000000-0000-0000-0000-000000000222',
      }),
      options: expect.objectContaining({
        userInstructions: 'original option instruction',
        outputCount: 2,
      }),
    });
    expect(vi.mocked(addGenerationJob).mock.calls[0][0]).toMatchObject({
      provider: 'openai',
      providerModel: 'gpt-image-2',
      styleReferenceId: 'gen1',
      copyTarget: 'new-product',
      selectedImageId: '00000000-0000-0000-0000-000000000222',
      sourceImagePath: 'uploads/u1/proj1/new-product.png',
      characterImagePath: 'characters/u1/original-character.png',
      options: expect.objectContaining({
        outputCount: 2,
      }),
    });
  });

  it('rejects OpenAI style copy when selected image does not belong to the source generation', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.generation.findFirst).mockResolvedValue({
      id: 'gen1',
      projectId: 'proj1',
      project: { userId: 'u1' },
      images: [
        {
          id: '00000000-0000-0000-0000-000000000111',
          filePath: 'generations/u1/proj1/gen1/output_1.png',
          type: 'output',
          createdAt: new Date('2026-04-28T00:00:00.000Z'),
        },
      ],
      provider: 'openai',
      providerModel: 'gpt-image-2',
      mode: 'ip_change',
      promptData: {
        sourceImagePath: 'uploads/u1/proj1/source.png',
        characterImagePath: 'characters/u1/original-character.png',
      },
      options: {},
    } as any);

    await expect(
      generationService.copyStyle('u1', 'gen1', {
        copyTarget: 'ip-change',
        selectedImageId: '00000000-0000-0000-0000-000000000999',
        characterImagePath: 'characters/u1/new-character.png',
      })
    ).rejects.toThrow('선택한 스타일 기준 이미지를 찾을 수 없습니다');

    expect(vi.mocked(prisma.generation.create)).not.toHaveBeenCalled();
    expect(vi.mocked(addGenerationJob)).not.toHaveBeenCalled();
  });

  it('rejects Gemini source generation when selectedImageId indicates v2 style copy', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.generation.findFirst).mockResolvedValue({
      id: 'gen1',
      projectId: 'proj1',
      project: { userId: 'u1' },
      images: [],
      provider: 'gemini',
      providerModel: 'gemini-3-pro-image-preview',
      mode: 'ip_change',
      promptData: {
        sourceImagePath: 'uploads/u1/proj1/source.png',
        characterImagePath: 'characters/u1/original-character.png',
      },
      options: {},
    } as any);

    await expect(
      generationService.copyStyle('u1', 'gen1', {
        selectedImageId: '00000000-0000-0000-0000-000000000111',
        characterImagePath: 'characters/u1/new-character.png',
      })
    ).rejects.toThrow('v2 스타일 복사는 v2 기준 결과에서만 시작할 수 있습니다');

    expect(vi.mocked(prisma.generation.create)).not.toHaveBeenCalled();
    expect(vi.mocked(addGenerationJob)).not.toHaveBeenCalled();
  });

  it('mirrors OpenAI style copy copyTarget styleReferenceId and styleSourceImageId in providerTrace', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: 'proj1', userId: 'u1' } as any);
    vi.mocked(prisma.generation.findFirst).mockResolvedValue({
      id: 'gen1',
      projectId: 'proj1',
      project: { userId: 'u1' },
      images: [
        {
          id: '00000000-0000-0000-0000-000000000333',
          filePath: 'generations/u1/proj1/gen1/output_1.png',
          type: 'output',
          createdAt: new Date('2026-04-28T00:00:00.000Z'),
        },
      ],
      provider: 'openai',
      providerModel: 'gpt-image-2',
      mode: 'ip_change',
      ipCharacterId: null,
      promptData: {
        sourceImagePath: 'uploads/u1/proj1/source.png',
        characterImagePath: 'characters/u1/original-character.png',
      },
      options: {
        transparentBackground: false,
      },
    } as any);
    vi.mocked(prisma.generation.create).mockResolvedValue({
      id: 'style3',
      projectId: 'proj1',
      status: 'pending',
      mode: 'ip_change',
      provider: 'openai',
      providerModel: 'gpt-image-2',
    } as any);

    await generationService.copyStyle('u1', 'gen1', {
      copyTarget: 'ip-change',
      selectedImageId: '00000000-0000-0000-0000-000000000333',
      characterImagePath: 'characters/u1/new-character.png',
    });

    expect(vi.mocked(prisma.generation.create).mock.calls[0][0].data.providerTrace).toEqual({
      workflow: 'style_copy',
      copyTarget: 'ip-change',
      styleReferenceId: 'gen1',
      styleSourceImageId: '00000000-0000-0000-0000-000000000333',
    });
  });
});

describe('GenerationService - regenerate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('replays OpenAI regeneration with persisted provider model inputs prompt and options', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: 'proj1', userId: 'u1' } as any);
    vi.mocked(prisma.generation.findFirst).mockResolvedValue({
      id: 'gen1',
      projectId: 'proj1',
      project: { userId: 'u1' },
      images: [
        {
          id: 'selected-img',
          filePath: 'generations/u1/proj1/gen1/output_1.png',
          isSelected: true,
          createdAt: new Date('2026-04-28T00:00:00.000Z'),
        },
      ],
      provider: 'openai',
      providerModel: 'gpt-image-2',
      mode: 'ip_change',
      ipCharacterId: null,
      userInstructions: null,
      promptData: {
        sourceImagePath: 'uploads/u1/proj1/source.png',
        characterImagePath: 'characters/u1/character.png',
        userPrompt: 'keep the same product treatment',
      },
      options: {
        preserveStructure: true,
        transparentBackground: false,
        fixedBackground: true,
        fixedViewpoint: true,
        quality: 'high',
        outputCount: 2,
      },
    } as any);
    vi.mocked(prisma.generation.create).mockResolvedValue({
      id: 'regen1',
      projectId: 'proj1',
      status: 'pending',
      mode: 'ip_change',
      provider: 'openai',
      providerModel: 'gpt-image-2',
    } as any);

    await generationService.regenerate('u1', 'gen1');

    const createData = vi.mocked(prisma.generation.create).mock.calls[0][0].data;
    expect(createData.provider).toBe('openai');
    expect(createData.providerModel).toBe('gpt-image-2');
    expect(createData.promptData).toMatchObject({
      sourceImagePath: 'uploads/u1/proj1/source.png',
      characterImagePath: 'characters/u1/character.png',
      userPrompt: 'keep the same product treatment',
    });
    expect(createData.promptData).not.toMatchObject({
      sourceImagePath: 'generations/u1/proj1/gen1/output_1.png',
    });
    expect(createData.options).toMatchObject({
      preserveStructure: true,
      quality: 'high',
      outputCount: 2,
    });

    expect(vi.mocked(addGenerationJob).mock.calls[0][0]).toMatchObject({
      provider: 'openai',
      providerModel: 'gpt-image-2',
      sourceImagePath: 'uploads/u1/proj1/source.png',
      characterImagePath: 'characters/u1/character.png',
      prompt: 'keep the same product treatment',
      options: expect.objectContaining({
        outputCount: 2,
      }),
    });
    expect(vi.mocked(addGenerationJob).mock.calls[0][0].sourceImagePath).not.toBe(
      'generations/u1/proj1/gen1/output_1.png'
    );
  });

  it.each([
    {
      copyTarget: 'ip-change' as const,
      sourceImagePath: 'uploads/u1/proj1/original-product.png',
      characterImagePath: 'characters/u1/new-character.png',
    },
    {
      copyTarget: 'new-product' as const,
      sourceImagePath: 'uploads/u1/proj1/new-product.png',
      characterImagePath: 'characters/u1/original-character.png',
    },
  ])(
    'replays OpenAI style-copy regeneration with persisted $copyTarget lineage',
    async ({ copyTarget, sourceImagePath, characterImagePath }) => {
      const { prisma } = await import('../../lib/prisma.js');
      const { addGenerationJob } = await import('../../lib/queue.js');
      const { generationService } = await import('../generation.service.js');

      vi.mocked(prisma.project.findFirst).mockResolvedValue({ id: 'proj1', userId: 'u1' } as any);
      vi.mocked(prisma.generation.findFirst).mockResolvedValue({
        id: 'style-result-1',
        projectId: 'proj1',
        project: { userId: 'u1' },
        images: [
          {
            id: 'generated-output-1',
            filePath: 'generations/u1/proj1/style-result-1/output_1.png',
            type: 'output',
            createdAt: new Date('2026-04-28T00:00:00.000Z'),
          },
        ],
        provider: 'openai',
        providerModel: 'gpt-image-2',
        mode: 'ip_change',
        styleReferenceId: 'source-style-generation',
        ipCharacterId: null,
        userInstructions: null,
        promptData: {
          sourceImagePath,
          characterImagePath,
          copyTarget,
          selectedImageId: 'style-source-image-2',
          userPrompt: 'copy the approved treatment',
        },
        options: {
          preserveStructure: true,
          transparentBackground: false,
          quality: 'medium',
          outputCount: 2,
          userInstructions: 'replace target only',
        },
      } as any);
      vi.mocked(prisma.generation.create).mockResolvedValue({
        id: 'style-regen-1',
        projectId: 'proj1',
        status: 'pending',
        mode: 'ip_change',
        provider: 'openai',
        providerModel: 'gpt-image-2',
      } as any);

      await generationService.regenerate('u1', 'style-result-1');

      expect(vi.mocked(prisma.generation.create).mock.calls[0][0].data).toMatchObject({
        provider: 'openai',
        providerModel: 'gpt-image-2',
        styleReferenceId: 'source-style-generation',
        promptData: expect.objectContaining({
          sourceImagePath,
          characterImagePath,
          copyTarget,
          selectedImageId: 'style-source-image-2',
        }),
        options: expect.objectContaining({
          outputCount: 2,
          userInstructions: 'replace target only',
        }),
      });
      expect(vi.mocked(addGenerationJob).mock.calls[0][0]).toMatchObject({
        provider: 'openai',
        providerModel: 'gpt-image-2',
        styleReferenceId: 'source-style-generation',
        copyTarget,
        selectedImageId: 'style-source-image-2',
        sourceImagePath,
        characterImagePath,
        options: expect.objectContaining({ outputCount: 2 }),
      });
    }
  );

  it('fails OpenAI regeneration clearly when stored source inputs are missing', async () => {
    const { prisma } = await import('../../lib/prisma.js');
    const { addGenerationJob } = await import('../../lib/queue.js');
    const { generationService } = await import('../generation.service.js');

    vi.mocked(prisma.generation.findFirst).mockResolvedValue({
      id: 'gen1',
      projectId: 'proj1',
      project: { userId: 'u1' },
      images: [],
      provider: 'openai',
      providerModel: 'gpt-image-2',
      mode: 'ip_change',
      ipCharacterId: null,
      promptData: {
        characterImagePath: 'characters/u1/character.png',
      },
      options: {
        outputCount: 2,
      },
    } as any);

    await expect(generationService.regenerate('u1', 'gen1')).rejects.toThrow(
      '재생성 입력값이 불완전합니다'
    );

    expect(vi.mocked(prisma.generation.create)).not.toHaveBeenCalled();
    expect(vi.mocked(addGenerationJob)).not.toHaveBeenCalled();
  });
});
