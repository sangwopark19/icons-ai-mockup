import OpenAI, { toFile } from 'openai';
import type { HardwareSpec } from '@mockup-ai/shared/types';

export type OpenAIQuality = 'low' | 'medium' | 'high';

export interface OpenAIIPChangeOptions {
  preserveStructure: boolean;
  transparentBackground: boolean;
  preserveHardware?: boolean;
  fixedBackground?: boolean;
  fixedViewpoint?: boolean;
  removeShadows?: boolean;
  userInstructions?: string;
  hardwareSpecInput?: string;
  hardwareSpecs?: HardwareSpec;
  quality?: OpenAIQuality;
  prompt?: string;
}

export interface OpenAIImageGenerationResult {
  images: Buffer[];
  requestIds: string[];
  responseId?: string;
  imageCallIds: string[];
  revisedPrompt?: string;
  providerTrace: Record<string, unknown>;
}

interface OpenAIImageResponse {
  _request_id?: string;
  id?: string;
  data?: Array<{
    b64_json?: string;
    revised_prompt?: string;
    id?: string;
    call_id?: string;
  }>;
}

export class OpenAIImageService {
  private readonly model = 'gpt-image-2';

  async generateIPChange(
    apiKey: string,
    sourceImageBase64: string,
    characterImageBase64: string,
    options: OpenAIIPChangeOptions
  ): Promise<OpenAIImageGenerationResult> {
    const client = new OpenAI({
      apiKey,
      maxRetries: 2,
      timeout: 60_000,
    });
    const prompt = this.buildIPChangePrompt(options);
    const quality = options.quality ?? 'medium';
    const images: Buffer[] = [];
    const requestIds: string[] = [];
    const imageCallIds: string[] = [];
    const responseIds: string[] = [];
    const revisedPrompts: string[] = [];
    const calls: Array<Record<string, unknown>> = [];
    const sourceBuffer = this.decodeBase64Image(sourceImageBase64);
    const characterBuffer = this.decodeBase64Image(characterImageBase64);
    const sourceMimeType = this.detectMimeType(sourceBuffer);
    const characterMimeType = this.detectMimeType(characterBuffer);

    for (let index = 0; index < 2; index++) {
      const sourceImage = await toFile(
        sourceBuffer,
        `source-product-${index + 1}.${this.extensionForMimeType(sourceMimeType)}`,
        { type: sourceMimeType }
      );
      const characterImage = await toFile(
        characterBuffer,
        `character-reference-${index + 1}.${this.extensionForMimeType(characterMimeType)}`,
        { type: characterMimeType }
      );

      const response = (await client.images.edit({
        model: this.model,
        image: [sourceImage, characterImage],
        prompt,
        quality,
        n: 1,
        size: '1024x1024',
        output_format: 'png',
      })) as OpenAIImageResponse;

      const image = response.data?.[0];
      if (!image?.b64_json) {
        throw new Error('OpenAI IP 변경 결과 이미지가 없습니다');
      }

      images.push(Buffer.from(image.b64_json, 'base64'));

      if (response._request_id) requestIds.push(response._request_id);
      if (response.id) responseIds.push(response.id);
      if (image.id) imageCallIds.push(image.id);
      if (image.call_id) imageCallIds.push(image.call_id);
      if (image.revised_prompt) revisedPrompts.push(image.revised_prompt);

      calls.push({
        index: index + 1,
        requestId: response._request_id ?? null,
        responseId: response.id ?? null,
        imageCallId: image.id ?? image.call_id ?? null,
        revisedPrompt: image.revised_prompt ?? null,
      });
    }

    return {
      images,
      requestIds,
      responseId: responseIds[0],
      imageCallIds,
      revisedPrompt: revisedPrompts[0],
      providerTrace: {
        provider: 'openai',
        model: this.model,
        endpoint: 'images.edit',
        quality,
        outputCount: images.length,
        calls,
      },
    };
  }

  buildIPChangePrompt(options: OpenAIIPChangeOptions): string {
    const preserveRules = [
      'Preserve product geometry, dimensions, crop, camera viewpoint, perspective, material, lighting, hardware, label placement, non-character text, and non-target areas.',
      'Preserve Image 2 character silhouette, proportions, face details, colors, and recognizable motifs.',
    ];

    if (options.preserveStructure) {
      preserveRules.push(
        'Preserve product geometry, crop, viewpoint, proportions, and all physical construction exactly.'
      );
    }

    if (options.fixedViewpoint) {
      preserveRules.push('Use the same camera angle, lens feel, crop, and perspective as Image 1.');
    }

    if (options.fixedBackground) {
      preserveRules.push('Use a plain pure white opaque background (#ffffff).');
    }

    if (options.removeShadows) {
      preserveRules.push('Remove cast shadows and drop shadows; keep necessary form shading only.');
    }

    if (options.preserveHardware) {
      preserveRules.push(this.buildHardwarePrompt(options));
    }

    const userInstruction = options.userInstructions?.trim();
    const extraPrompt = options.prompt?.trim();

    return `Task:
Edit Image 1 by replacing only the existing character/IP artwork with the character from Image 2.

Image roles:
- Image 1: source product photo. Preserve the product body, camera angle, material, hardware, lighting, label placement, and product silhouette.
- Image 2: new character IP reference. Preserve this character's silhouette, proportions, facial features, colors, and recognizable details.

Must change:
- Replace the character/IP artwork on Image 1 with the character from Image 2.
- Integrate it as a real product decoration, print, patch, charm, figure, or surface treatment according to the source product.

Must preserve:
${preserveRules.map((rule) => `- ${rule}`).join('\n')}

Hard constraints:
- Do not add extra characters, logos, watermark, text, props, accessories, or decorative effects.
- Do not redesign the product body.
- Do not change hardware color, position, size, or shape.
- Do not alter saturation, contrast, camera angle, or surrounding objects unless explicitly requested.
- If transparent output was requested, still generate an opaque clean product-review image first.

${
  userInstruction || extraPrompt
    ? `Highest priority user instruction:
${[userInstruction, extraPrompt].filter(Boolean).join('\n')}`
    : ''
}

Output:
- Production-quality product mockup suitable for internal design review.`;
  }

  private decodeBase64Image(value: string): Buffer {
    const normalized = value.includes(',') ? value.split(',').pop() || value : value;
    return Buffer.from(normalized, 'base64');
  }

  private detectMimeType(buffer: Buffer): 'image/png' | 'image/jpeg' | 'image/webp' {
    if (
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return 'image/png';
    }

    if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
      return 'image/jpeg';
    }

    if (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'image/webp';
    }

    throw new Error('지원하지 않는 이미지 형식입니다');
  }

  private extensionForMimeType(mimeType: 'image/png' | 'image/jpeg' | 'image/webp'): string {
    if (mimeType === 'image/jpeg') return 'jpg';
    if (mimeType === 'image/webp') return 'webp';
    return 'png';
  }

  private buildHardwarePrompt(options: OpenAIIPChangeOptions): string {
    const details = options.hardwareSpecs?.items?.length
      ? options.hardwareSpecs.items
          .map((item, index) => {
            const attributes = [item.material, item.color, item.position, item.size]
              .map((value) => value?.trim())
              .filter(Boolean)
              .join(', ');
            return `${index + 1}. ${item.type}: ${attributes || 'details unspecified'}`;
          })
          .join('; ')
      : options.hardwareSpecInput?.trim();

    return details
      ? `Preserve hardware exactly: ${details}.`
      : 'Preserve all hardware material, color, position, size, and shape exactly.';
  }
}

export const openaiImageService = new OpenAIImageService();
