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

  it('returns the route validation message for invalid OpenAI create requests', async () => {
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
      },
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      success: false,
      error: {
        code: 'GENERATION_FAILED',
        message: 'OpenAI provider는 현재 IP 변경 v2만 지원합니다',
      },
    });
    expect(vi.mocked(generationService.create)).not.toHaveBeenCalled();

    await app.close();
  });
});
