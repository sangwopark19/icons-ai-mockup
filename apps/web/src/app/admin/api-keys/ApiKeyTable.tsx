'use client';

import React from 'react';
import type { AdminApiKey, AdminProvider } from '@/lib/api';

function getProviderLabel(provider: AdminProvider): string {
  return provider === 'openai' ? 'OpenAI' : 'Gemini';
}

interface ApiKeyTableProps {
  keys: AdminApiKey[];
  provider: AdminProvider;
  onDelete: (id: string) => void;
  onActivate: (id: string) => void;
  loading: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function ApiKeyTable({ keys, provider, onDelete, onActivate, loading }: ApiKeyTableProps) {
  if (!loading && keys.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        등록된 {getProviderLabel(provider)} API 키가 없습니다
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border-default)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
            <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">별칭</th>
            <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
              마스킹된 키
            </th>
            <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">상태</th>
            <th className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]">
              호출 횟수
            </th>
            <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">등록일</th>
            <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
              마지막 사용일
            </th>
            <th className="px-4 py-3 text-right font-medium text-[var(--text-secondary)]">액션</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-default)]">
          {loading && keys.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-tertiary)]">
                불러오는 중...
              </td>
            </tr>
          ) : (
            keys.map((key) => (
              <tr
                key={key.id}
                className="bg-[var(--bg-surface)] transition-colors hover:bg-[var(--bg-elevated)]"
              >
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{key.alias}</td>
                <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">
                  ****{key.maskedKey}
                </td>
                <td className="px-4 py-3">
                  {key.isActive ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      활성
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      비활성
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-[var(--text-secondary)]">
                  {key.callCount.toLocaleString('ko-KR')}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {formatDate(key.createdAt)}
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {formatDate(key.lastUsedAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  {!key.isActive && (
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => onActivate(key.id)}
                        disabled={loading}
                        className="inline-flex h-8 items-center rounded-lg bg-blue-50 px-3 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:pointer-events-none disabled:opacity-50"
                      >
                        활성화
                      </button>
                      <button
                        onClick={() => onDelete(key.id)}
                        disabled={loading}
                        className="inline-flex h-8 items-center rounded-lg bg-red-50 px-3 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:pointer-events-none disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
