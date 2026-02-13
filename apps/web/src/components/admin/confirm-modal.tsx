'use client';

import * as React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';

/**
 * 확인 모달 Props
 */
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

/**
 * 확인 모달 컴포넌트
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  // 모달이 열릴 때 body 스크롤 방지
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC 키로 닫기
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const variantConfig = {
    danger: {
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-500',
    },
    warning: {
      iconBg: 'bg-yellow-500/10',
      iconColor: 'text-yellow-500',
    },
    info: {
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
  };

  const config = variantConfig[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* 모달 컨텐츠 */}
      <div
        className={cn(
          'relative z-10 w-full max-w-md mx-4',
          'bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-default)] shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-lg p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)] disabled:opacity-50"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 컨텐츠 */}
        <div className="p-6">
          {/* 아이콘 */}
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', config.iconBg)}>
            <AlertTriangle className={cn('h-6 w-6', config.iconColor)} />
          </div>

          {/* 텍스트 */}
          <div className="mt-4 space-y-2">
            <h2
              id="modal-title"
              className="text-xl font-semibold text-[var(--text-primary)]"
            >
              {title}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {message}
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="mt-6 flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              {cancelLabel}
            </Button>
            <Button
              variant={variant === 'info' ? 'primary' : 'danger'}
              onClick={onConfirm}
              isLoading={isLoading}
              disabled={isLoading}
              className="flex-1"
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
