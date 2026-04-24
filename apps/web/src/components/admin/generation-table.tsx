'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, AdminGeneration, Pagination } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import GenerationDetailModal from './generation-detail-modal';

const STATUS_TABS = [
  { label: '전체', value: undefined },
  { label: '대기중', value: 'pending' },
  { label: '처리중', value: 'processing' },
  { label: '완료', value: 'completed' },
  { label: '실패', value: 'failed' },
] as const;

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '대기중',
  processing: '처리중',
  completed: '완료',
  failed: '실패',
};

const PROVIDER_LABELS = {
  gemini: 'Gemini',
  openai: 'OpenAI',
} as const;

const PROVIDER_BADGE_CLASSES = {
  gemini: 'bg-emerald-100 text-emerald-800',
  openai: 'bg-sky-100 text-sky-800',
} as const;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(date)
    .replace(/\. /g, '-')
    .replace('.', '');
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push('...');
    pages.push(total - 1);
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push(2);
    pages.push('...');
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push('...');
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push('...');
    pages.push(total);
  }

  return pages;
}

export default function GenerationTable() {
  const { accessToken } = useAuthStore();
  const [generations, setGenerations] = useState<AdminGeneration[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [emailSearch, setEmailSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedGeneration, setSelectedGeneration] = useState<AdminGeneration | null>(null);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params: { page?: number; limit?: number; status?: string; email?: string } = {
        page,
        limit: 20,
      };
      if (statusFilter) params.status = statusFilter;
      if (emailSearch.trim()) params.email = emailSearch.trim();

      const res = await adminApi.listGenerations(accessToken, params);
      setGenerations(res.data);
      setPagination(res.pagination);
      setStatusCounts(res.statusCounts);
    } catch (err) {
      console.error('Failed to fetch generations:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, statusFilter, emailSearch]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!mounted) return;
      await fetchData();
    };

    run();

    const interval = setInterval(() => {
      if (mounted) fetchData();
    }, 30_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  const handleStatusTabClick = (value: string | undefined) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleEmailSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchData();
    }
  };

  const handleRetry = async (id: string) => {
    if (!accessToken) return;
    setRetryingIds((prev) => new Set(prev).add(id));
    try {
      await adminApi.retryGeneration(accessToken, id);
      // Optimistically update status to pending
      setGenerations((prev) => prev.map((g) => (g.id === id ? { ...g, status: 'pending' } : g)));
      await fetchData();
    } catch (err) {
      console.error('Retry failed:', err);
      alert('재시도에 실패했습니다.');
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const pageNumbers = getPageNumbers(pagination.page, pagination.totalPages);

  const totalCount =
    (statusCounts.pending ?? 0) +
    (statusCounts.processing ?? 0) +
    (statusCounts.completed ?? 0) +
    (statusCounts.failed ?? 0);

  return (
    <div className="space-y-4">
      {/* Status tabs + search bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => {
            const count = tab.value === undefined ? totalCount : (statusCounts[tab.value] ?? 0);
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.label}
                onClick={() => handleStatusTabClick(tab.value)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {tab.label}
                <span
                  className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-xs font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="ml-auto">
          <input
            type="text"
            placeholder="이메일 검색 (Enter)"
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            onKeyDown={handleEmailSearchKeyDown}
            className="min-w-[200px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto rounded-lg border border-[var(--border-default)]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-elevated)]">
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                사용자 이메일
              </th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                모드
              </th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                Provider
              </th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                상태
              </th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                생성일
              </th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                에러 메시지
              </th>
              <th className="px-4 py-3 text-left font-semibold text-[var(--text-secondary)]">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="relative">
            {loading && (
              <tr>
                <td colSpan={7} className="p-0">
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
                    <svg
                      className="text-brand-500 h-6 w-6 animate-spin"
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
                  </div>
                </td>
              </tr>
            )}
            {generations.length === 0 && !loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[var(--text-tertiary)]">
                  생성 작업이 없습니다
                </td>
              </tr>
            ) : (
              generations.map((gen) => (
                <tr
                  key={gen.id}
                  className="border-b border-[var(--border-default)] transition-colors hover:bg-[var(--bg-elevated)]"
                >
                  <td className="px-4 py-3 text-[var(--text-primary)]">{gen.userEmail}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{gen.mode}</td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-36 flex-col gap-1">
                      <span
                        className={`inline-flex w-fit items-center rounded px-2 py-0.5 text-xs font-medium ${
                          PROVIDER_BADGE_CLASSES[gen.provider]
                        }`}
                      >
                        {PROVIDER_LABELS[gen.provider]}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {gen.providerModel}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE_CLASSES[gen.status] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {STATUS_LABELS[gen.status] ?? gen.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {formatDate(gen.createdAt)}
                  </td>
                  <td className="max-w-[200px] px-4 py-3 text-[var(--text-secondary)]">
                    {gen.status === 'failed' && gen.errorMessage ? (
                      <span className="block truncate text-red-600" title={gen.errorMessage}>
                        {gen.errorMessage.length > 60
                          ? gen.errorMessage.slice(0, 60) + '...'
                          : gen.errorMessage}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {gen.status === 'failed' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedGeneration(gen)}
                          className="rounded bg-[var(--bg-secondary)] px-2 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)]"
                        >
                          상세보기
                        </button>
                        <button
                          onClick={() => handleRetry(gen.id)}
                          disabled={retryingIds.has(gen.id)}
                          className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          재시도
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            &lsaquo;
          </button>
          {pageNumbers.map((p, idx) =>
            p === '...' ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-8 w-8 items-center justify-center text-sm text-[var(--text-tertiary)]"
              >
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p as number)}
                className={`flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-colors ${
                  p === pagination.page
                    ? 'bg-brand-500 text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.totalPages}
            className="flex h-8 w-8 items-center justify-center rounded text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            &rsaquo;
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <GenerationDetailModal
        generation={selectedGeneration}
        onClose={() => setSelectedGeneration(null)}
        onRetry={async (id) => {
          await handleRetry(id);
          setSelectedGeneration(null);
        }}
      />
    </div>
  );
}
