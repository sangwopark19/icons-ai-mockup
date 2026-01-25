import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';
import { GenerationOptions, buildFinalPrompt, buildStyleCopyPrompt } from '../lib/prompts.js';

/**
 * 레거시 생성 옵션 타입 (하위 호환성 유지)
 * @deprecated v3 GenerationOptions 사용 권장
 */
interface LegacyGenerationOptions {
  preserveStructure: boolean;
  transparentBackground: boolean;
  prompt?: string;
}

/**
 * Gemini API 서비스
 * @google/genai SDK 사용 (가이드 준수)
 */
export class GeminiService {
  private readonly ai: GoogleGenAI;
  // 고품질 이미지 생성용 모델 (Nano Banana Pro)
  private readonly imageModel = 'gemini-3-pro-image-preview';

  constructor() {
    const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY가 설정되지 않았습니다');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * 통합 이미지 생성 함수 (v3)
   * 옵션별 프롬프트를 동적으로 적용하여 Gemini API 호출
   * 
   * @param basePrompt - 기본 프롬프트 (시스템 프롬프트)
   * @param options - v3 생성 옵션 (viewpointLock, whiteBackground 등)
   * @param referenceImages - 참조 이미지 배열 (base64, 최대 14개)
   * @param chatHistory - Multi-turn Chat을 위한 대화 히스토리
   * @returns 생성된 이미지 Buffer 배열
   */
  async generateImage(
    basePrompt: string,
    options?: Partial<GenerationOptions>,
    referenceImages?: string[],
    chatHistory?: Array<{ role: 'user' | 'model'; parts: any[] }>
  ): Promise<Buffer[]> {
    // 1. 옵션별 프롬프트 생성
    const { prompt: optionsPrompt, appliedOptions } = buildFinalPrompt(options || {});
    
    // 2. 최종 프롬프트 조합
    const finalPrompt = [basePrompt, optionsPrompt]
      .filter(p => p.trim().length > 0)
      .join('\n\n');

    console.log(`📝 적용된 옵션: ${appliedOptions.join(', ') || '없음'}`);

    // 3. 참조 이미지 처리 (최대 14개 제한)
    const validReferenceImages = (referenceImages || []).slice(0, 14);
    if (referenceImages && referenceImages.length > 14) {
      console.warn(`⚠️ 참조 이미지가 ${referenceImages.length}개 제공되었으나 최대 14개만 사용됩니다.`);
    }

    // 4. parts 배열 구성
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: finalPrompt }
    ];

    // 참조 이미지 추가
    validReferenceImages.forEach((imageBase64, index) => {
      if (index > 0) {
        parts.push({ text: `참조 이미지 ${index + 1}:` });
      }
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: imageBase64,
        },
      });
    });

    // 5. Gemini API 호출 (Multi-turn Chat 또는 일반 생성)
    const images: Buffer[] = [];
    const outputCount = 2;

    // Multi-turn Chat 모드 (스타일 복사 시나리오)
    if (chatHistory && chatHistory.length > 0) {
      console.log(`🔄 Multi-turn Chat 모드: ${chatHistory.length}개 히스토리 사용`);
      
      const chat = this.ai.chats.create({ model: this.imageModel });
      
      try {
        // 대화 히스토리를 Chat 세션에 반영
        // Gemini API는 chat.sendMessage로 순차적으로 전송
        for (const historyItem of chatHistory) {
          await chat.sendMessage({
            message: historyItem.parts,
          });
        }

        // 현재 요청 전송
        const response = await chat.sendMessage({
          message: parts,
        });

        const extractedImages = this.extractImagesFromResponse(response);
        images.push(...extractedImages);

        // Chat 모드에서는 1회만 생성 (대화 컨텍스트 유지를 위해)
        if (images.length === 0) {
          throw new Error('Chat 모드 이미지 생성에 실패했습니다');
        }

        return images;
      } catch (error) {
        console.error('Chat 모드 이미지 생성 실패:', error);
        throw new Error('Chat 모드 이미지 생성에 실패했습니다');
      }
    }

    // 일반 생성 모드 (Stateless)
    for (let i = 0; i < outputCount; i++) {
      try {
        const response = await this.ai.models.generateContent({
          model: this.imageModel,
          contents: [
            {
              role: 'user',
              parts,
            },
          ],
          config: {
            imageConfig: {
              aspectRatio: '1:1',
              imageSize: '2K',
            },
          },
        });

        const extractedImages = this.extractImagesFromResponse(response);
        images.push(...extractedImages);
      } catch (error) {
        console.error(`이미지 생성 ${i + 1} 실패:`, error);
      }
    }

    if (images.length === 0) {
      throw new Error('이미지 생성에 실패했습니다');
    }

    return images;
  }

  /**
   * IP 변경 목업 생성
   * @deprecated 내부적으로 generateImage() 사용 권장
   */
  async generateIPChange(
    sourceImageBase64: string,
    characterImageBase64: string,
    options: LegacyGenerationOptions
  ): Promise<Buffer[]> {
    const systemPrompt = this.buildIPChangePrompt(options);

    // 이미지 생성 요청 (가이드에 따른 구조)
    const images: Buffer[] = [];
    const outputCount = 2;

    for (let i = 0; i < outputCount; i++) {
      try {
        const response = await this.ai.models.generateContent({
          model: this.imageModel,
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemPrompt },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: sourceImageBase64,
                  },
                },
                { text: '이 제품의 캐릭터를 아래 캐릭터로 변경해주세요:' },
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: characterImageBase64,
                  },
                },
              ],
            },
          ],
          config: {
            // 고품질 이미지 설정
            imageConfig: {
              aspectRatio: '1:1',
              imageSize: '2K',
            },
          },
        });

        // 응답에서 이미지 추출
        const extractedImages = this.extractImagesFromResponse(response);
        images.push(...extractedImages);
      } catch (error) {
        console.error(`이미지 생성 ${i + 1} 실패:`, error);
      }
    }

    if (images.length === 0) {
      throw new Error('이미지 생성에 실패했습니다');
    }

    return images;
  }

  /**
   * 스케치 실사화 생성
   * @deprecated 내부적으로 generateImage() 사용 권장
   */
  async generateSketchToReal(
    sketchImageBase64: string,
    textureImageBase64: string | null,
    options: LegacyGenerationOptions
  ): Promise<Buffer[]> {
    const systemPrompt = this.buildSketchToRealPrompt(options);

    // 요청 파츠 구성
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      { text: systemPrompt },
      {
        inlineData: {
          mimeType: 'image/png',
          data: sketchImageBase64,
        },
      },
    ];

    if (textureImageBase64) {
      parts.push({ text: '참조할 질감 이미지:' });
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: textureImageBase64,
        },
      });
    }

    if (options.prompt) {
      parts.push({ text: `추가 지시사항: ${options.prompt}` });
    }

    const images: Buffer[] = [];
    const outputCount = 2;

    for (let i = 0; i < outputCount; i++) {
      try {
        const response = await this.ai.models.generateContent({
          model: this.imageModel,
          contents: [
            {
              role: 'user',
              parts,
            },
          ],
          config: {
            imageConfig: {
              aspectRatio: '1:1',
              imageSize: '2K',
            },
          },
        });

        const extractedImages = this.extractImagesFromResponse(response);
        images.push(...extractedImages);
      } catch (error) {
        console.error(`이미지 생성 ${i + 1} 실패:`, error);
      }
    }

    if (images.length === 0) {
      throw new Error('이미지 생성에 실패했습니다');
    }

    return images;
  }

  /**
   * 부분 수정 생성
   * 이미지 편집은 chat 모드 사용 권장 (가이드 참조)
   */
  async generateEdit(
    originalImageBase64: string,
    editPrompt: string
  ): Promise<Buffer[]> {
    const systemPrompt = `당신은 이미지 편집 전문가입니다.
주어진 이미지에서 사용자가 요청한 부분만 수정하고, 나머지는 절대 변경하지 마세요.
수정 요청: ${editPrompt}

중요 규칙:
- 요청된 부분만 수정
- 나머지 영역은 픽셀 단위로 동일하게 유지
- 전체적인 스타일과 조명 일관성 유지`;

    // 이미지 편집은 chat 모드 사용 (가이드 권장)
    const chat = this.ai.chats.create({ model: this.imageModel });

    try {
      const response = await chat.sendMessage({
        message: [
          { inlineData: { mimeType: 'image/png', data: originalImageBase64 } },
          systemPrompt,
        ],
      });

      const images = this.extractImagesFromResponse(response);

      if (images.length === 0) {
        throw new Error('이미지 편집에 실패했습니다');
      }

      return images;
    } catch (error) {
      console.error('이미지 편집 실패:', error);
      throw new Error('이미지 편집에 실패했습니다');
    }
  }

  /**
   * 스타일 복사 전용 이미지 생성 (v3)
   * 
   * Gemini API "Detail Preservation Pattern" 적용
   * 3개 이미지를 명확한 순서와 역할로 전달하여 스타일 일관성 보장
   * 
   * @param styleReferenceBase64 - 스타일 참조 이미지 (부모 Generation의 선택된 이미지)
   * @param sourceProductBase64 - 원본 제품 이미지
   * @param newCharacterBase64 - 새 캐릭터 이미지
   * @param options - 추가 생성 옵션 (viewpointLock, whiteBackground 등)
   * @param outputCount - 생성할 이미지 수 (기본값: 2)
   * @returns 생성된 이미지 Buffer 배열
   */
  async generateStyleCopy(
    styleReferenceBase64: string,
    sourceProductBase64: string,
    newCharacterBase64: string,
    options?: Partial<GenerationOptions>,
    outputCount: number = 2
  ): Promise<Buffer[]> {
    // 1. 스타일 복사 전용 프롬프트 생성
    const styleCopyPrompt = buildStyleCopyPrompt(options);
    
    console.log(`🎨 스타일 복사 모드: ${styleCopyPrompt.appliedOptions.join(', ')}`);

    // 2. parts 배열 구성 (Gemini API "Detail Preservation Pattern")
    // 각 이미지에 명확한 역할 라벨 부여
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
      // 시스템 프롬프트
      { text: styleCopyPrompt.systemPrompt },
      
      // Image 1: 스타일 참조 (부모 Generation 이미지)
      { text: styleCopyPrompt.image1Label },
      {
        inlineData: {
          mimeType: 'image/png',
          data: styleReferenceBase64,
        },
      },
      
      // Image 2: 원본 제품 구조
      { text: styleCopyPrompt.image2Label },
      {
        inlineData: {
          mimeType: 'image/png',
          data: sourceProductBase64,
        },
      },
      
      // Image 3: 새 캐릭터
      { text: styleCopyPrompt.image3Label },
      {
        inlineData: {
          mimeType: 'image/png',
          data: newCharacterBase64,
        },
      },
      
      // 최종 지시 프롬프트
      { text: styleCopyPrompt.finalInstruction },
    ];

    // 3. Gemini API 호출 (Stateless 모드 - 일관성을 위해)
    const images: Buffer[] = [];

    for (let i = 0; i < outputCount; i++) {
      try {
        console.log(`🖼️ 스타일 복사 이미지 생성 ${i + 1}/${outputCount}...`);
        
        const response = await this.ai.models.generateContent({
          model: this.imageModel,
          contents: [
            {
              role: 'user',
              parts,
            },
          ],
          config: {
            imageConfig: {
              aspectRatio: '1:1',
              imageSize: '2K',
            },
          },
        });

        const extractedImages = this.extractImagesFromResponse(response);
        images.push(...extractedImages);
        
        if (extractedImages.length > 0) {
          console.log(`✅ 스타일 복사 이미지 ${i + 1} 생성 완료`);
        }
      } catch (error) {
        console.error(`❌ 스타일 복사 이미지 생성 ${i + 1} 실패:`, error);
      }
    }

    if (images.length === 0) {
      throw new Error('스타일 복사 이미지 생성에 실패했습니다');
    }

    console.log(`🎉 스타일 복사 완료: ${images.length}개 이미지 생성`);
    return images;
  }

  /**
   * 응답에서 이미지 추출
   */
  private extractImagesFromResponse(response: any): Buffer[] {
    const images: Buffer[] = [];

    const candidates = response.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          const buffer = Buffer.from(part.inlineData.data, 'base64');
          images.push(buffer);
        }
      }
    }

    return images;
  }

  /**
   * IP 변경 프롬프트 생성 (레거시)
   * @deprecated
   */
  private buildIPChangePrompt(options: LegacyGenerationOptions): string {
    let prompt = `당신은 제품 목업 이미지 생성 전문가입니다.
주어진 제품 이미지에서 기존 캐릭터/IP를 새로운 캐릭터로 교체하여 실제 제품처럼 보이는 목업을 생성하세요.

핵심 요구사항:
1. 제품의 물리적 형태와 구조를 정확히 유지
2. 새 캐릭터의 비율과 실루엣을 변형 없이 적용
3. 원본 제품의 재질감과 조명을 유지
4. 캐릭터의 색상과 디테일을 정확히 재현`;

    if (options.preserveStructure) {
      prompt += '\n5. 원본 구조를 최우선으로 유지';
    }

    if (options.transparentBackground) {
      prompt += '\n6. 배경을 투명하게 처리 (PNG 투명 배경)';
    }

    return prompt;
  }

  /**
   * 스케치 실사화 프롬프트 생성 (레거시)
   * @deprecated
   */
  private buildSketchToRealPrompt(options: LegacyGenerationOptions): string {
    let prompt = `당신은 2D 스케치를 실제 제품 사진으로 변환하는 전문가입니다.
주어진 스케치를 실제 제품처럼 보이는 고품질 3D 렌더링으로 변환하세요.

핵심 요구사항:
1. 스케치의 형태와 비율을 정확히 유지
2. 실제 제품처럼 보이는 사실적인 재질감 적용
3. 자연스러운 조명과 그림자 추가
4. 제품 사진 수준의 고품질 출력`;

    if (options.transparentBackground) {
      prompt += '\n5. 배경을 투명하게 처리 (PNG 투명 배경)';
    }

    return prompt;
  }
}

export const geminiService = new GeminiService();
