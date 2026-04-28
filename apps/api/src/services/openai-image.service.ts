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

export interface OpenAISketchToRealOptions {
  preserveStructure?: boolean;
  transparentBackground?: boolean;
  fixedBackground?: boolean;
  fixedViewpoint?: boolean;
  userInstructions?: string;
  productCategory?: string;
  productCategoryOther?: string;
  materialPreset?: string;
  materialOther?: string;
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
    const revisedPrompts: string[] = [];
    const candidates: Array<Record<string, unknown>> = [];
    const sourceBuffer = this.decodeBase64Image(sourceImageBase64);
    const characterBuffer = this.decodeBase64Image(characterImageBase64);
    const sourceMimeType = this.detectMimeType(sourceBuffer);
    const characterMimeType = this.detectMimeType(characterBuffer);

    const sourceImage = await toFile(
      sourceBuffer,
      `source-product.${this.extensionForMimeType(sourceMimeType)}`,
      { type: sourceMimeType }
    );
    const characterImage = await toFile(
      characterBuffer,
      `character-reference.${this.extensionForMimeType(characterMimeType)}`,
      { type: characterMimeType }
    );

    const response = (await client.images.edit({
      model: this.model,
      image: [sourceImage, characterImage],
      prompt,
      quality,
      n: 2,
      size: '1024x1024',
      output_format: 'png',
    })) as OpenAIImageResponse;

    const responseImages = response.data ?? [];
    if (responseImages.length < 2) {
      throw new Error('OpenAI IP 변경 결과 이미지가 부족합니다');
    }

    if (response._request_id) requestIds.push(response._request_id);

    for (const [index, image] of responseImages.slice(0, 2).entries()) {
      if (!image?.b64_json) {
        throw new Error('OpenAI IP 변경 결과 이미지가 없습니다');
      }

      images.push(Buffer.from(image.b64_json, 'base64'));

      if (image.id) imageCallIds.push(image.id);
      if (image.call_id) imageCallIds.push(image.call_id);
      if (image.revised_prompt) revisedPrompts.push(image.revised_prompt);

      candidates.push({
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
      responseId: response.id,
      imageCallIds,
      revisedPrompt: revisedPrompts[0],
      providerTrace: {
        provider: 'openai',
        model: this.model,
        endpoint: 'images.edit',
        quality,
        outputCount: images.length,
        externalRequestCount: 1,
        candidates,
      },
    };
  }

  async generateSketchToReal(
    apiKey: string,
    sketchImageBase64: string,
    textureImageBase64OrNull: string | null,
    options: OpenAISketchToRealOptions
  ): Promise<OpenAIImageGenerationResult> {
    const client = new OpenAI({
      apiKey,
      maxRetries: 2,
      timeout: 60_000,
    });
    const prompt = this.buildSketchToRealPrompt(options);
    const quality = options.quality ?? 'medium';
    const images: Buffer[] = [];
    const requestIds: string[] = [];
    const imageCallIds: string[] = [];
    const revisedPrompts: string[] = [];
    const candidates: Array<Record<string, unknown>> = [];
    const sketchBuffer = this.decodeBase64Image(sketchImageBase64);
    const sketchMimeType = this.detectMimeType(sketchBuffer);
    const sketchImage = await toFile(
      sketchBuffer,
      `designer-sketch.${this.extensionForMimeType(sketchMimeType)}`,
      { type: sketchMimeType }
    );
    const inputImages = [sketchImage];

    if (textureImageBase64OrNull) {
      const textureBuffer = this.decodeBase64Image(textureImageBase64OrNull);
      const textureMimeType = this.detectMimeType(textureBuffer);
      const textureImage = await toFile(
        textureBuffer,
        `material-texture-reference.${this.extensionForMimeType(textureMimeType)}`,
        { type: textureMimeType }
      );
      inputImages.push(textureImage);
    }

    const response = (await client.images.edit({
      model: this.model,
      image: inputImages,
      prompt,
      quality,
      n: 2,
      size: '1024x1024',
      output_format: 'png',
    })) as OpenAIImageResponse;

    const responseImages = response.data ?? [];
    if (responseImages.length < 2) {
      throw new Error('OpenAI 스케치 실사화 결과 이미지가 부족합니다');
    }

    if (response._request_id) requestIds.push(response._request_id);

    for (const [index, image] of responseImages.slice(0, 2).entries()) {
      if (!image?.b64_json) {
        throw new Error('OpenAI 스케치 실사화 결과 이미지가 없습니다');
      }

      images.push(Buffer.from(image.b64_json, 'base64'));

      if (image.id) imageCallIds.push(image.id);
      if (image.call_id) imageCallIds.push(image.call_id);
      if (image.revised_prompt) revisedPrompts.push(image.revised_prompt);

      candidates.push({
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
      responseId: response.id,
      imageCallIds,
      revisedPrompt: revisedPrompts[0],
      providerTrace: {
        provider: 'openai',
        model: this.model,
        endpoint: 'images.edit',
        workflow: 'sketch_to_real',
        quality,
        outputCount: images.length,
        inputImageCount: inputImages.length,
        externalRequestCount: 1,
        candidates,
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

  buildSketchToRealPrompt(options: OpenAISketchToRealOptions): string {
    const category = [options.productCategory, options.productCategoryOther]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' / ');
    const material = [options.materialPreset, options.materialOther]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(' / ');
    const userContent = [options.userInstructions?.trim(), options.prompt?.trim()]
      .filter(Boolean)
      .join('\n');
    const preserveRules = [
      'Preserve exact layout, silhouette, proportions, face details, product construction, and perspective from Image 1.',
      'Preserve all designed contours, handle/rim/base positions, product category cues, physical construction, and camera viewpoint from Image 1.',
    ];

    if (options.preserveStructure) {
      preserveRules.push('Keep the sketch structure locked; do not simplify or redesign the form.');
    }

    if (options.fixedViewpoint) {
      preserveRules.push('Use the same camera angle, crop, lens feel, and perspective as Image 1.');
    }

    const outputRules = [
      'Return exactly two clean product-review mockup candidates.',
      options.fixedBackground
        ? 'Use a clean opaque light product-review background without scene objects.'
        : 'Keep the presentation clean, neutral, and product-review focused.',
    ];

    if (options.transparentBackground) {
      outputRules.push(
        'For transparent-background requests, generate an opaque image on a clean uniform light/near-white product-review background suitable for local background removal.'
      );
    }

    return `Task:
Edit Image 1 into a photorealistic product mockup.

Image roles:
- Image 1: designer sketch. Treat it as the locked design spec.
- Image 2, optional: material/texture reference. Apply only the material, texture, finish, and color behavior from this image.
- Image 2 is not a style reference, scene reference, product-shape reference, character reference, logo reference, or text reference.

Product category:
- ${category || 'Not specified. Derive product structure from Image 1, the requested prompt, and normal product construction only.'}
- Product category and Image 1 control product structure. Texture reference never changes the product shape.

Material guidance:
- ${material || 'No explicit material preset. Infer suitable manufacturing material from the product category, Image 1, and prompt.'}
- If Image 2 is present, it takes priority only for material, texture, finish, and color behavior.
- If Image 2 is absent, infer a believable material such as ceramic, plastic, fabric, acrylic, resin, vinyl, rubber, metal, or transparent material.

Must preserve:
${preserveRules.map((rule) => `- ${rule}`).join('\n')}

Must add:
- Add only photorealistic material, lighting, surface finish, form shading, stitching, molded edges, glaze, or manufacturing detail appropriate to the product category.
- Convert the sketch into a believable manufactured product while keeping every core design detail locked.

User instructions:
${userContent ? `- Apply only if it does not conflict with Must preserve or the hard constraints below:\n${userContent}` : '- None provided.'}

Hard constraints:
- These hard constraints override any conflicting user instructions.
- Do not add new characters, text, logos, decorations, props, background objects, or scene staging.
- Do not import product shape, scene, logos, text, props, or character details from Image 2.
- Do not import pattern placement, background, props, or decorative layout from Image 2.
- Do not change form, proportions, face details, product construction, camera perspective, or product category.
- Do not ask for or create direct transparent output from GPT Image 2.

Output:
${outputRules.map((rule) => `- ${rule}`).join('\n')}`;
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
