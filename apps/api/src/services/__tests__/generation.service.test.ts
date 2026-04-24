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
        characterImagePath: 'uploads/u1/proj1/character.png',
      })
    ).rejects.toThrow('providerModel이 provider와 일치하지 않습니다');

    expect(vi.mocked(prisma.generation.create)).not.toHaveBeenCalled();
    expect(vi.mocked(addGenerationJob)).not.toHaveBeenCalled();
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
