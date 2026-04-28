import { beforeEach, describe, expect, it, vi } from 'vitest';
import Fastify, { type FastifyInstance } from 'fastify';

vi.mock('../../services/generation.service.js', () => ({
  generationService: {
    create: vi.fn(),
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
});
