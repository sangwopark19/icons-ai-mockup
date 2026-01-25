import { describe, it, expect } from 'vitest';
import {
  GenerationOptionsSchema,
  getViewpointLockPrompt,
  getWhiteBackgroundPrompt,
  getAccessoryPreservationPrompt,
  getStyleCopyPrompt,
  buildFinalPrompt,
  buildFinalPromptSafe,
  buildStyleCopyPrompt,
  type GenerationOptions,
  type StyleCopyPromptResult,
} from './prompts.js';

// ============================================================================
// Zod 스키마 테스트
// ============================================================================
describe('GenerationOptionsSchema', () => {
  it('기본값으로 빈 객체를 파싱한다', () => {
    const result = GenerationOptionsSchema.parse({});
    expect(result).toEqual({
      viewpointLock: false,
      whiteBackground: false,
      accessoryPreservation: false,
      styleCopy: false,
      userInstructions: undefined,
    });
  });

  it('모든 옵션이 true인 객체를 파싱한다', () => {
    const input = {
      viewpointLock: true,
      whiteBackground: true,
      accessoryPreservation: true,
      styleCopy: true,
    };
    const result = GenerationOptionsSchema.parse(input);
    expect(result.viewpointLock).toBe(true);
    expect(result.whiteBackground).toBe(true);
    expect(result.accessoryPreservation).toBe(true);
    expect(result.styleCopy).toBe(true);
  });

  it('userInstructions 문자열을 파싱한다', () => {
    const result = GenerationOptionsSchema.parse({
      userInstructions: '지퍼 색상 유지해주세요',
    });
    expect(result.userInstructions).toBe('지퍼 색상 유지해주세요');
  });

  it('userInstructions가 500자를 초과하면 에러를 던진다', () => {
    const longText = 'a'.repeat(501);
    expect(() =>
      GenerationOptionsSchema.parse({ userInstructions: longText })
    ).toThrow();
  });

  it('유효하지 않은 타입의 viewpointLock은 에러를 던진다', () => {
    expect(() =>
      GenerationOptionsSchema.parse({ viewpointLock: 'true' })
    ).toThrow();
  });

  it('유효하지 않은 타입의 whiteBackground은 에러를 던진다', () => {
    expect(() =>
      GenerationOptionsSchema.parse({ whiteBackground: 123 })
    ).toThrow();
  });

  it('safeParse로 유효한 객체를 파싱한다', () => {
    const result = GenerationOptionsSchema.safeParse({ viewpointLock: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.viewpointLock).toBe(true);
    }
  });

  it('safeParse로 유효하지 않은 객체를 처리한다', () => {
    const result = GenerationOptionsSchema.safeParse({ viewpointLock: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('빈 userInstructions 문자열을 허용한다', () => {
    const result = GenerationOptionsSchema.parse({ userInstructions: '' });
    expect(result.userInstructions).toBe('');
  });

  it('정확히 500자인 userInstructions를 허용한다', () => {
    const exactText = 'a'.repeat(500);
    const result = GenerationOptionsSchema.parse({ userInstructions: exactText });
    expect(result.userInstructions).toBe(exactText);
  });
});

// ============================================================================
// 개별 프롬프트 함수 테스트
// ============================================================================
describe('getViewpointLockPrompt', () => {
  it('enabled=true일 때 시점 고정 프롬프트를 반환한다', () => {
    const prompt = getViewpointLockPrompt(true);
    expect(prompt).toContain('Keep the exact same camera angle');
    expect(prompt).toContain('Do not change the product\'s orientation');
    expect(prompt.endsWith('.')).toBe(true);
  });

  it('enabled=false일 때 빈 문자열을 반환한다', () => {
    const prompt = getViewpointLockPrompt(false);
    expect(prompt).toBe('');
  });

  it('기본값(true)으로 프롬프트를 반환한다', () => {
    const prompt = getViewpointLockPrompt();
    expect(prompt).toContain('Keep the exact same camera angle');
  });
});

describe('getWhiteBackgroundPrompt', () => {
  it('enabled=true일 때 백색 배경 프롬프트를 반환한다', () => {
    const prompt = getWhiteBackgroundPrompt(true);
    expect(prompt).toContain('pure white with no shadows');
    expect(prompt).toContain('studio-lit product photograph');
    expect(prompt.endsWith('.')).toBe(true);
  });

  it('enabled=false일 때 빈 문자열을 반환한다', () => {
    const prompt = getWhiteBackgroundPrompt(false);
    expect(prompt).toBe('');
  });

  it('기본값(true)으로 프롬프트를 반환한다', () => {
    const prompt = getWhiteBackgroundPrompt();
    expect(prompt).toContain('pure white');
  });
});

describe('getAccessoryPreservationPrompt', () => {
  it('enabled=true일 때 부자재 보존 프롬프트를 반환한다', () => {
    const prompt = getAccessoryPreservationPrompt(true);
    expect(prompt).toContain('CRITICAL');
    expect(prompt).toContain('zippers, key rings, buttons, buckles');
    expect(prompt).toContain('Preserve the exact colors and shapes');
    expect(prompt).toContain('Do not modify, add, or remove');
    expect(prompt.endsWith('.')).toBe(true);
  });

  it('enabled=false일 때 빈 문자열을 반환한다', () => {
    const prompt = getAccessoryPreservationPrompt(false);
    expect(prompt).toBe('');
  });

  it('기본값(true)으로 프롬프트를 반환한다', () => {
    const prompt = getAccessoryPreservationPrompt();
    expect(prompt).toContain('CRITICAL');
  });
});

describe('getStyleCopyPrompt', () => {
  it('enabled=true일 때 스타일 복사 프롬프트를 반환한다', () => {
    const prompt = getStyleCopyPrompt(true);
    expect(prompt).toContain('Maintain the exact same material texture');
    expect(prompt).toContain('color tone');
    expect(prompt).toContain('Only change the character');
    expect(prompt.endsWith('.')).toBe(true);
  });

  it('enabled=false일 때 빈 문자열을 반환한다', () => {
    const prompt = getStyleCopyPrompt(false);
    expect(prompt).toBe('');
  });

  it('기본값(true)으로 프롬프트를 반환한다', () => {
    const prompt = getStyleCopyPrompt();
    expect(prompt).toContain('Maintain the exact same material texture');
  });
});

// ============================================================================
// buildFinalPrompt 조합 테스트
// ============================================================================
describe('buildFinalPrompt', () => {
  it('모든 옵션이 false일 때 빈 프롬프트를 반환한다', () => {
    const result = buildFinalPrompt({
      viewpointLock: false,
      whiteBackground: false,
      accessoryPreservation: false,
      styleCopy: false,
    });
    expect(result.prompt).toBe('');
    expect(result.appliedOptions).toEqual([]);
  });

  it('viewpointLock만 true일 때 시점 고정 프롬프트만 포함한다', () => {
    const result = buildFinalPrompt({ viewpointLock: true });
    expect(result.prompt).toContain('Keep the exact same camera angle');
    expect(result.appliedOptions).toEqual(['viewpointLock']);
  });

  it('whiteBackground만 true일 때 백색 배경 프롬프트만 포함한다', () => {
    const result = buildFinalPrompt({ whiteBackground: true });
    expect(result.prompt).toContain('pure white with no shadows');
    expect(result.appliedOptions).toEqual(['whiteBackground']);
  });

  it('accessoryPreservation만 true일 때 부자재 보존 프롬프트만 포함한다', () => {
    const result = buildFinalPrompt({ accessoryPreservation: true });
    expect(result.prompt).toContain('CRITICAL');
    expect(result.appliedOptions).toEqual(['accessoryPreservation']);
  });

  it('styleCopy만 true일 때 스타일 복사 프롬프트만 포함한다', () => {
    const result = buildFinalPrompt({ styleCopy: true });
    expect(result.prompt).toContain('Maintain the exact same material texture');
    expect(result.appliedOptions).toEqual(['styleCopy']);
  });

  it('viewpointLock + whiteBackground 조합을 처리한다', () => {
    const result = buildFinalPrompt({
      viewpointLock: true,
      whiteBackground: true,
    });
    expect(result.prompt).toContain('Keep the exact same camera angle');
    expect(result.prompt).toContain('pure white with no shadows');
    expect(result.appliedOptions).toEqual(['viewpointLock', 'whiteBackground']);
  });

  it('viewpointLock + accessoryPreservation 조합을 처리한다', () => {
    const result = buildFinalPrompt({
      viewpointLock: true,
      accessoryPreservation: true,
    });
    expect(result.prompt).toContain('Keep the exact same camera angle');
    expect(result.prompt).toContain('CRITICAL');
    expect(result.appliedOptions).toEqual(['viewpointLock', 'accessoryPreservation']);
  });

  it('viewpointLock + styleCopy 조합을 처리한다', () => {
    const result = buildFinalPrompt({
      viewpointLock: true,
      styleCopy: true,
    });
    expect(result.prompt).toContain('Keep the exact same camera angle');
    expect(result.prompt).toContain('Maintain the exact same material texture');
    expect(result.appliedOptions).toEqual(['viewpointLock', 'styleCopy']);
  });

  it('whiteBackground + accessoryPreservation 조합을 처리한다', () => {
    const result = buildFinalPrompt({
      whiteBackground: true,
      accessoryPreservation: true,
    });
    expect(result.prompt).toContain('pure white with no shadows');
    expect(result.prompt).toContain('CRITICAL');
    expect(result.appliedOptions).toEqual(['whiteBackground', 'accessoryPreservation']);
  });

  it('whiteBackground + styleCopy 조합을 처리한다', () => {
    const result = buildFinalPrompt({
      whiteBackground: true,
      styleCopy: true,
    });
    expect(result.prompt).toContain('pure white with no shadows');
    expect(result.prompt).toContain('Maintain the exact same material texture');
    expect(result.appliedOptions).toEqual(['whiteBackground', 'styleCopy']);
  });

  it('accessoryPreservation + styleCopy 조합을 처리한다', () => {
    const result = buildFinalPrompt({
      accessoryPreservation: true,
      styleCopy: true,
    });
    expect(result.prompt).toContain('CRITICAL');
    expect(result.prompt).toContain('Maintain the exact same material texture');
    expect(result.appliedOptions).toEqual(['accessoryPreservation', 'styleCopy']);
  });

  it('viewpointLock + whiteBackground + accessoryPreservation 조합을 처리한다', () => {
    const result = buildFinalPrompt({
      viewpointLock: true,
      whiteBackground: true,
      accessoryPreservation: true,
    });
    expect(result.appliedOptions).toEqual(['viewpointLock', 'whiteBackground', 'accessoryPreservation']);
  });

  it('viewpointLock + whiteBackground + styleCopy 조합을 처리한다', () => {
    const result = buildFinalPrompt({
      viewpointLock: true,
      whiteBackground: true,
      styleCopy: true,
    });
    expect(result.appliedOptions).toEqual(['viewpointLock', 'whiteBackground', 'styleCopy']);
  });

  it('viewpointLock + accessoryPreservation + styleCopy 조합을 처리한다', () => {
    const result = buildFinalPrompt({
      viewpointLock: true,
      accessoryPreservation: true,
      styleCopy: true,
    });
    expect(result.appliedOptions).toEqual(['viewpointLock', 'accessoryPreservation', 'styleCopy']);
  });

  it('whiteBackground + accessoryPreservation + styleCopy 조합을 처리한다', () => {
    const result = buildFinalPrompt({
      whiteBackground: true,
      accessoryPreservation: true,
      styleCopy: true,
    });
    expect(result.appliedOptions).toEqual(['whiteBackground', 'accessoryPreservation', 'styleCopy']);
  });

  it('모든 옵션이 true일 때 모든 프롬프트를 조합한다', () => {
    const result = buildFinalPrompt({
      viewpointLock: true,
      whiteBackground: true,
      accessoryPreservation: true,
      styleCopy: true,
    });
    expect(result.prompt).toContain('Keep the exact same camera angle');
    expect(result.prompt).toContain('pure white with no shadows');
    expect(result.prompt).toContain('CRITICAL');
    expect(result.prompt).toContain('Maintain the exact same material texture');
    expect(result.appliedOptions).toEqual([
      'viewpointLock',
      'whiteBackground',
      'accessoryPreservation',
      'styleCopy',
    ]);
  });

  it('userInstructions가 포함된 경우 추가 지시사항을 포함한다', () => {
    const result = buildFinalPrompt({
      viewpointLock: true,
      userInstructions: '지퍼 색상을 빨간색으로 유지해주세요',
    });
    expect(result.prompt).toContain('Additional instructions: 지퍼 색상을 빨간색으로 유지해주세요');
    expect(result.appliedOptions).toContain('userInstructions');
  });

  it('userInstructions만 있는 경우 추가 지시사항만 포함한다', () => {
    const result = buildFinalPrompt({
      userInstructions: '고리 모양 유지',
    });
    expect(result.prompt).toBe('Additional instructions: 고리 모양 유지');
    expect(result.appliedOptions).toEqual(['userInstructions']);
  });

  it('빈 userInstructions는 무시한다', () => {
    const result = buildFinalPrompt({
      viewpointLock: true,
      userInstructions: '',
    });
    expect(result.prompt).not.toContain('Additional instructions');
    expect(result.appliedOptions).not.toContain('userInstructions');
  });

  it('공백만 있는 userInstructions는 무시한다', () => {
    const result = buildFinalPrompt({
      viewpointLock: true,
      userInstructions: '   ',
    });
    expect(result.prompt).not.toContain('Additional instructions');
    expect(result.appliedOptions).not.toContain('userInstructions');
  });

  it('프롬프트가 줄바꿈으로 구분된다', () => {
    const result = buildFinalPrompt({
      viewpointLock: true,
      whiteBackground: true,
    });
    expect(result.prompt).toContain('\n\n');
  });

  it('빈 객체를 전달하면 기본값으로 처리한다', () => {
    const result = buildFinalPrompt({});
    expect(result.prompt).toBe('');
    expect(result.appliedOptions).toEqual([]);
  });
});

// ============================================================================
// buildFinalPromptSafe 테스트
// ============================================================================
describe('buildFinalPromptSafe', () => {
  it('유효한 옵션으로 성공 결과를 반환한다', () => {
    const result = buildFinalPromptSafe({ viewpointLock: true });
    expect(result.success).toBe(true);
    expect(result.prompt).toContain('Keep the exact same camera angle');
    expect(result.appliedOptions).toContain('viewpointLock');
    expect(result.error).toBeUndefined();
  });

  it('유효하지 않은 옵션으로 실패 결과를 반환한다', () => {
    const result = buildFinalPromptSafe({ viewpointLock: 'invalid' as unknown as boolean });
    expect(result.success).toBe(false);
    expect(result.prompt).toBe('');
    expect(result.appliedOptions).toEqual([]);
    expect(result.error).toBeDefined();
  });

  it('빈 객체로 성공 결과를 반환한다', () => {
    const result = buildFinalPromptSafe({});
    expect(result.success).toBe(true);
    expect(result.prompt).toBe('');
    expect(result.appliedOptions).toEqual([]);
  });

  it('userInstructions가 너무 긴 경우 실패 결과를 반환한다', () => {
    const result = buildFinalPromptSafe({
      userInstructions: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// ============================================================================
// buildStyleCopyPrompt 테스트 (v3 스타일 복사 전용)
// ============================================================================
describe('buildStyleCopyPrompt', () => {
  it('기본 스타일 복사 프롬프트 구조를 반환한다', () => {
    const result = buildStyleCopyPrompt();
    
    // 시스템 프롬프트 확인
    expect(result.systemPrompt).toContain('product mockup expert');
    expect(result.systemPrompt).toContain('CRITICAL TASK');
    expect(result.systemPrompt).toContain('IMAGE ROLES');
    expect(result.systemPrompt).toContain('Image 1 (STYLE REFERENCE)');
    expect(result.systemPrompt).toContain('Image 2 (SOURCE PRODUCT)');
    expect(result.systemPrompt).toContain('Image 3 (NEW CHARACTER)');
    
    // 이미지 라벨 확인
    expect(result.image1Label).toContain('STYLE REFERENCE');
    expect(result.image2Label).toContain('SOURCE PRODUCT');
    expect(result.image3Label).toContain('NEW CHARACTER');
    
    // 최종 지시 프롬프트 확인
    expect(result.finalInstruction).toContain('Generate a new product mockup');
    expect(result.finalInstruction).toContain('EXACT style from Image 1');
    expect(result.finalInstruction).toContain('character from Image 3');
    
    // 기본 적용 옵션
    expect(result.appliedOptions).toContain('styleCopy');
  });

  it('시스템 프롬프트에 보존해야 할 요소가 명시되어 있다', () => {
    const result = buildStyleCopyPrompt();
    
    // 부자재 보존 요소
    expect(result.systemPrompt).toContain('key rings');
    expect(result.systemPrompt).toContain('chains');
    expect(result.systemPrompt).toContain('zippers');
    expect(result.systemPrompt).toContain('buckles');
    expect(result.systemPrompt).toContain('buttons');
    
    // 재질감 보존 요소
    expect(result.systemPrompt).toContain('Material texture');
    expect(result.systemPrompt).toContain('finish quality');
    expect(result.systemPrompt).toContain('matte');
    expect(result.systemPrompt).toContain('glossy');
    
    // 색조 및 조명 보존
    expect(result.systemPrompt).toContain('Color tones');
    expect(result.systemPrompt).toContain('lighting conditions');
    expect(result.systemPrompt).toContain('Shadow direction');
  });

  it('시스템 프롬프트에 변경하면 안되는 요소가 명시되어 있다', () => {
    const result = buildStyleCopyPrompt();
    
    expect(result.systemPrompt).toContain('ABSOLUTELY DO NOT MODIFY');
    expect(result.systemPrompt).toContain('Accessory shapes');
    expect(result.systemPrompt).toContain('Hardware elements');
    expect(result.systemPrompt).toContain('Product material texture');
    expect(result.systemPrompt).toContain('Background or environment');
  });

  it('viewpointLock 옵션을 적용한다', () => {
    const result = buildStyleCopyPrompt({ viewpointLock: true });
    
    expect(result.appliedOptions).toContain('viewpointLock');
    expect(result.finalInstruction).toContain('Keep the exact same camera angle');
  });

  it('whiteBackground 옵션을 적용한다', () => {
    const result = buildStyleCopyPrompt({ whiteBackground: true });
    
    expect(result.appliedOptions).toContain('whiteBackground');
    expect(result.finalInstruction).toContain('pure white with no shadows');
  });

  it('accessoryPreservation 옵션을 적용한다', () => {
    const result = buildStyleCopyPrompt({ accessoryPreservation: true });
    
    expect(result.appliedOptions).toContain('accessoryPreservation');
    expect(result.finalInstruction).toContain('EXTRA EMPHASIS');
    expect(result.finalInstruction).toContain('accessory details');
  });

  it('userInstructions를 적용한다', () => {
    const result = buildStyleCopyPrompt({
      userInstructions: '키링 체인 색상 유지해주세요',
    });
    
    expect(result.appliedOptions).toContain('userInstructions');
    expect(result.finalInstruction).toContain('키링 체인 색상 유지해주세요');
  });

  it('여러 옵션을 조합한다', () => {
    const result = buildStyleCopyPrompt({
      viewpointLock: true,
      whiteBackground: true,
      accessoryPreservation: true,
      userInstructions: '추가 지시사항',
    });
    
    expect(result.appliedOptions).toContain('styleCopy');
    expect(result.appliedOptions).toContain('viewpointLock');
    expect(result.appliedOptions).toContain('whiteBackground');
    expect(result.appliedOptions).toContain('accessoryPreservation');
    expect(result.appliedOptions).toContain('userInstructions');
    
    expect(result.finalInstruction).toContain('Keep the exact same camera angle');
    expect(result.finalInstruction).toContain('pure white');
    expect(result.finalInstruction).toContain('EXTRA EMPHASIS');
    expect(result.finalInstruction).toContain('추가 지시사항');
  });

  it('빈 옵션으로 기본 구조를 반환한다', () => {
    const result = buildStyleCopyPrompt({});
    
    expect(result.systemPrompt).toBeDefined();
    expect(result.image1Label).toBeDefined();
    expect(result.image2Label).toBeDefined();
    expect(result.image3Label).toBeDefined();
    expect(result.finalInstruction).toBeDefined();
    expect(result.appliedOptions).toEqual(['styleCopy']);
  });

  it('출력 요구사항이 명시되어 있다', () => {
    const result = buildStyleCopyPrompt();
    
    expect(result.systemPrompt).toContain('OUTPUT REQUIREMENTS');
    expect(result.systemPrompt).toContain('visually indistinguishable from Image 1');
    expect(result.systemPrompt).toContain('ONLY the character should be different');
    expect(result.systemPrompt).toContain('pixel-perfectly');
  });

  it('styleCopy가 항상 appliedOptions에 포함된다', () => {
    const result1 = buildStyleCopyPrompt();
    const result2 = buildStyleCopyPrompt({ viewpointLock: true });
    const result3 = buildStyleCopyPrompt({ styleCopy: false }); // 무시됨
    
    expect(result1.appliedOptions).toContain('styleCopy');
    expect(result2.appliedOptions).toContain('styleCopy');
    expect(result3.appliedOptions).toContain('styleCopy');
  });
});
