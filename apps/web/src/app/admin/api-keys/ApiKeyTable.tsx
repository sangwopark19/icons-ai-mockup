'use client';

import React from 'react';
import type { AdminApiKey } from '@/lib/api';

interface ApiKeyTableProps {
  keys: AdminApiKey[];
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

export function ApiKeyTable({ keys, onDelete, onActivate, loading }: ApiKeyTableProps) {
  if (!loading && keys.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        등록된 API 키가 없습니다
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border-default)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--bg-elevated)] border-b border-[var(--border-default)]">
            <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">별칭</th>
            <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">마스킹된 키</th>
            <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">상태</th>
            <th className="text-right px-4 py-3 font-medium text-[var(--text-secondary)]">호출 횟수</th>
            <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">등록일</th>
            <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">마지막 사용일</th>
            <th className="text-right px-4 py-3 font-medium text-[var(--text-secondary)]">액션</th>
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
                className="bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{key.alias}</td>
                <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">
                  ****{key.maskedKey}
                </td>
                <td className="px-4 py-3">
                  {key.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      활성
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
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
                        className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                      >
                        활성화
                      </button>
                      <button
                        onClick={() => onDelete(key.id)}
                        disabled={loading}
                        className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:pointer-events-none transition-colors"
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
