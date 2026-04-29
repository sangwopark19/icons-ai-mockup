import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GenerationJobData } from '../lib/queue.js';

vi.mock('bullmq', () => ({
  Worker: vi.fn(function WorkerMock() {
    return {
      close: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
    };
  }),
}));

vi.mock('../lib/redis.js', () => ({
  redis: {},
}));

vi.mock('../services/admin.service.js', () => ({
  adminService: {
    getActiveApiKey: vi.fn(),
    incrementCallCount: vi.fn(),
  },
}));

vi.mock('../services/upload.service.js', () => ({
  uploadService: {
    readFile: vi.fn(),
    saveGeneratedImage: vi.fn(),
  },
}));

vi.mock('../services/generation.service.js', () => ({
  generationService: {
    getById: vi.fn(),
    updateStatus: vi.fn(),
    updateOpenAIMetadata: vi.fn(),
    deleteGeneratedOutputImages: vi.fn(),
    saveGeneratedImage: vi.fn(),
    updateThoughtSignatures: vi.fn(),
  },
}));

vi.mock('../services/gemini.service.js', () => ({
  geminiService: {
    generateIPChange: vi.fn(),
    generateSketchToReal: vi.fn(),
    generateWithStyleCopy: vi.fn(),
  },
}));

vi.mock('../services/openai-image.service.js', () => ({
  openaiImageService: {
    generateIPChange: vi.fn(),
    generateSketchToReal: vi.fn(),
    generateStyleCopyWithLinkage: vi.fn(),
    generateStyleCopyFromImage: vi.fn(),
  },
}));

vi.mock('../services/background-removal.service.js', () => ({
  removeUniformLightBackground: vi.fn(),
}));

const { processGenerationJob } = await import('../worker.js');
const { adminService } = await import('../services/admin.service.js');
const { uploadService } = await import('../services/upload.service.js');
const { generationService } = await import('../services/generation.service.js');
const { geminiService } = await import('../services/gemini.service.js');
const { openaiImageService } = await import('../services/openai-image.service.js');

const twoImageResult = (label: string, trace: Record<string, unknown> = {}) => ({
  images: [Buffer.from(`${label}-1`), Buffer.from(`${label}-2`)],
  requestIds: [`req-${label}`],
  responseId: `resp-${label}`,
  imageCallIds: [`call-${label}-1`, `call-${label}-2`],
  revisedPrompt: `revised-${label}`,
  providerTrace: {
    provider: 'openai',
    model: 'gpt-image-2',
    endpoint: 'mock',
    externalRequestCount: 1,
    ...trace,
  },
});

const baseOptions: GenerationJobData['options'] = {
  preserveStructure: true,
  transparentBackground: false,
  preserveHardware: true,
  fixedBackground: true,
  fixedViewpoint: true,
  removeShadows: false,
  userInstructions: 'replace the target only',
  quality: 'high',
  outputCount: 2,
};

const baseOpenAIJob = (overrides: Partial<GenerationJobData> = {}): GenerationJobData => ({
  generationId: 'gen-openai-copy',
  userId: 'user-1',
  projectId: 'project-1',
  mode: 'ip_change',
  provider: 'openai',
  providerModel: 'gpt-image-2',
  styleReferenceId: 'style-ref-1',
  selectedImageId: 'style-img-2',
  copyTarget: 'ip-change',
  sourceImagePath: 'uploads/user-1/project-1/source.png',
  characterImagePath: 'characters/user-1/target.png',
  options: baseOptions,
  ...overrides,
});

const generationRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'gen-openai-copy',
  projectId: 'project-1',
  provider: 'openai',
  providerModel: 'gpt-image-2',
  mode: 'ip_change',
  images: [],
  ...overrides,
});

const openAIReference = (overrides: Record<string, unknown> = {}) => ({
  id: 'style-ref-1',
  projectId: 'project-1',
  provider: 'openai',
  providerModel: 'gpt-image-2',
  mode: 'ip_change',
  openaiResponseId: 'resp-style',
  openaiImageCallId: null,
  providerTrace: { workflow: 'ip_change', candidateCount: 2 },
  promptData: { userPrompt: 'original prompt' },
  thoughtSignatures: null,
  images: [
    {
      id: 'style-img-1',
      filePath: 'generations/user-1/project-1/style-ref-1/output_1.png',
      isSelected: false,
    },
    {
      id: 'style-img-2',
      filePath: 'generations/user-1/project-1/style-ref-1/output_2.png',
      isSelected: true,
    },
  ],
  ...overrides,
});

const mockGenerationLookup = (...records: Array<Record<string, unknown>>) => {
  vi.mocked(generationService.getById).mockImplementation(async (_userId, generationId) => {
    const record = records.find((item) => item.id === generationId);
    return (record ?? null) as never;
  });
};

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(adminService.getActiveApiKey).mockResolvedValue({
    id: 'api-key-1',
    provider: 'openai',
    key: 'openai-key',
  });
  vi.mocked(adminService.incrementCallCount).mockResolvedValue(undefined);
  vi.mocked(uploadService.readFile).mockImplementation(async (filePath) =>
    Buffer.from(`file:${filePath}`)
  );
  vi.mocked(uploadService.saveGeneratedImage).mockImplementation(
    async (_userId, _projectId, generationId, buffer, index) => ({
      filePath: `generations/user-1/project-1/${generationId}/output_${index + 1}.png`,
      thumbnailPath: null,
      metadata: { width: 1, height: 1, format: 'png', size: buffer.length },
    })
  );
  vi.mocked(generationService.updateStatus).mockResolvedValue(undefined);
  vi.mocked(generationService.updateOpenAIMetadata).mockResolvedValue(undefined);
  vi.mocked(generationService.deleteGeneratedOutputImages).mockResolvedValue(undefined);
  vi.mocked(generationService.saveGeneratedImage).mockResolvedValue({} as never);
  vi.mocked(generationService.updateThoughtSignatures).mockResolvedValue(undefined);
  vi.mocked(openaiImageService.generateIPChange).mockResolvedValue(twoImageResult('ip-change'));
  vi.mocked(openaiImageService.generateSketchToReal).mockResolvedValue(
    twoImageResult('sketch-to-real')
  );
  vi.mocked(openaiImageService.generateStyleCopyWithLinkage).mockResolvedValue(
    twoImageResult('style-linkage', { endpoint: 'responses.create' })
  );
  vi.mocked(openaiImageService.generateStyleCopyFromImage).mockResolvedValue(
    twoImageResult('style-fallback', { endpoint: 'images.edit' })
  );
});

describe('processGenerationJob provider continuation', () => {
  it('uses OpenAI linkage before selected-image fallback for style copy', async () => {
    const jobData = baseOpenAIJob();
    mockGenerationLookup(generationRecord(), openAIReference());

    const result = await processGenerationJob({ data: jobData });

    expect(result).toEqual({ success: true, imageCount: 2 });
    expect(openaiImageService.generateStyleCopyWithLinkage).toHaveBeenCalledWith(
      'openai-key',
      Buffer.from(`file:${jobData.characterImagePath}`).toString('base64'),
      expect.objectContaining({
        openaiResponseId: 'resp-style',
        openaiImageCallId: undefined,
        providerTrace: expect.objectContaining({ workflow: 'ip_change' }),
      }),
      expect.objectContaining({
        copyTarget: 'ip-change',
        quality: 'high',
        userInstructions: 'replace the target only',
      })
    );
    expect(openaiImageService.generateStyleCopyFromImage).not.toHaveBeenCalled();
    expect(uploadService.readFile).not.toHaveBeenCalledWith(
      'generations/user-1/project-1/style-ref-1/output_2.png'
    );
    expect(geminiService.generateWithStyleCopy).not.toHaveBeenCalled();
  });

  it('uses the selected candidate image call id when only persisted image-call linkage exists', async () => {
    const jobData = baseOpenAIJob();
    mockGenerationLookup(
      generationRecord(),
      openAIReference({
        openaiResponseId: null,
        openaiImageCallId: 'call-style-1,call-style-2',
        providerTrace: { workflow: 'ip_change', candidateCount: 2 },
      })
    );

    await processGenerationJob({ data: jobData });

    expect(openaiImageService.generateStyleCopyWithLinkage).toHaveBeenCalledWith(
      'openai-key',
      Buffer.from(`file:${jobData.characterImagePath}`).toString('base64'),
      expect.objectContaining({
        openaiResponseId: null,
        openaiImageCallId: 'call-style-2',
      }),
      expect.objectContaining({ copyTarget: 'ip-change' })
    );
    expect(
      JSON.stringify(vi.mocked(openaiImageService.generateStyleCopyWithLinkage).mock.calls[0][2])
    ).not.toContain('call-style-1,call-style-2');
  });

  it('falls back to selected style image when OpenAI linkage is missing', async () => {
    const jobData = baseOpenAIJob();
    mockGenerationLookup(
      generationRecord(),
      openAIReference({ openaiResponseId: null, openaiImageCallId: null })
    );

    await processGenerationJob({ data: jobData });

    expect(openaiImageService.generateStyleCopyWithLinkage).not.toHaveBeenCalled();
    expect(openaiImageService.generateStyleCopyFromImage).toHaveBeenCalledWith(
      'openai-key',
      Buffer.from('file:generations/user-1/project-1/style-ref-1/output_2.png').toString('base64'),
      Buffer.from(`file:${jobData.characterImagePath}`).toString('base64'),
      expect.objectContaining({ copyTarget: 'ip-change', quality: 'high' })
    );
    expect(geminiService.generateWithStyleCopy).not.toHaveBeenCalled();
  });

  it('falls back once to selected style image when OpenAI linkage is invalid_response', async () => {
    const jobData = baseOpenAIJob();
    mockGenerationLookup(generationRecord(), openAIReference());
    vi.mocked(openaiImageService.generateStyleCopyWithLinkage).mockRejectedValueOnce({
      status: 400,
      code: 'invalid_response',
      message: 'invalid_response: response cannot be used',
    });

    await processGenerationJob({ data: jobData });

    expect(openaiImageService.generateStyleCopyWithLinkage).toHaveBeenCalledTimes(1);
    expect(openaiImageService.generateStyleCopyFromImage).toHaveBeenCalledTimes(1);
    expect(generationService.updateOpenAIMetadata).toHaveBeenCalledWith(
      'gen-openai-copy',
      expect.objectContaining({
        providerTrace: expect.objectContaining({
          styleReferenceId: 'style-ref-1',
          styleSourceImageId: 'style-img-2',
          copyTarget: 'ip-change',
          linkageFallbackUsed: true,
          linkageFallbackReason: expect.stringContaining('invalid_response'),
        }),
      })
    );
    expect(adminService.incrementCallCount).toHaveBeenCalledWith('openai', 'api-key-1', 2);
  });

  it('does not fallback for OpenAI auth or permission linkage errors', async () => {
    const jobData = baseOpenAIJob();
    mockGenerationLookup(generationRecord(), openAIReference());
    vi.mocked(openaiImageService.generateStyleCopyWithLinkage).mockRejectedValueOnce({
      status: 401,
      code: 'authentication_error',
      message: 'authentication failed for this API key',
    });

    await expect(processGenerationJob({ data: jobData })).rejects.toMatchObject({
      status: 401,
      code: 'authentication_error',
    });

    expect(openaiImageService.generateStyleCopyFromImage).not.toHaveBeenCalled();
    expect(generationService.saveGeneratedImage).not.toHaveBeenCalled();
    expect(generationService.updateStatus).toHaveBeenLastCalledWith(
      'gen-openai-copy',
      'failed',
      'authentication failed for this API key'
    );
  });

  it('keeps Gemini thoughtSignature branch isolated from OpenAI style copy', async () => {
    const reference = {
      ...openAIReference(),
      get thoughtSignatures() {
        throw new Error('parseThoughtSignatures was used for OpenAI');
      },
    };
    mockGenerationLookup(generationRecord(), reference);

    await processGenerationJob({ data: baseOpenAIJob() });

    expect(openaiImageService.generateStyleCopyWithLinkage).toHaveBeenCalledTimes(1);
    expect(geminiService.generateWithStyleCopy).not.toHaveBeenCalled();
  });

  it('rejects queue provider mismatch before vendor calls', async () => {
    const jobData = baseOpenAIJob();
    mockGenerationLookup(generationRecord({ provider: 'gemini' }));

    await expect(processGenerationJob({ data: jobData })).rejects.toThrow(
      '저장된 provider와 큐 provider가 일치하지 않아 작업을 실행할 수 없습니다.'
    );

    expect(adminService.getActiveApiKey).not.toHaveBeenCalled();
    expect(openaiImageService.generateIPChange).not.toHaveBeenCalled();
    expect(openaiImageService.generateStyleCopyWithLinkage).not.toHaveBeenCalled();
    expect(geminiService.generateIPChange).not.toHaveBeenCalled();
    expect(geminiService.generateWithStyleCopy).not.toHaveBeenCalled();
  });

  it('preserves existing OpenAI ip_change and sketch_to_real worker dispatch after processGenerationJob export', async () => {
    mockGenerationLookup(
      generationRecord({ id: 'gen-ip', mode: 'ip_change' }),
      generationRecord({ id: 'gen-sketch', mode: 'sketch_to_real' })
    );

    await processGenerationJob({
      data: baseOpenAIJob({
        generationId: 'gen-ip',
        styleReferenceId: undefined,
        selectedImageId: undefined,
        copyTarget: undefined,
      }),
    });
    await processGenerationJob({
      data: baseOpenAIJob({
        generationId: 'gen-sketch',
        mode: 'sketch_to_real',
        styleReferenceId: undefined,
        selectedImageId: undefined,
        copyTarget: undefined,
        characterImagePath: undefined,
      }),
    });

    expect(openaiImageService.generateIPChange).toHaveBeenCalledTimes(1);
    expect(openaiImageService.generateSketchToReal).toHaveBeenCalledTimes(1);
    expect(openaiImageService.generateStyleCopyWithLinkage).not.toHaveBeenCalled();
    expect(geminiService.generateWithStyleCopy).not.toHaveBeenCalled();
  });
});
