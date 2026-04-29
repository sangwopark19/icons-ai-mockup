import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GenerationJobData } from '../queue.js';

const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  queueConstructor: vi.fn(),
}));

vi.mock('bullmq', () => ({
  Queue: vi.fn(function QueueMock(name: string, options: unknown) {
    mocks.queueConstructor(name, options);
    return {
      add: mocks.add,
    };
  }),
  Job: vi.fn(),
}));

vi.mock('../redis.js', () => ({
  redis: {},
}));

function buildJobData(provider: GenerationJobData['provider']): GenerationJobData {
  return {
    generationId: `${provider}-gen`,
    userId: 'u1',
    projectId: 'p1',
    mode: 'ip_change',
    provider,
    providerModel: provider === 'openai' ? 'gpt-image-2' : 'gemini-3-pro-image-preview',
    sourceImagePath: 'uploads/u1/p1/source.png',
    characterImagePath: 'characters/u1/character.png',
    options: {
      preserveStructure: true,
      transparentBackground: false,
      outputCount: 2,
    },
  };
}

describe('generation queue request budgets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps default retry behavior for Gemini jobs', async () => {
    const { addGenerationJob } = await import('../queue.js');
    const data = buildJobData('gemini');

    await addGenerationJob(data);

    expect(mocks.queueConstructor).toHaveBeenCalledWith(
      'generation',
      expect.objectContaining({
        defaultJobOptions: expect.objectContaining({
          attempts: 3,
        }),
      })
    );
    expect(mocks.add).toHaveBeenCalledWith('generate', data, {
      priority: 1,
    });
  });

  it('limits OpenAI jobs to one BullMQ attempt', async () => {
    const { addGenerationJob } = await import('../queue.js');
    const data = buildJobData('openai');

    await addGenerationJob(data);

    expect(mocks.add).toHaveBeenCalledWith('generate', data, {
      priority: 1,
      attempts: 1,
    });
  });
});
