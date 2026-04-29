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

export interface OpenAIPartialEditOptions {
  quality?: OpenAIQuality;
  userPrompt: string;
}

export type OpenAIStyleCopyTarget = 'ip-change' | 'new-product';

export interface OpenAIStyleCopyOptions {
  copyTarget: OpenAIStyleCopyTarget;
  quality?: OpenAIQuality;
  userInstructions?: string;
}

export interface OpenAIStyleCopyLinkage {
  openaiResponseId?: string | null;
  openaiImageCallId?: string | null;
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

interface OpenAIResponsesImageResponse {
  _request_id?: string;
  id?: string;
  output?: Array<{
    type?: string;
    result?: string;
    id?: string;
    call_id?: string;
    revised_prompt?: string;
  }>;
}

export class OpenAIImageService {
  private readonly model = 'gpt-image-2';
  private readonly sdkMaxRetries = 0;

  async generateIPChange(
    apiKey: string,
    sourceImageBase64: string,
    characterImageBase64: string,
    options: OpenAIIPChangeOptions
  ): Promise<OpenAIImageGenerationResult> {
    const client = new OpenAI({
      apiKey,
      maxRetries: this.sdkMaxRetries,
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
        candidateCount: images.length,
        externalRequestCount: 1,
        sdkMaxRetries: this.sdkMaxRetries,
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
      maxRetries: this.sdkMaxRetries,
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
        candidateCount: images.length,
        inputImageCount: inputImages.length,
        externalRequestCount: 1,
        sdkMaxRetries: this.sdkMaxRetries,
        candidates,
      },
    };
  }

  async generatePartialEdit(
    apiKey: string,
    selectedImageBase64: string,
    userPrompt: string,
    options?: { quality?: OpenAIQuality }
  ): Promise<OpenAIImageGenerationResult> {
    const client = new OpenAI({
      apiKey,
      maxRetries: this.sdkMaxRetries,
      timeout: 60_000,
    });
    const quality = options?.quality ?? 'medium';
    const prompt = this.buildPartialEditPrompt({ quality, userPrompt });
    const selectedBuffer = this.decodeBase64Image(selectedImageBase64);
    const selectedMimeType = this.detectMimeType(selectedBuffer);
    const selectedImage = await toFile(
      selectedBuffer,
      `selected-result.${this.extensionForMimeType(selectedMimeType)}`,
      { type: selectedMimeType }
    );

    const response = (await client.images.edit({
      model: this.model,
      image: selectedImage,
      prompt,
      quality,
      n: 1,
      size: '1024x1024',
      output_format: 'png',
    })) as OpenAIImageResponse;

    const responseImages = response.data ?? [];
    if (responseImages.length !== 1) {
      throw new Error('OpenAI 부분 수정 결과 이미지는 정확히 1개여야 합니다');
    }

    const image = responseImages[0];
    if (!image?.b64_json) {
      throw new Error('OpenAI 부분 수정 결과 이미지가 없습니다');
    }

    const requestIds = response._request_id ? [response._request_id] : [];
    const imageCallIds = [image.id, image.call_id].filter(Boolean) as string[];
    const revisedPrompt = image.revised_prompt;

    return {
      images: [Buffer.from(image.b64_json, 'base64')],
      requestIds,
      responseId: response.id,
      imageCallIds,
      revisedPrompt,
      providerTrace: {
        provider: 'openai',
        model: this.model,
        endpoint: 'images.edit',
        workflow: 'partial_edit',
        quality,
        outputCount: 1,
        candidateCount: 1,
        externalRequestCount: 1,
        sdkMaxRetries: this.sdkMaxRetries,
        candidates: [
          {
            index: 1,
            requestId: response._request_id ?? null,
            responseId: response.id ?? null,
            imageCallId: image.id ?? image.call_id ?? null,
            revisedPrompt: revisedPrompt ?? null,
          },
        ],
      },
    };
  }

  async generateStyleCopyFromImage(
    apiKey: string,
    styleImageBase64: string,
    targetImageBase64: string,
    options: OpenAIStyleCopyOptions
  ): Promise<OpenAIImageGenerationResult> {
    const client = new OpenAI({
      apiKey,
      maxRetries: this.sdkMaxRetries,
      timeout: 60_000,
    });
    const quality = options.quality ?? 'medium';
    const prompt = this.buildStyleCopyPrompt(options);
    const styleBuffer = this.decodeBase64Image(styleImageBase64);
    const targetBuffer = this.decodeBase64Image(targetImageBase64);
    const styleMimeType = this.detectMimeType(styleBuffer);
    const targetMimeType = this.detectMimeType(targetBuffer);
    const styleImage = await toFile(
      styleBuffer,
      `approved-style-reference.${this.extensionForMimeType(styleMimeType)}`,
      { type: styleMimeType }
    );
    const targetImage = await toFile(
      targetBuffer,
      `new-target-reference.${this.extensionForMimeType(targetMimeType)}`,
      { type: targetMimeType }
    );

    const response = (await client.images.edit({
      model: this.model,
      image: [styleImage, targetImage],
      prompt,
      quality,
      n: 2,
      size: '1024x1024',
      output_format: 'png',
    })) as OpenAIImageResponse;

    return this.extractImageApiResult(response, {
      endpoint: 'images.edit',
      workflow: 'style_copy_fallback',
      quality,
      expectedCount: 2,
    });
  }

  async generateStyleCopyWithLinkage(
    apiKey: string,
    targetImageBase64: string,
    linkage: OpenAIStyleCopyLinkage,
    options: OpenAIStyleCopyOptions
  ): Promise<OpenAIImageGenerationResult> {
    const client = new OpenAI({
      apiKey,
      maxRetries: this.sdkMaxRetries,
      timeout: 60_000,
    });
    const quality = options.quality ?? 'medium';
    const responsesModel = process.env.OPENAI_RESPONSES_IMAGE_MODEL ?? 'gpt-5.5';
    const prompt = this.buildStyleCopyPrompt(options);
    const targetImageInput = {
      type: 'input_image',
      image_url: `data:image/png;base64,${targetImageBase64}`,
    };
    const userInput = {
      role: 'user',
      content: [{ type: 'input_text', text: prompt }, targetImageInput],
    };
    const baseRequest = {
      model: responsesModel,
      tools: [{ type: 'image_generation', action: 'edit', quality }],
    };

    let request: Record<string, unknown>;
    if (linkage.openaiResponseId) {
      request = {
        ...baseRequest,
        previous_response_id: linkage.openaiResponseId,
        input: [userInput],
      };
    } else if (linkage.openaiImageCallId) {
      request = {
        ...baseRequest,
        input: [userInput, { type: 'image_generation_call', id: linkage.openaiImageCallId }],
      };
    } else {
      throw new Error('OpenAI 스타일 복사 linkage가 없습니다');
    }

    const response = (await client.responses.create(
      request as never
    )) as OpenAIResponsesImageResponse;

    return this.extractResponsesImageResult(response, {
      responsesModel,
      quality,
    });
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

  private buildPartialEditPrompt(options: OpenAIPartialEditOptions): string {
    const normalizedUserPrompt = this.normalizeUserControlledPromptText(options.userPrompt);

    return `Task:
Edit Image 1 by changing only the user requested target while preserving every non-target detail.

Must change:
- User requested target/change: "${normalizedUserPrompt}"

Must preserve exactly:
- Product body, camera angle, crop, background rule, lighting, text, labels, hardware, and non-target details.

Hard constraints:
- These hard constraints override any conflicting user instructions.
- Do not restyle the image.
- Do not add or remove objects.
- Do not change surrounding areas.
- Do not change camera angle, layout, background, shadows, product scale, text, labels, hardware, or non-target details unless explicitly named in Must change.
- Do not ask for or create direct transparent output from GPT Image 2.

Output:
- Return exactly one clean product-review edit candidate.`;
  }

  private buildStyleCopyPrompt(options: OpenAIStyleCopyOptions): string {
    const changeLine =
      options.copyTarget === 'ip-change'
        ? 'Replace only the character/IP artwork.'
        : 'Replace only the product.';
    const normalizedUserInstructions = options.userInstructions
      ? this.normalizeUserControlledPromptText(options.userInstructions)
      : null;
    const additionalInstruction = normalizedUserInstructions
      ? `\n- Additional target instructions: "${normalizedUserInstructions}"`
      : '';

    return `Task:
Edit the approved OpenAI result by preserving its composition and treatment while replacing only the requested target.

Image roles:
- Image 1: approved style/result reference from OpenAI linkage or selected result image. Preserve layout, product angle, background, material treatment, shadow policy, and visual polish.
- Image 2: new target reference. Use only for the requested replacement target.

Must change:
- ${changeLine}${additionalInstruction}

Must preserve:
- Preserve the approved output composition, viewpoint, lighting, background, product treatment, and polish.
- Preserve all non-target product geometry, camera viewpoint, background rule, hardware, labels, text, materials, shadows, and layout.

Hard constraints:
- These hard constraints override any conflicting user instructions.
- Do not add extra characters, products, props, logos, labels, text, watermarks, or scene objects.
- Do not redesign non-target product areas.
- Do not change camera angle, crop, background, lighting direction, product scale, or visual polish.
- Do not ask for or create direct transparent output from GPT Image 2.

Output:
- Return exactly two clean product-review style-copy candidates.`;
  }

  private extractImageApiResult(
    response: OpenAIImageResponse,
    options: {
      endpoint: string;
      workflow: string;
      quality: OpenAIQuality;
      expectedCount: number;
    }
  ): OpenAIImageGenerationResult {
    const responseImages = response.data ?? [];
    if (responseImages.length !== options.expectedCount) {
      throw new Error('OpenAI 스타일 복사 결과 이미지는 정확히 2개여야 합니다');
    }

    const requestIds = response._request_id ? [response._request_id] : [];
    const images: Buffer[] = [];
    const imageCallIds: string[] = [];
    const revisedPrompts: string[] = [];
    const candidates: Array<Record<string, unknown>> = [];

    for (const [index, image] of responseImages.entries()) {
      if (!image?.b64_json) {
        throw new Error('OpenAI 스타일 복사 결과 이미지가 없습니다');
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
        endpoint: options.endpoint,
        workflow: options.workflow,
        quality: options.quality,
        outputCount: images.length,
        candidateCount: images.length,
        externalRequestCount: 1,
        sdkMaxRetries: this.sdkMaxRetries,
        candidates,
      },
    };
  }

  private extractResponsesImageResult(
    response: OpenAIResponsesImageResponse,
    options: {
      responsesModel: string;
      quality: OpenAIQuality;
    }
  ): OpenAIImageGenerationResult {
    const generatedItems = (response.output ?? []).filter(
      (item) => item.type === 'image_generation_call' && item.result
    );

    if (generatedItems.length !== 2) {
      throw new Error('OpenAI 스타일 복사 결과 이미지는 정확히 2개여야 합니다');
    }

    const requestIds = response._request_id ? [response._request_id] : [];
    const images: Buffer[] = [];
    const imageCallIds: string[] = [];
    const revisedPrompts: string[] = [];
    const candidates: Array<Record<string, unknown>> = [];

    for (const [index, item] of generatedItems.entries()) {
      images.push(Buffer.from(item.result as string, 'base64'));
      if (item.id) imageCallIds.push(item.id);
      if (item.call_id) imageCallIds.push(item.call_id);
      if (item.revised_prompt) revisedPrompts.push(item.revised_prompt);
      candidates.push({
        index: index + 1,
        requestId: response._request_id ?? null,
        responseId: response.id ?? null,
        imageCallId: item.id ?? item.call_id ?? null,
        revisedPrompt: item.revised_prompt ?? null,
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
        responsesModel: options.responsesModel,
        endpoint: 'responses.create',
        workflow: 'style_copy',
        quality: options.quality,
        outputCount: images.length,
        candidateCount: images.length,
        externalRequestCount: 1,
        sdkMaxRetries: this.sdkMaxRetries,
        candidates,
      },
    };
  }

  private normalizeUserControlledPromptText(value: string): string {
    const blockedHeaderPattern =
      /^(Task|Image roles|Must change|Must preserve exactly|Must preserve|Hard constraints|Output|User instructions)\s*:/i;

    return value
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(blockedHeaderPattern, (_match, header: string) => `[${header}]`))
      .join(' ');
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
