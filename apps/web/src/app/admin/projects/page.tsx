'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, FolderOpen, User, Image, Sparkles, Calendar } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { adminApi } from '@/lib/api';
import { DataTable, type TableColumn } from '@/components/admin/data-table';
import { SearchFilter } from '@/components/admin/search-filter';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

/**
 * 관리자 프로젝트 데이터 타입
 */
interface AdminProject {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  _count: {
    generations: number;
    characters: number;
  };
}

/**
 * 프로젝트 관리 페이지
 */
export default function ProjectsPage() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  // 필터 상태
  const [searchValue, setSearchValue] = React.useState('');
  const [userFilter, setUserFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const limit = 20;

  // 모달 상태
  const [confirmModal, setConfirmModal] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // 프로젝트 목록 조회
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'projects', page, limit, searchValue, userFilter],
    queryFn: async () => {
      if (!accessToken) throw new Error('인증 토큰이 없습니다');

      return adminApi.getProjects(accessToken, {
        page,
        limit,
        search: searchValue || undefined,
        userId: userFilter === 'all' ? undefined : userFilter,
      });
    },
    enabled: !!accessToken,
  });

  // 사용자 목록 조회 (필터용)
  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users-for-filter'],
    queryFn: async () => {
      if (!accessToken) throw new Error('인증 토큰이 없습니다');
      return adminApi.getUsers(accessToken, { limit: 100 });
    },
    enabled: !!accessToken,
  });

  // 프로젝트 삭제 Mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!accessToken) throw new Error('인증 토큰이 없습니다');
      return adminApi.deleteProject(accessToken, projectId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] });
    },
  });

  // 프로젝트 삭제 핸들러
  const handleDelete = (project: AdminProject) => {
    setConfirmModal({
      isOpen: true,
      title: '프로젝트 삭제',
      message: `"${project.name}" 프로젝트를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없으며, 프로젝트와 함께 모든 생성 작업(${project._count.generations}개), 캐릭터(${project._count.characters}개) 및 관련 이미지가 영구적으로 삭제됩니다.`,
      onConfirm: () => {
        deleteProjectMutation.mutate(project.id);
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  // 숫자 포맷팅 함수
  const formatNumber = (num: number): string => {
    return num.toLocaleString('ko-KR');
  };

  // 테이블 컬럼 정의
  const columns: TableColumn<AdminProject>[] = [
    {
      key: 'name',
      label: '프로젝트',
      render: (project) => (
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-semibold text-[var(--text-primary)] truncate">
              {project.name}
            </span>
            {project.description && (
              <span className="text-xs text-[var(--text-tertiary)] line-clamp-1">
                {project.description}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'user',
      label: '사용자',
      render: (project) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-secondary)] border border-[var(--border-default)]">
            {project.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium text-[var(--text-primary)] truncate">
              {project.user.name}
            </span>
            <span className="text-xs text-[var(--text-tertiary)] truncate">
              {project.user.email}
            </span>
          </div>
        </div>
      ),
      className: 'w-48',
    },
    {
      key: 'stats',
      label: '통계',
      render: (project) => (
        <div className="flex items-center gap-4">
          {/* 생성 수 */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
                {formatNumber(project._count.generations)}
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">
                생성
              </span>
            </div>
          </div>

          {/* 캐릭터 수 */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <Image className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[var(--text-primary)] tabular-nums">
                {formatNumber(project._count.characters)}
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide">
                캐릭터
              </span>
            </div>
          </div>
        </div>
      ),
      className: 'w-64',
    },
    {
      key: 'createdAt',
      label: '생성일',
      render: (project) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--text-tertiary)]" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-[var(--text-secondary)] tabular-nums">
              {new Date(project.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })}
            </span>
            <span className="text-xs text-[var(--text-tertiary)] tabular-nums">
              {new Date(project.createdAt).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      ),
      className: 'w-36',
    },
    {
      key: 'actions',
      label: '액션',
      render: (project) => (
        <button
          onClick={() => handleDelete(project)}
          className="rounded-lg p-2 text-[var(--text-tertiary)] transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 hover:scale-105 active:scale-95"
          title="프로젝트 삭제"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
      className: 'w-20',
    },
  ];

  // 검색어 변경 시 페이지 초기화
  React.useEffect(() => {
    setPage(1);
  }, [searchValue, userFilter]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">프로젝트 관리</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          사용자 프로젝트를 조회하고 관리합니다
        </p>
      </div>

      {/* 검색 및 필터 */}
      <SearchFilter
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="프로젝트 이름으로 검색..."
        filters={[
          {
            label: '사용자',
            value: userFilter,
            onChange: setUserFilter,
            options: [
              { label: '전체 사용자', value: 'all' },
              ...(usersData?.data || []).map((user) => ({
                label: `${user.name} (${user.email})`,
                value: user.id,
              })),
            ],
          },
        ]}
      />

      {/* 통계 요약 */}
      {data && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* 총 프로젝트 수 */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5 transition-all duration-200 hover:border-brand-500/30 hover:shadow-md hover:shadow-brand-500/5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                  총 프로젝트
                </span>
                <span className="text-3xl font-bold text-brand-500 tabular-nums">
                  {formatNumber(data.total)}
                </span>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10">
                <FolderOpen className="h-6 w-6 text-brand-400" />
              </div>
            </div>
          </div>

          {/* 현재 페이지 */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                  현재 페이지
                </span>
                <span className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
                  {data.page} <span className="text-xl text-[var(--text-tertiary)]">/ {data.totalPages}</span>
                </span>
              </div>
            </div>
          </div>

          {/* 표시 중인 항목 */}
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
                  표시 중
                </span>
                <span className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
                  {data.projects.length}
                  <span className="text-xl text-[var(--text-tertiary)]"> / {limit}</span>
                </span>
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
            <p className="text-sm text-[var(--text-tertiary)]">프로젝트 로딩 중...</p>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">데이터를 불러오는 중 오류가 발생했습니다</p>
        </div>
      )}

      {/* 데이터 테이블 */}
      {data && !isLoading && (
        <>
          <DataTable
            columns={columns}
            data={data.projects}
            emptyMessage="프로젝트가 없습니다"
          />

          {/* 페이지네이션 */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                이전
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === data.totalPages ||
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
                          'h-8 min-w-[2rem] rounded-lg px-3 text-sm font-medium transition-all duration-200',
                          p === page
                            ? 'bg-brand-500 text-white shadow-md'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                        )}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}

      {/* 확인 모달 */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant="danger"
        confirmLabel="삭제"
        isLoading={deleteProjectMutation.isPending}
      />
    </div>
  );
}
