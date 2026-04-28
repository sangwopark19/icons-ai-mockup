import { beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';

vi.mock('../../services/generation.service.js', () => ({
  generationService: {
    create: vi.fn(),
    selectImage: vi.fn(),
    copyStyle: vi.fn(),
    getProjectHistory: vi.fn(),
  },
}));

async function buildTestApp(): Promise<FastifyInstance> {
  const { default: generationRoutes } = await import('../generation.routes.js');
  const app = Fastify({ logger: false });

  app.decorate('authenticate', async (request: any) => {
    request.user = { id: 'user1' };
  });

  await app.register(generationRoutes);
  await app.ready();
  return app;
}

describe('generation routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts OpenAI sketch_to_real create requests with product and material options', async () => {
    const app = await buildTestApp();
    const { generationService } = await import('../../services/generation.service.js');
    vi.mocked(generationService.create).mockResolvedValue({
      id: 'gen1',
      status: 'pending',
      mode: 'sketch_to_real',
      provider: 'openai',
      providerModel: 'gpt-image-2',
      createdAt: new Date('2026-04-28T00:00:00.000Z'),
    } as any);

    const response = await app.inject({
      method: 'POST',
      url: '/',
      payload: {
        projectId: '00000000-0000-0000-0000-000000000001',
        mode: 'sketch_to_real',
        provider: 'openai',
        providerModel: 'gpt-image-2',
        sourceImagePath: 'uploads/user1/project/source.png',
        textureImagePath: 'uploads/user1/project/texture.png',
        options: {
          outputCount: 2,
          transparentBackground: true,
          productCategory: 'mug',
          materialPreset: 'ceramic',
        },
      },
    });

    expect(response.statusCode).toBe(201);
    expect(vi.mocked(generationService.create)).toHaveBeenCalledWith(
      'user1',
      expect.objectContaining({
        mode: 'sketch_to_real',
        provider: 'openai',
        providerModel: 'gpt-image-2',
        textureImagePath: 'uploads/user1/project/texture.png',
        options: expect.objectContaining({
          outputCount: 2,
          transparentBackground: true,
          productCategory: 'mug',
          materialPreset: 'ceramic',
        }),
      })
    );

    await app.close();
  });

  it('rejects OpenAI sketch_to_real requests with the wrong providerModel', async () => {
    const app = await buildTestApp();
    const { generationService } = await import('../../services/generation.service.js');

    const response = await app.inject({
      method: 'POST',
      url: '/',
      payload: {
        projectId: '00000000-0000-0000-0000-000000000001',
        mode: 'sketch_to_real',
        provider: 'openai',
        providerModel: 'not-gpt-image-2',
        sourceImagePath: 'uploads/user1/project/source.png',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: 'OpenAI providerModel은 gpt-image-2여야 합니다',
      },
    });
    expect(vi.mocked(generationService.create)).not.toHaveBeenCalled();

    await app.close();
  });

  it('rejects OpenAI sketch_to_real requests when outputCount is not 2', async () => {
    const app = await buildTestApp();
    const { generationService } = await import('../../services/generation.service.js');

    const response = await app.inject({
      method: 'POST',
      url: '/',
      payload: {
        projectId: '00000000-0000-0000-0000-000000000001',
        mode: 'sketch_to_real',
        provider: 'openai',
        providerModel: 'gpt-image-2',
        sourceImagePath: 'uploads/user1/project/source.png',
        options: {
          outputCount: 1,
        },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toMatchObject({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: 'OpenAI v2는 후보 2개 생성만 지원합니다',
      },
    });
    expect(vi.mocked(generationService.create)).not.toHaveBeenCalled();

    await app.close();
  });

  it('rejects OpenAI sketch_to_real requests without product and material options', async () => {
    const app = await buildTestApp();
    const { generationService } = await import('../../services/generation.service.js');

    const response = await app.inject({
      method: 'POST',
      url: '/',
      payload: {
        projectId: '00000000-0000-0000-0000-000000000001',
        mode: 'sketch_to_real',
        provider: 'openai',
        providerModel: 'gpt-image-2',
        sourceImagePath: 'uploads/user1/project/source.png',
        options: {
          outputCount: 2,
        },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toMatchObject({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: 'OpenAI 스케치 실사화 v2에는 제품 종류가 필요합니다',
      },
    });
    expect(vi.mocked(generationService.create)).not.toHaveBeenCalled();

    await app.close();
  });

  it('rejects OpenAI sketch_to_real 기타 options without detail text', async () => {
    const app = await buildTestApp();
    const { generationService } = await import('../../services/generation.service.js');

    const response = await app.inject({
      method: 'POST',
      url: '/',
      payload: {
        projectId: '00000000-0000-0000-0000-000000000001',
        mode: 'sketch_to_real',
        provider: 'openai',
        providerModel: 'gpt-image-2',
        sourceImagePath: 'uploads/user1/project/source.png',
        options: {
          outputCount: 2,
          productCategory: '기타',
          materialPreset: '기타',
        },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toMatchObject({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: '기타 제품 종류를 선택한 경우 상세 내용을 입력해주세요',
      },
    });
    expect(vi.mocked(generationService.create)).not.toHaveBeenCalled();

    await app.close();
  });

  it('returns a structured 400 for invalid select-image payloads', async () => {
    const app = await buildTestApp();
    const { generationService } = await import('../../services/generation.service.js');

    const response = await app.inject({
      method: 'POST',
      url: '/00000000-0000-0000-0000-000000000001/select',
      payload: { imageId: 'not-a-uuid' },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toMatchObject({
      success: false,
      error: { code: 'INVALID_REQUEST' },
    });
    expect(vi.mocked(generationService.selectImage)).not.toHaveBeenCalled();

    await app.close();
  });

  it('returns a structured 400 for invalid copy-style payloads', async () => {
    const app = await buildTestApp();
    const { generationService } = await import('../../services/generation.service.js');

    const response = await app.inject({
      method: 'POST',
      url: '/00000000-0000-0000-0000-000000000001/copy-style',
      payload: { characterImagePath: 123 },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toMatchObject({
      success: false,
      error: { code: 'INVALID_REQUEST' },
    });
    expect(vi.mocked(generationService.copyStyle)).not.toHaveBeenCalled();

    await app.close();
  });

  it('returns a structured 400 for invalid history query params', async () => {
    const app = await buildTestApp();
    const { generationService } = await import('../../services/generation.service.js');

    const response = await app.inject({
      method: 'GET',
      url: '/project/00000000-0000-0000-0000-000000000001/history?page=0&limit=20',
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toMatchObject({
      success: false,
      error: { code: 'INVALID_REQUEST' },
    });
    expect(vi.mocked(generationService.getProjectHistory)).not.toHaveBeenCalled();

    await app.close();
  });
});
