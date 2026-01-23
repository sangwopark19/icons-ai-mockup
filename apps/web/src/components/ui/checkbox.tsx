'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

/**
 * Checkbox Props
 */
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  description?: string;
  error?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * 체크박스 컴포넌트
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      label,
      description,
      error,
      checked,
      onCheckedChange,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || React.useId();
    const descriptionId = description ? `${checkboxId}-description` : undefined;
    const errorId = error ? `${checkboxId}-error` : undefined;

    // Change 이벤트 핸들러
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(event.target.checked);
    };

    // 키보드 이벤트 핸들러 (Space 키)
    const handleKeyDown = (event: React.KeyboardEvent<HTMLLabelElement>) => {
      if (event.key === ' ' && !disabled) {
        event.preventDefault();
        onCheckedChange?.(!checked);
      }
    };

    return (
      <div className={cn('space-y-1', className)}>
        <label
          htmlFor={checkboxId}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          className={cn(
            'inline-flex items-start gap-3 cursor-pointer',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <div className="relative flex items-center justify-center">
            <input
              id={checkboxId}
              ref={ref}
              type="checkbox"
              role="checkbox"
              aria-checked={checked}
              aria-describedby={
                [descriptionId, errorId].filter(Boolean).join(' ') || undefined
              }
              aria-invalid={error ? 'true' : undefined}
              checked={checked}
              onChange={handleChange}
              disabled={disabled}
              className={cn(
                'peer h-5 w-5 appearance-none rounded border-2 transition-all',
                'border-[var(--border-default)] bg-[var(--bg-tertiary)]',
                'hover:border-[var(--border-hover)]',
                'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
                'checked:border-brand-500 checked:bg-brand-500',
                'disabled:cursor-not-allowed disabled:opacity-50',
                error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
              )}
              {...props}
            />
            {/* 체크 아이콘 */}
            <svg
              className={cn(
                'pointer-events-none absolute h-3 w-3 text-white opacity-0 transition-opacity',
                'peer-checked:opacity-100'
              )}
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 6L5 9L10 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* 레이블 영역 */}
          {(label || description) && (
            <div className="flex flex-col gap-0.5">
              {label && (
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {label}
                </span>
              )}
              {description && (
                <span
                  id={descriptionId}
                  className="text-xs text-[var(--text-tertiary)]"
                >
                  {description}
                </span>
              )}
            </div>
          )}
        </label>

        {/* 에러 메시지 */}
        {error && (
          <p id={errorId} className="text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
