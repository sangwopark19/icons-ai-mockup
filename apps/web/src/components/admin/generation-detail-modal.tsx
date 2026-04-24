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

function getProviderLabel(provider: AdminGeneration['provider']): string {
  return provider === 'openai' ? 'OpenAI' : 'Gemini';
}

export default function GenerationDetailModal({
  generation,
  onClose,
  onRetry,
}: GenerationDetailModalProps) {
  const [retrying, setRetrying] = useState(false);
  const [showSupportInfo, setShowSupportInfo] = useState(false);

  useEffect(() => {
    if (!generation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [generation, onClose]);

  useEffect(() => {
    setShowSupportInfo(false);
  }, [generation?.id]);

  if (!generation) return null;

  const supportFields = [
    { label: 'Provider', value: getProviderLabel(generation.provider) },
    { label: 'Model', value: generation.providerModel },
    { label: 'OpenAI Request ID', value: generation.openaiRequestId },
    { label: 'OpenAI Response ID', value: generation.openaiResponseId },
    { label: 'OpenAI Image Call ID', value: generation.openaiImageCallId },
    { label: 'OpenAI Revised Prompt', value: generation.openaiRevisedPrompt },
  ].filter((field) => Boolean(field.value));

  const copySupportValue = async (label: string, value: string) => {
    await navigator.clipboard?.writeText(value);
    console.log(`${label} copied`);
  };

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
        className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">생성 작업 상세</h3>
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
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
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="mb-1 text-sm font-semibold text-red-700">에러 메시지</p>
              <p className="break-words text-sm text-red-600">{generation.errorMessage}</p>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                사용자
              </p>
              <p className="text-gray-900">{generation.userEmail}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                생성 모드
              </p>
              <p className="text-gray-900">{generation.mode}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                Provider
              </p>
              <p className="text-gray-900">{getProviderLabel(generation.provider)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                Model
              </p>
              <p className="break-words text-gray-900">{generation.providerModel}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                재시도 횟수
              </p>
              <p className="text-gray-900">{generation.retryCount}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                생성일
              </p>
              <p className="text-gray-900">{formatDate(generation.createdAt)}</p>
            </div>
          </div>

          {/* Options JSON */}
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
              생성 옵션
            </p>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
              {JSON.stringify(generation.options, null, 2)}
            </pre>
          </div>

          {/* Prompt data JSON */}
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
              프롬프트 데이터
            </p>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
              {JSON.stringify(generation.promptData, null, 2)}
            </pre>
          </div>

          {/* Safe support metadata */}
          <div className="rounded-lg border border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => setShowSupportInfo((value) => !value)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-900"
            >
              <span>지원 정보</span>
              <span className="text-xs text-gray-500">{showSupportInfo ? '접기' : '펼치기'}</span>
            </button>
            {showSupportInfo && (
              <div className="space-y-3 border-t border-gray-200 px-4 py-3">
                {supportFields.map((field) => (
                  <div key={field.label} className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {field.label}
                    </p>
                    <p className="break-words text-sm text-gray-800">{field.value}</p>
                    <button
                      type="button"
                      onClick={() => copySupportValue(field.label, String(field.value))}
                      className="h-8 rounded border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      aria-label={`${field.label} 복사`}
                    >
                      복사
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
          <button
            onClick={onClose}
            disabled={retrying}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            닫기
          </button>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
