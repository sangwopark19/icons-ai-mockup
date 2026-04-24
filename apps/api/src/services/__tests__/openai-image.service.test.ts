import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  edit: vi.fn(),
  toFile: vi.fn(async (buffer: Buffer, name: string) => ({
    buffer,
    name,
    type: 'image/png',
  })),
}));

vi.mock('openai', () => ({
  default: vi.fn(function OpenAIMock() {
    return {
      images: {
        edit: mocks.edit,
      },
    };
  }),
  toFile: mocks.toFile,
}));

describe('OpenAIImageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.edit
      .mockResolvedValueOnce({
        _request_id: 'req_1',
        id: 'resp_1',
        data: [{ b64_json: Buffer.from('candidate-1').toString('base64'), id: 'img_1' }],
      })
      .mockResolvedValueOnce({
        _request_id: 'req_2',
        id: 'resp_2',
        data: [
          {
            b64_json: Buffer.from('candidate-2').toString('base64'),
            id: 'img_2',
            revised_prompt: 'revised',
          },
        ],
      });
  });

  it('returns exactly two image buffers from two edit calls', async () => {
    const { openaiImageService } = await import('../openai-image.service.js');

    const result = await openaiImageService.generateIPChange(
      'sk-test',
      Buffer.from('source').toString('base64'),
      Buffer.from('character').toString('base64'),
      {
        preserveStructure: true,
        transparentBackground: false,
        fixedBackground: true,
        fixedViewpoint: true,
      }
    );

    expect(mocks.edit).toHaveBeenCalledTimes(2);
    expect(result.images).toHaveLength(2);
    expect(result.images[0].toString()).toBe('candidate-1');
    expect(result.images[1].toString()).toBe('candidate-2');
    expect(result.requestIds).toEqual(['req_1', 'req_2']);
    expect(result.responseId).toBe('resp_1');
    expect(result.imageCallIds).toEqual(['img_1', 'img_2']);
    expect(result.revisedPrompt).toBe('revised');
  });

  it('calls images.edit with GPT Image 2 and omits forbidden parameters', async () => {
    const { openaiImageService } = await import('../openai-image.service.js');

    await openaiImageService.generateIPChange(
      'sk-test',
      Buffer.from('source').toString('base64'),
      Buffer.from('character').toString('base64'),
      {
        preserveStructure: true,
        transparentBackground: true,
        fixedBackground: true,
        fixedViewpoint: true,
        quality: 'high',
      }
    );

    const firstCall = mocks.edit.mock.calls[0][0];
    expect(firstCall).toMatchObject({
      model: 'gpt-image-2',
      quality: 'high',
      n: 1,
      size: '1024x1024',
      output_format: 'png',
    });
    expect(firstCall.image).toHaveLength(2);
    expect(firstCall.background).toBeUndefined();
    expect(firstCall.input_fidelity).toBeUndefined();
  });

  it('builds a strict IP replacement prompt with required sections', async () => {
    const { openaiImageService } = await import('../openai-image.service.js');

    const prompt = openaiImageService.buildIPChangePrompt({
      preserveStructure: true,
      transparentBackground: false,
      fixedBackground: true,
      fixedViewpoint: true,
      userInstructions: '캐릭터는 정면 얼굴이 보이게 유지',
    });

    expect(prompt).toContain(
      'Edit Image 1 by replacing only the existing character/IP artwork with the character from Image 2.'
    );
    expect(prompt).toContain('Task:');
    expect(prompt).toContain('Image roles:');
    expect(prompt).toContain('Must change:');
    expect(prompt).toContain('Must preserve:');
    expect(prompt).toContain('Hard constraints:');
    expect(prompt).toContain('Output:');
    expect(prompt).toContain('Do not add extra characters, logos, watermark, text, props');
  });

  it('defaults quality to medium', async () => {
    const { openaiImageService } = await import('../openai-image.service.js');

    await openaiImageService.generateIPChange(
      'sk-test',
      Buffer.from('source').toString('base64'),
      Buffer.from('character').toString('base64'),
      {
        preserveStructure: true,
        transparentBackground: false,
      }
    );

    expect(mocks.edit.mock.calls[0][0].quality).toBe('medium');
  });
});
