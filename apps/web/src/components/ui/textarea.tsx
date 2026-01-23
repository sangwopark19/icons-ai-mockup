'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

/**
 * Textarea Props
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

/**
 * 텍스트에어리어 컴포넌트
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      description,
      error,
      resize = 'vertical',
      id,
      disabled,
      required,
      readOnly,
      ...props
    },
    ref
  ) => {
    const textareaId = id || React.useId();
    const descriptionId = description ? `${textareaId}-description` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;

    // resize 스타일 매핑
    const resizeClass = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    }[resize];

    return (
      <div className="space-y-1.5">
        {/* 레이블 */}
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-[var(--text-secondary)]"
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        {/* 설명 텍스트 */}
        {description && (
          <p id={descriptionId} className="text-xs text-[var(--text-tertiary)]">
            {description}
          </p>
        )}

        {/* Textarea */}
        <textarea
          id={textareaId}
          ref={ref}
          aria-label={label}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            [descriptionId, errorId].filter(Boolean).join(' ') || undefined
          }
          aria-required={required}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border bg-[var(--bg-tertiary)] px-4 py-3 text-base text-[var(--text-primary)] transition-colors',
            'border-[var(--border-default)]',
            'placeholder:text-[var(--text-tertiary)]',
            'hover:border-[var(--border-hover)]',
            'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'read-only:cursor-default read-only:bg-[var(--bg-elevated)]',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            resizeClass,
            className
          )}
          {...props}
        />

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
Textarea.displayName = 'Textarea';

export { Textarea };
