'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import type { GenerationOptionsV3 } from '@icons/shared';

/**
 * GenerationOptions 컴포넌트 Props
 */
export interface GenerationOptionsProps {
  /**
   * 옵션 변경 시 호출되는 콜백 함수
   */
  onOptionsChange?: (options: GenerationOptionsV3) => void;
  /**
   * 초기 옵션 값
   */
  defaultOptions?: Partial<GenerationOptionsV3>;
  /**
   * 컴포넌트 비활성화 여부
   */
  disabled?: boolean;
  /**
   * 추가 CSS 클래스명
   */
  className?: string;
}

/**
 * GenerationOptions 상태 관리 커스텀 훅
 * @param defaultOptions - 초기 옵션 값
 * @param onOptionsChange - 옵션 변경 콜백
 * @returns 옵션 상태 및 업데이트 함수
 */
function useGenerationOptions(
  defaultOptions?: Partial<GenerationOptionsV3>,
  onOptionsChange?: (options: GenerationOptionsV3) => void
) {
  // 초기 상태 설정
  const [options, setOptions] = React.useState<GenerationOptionsV3>({
    viewpointLock: defaultOptions?.viewpointLock ?? false,
    whiteBackground: defaultOptions?.whiteBackground ?? false,
    userInstructions: defaultOptions?.userInstructions ?? '',
  });

  // 옵션 업데이트 함수
  const updateOptions = React.useCallback(
    (updates: Partial<GenerationOptionsV3>) => {
      setOptions((prev) => {
        const newOptions = { ...prev, ...updates };
        // 콜백 호출
        onOptionsChange?.(newOptions);
        return newOptions;
      });
    },
    [onOptionsChange]
  );

  // 시점 고정 토글
  const toggleViewpointLock = React.useCallback(
    (checked: boolean) => {
      updateOptions({ viewpointLock: checked });
    },
    [updateOptions]
  );

  // 백색 배경 토글
  const toggleWhiteBackground = React.useCallback(
    (checked: boolean) => {
      updateOptions({ whiteBackground: checked });
    },
    [updateOptions]
  );

  // 사용자 지시사항 업데이트
  const updateUserInstructions = React.useCallback(
    (value: string) => {
      updateOptions({ userInstructions: value });
    },
    [updateOptions]
  );

  return {
    options,
    toggleViewpointLock,
    toggleWhiteBackground,
    updateUserInstructions,
  };
}

/**
 * 생성 옵션 컴포넌트 (Phase 5.3)
 * 
 * v3 생성 옵션 UI를 제공합니다:
 * - 시점 고정 (viewpointLock): 원본 이미지의 카메라 앵글 유지
 * - 백색 배경 (whiteBackground): 그림자 없는 완전한 백색 배경
 * - 사용자 지시사항 (userInstructions): 추가 텍스트 지시사항
 * 
 * @example
 * ```tsx
 * <GenerationOptions
 *   defaultOptions={{ viewpointLock: true }}
 *   onOptionsChange={(options) => console.log(options)}
 * />
 * ```
 */
export const GenerationOptions = React.forwardRef<HTMLDivElement, GenerationOptionsProps>(
  ({ onOptionsChange, defaultOptions, disabled = false, className }, ref) => {
    const {
      options,
      toggleViewpointLock,
      toggleWhiteBackground,
      updateUserInstructions,
    } = useGenerationOptions(defaultOptions, onOptionsChange);

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-6 rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6',
          disabled && 'opacity-50 pointer-events-none',
          className
        )}
      >
        {/* 제목 */}
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            생성 옵션
          </h3>
          <p className="text-sm text-[var(--text-tertiary)]">
            이미지 생성 시 적용할 추가 옵션을 선택하세요
          </p>
        </div>

        {/* 체크박스 옵션 그룹 */}
        <div className="flex flex-col gap-4">
          {/* 시점 고정 */}
          <Checkbox
            checked={options.viewpointLock}
            onCheckedChange={toggleViewpointLock}
            disabled={disabled}
            label="시점 고정"
            description="원본 이미지의 카메라 앵글과 시점을 정확하게 유지합니다"
          />

          {/* 백색 배경 */}
          <Checkbox
            checked={options.whiteBackground}
            onCheckedChange={toggleWhiteBackground}
            disabled={disabled}
            label="백색 배경"
            description="그림자 없는 완전한 백색 배경으로 생성합니다"
          />
        </div>

        {/* 사용자 지시사항 */}
        <Textarea
          value={options.userInstructions}
          onChange={(e) => updateUserInstructions(e.target.value)}
          disabled={disabled}
          label="사용자 지시사항 (선택사항)"
          description="이미지 생성 시 추가로 적용할 지시사항을 입력하세요 (최대 500자)"
          placeholder="예: 더 밝은 조명, 미소 짓는 표정 등"
          maxLength={500}
          resize="vertical"
          rows={4}
        />

        {/* 글자 수 카운터 */}
        {options.userInstructions && (
          <div className="flex justify-end">
            <span
              className={cn(
                'text-xs',
                options.userInstructions.length > 450
                  ? 'text-red-500'
                  : 'text-[var(--text-tertiary)]'
              )}
            >
              {options.userInstructions.length} / 500
            </span>
          </div>
        )}
      </div>
    );
  }
);

GenerationOptions.displayName = 'GenerationOptions';
