'use client';

import React, { useState, useEffect } from 'react';
import type { AdminGeneration } from '@/lib/api';

interface GenerationDetailModalProps {
  generation: AdminGeneration | null;
  onClose: () => void;
  onRetry: (id: string) => Promise<void>;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
    .format(date)
    .replace(/\. /g, '-')
    .replace('.', '');
}

export default function GenerationDetailModal({
  generation,
  onClose,
  onRetry,
}: GenerationDetailModalProps) {
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!generation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [generation, onClose]);

  if (!generation) return null;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry(generation.id);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">생성 작업 상세</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Error message */}
          {generation.errorMessage && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-semibold text-red-700 mb-1">에러 메시지</p>
              <p className="text-sm text-red-600 break-words">{generation.errorMessage}</p>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                사용자
              </p>
              <p className="text-gray-900">{generation.userEmail}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                생성 모드
              </p>
              <p className="text-gray-900">{generation.mode}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                재시도 횟수
              </p>
              <p className="text-gray-900">{generation.retryCount}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
                생성일
              </p>
              <p className="text-gray-900">{formatDate(generation.createdAt)}</p>
            </div>
          </div>

          {/* Options JSON */}
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
              생성 옵션
            </p>
            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(generation.options, null, 2)}
            </pre>
          </div>

          {/* Prompt data JSON */}
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">
              프롬프트 데이터
            </p>
            <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(generation.promptData, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={retrying}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            닫기
          </button>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {retrying && (
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            재시도
          </button>
        </div>
      </div>
    </div>
  );
}
