import { z } from 'zod';

/**
 * 프롬프트 관리 모듈
 * v3 피드백 기반 개선 기능을 위한 프롬프트 템플릿 및 옵션별 지시어 관리
 */

// ============================================================================
// 타입 정의 및 Zod 스키마
// ============================================================================

/**
 * 생성 옵션 Zod 스키마
 * 이미지 생성 시 적용할 수 있는 옵션들을 정의
 */
export const GenerationOptionsSchema = z.object({
  /** 시점 고정: 원본 이미지의 카메라 앵글/시점 유지 */
  viewpointLock: z.boolean().default(false),
  /** 백색 배경: 그림자 없는 완전한 백색 배경 */
  whiteBackground: z.boolean().default(false),
  /** 부자재 보존: 지퍼, 키링 등 부자재 디테일 보존 */
  accessoryPreservation: z.boolean().default(false),
  /** 스타일 복사: 기존 결과물의 스타일 유지하며 캐릭터만 변경 */
  styleCopy: z.boolean().default(false),
  /** 사용자 지시사항: IP 변경 시 추가 지시 텍스트 */
  userInstructions: z.string().max(500).optional(),
});

/**
 * 생성 옵션 타입 (Zod 스키마에서 추론)
 */
export type GenerationOptions = z.infer<typeof GenerationOptionsSchema>;

/**
 * 프롬프트 조합 결과 타입
 */
export interface PromptResult {
  /** 조합된 최종 프롬프트 */
  prompt: string;
  /** 적용된 옵션 목록 */
  appliedOptions: string[];
}

// ============================================================================
// 프롬프트 상수 정의
// ============================================================================

/**
 * 시점 고정 프롬프트
 * PRD 명세에 따른 정확한 텍스트
 */
const VIEWPOINT_LOCK_PROMPTS = [
  'Keep the exact same camera angle, perspective, and viewpoint as the original image',
  'Do not change the product\'s orientation or angle',
] as const;

/**
 * 백색 배경 프롬프트
 * 투명 배경 대체, 그림자 없는 깨끗한 백색 배경
 */
const WHITE_BACKGROUND_PROMPTS = [
  'The background must be pure white with no shadows',
  'Clean, studio-lit product photograph on white background',
] as const;

/**
 * 부자재 보존 프롬프트
 * 스케치 실사화 시 지퍼, 키링 등 디테일 보존을 위한 Semantic Negative Prompt
 */
const ACCESSORY_PRESERVATION_PROMPTS = [
  'CRITICAL: Keep all accessories (zippers, key rings, buttons, buckles) exactly as shown in the original',
  'Preserve the exact colors and shapes of all hardware and decorative elements',
  'Do not modify, add, or remove any accessory details',
] as const;

/**
 * 스타일 복사 프롬프트 (레거시 - 하위 호환성 유지)
 * 기존 결과물의 질감, 부자재, 톤 유지
 * @deprecated buildStyleCopyPrompt() 사용 권장
 */
const STYLE_COPY_PROMPTS = [
  'Maintain the exact same material texture, color tone, and accessory details from the reference image',
  'Only change the character while preserving all other visual elements',
] as const;

/**
 * 스타일 복사 전용 시스템 프롬프트 (v3 개선)
 * Gemini API 공식 문서의 "Detail Preservation Pattern" 적용
 * 
 * 핵심 원칙:
 * 1. 각 이미지 역할을 명확히 지정 (Image 1, 2, 3)
 * 2. 보존할 요소를 구체적으로 나열
 * 3. 변경할 요소만 명확히 지정
 */
const STYLE_COPY_SYSTEM_PROMPT = `You are a product mockup expert specializing in style-consistent image generation.

CRITICAL TASK: Replace ONLY the character/IP on the product while keeping EVERYTHING else identical to Image 1.

IMAGE ROLES:
- Image 1 (STYLE REFERENCE): The target style you MUST copy exactly - this is the previously generated result
- Image 2 (SOURCE PRODUCT): The original product structure for reference
- Image 3 (NEW CHARACTER): The new character/IP to apply - ONLY use the character design from this image

MUST PRESERVE EXACTLY FROM IMAGE 1:
- Material texture and finish quality (matte, glossy, fabric weave pattern)
- Color tones, saturation, and lighting conditions
- ALL accessories with exact shapes and positions (key rings, chains, zippers, buckles, buttons, clasps)
- Product packaging style, labels, and decoration elements
- Shadow direction, intensity, and ambient lighting
- Camera angle and perspective
- Background style and color

MUST CHANGE (ONLY THIS):
- The character/illustration printed or applied on the product
- Use ONLY the character design from Image 3
- Maintain the same size, position, and orientation as the character in Image 1

ABSOLUTELY DO NOT MODIFY:
- Accessory shapes, colors, or positions (key ring chains must be identical)
- Hardware elements (zippers, buckles, buttons)
- Product material texture or finish
- Lighting or shadow direction
- Background or environment
- Product dimensions or proportions
- Any decorative elements besides the character

OUTPUT REQUIREMENTS:
- The result must be visually indistinguishable from Image 1 except for the character
- If someone compares Image 1 and your output, ONLY the character should be different
- All accessories, textures, and details must match Image 1 pixel-perfectly` as const;

// ============================================================================
// 개별 프롬프트 함수
// ============================================================================

/**
 * 시점 고정 프롬프트 반환
 * @param enabled - 옵션 활성화 여부
 * @returns 시점 고정 프롬프트 문자열 또는 빈 문자열
 */
export function getViewpointLockPrompt(enabled: boolean = true): string {
  if (!enabled) return '';
  return VIEWPOINT_LOCK_PROMPTS.join('. ') + '.';
}

/**
 * 백색 배경 프롬프트 반환
 * @param enabled - 옵션 활성화 여부
 * @returns 백색 배경 프롬프트 문자열 또는 빈 문자열
 */
export function getWhiteBackgroundPrompt(enabled: boolean = true): string {
  if (!enabled) return '';
  return WHITE_BACKGROUND_PROMPTS.join('. ') + '.';
}

/**
 * 부자재 보존 프롬프트 반환
 * @param enabled - 옵션 활성화 여부
 * @returns 부자재 보존 프롬프트 문자열 또는 빈 문자열
 */
export function getAccessoryPreservationPrompt(enabled: boolean = true): string {
  if (!enabled) return '';
  return ACCESSORY_PRESERVATION_PROMPTS.join('. ') + '.';
}

/**
 * 스타일 복사 프롬프트 반환 (레거시)
 * @param enabled - 옵션 활성화 여부
 * @returns 스타일 복사 프롬프트 문자열 또는 빈 문자열
 * @deprecated buildStyleCopyPrompt() 사용 권장
 */
export function getStyleCopyPrompt(enabled: boolean = true): string {
  if (!enabled) return '';
  return STYLE_COPY_PROMPTS.join('. ') + '.';
}

// ============================================================================
// 스타일 복사 전용 프롬프트 함수 (v3)
// ============================================================================

/**
 * 스타일 복사 전용 프롬프트 결과 타입
 */
export interface StyleCopyPromptResult {
  /** 시스템 프롬프트 (이미지 역할 설명 포함) */
  systemPrompt: string;
  /** 이미지 1 라벨 */
  image1Label: string;
  /** 이미지 2 라벨 */
  image2Label: string;
  /** 이미지 3 라벨 */
  image3Label: string;
  /** 최종 지시 프롬프트 */
  finalInstruction: string;
  /** 적용된 추가 옵션 */
  appliedOptions: string[];
}

/**
 * 스타일 복사 전용 프롬프트 생성 (v3)
 * 
 * Gemini API 공식 문서의 "Detail Preservation Pattern" 적용
 * 3개 이미지를 명확한 순서와 역할로 구성
 * 
 * @param options - 추가 생성 옵션 (viewpointLock, whiteBackground 등)
 * @returns 스타일 복사용 프롬프트 구조체
 * 
 * @example
 * const result = buildStyleCopyPrompt({ viewpointLock: true });
 * // result.systemPrompt: 전체 시스템 프롬프트
 * // result.image1Label: "Image 1 (STYLE REFERENCE):"
 */
export function buildStyleCopyPrompt(
  options?: Partial<GenerationOptions>
): StyleCopyPromptResult {
  const appliedOptions: string[] = ['styleCopy'];

  // 추가 옵션 프롬프트 조합
  const additionalPrompts: string[] = [];

  if (options?.viewpointLock) {
    additionalPrompts.push(getViewpointLockPrompt());
    appliedOptions.push('viewpointLock');
  }

  if (options?.whiteBackground) {
    additionalPrompts.push(getWhiteBackgroundPrompt());
    appliedOptions.push('whiteBackground');
  }

  if (options?.accessoryPreservation) {
    // 스타일 복사에서는 이미 부자재 보존이 기본이므로 강조만 추가
    additionalPrompts.push(
      'EXTRA EMPHASIS: Pay special attention to preserving ALL accessory details exactly as they appear in Image 1.'
    );
    appliedOptions.push('accessoryPreservation');
  }

  if (options?.userInstructions?.trim()) {
    additionalPrompts.push(`Additional user instructions: ${options.userInstructions.trim()}`);
    appliedOptions.push('userInstructions');
  }

  // 최종 지시 프롬프트 구성
  const finalInstruction = `Generate a new product mockup that:
1. Copies the EXACT style from Image 1 (all accessories, textures, colors, lighting)
2. Uses the product structure from Image 2 as reference
3. Features ONLY the character from Image 3
4. Changes NOTHING except the character - the result must be identical to Image 1 in all other aspects

${additionalPrompts.length > 0 ? '\nADDITIONAL REQUIREMENTS:\n' + additionalPrompts.join('\n') : ''}`;

  return {
    systemPrompt: STYLE_COPY_SYSTEM_PROMPT,
    image1Label: 'Image 1 (STYLE REFERENCE) - Copy this style exactly:',
    image2Label: 'Image 2 (SOURCE PRODUCT) - Original product structure:',
    image3Label: 'Image 3 (NEW CHARACTER) - Use only this character:',
    finalInstruction,
    appliedOptions,
  };
}

// ============================================================================
// 프롬프트 조합 함수
// ============================================================================

/**
 * 최종 프롬프트 조합
 * 옵션에 따라 활성화된 프롬프트들을 동적으로 조합
 *
 * @param options - 생성 옵션 객체
 * @returns 조합된 프롬프트와 적용된 옵션 목록
 * @throws 옵션 유효성 검사 실패 시 Zod 에러
 *
 * @example
 * const result = buildFinalPrompt({
 *   viewpointLock: true,
 *   whiteBackground: true,
 *   accessoryPreservation: false,
 *   styleCopy: false,
 * });
 * // result.prompt: "Keep the exact same camera angle..."
 * // result.appliedOptions: ['viewpointLock', 'whiteBackground']
 */
export function buildFinalPrompt(options: Partial<GenerationOptions>): PromptResult {
  // Zod 스키마로 옵션 검증 및 기본값 적용
  const validatedOptions = GenerationOptionsSchema.parse(options);

  const promptParts: string[] = [];
  const appliedOptions: string[] = [];

  // 시점 고정 프롬프트
  if (validatedOptions.viewpointLock) {
    promptParts.push(getViewpointLockPrompt());
    appliedOptions.push('viewpointLock');
  }

  // 백색 배경 프롬프트
  if (validatedOptions.whiteBackground) {
    promptParts.push(getWhiteBackgroundPrompt());
    appliedOptions.push('whiteBackground');
  }

  // 부자재 보존 프롬프트
  if (validatedOptions.accessoryPreservation) {
    promptParts.push(getAccessoryPreservationPrompt());
    appliedOptions.push('accessoryPreservation');
  }

  // 스타일 복사 프롬프트
  if (validatedOptions.styleCopy) {
    promptParts.push(getStyleCopyPrompt());
    appliedOptions.push('styleCopy');
  }

  // 사용자 지시사항 추가
  if (validatedOptions.userInstructions?.trim()) {
    promptParts.push(`Additional instructions: ${validatedOptions.userInstructions.trim()}`);
    appliedOptions.push('userInstructions');
  }

  return {
    prompt: promptParts.join('\n\n'),
    appliedOptions,
  };
}

/**
 * 안전한 프롬프트 조합 (에러 시 빈 결과 반환)
 * @param options - 생성 옵션 객체
 * @returns 조합된 프롬프트와 적용된 옵션 목록, 또는 에러 시 빈 결과
 */
export function buildFinalPromptSafe(
  options: Partial<GenerationOptions>
): PromptResult & { success: boolean; error?: string } {
  const result = GenerationOptionsSchema.safeParse(options);

  if (!result.success) {
    return {
      prompt: '',
      appliedOptions: [],
      success: false,
      error: result.error.message,
    };
  }

  const promptResult = buildFinalPrompt(result.data);
  return {
    ...promptResult,
    success: true,
  };
}
