import { beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';

const ids = {
  generation: '00000000-0000-0000-0000-000000000001',
  project: '00000000-0000-0000-0000-000000000002',
  selectedImage: '00000000-0000-0000-0000-000000000111',
  otherImage: '00000000-0000-0000-0000-000000000222',
  newGeneration: '00000000-0000-0000-0000-000000000999',
  savedImage: '00000000-0000-0000-0000-000000000333',
};

const mocks = vi.hoisted(() => ({
  generationService: {
    getById: vi.fn(),
    saveGeneratedImage: vi.fn(),
    updateOpenAIMetadata: vi.fn(),
  },
  adminService: {
    getActiveApiKey: vi.fn(),
    incrementCallCount: vi.fn(),
  },
  geminiService: {
    generateEdit: vi.fn(),
  },
  openaiImageService: {
    generatePartialEdit: vi.fn(),
  },
  uploadService: {
    readFile: vi.fn(),
    saveGeneratedImage: vi.fn(),
  },
  prisma: {
    generation: {
      create: vi.fn(),
    },
    generatedImage: {
      update: vi.fn(),
    },
    imageHistory: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../../services/generation.service.js', () => ({
  generationService: mocks.generationService,
}));

vi.mock('../../services/admin.service.js', () => ({
  adminService: mocks.adminService,
}));

vi.mock('../../services/gemini.service.js', () => ({
  geminiService: mocks.geminiService,
}));

vi.mock('../../services/openai-image.service.js', () => ({
  openaiImageService: mocks.openaiImageService,
}));

vi.mock('../../services/upload.service.js', () => ({
  uploadService: mocks.uploadService,
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: mocks.prisma,
}));

async function buildTestApp(): Promise<FastifyInstance> {
  const { default: editRoutes } = await import('../edit.routes.js');
  const app = Fastify({ logger: false });

  app.decorate('authenticate', async (request: any) => {
    request.user = { id: 'user1' };
  });

  await app.register(editRoutes);
  await app.ready();
  return app;
}

function imageFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: ids.selectedImage,
    generationId: ids.generation,
    filePath: 'generations/user1/project/source.png',
    thumbnailPath: null,
    type: 'output',
    isSelected: true,
    hasTransparency: false,
    width: 1024,
    height: 1024,
    fileSize: 128,
    createdAt: new Date('2026-04-29T00:00:00.000Z'),
    ...overrides,
  };
}

function generationFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: ids.generation,
    projectId: ids.project,
    ipCharacterId: null,
    sourceImageId: null,
    mode: 'ip_change',
    status: 'completed',
    provider: 'gemini',
    providerModel: 'gemini-3-pro-image-preview',
    promptData: { sourceImagePath: 'uploads/source.png' },
    options: { outputCount: 2, quality: 'medium' },
    images: [imageFixture()],
    createdAt: new Date('2026-04-29T00:00:00.000Z'),
    completedAt: new Date('2026-04-29T00:01:00.000Z'),
    ...overrides,
  };
}

function openAIGenerationFixture(overrides: Record<string, unknown> = {}) {
  return generationFixture({
    provider: 'openai',
    providerModel: 'gpt-image-2',
    options: { outputCount: 2, quality: 'high' },
    ...overrides,
  });
}

describe('edit routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.generationService.getById.mockResolvedValue(generationFixture());
    mocks.generationService.saveGeneratedImage.mockResolvedValue({ id: ids.savedImage });
    mocks.generationService.updateOpenAIMetadata.mockResolvedValue(undefined);
    mocks.adminService.getActiveApiKey.mockResolvedValue({ id: 'key1', key: 'active-api-key' });
    mocks.adminService.incrementCallCount.mockResolvedValue(undefined);
    mocks.geminiService.generateEdit.mockResolvedValue({
      images: [Buffer.from('gemini-result')],
    });
    mocks.openaiImageService.generatePartialEdit.mockResolvedValue({
      images: [Buffer.from('openai-result')],
      requestIds: ['req_openai_1'],
      responseId: 'resp_openai_1',
      imageCallIds: ['img_openai_1'],
      revisedPrompt: 'revised prompt',
      providerTrace: {
        provider: 'openai',
        model: 'gpt-image-2',
        endpoint: 'images.edit',
        workflow: 'partial_edit',
        outputCount: 1,
      },
    });
    mocks.uploadService.readFile.mockResolvedValue(Buffer.from('selected-image'));
    mocks.uploadService.saveGeneratedImage.mockResolvedValue({
      filePath: 'generations/user1/project/new/output_1.png',
      thumbnailPath: 'generations/user1/project/new/thumb_output_1.jpg',
      metadata: { width: 1024, height: 1024, size: 18 },
    });
    mocks.prisma.generation.create.mockResolvedValue({
      id: ids.newGeneration,
      provider: 'openai',
      providerModel: 'gpt-image-2',
    });
    mocks.prisma.generatedImage.update.mockResolvedValue({});
    mocks.prisma.imageHistory.create.mockResolvedValue({});
  });

  it('keeps Gemini partial edit on geminiService.generateEdit', async () => {
    const app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: `/${ids.generation}/edit`,
      payload: { prompt: 'change only the logo color to red' },
    });

    expect(response.statusCode).toBe(201);
    expect(mocks.adminService.getActiveApiKey).toHaveBeenCalledWith('gemini');
    expect(mocks.adminService.incrementCallCount).toHaveBeenCalledWith('gemini', 'key1');
    expect(mocks.geminiService.generateEdit).toHaveBeenCalledWith(
      'active-api-key',
      Buffer.from('selected-image').toString('base64'),
      'change only the logo color to red'
    );
    expect(mocks.openaiImageService.generatePartialEdit).not.toHaveBeenCalled();

    await app.close();
  });

  it('routes OpenAI partial edit through openaiImageService.generatePartialEdit', async () => {
    mocks.generationService.getById.mockResolvedValue(openAIGenerationFixture());
    const app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: `/${ids.generation}/edit`,
      payload: {
        prompt: 'change only the logo color to blue',
        selectedImageId: ids.selectedImage,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body)).toEqual({
      success: true,
      data: {
        generationId: ids.newGeneration,
        message: '수정이 완료되었습니다',
      },
    });
    expect(mocks.adminService.getActiveApiKey).toHaveBeenCalledWith('openai');
    expect(mocks.adminService.incrementCallCount).toHaveBeenCalledWith('openai', 'key1');
    expect(mocks.openaiImageService.generatePartialEdit).toHaveBeenCalledWith(
      'active-api-key',
      Buffer.from('selected-image').toString('base64'),
      'change only the logo color to blue',
      { quality: 'high' }
    );
    expect(mocks.geminiService.generateEdit).not.toHaveBeenCalled();

    await app.close();
  });

  it('returns NO_SELECTED_IMAGE when selected image is missing', async () => {
    mocks.generationService.getById.mockResolvedValue(openAIGenerationFixture({ images: [] }));
    const app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: `/${ids.generation}/edit`,
      payload: { prompt: 'change only the logo color' },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      success: false,
      error: { code: 'NO_SELECTED_IMAGE', message: '선택된 이미지가 없습니다' },
    });
    expect(mocks.openaiImageService.generatePartialEdit).not.toHaveBeenCalled();
    expect(mocks.geminiService.generateEdit).not.toHaveBeenCalled();

    await app.close();
  });

  it('stores OpenAI metadata for OpenAI partial edit', async () => {
    mocks.generationService.getById.mockResolvedValue(openAIGenerationFixture());
    const app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: `/${ids.generation}/edit`,
      payload: {
        prompt: 'change only the zipper to black',
        selectedImageId: ids.selectedImage,
      },
    });

    expect(response.statusCode).toBe(201);
    expect(mocks.generationService.updateOpenAIMetadata).toHaveBeenCalledWith(
      ids.newGeneration,
      {
        requestIds: ['req_openai_1'],
        responseId: 'resp_openai_1',
        imageCallIds: ['img_openai_1'],
        revisedPrompt: 'revised prompt',
        providerTrace: {
          provider: 'openai',
          model: 'gpt-image-2',
          endpoint: 'images.edit',
          workflow: 'partial_edit',
          outputCount: 1,
        },
      }
    );
    expect(JSON.parse(response.body).data.providerTrace).toBeUndefined();

    await app.close();
  });

  it('returns OPENAI_KEY_MISSING when OpenAI active key is absent', async () => {
    mocks.generationService.getById.mockResolvedValue(openAIGenerationFixture());
    mocks.adminService.getActiveApiKey.mockRejectedValue(
      new Error('활성화된 openai API 키가 없습니다')
    );
    const app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: `/${ids.generation}/edit`,
      payload: {
        prompt: 'change only the logo color',
        selectedImageId: ids.selectedImage,
      },
    });

    expect(response.statusCode).toBe(503);
    expect(JSON.parse(response.body)).toEqual({
      success: false,
      error: {
        code: 'OPENAI_KEY_MISSING',
        message: 'OpenAI v2 API 키가 설정되어 있지 않습니다. 관리자에게 문의해주세요.',
      },
    });
    expect(mocks.openaiImageService.generatePartialEdit).not.toHaveBeenCalled();
    expect(mocks.geminiService.generateEdit).not.toHaveBeenCalled();

    await app.close();
  });

  it('rejects selectedImageId that is not owned by the source generation', async () => {
    mocks.generationService.getById.mockResolvedValue(openAIGenerationFixture());
    const app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: `/${ids.generation}/edit`,
      payload: {
        prompt: 'change only the logo color',
        selectedImageId: ids.otherImage,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      success: false,
      error: { code: 'NO_SELECTED_IMAGE', message: '선택된 이미지가 없습니다' },
    });
    expect(mocks.openaiImageService.generatePartialEdit).not.toHaveBeenCalled();
    expect(mocks.geminiService.generateEdit).not.toHaveBeenCalled();

    await app.close();
  });

  it('ignores forged provider payload and uses persisted generation provider', async () => {
    mocks.generationService.getById.mockResolvedValue(openAIGenerationFixture());
    const app = await buildTestApp();

    const response = await app.inject({
      method: 'POST',
      url: `/${ids.generation}/edit`,
      payload: {
        prompt: 'change only the logo color',
        selectedImageId: ids.selectedImage,
        provider: 'gemini',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(mocks.openaiImageService.generatePartialEdit).toHaveBeenCalledTimes(1);
    expect(mocks.geminiService.generateEdit).not.toHaveBeenCalled();

    await app.close();
  });
});
