import { GoogleGenAI } from '@google/genai';
import { config } from '../config/index.js';

/**
 * 생성 옵션 타입
 */
interface GenerationOptions {
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
   * IP 변경 목업 생성
   */
  async generateIPChange(
    sourceImageBase64: string,
    characterImageBase64: string,
    options: GenerationOptions
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
   */
  async generateSketchToReal(
    sketchImageBase64: string,
    textureImageBase64: string | null,
    options: GenerationOptions
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
   * IP 변경 프롬프트 생성
   */
  private buildIPChangePrompt(options: GenerationOptions): string {
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
   * 스케치 실사화 프롬프트 생성
   */
  private buildSketchToRealPrompt(options: GenerationOptions): string {
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
