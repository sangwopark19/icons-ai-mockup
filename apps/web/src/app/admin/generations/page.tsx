'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ImageIcon,
  Wand2,
  Clock,
  AlertCircle,
  User,
  FolderOpen,
  Calendar,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { adminApi } from '@/lib/api';
import { DataTable, type TableColumn } from '@/components/admin/data-table';
import { SearchFilter } from '@/components/admin/search-filter';
import { StatusBadge } from '@/components/admin/status-badge';
import type { GenerationStatus, GenerationMode } from '@mockup-ai/shared';
import { cn } from '@/lib/cn';

/**
 * 생성 작업 데이터 타입
 */
interface AdminGeneration {
  id: string;
  mode: GenerationMode;
  status: GenerationStatus;
  createdAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
  retryCount: number;
  project: {
    id: string;
    name: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  images: Array<{
    id: string;
    thumbnailPath: string | null;
  }>;
}

/**
 * 모드별 설정
 */
const modeConfig: Record<
  GenerationMode,
  {
    label: string;
    icon: typeof Wand2;
    color: string;
  }
> = {
  ip_change: {
    label: 'IP 변경',
    icon: Wand2,
    color: 'text-purple-400',
  },
  sketch_to_real: {
    label: '스케치 실사화',
    icon: ImageIcon,
    color: 'text-blue-400',
  },
};

/**
 * 에러 상세 모달
 */
function ErrorModal({
  isOpen,
  onClose,
  generation,
}: {
  isOpen: boolean;
  onClose: () => void;
  generation: AdminGeneration;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative w-full max-w-2xl rounded-xl border border-red-500/30 bg-[var(--bg-secondary)] p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                생성 실패 상세
              </h3>
              <p className="text-sm text-[var(--text-tertiary)]">
                Generation ID: <span className="font-mono">{generation.id.slice(0, 8)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* 에러 메시지 */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text-secondary)]">
              에러 메시지
            </label>
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <pre className="whitespace-pre-wrap font-mono text-sm text-red-300">
                {generation.errorMessage || '에러 메시지가 없습니다'}
              </pre>
            </div>
          </div>

          {/* 재시도 횟수 */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text-secondary)]">
              재시도 횟수
            </label>
            <p className="text-sm text-[var(--text-primary)]">
              {generation.retryCount}회 시도
            </p>
          </div>

          {/* 생성 시각 */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--text-secondary)]">
              생성 시각
            </label>
            <p className="text-sm text-[var(--text-primary)]">
              {new Date(generation.createdAt).toLocaleString('ko-KR')}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-[var(--bg-tertiary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 생성 작업 모니터링 페이지
 */
export default function GenerationsPage() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  // 필터 상태
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [userFilter, setUserFilter] = React.useState('all');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [page, setPage] = React.useState(1);
  const limit = 20;

  // 에러 모달 상태
  const [errorModal, setErrorModal] = React.useState<{
    isOpen: boolean;
    generation: AdminGeneration | null;
  }>({
    isOpen: false,
    generation: null,
  });

  // 생성 작업 목록 조회
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'generations', page, limit, statusFilter, userFilter, dateFrom, dateTo],
    queryFn: async () => {
      if (!accessToken) throw new Error('인증 토큰이 없습니다');

      const response = await adminApi.getGenerations(accessToken, {
        page,
        limit,
        status: statusFilter === 'all' ? undefined : statusFilter,
        userId: userFilter === 'all' ? undefined : userFilter,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      return response as any as {
        data: {
          generations: AdminGeneration[];
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
    },
    enabled: !!accessToken,
    refetchInterval: (query) => {
      const hasProcessing = query.state.data?.data?.generations?.some(
        (g: AdminGeneration) => g.status === 'processing'
      );
      return hasProcessing ? 10000 : 30000; // processing 있으면 10초, 없으면 30초
    },
  });

  // 사용자 목록 조회 (필터용)
  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users-for-filter'],
    queryFn: async () => {
      if (!accessToken) throw new Error('인증 토큰이 없습니다');
      return adminApi.getUsers(accessToken, { page: 1, limit: 1000 });
    },
    enabled: !!accessToken,
  });

  // 수동 새로고침
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'generations'] });
  };

  // 에러 상세 보기
  const handleViewError = (generation: AdminGeneration) => {
    setErrorModal({ isOpen: true, generation });
  };

  // 테이블 컬럼 정의
  const columns: TableColumn<AdminGeneration>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (gen) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs text-[var(--text-primary)]">
            {gen.id.slice(0, 8)}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {new Date(gen.createdAt).toLocaleString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      ),
      className: 'w-32',
    },
    {
      key: 'user',
      label: '사용자',
      render: (gen) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 text-xs font-semibold text-brand-400">
            {gen.project.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {gen.project.user.name}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              {gen.project.user.email}
            </span>
          </div>
        </div>
      ),
      className: 'w-48',
    },
    {
      key: 'project',
      label: '프로젝트',
      render: (gen) => (
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-[var(--text-tertiary)]" />
          <span className="text-sm text-[var(--text-secondary)]">
            {gen.project.name}
          </span>
        </div>
      ),
    },
    {
      key: 'mode',
      label: '모드',
      render: (gen) => {
        const config = modeConfig[gen.mode];
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-2">
            <Icon className={cn('h-4 w-4', config.color)} />
            <span className="text-sm text-[var(--text-secondary)]">
              {config.label}
            </span>
          </div>
        );
      },
      className: 'w-40',
    },
    {
      key: 'status',
      label: '상태',
      render: (gen) => (
        <StatusBadge status={gen.status} />
      ),
      className: 'w-28',
    },
    {
      key: 'duration',
      label: '소요시간',
      render: (gen) => {
        if (gen.status === 'pending') {
          return (
            <span className="text-xs text-[var(--text-tertiary)]">
              대기중
            </span>
          );
        }

        if (gen.status === 'processing') {
          const elapsed = Date.now() - new Date(gen.createdAt).getTime();
          const seconds = Math.floor(elapsed / 1000);
          return (
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="h-3 w-3 animate-pulse text-blue-400" />
              <span className="font-mono text-blue-400">
                {seconds}초
              </span>
            </div>
          );
        }

        if (gen.completedAt) {
          const duration = new Date(gen.completedAt).getTime() - new Date(gen.createdAt).getTime();
          const seconds = Math.floor(duration / 1000);
          return (
            <span className="font-mono text-xs text-[var(--text-secondary)]">
              {seconds}초
            </span>
          );
        }

        return <span className="text-xs text-[var(--text-tertiary)]">-</span>;
      },
      className: 'w-28',
    },
    {
      key: 'actions',
      label: '액션',
      render: (gen) => (
        <div className="flex items-center gap-2">
          {gen.status === 'failed' && (
            <button
              onClick={() => handleViewError(gen)}
              className="group rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-red-500/10 hover:text-red-400"
              title="에러 상세 보기"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {gen.status === 'completed' && gen.images.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-green-400">
              <ImageIcon className="h-3 w-3" />
              <span>{gen.images.length}개</span>
            </div>
          )}
        </div>
      ),
      className: 'w-24',
    },
  ];

  // 필터 변경 시 페이지 초기화
  React.useEffect(() => {
    setPage(1);
  }, [statusFilter, userFilter, dateFrom, dateTo]);

  const generations = data?.data?.generations || [];
  const pagination = data?.data ? {
    total: data.data.total,
    page: data.data.page,
    totalPages: data.data.totalPages,
  } : null;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            생성 작업 모니터링
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            실시간으로 AI 이미지 생성 작업을 모니터링합니다
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-all hover:border-brand-500/30 hover:bg-[var(--bg-elevated)]"
        >
          <RefreshCw className="h-4 w-4" />
          새로고침
        </button>
      </div>

      {/* 필터 */}
      <SearchFilter
        searchValue=""
        onSearchChange={() => {}}
        searchPlaceholder="검색 기능 없음"
        filters={[
          {
            label: '상태',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: '전체 상태', value: 'all' },
              { label: '대기중', value: 'pending' },
              { label: '처리중', value: 'processing' },
              { label: '완료', value: 'completed' },
              { label: '실패', value: 'failed' },
            ],
          },
          {
            label: '사용자',
            value: userFilter,
            onChange: setUserFilter,
            options: [
              { label: '전체 사용자', value: 'all' },
              ...(usersData?.data || []).map((user) => ({
                label: user.name,
                value: user.id,
              })),
            ],
          },
        ]}
      />

      {/* 날짜 필터 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--text-tertiary)]" />
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            기간:
          </span>
        </div>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--border-hover)] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          placeholder="시작일"
        />
        <span className="text-sm text-[var(--text-tertiary)]">~</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-9 rounded-lg border border-[var(--border-default)] bg-[var(--bg-tertiary)] px-3 text-sm text-[var(--text-primary)] transition-colors hover:border-[var(--border-hover)] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          placeholder="종료일"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => {
              setDateFrom('');
              setDateTo('');
            }}
            className="text-xs text-[var(--text-tertiary)] underline transition-colors hover:text-[var(--text-secondary)]"
          >
            초기화
          </button>
        )}
      </div>

      {/* 통계 요약 */}
      {pagination && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <ImageIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">총 작업</p>
                <p className="text-xl font-bold text-[var(--text-primary)]">
                  {pagination.total}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-500/20 bg-gray-500/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-500/10 p-2">
                <Clock className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">대기중</p>
                <p className="text-xl font-bold text-gray-400">
                  {generations.filter((g) => g.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">처리중</p>
                <p className="text-xl font-bold text-blue-400">
                  {generations.filter((g) => g.status === 'processing').length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-500/10 p-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">실패</p>
                <p className="text-xl font-bold text-red-400">
                  {generations.filter((g) => g.status === 'failed').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <p className="text-sm text-[var(--text-tertiary)]">
              작업 목록을 불러오는 중...
            </p>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">
            데이터를 불러오는 중 오류가 발생했습니다
          </p>
        </div>
      )}

      {/* 데이터 테이블 */}
      {!isLoading && generations && (
        <>
          <DataTable
            columns={columns}
            data={generations}
            emptyMessage="생성 작업이 없습니다"
          />

          {/* 페이지네이션 */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  page === 1
                    ? 'cursor-not-allowed bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                )}
              >
                이전
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === pagination.totalPages ||
                      Math.abs(p - page) <= 2
                  )
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-2 text-[var(--text-tertiary)]">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={cn(
                          'h-8 min-w-[2rem] rounded-lg px-3 text-sm font-medium transition-colors',
                          p === page
                            ? 'bg-brand-500 text-white'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                        )}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  page === pagination.totalPages
                    ? 'cursor-not-allowed bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                )}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {/* 에러 상세 모달 */}
      {errorModal.generation && (
        <ErrorModal
          isOpen={errorModal.isOpen}
          onClose={() => setErrorModal({ isOpen: false, generation: null })}
          generation={errorModal.generation}
        />
      )}
    </div>
  );
}
