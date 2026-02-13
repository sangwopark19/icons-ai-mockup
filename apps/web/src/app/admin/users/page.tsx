'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, ShieldOff, Trash2, UserCog, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { adminApi } from '@/lib/api';
import type { AdminUser } from '@mockup-ai/shared';
import { DataTable, type TableColumn } from '@/components/admin/data-table';
import { SearchFilter } from '@/components/admin/search-filter';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

/**
 * 사용자 관리 페이지
 */
export default function UsersPage() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  // 필터 상태
  const [searchValue, setSearchValue] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [activeFilter, setActiveFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const limit = 20;

  // 모달 상태
  const [confirmModal, setConfirmModal] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    onConfirm: () => {},
  });

  // 사용자 목록 조회
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', page, limit, searchValue, roleFilter, activeFilter],
    queryFn: async () => {
      if (!accessToken) throw new Error('인증 토큰이 없습니다');

      return adminApi.getUsers(accessToken, {
        page,
        limit,
        search: searchValue || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
      });
    },
    enabled: !!accessToken,
  });

  // 역할 변경 Mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'user' | 'admin' }) => {
      if (!accessToken) throw new Error('인증 토큰이 없습니다');
      return adminApi.updateUserRole(accessToken, userId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  // 활성 상태 토글 Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      if (!accessToken) throw new Error('인증 토큰이 없습니다');
      return adminApi.toggleUserActive(accessToken, userId, isActive);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  // 사용자 삭제 Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!accessToken) throw new Error('인증 토큰이 없습니다');
      return adminApi.deleteUser(accessToken, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  // 역할 변경 핸들러
  const handleRoleChange = (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setConfirmModal({
      isOpen: true,
      title: '역할 변경',
      message: `${user.name}님의 역할을 ${newRole === 'admin' ? '관리자' : '일반 사용자'}로 변경하시겠습니까?`,
      variant: 'warning',
      onConfirm: () => {
        updateRoleMutation.mutate({ userId: user.id, role: newRole });
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  // 활성 상태 토글 핸들러
  const handleToggleActive = (user: AdminUser) => {
    const newStatus = !user.isActive;
    setConfirmModal({
      isOpen: true,
      title: newStatus ? '사용자 활성화' : '사용자 비활성화',
      message: `${user.name}님을 ${newStatus ? '활성화' : '비활성화'}하시겠습니까?${!newStatus ? ' 비활성화된 사용자는 로그인할 수 없습니다.' : ''}`,
      variant: newStatus ? 'info' : 'warning',
      onConfirm: () => {
        toggleActiveMutation.mutate({ userId: user.id, isActive: newStatus });
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  // 사용자 삭제 핸들러
  const handleDelete = (user: AdminUser) => {
    setConfirmModal({
      isOpen: true,
      title: '사용자 삭제',
      message: `${user.name}님을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 사용자의 모든 데이터가 삭제됩니다.`,
      variant: 'danger',
      onConfirm: () => {
        deleteUserMutation.mutate(user.id);
        setConfirmModal({ ...confirmModal, isOpen: false });
      },
    });
  };

  // 테이블 컬럼 정의
  const columns: TableColumn<AdminUser>[] = [
    {
      key: 'email',
      label: '이메일',
      render: (user) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-[var(--text-primary)]">{user.email}</span>
          <span className="text-xs text-[var(--text-tertiary)]">{user.name}</span>
        </div>
      ),
    },
    {
      key: 'role',
      label: '역할',
      render: (user) => (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            user.role === 'admin'
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          )}
        >
          {user.role === 'admin' ? <Shield className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
          {user.role === 'admin' ? '관리자' : '사용자'}
        </span>
      ),
      className: 'w-28',
    },
    {
      key: 'isActive',
      label: '상태',
      render: (user) => (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
            user.isActive
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
          )}
        >
          {user.isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {user.isActive ? '활성' : '비활성'}
        </span>
      ),
      className: 'w-24',
    },
    {
      key: 'stats',
      label: '통계',
      render: (user) => (
        <div className="flex gap-3 text-xs text-[var(--text-tertiary)]">
          <span>프로젝트 {user._count?.projects ?? 0}개</span>
          <span className="text-[var(--border-default)]">|</span>
          <span>세션 {user._count?.sessions ?? 0}개</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: '가입일',
      render: (user) => (
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="text-[var(--text-secondary)]">
            {new Date(user.createdAt).toLocaleDateString('ko-KR')}
          </span>
          {user.lastLoginAt && (
            <span className="text-[var(--text-tertiary)]">
              최근 로그인: {new Date(user.lastLoginAt).toLocaleDateString('ko-KR')}
            </span>
          )}
        </div>
      ),
      className: 'w-36',
    },
    {
      key: 'actions',
      label: '액션',
      render: (user) => (
        <div className="flex items-center gap-2">
          {/* 역할 변경 */}
          <button
            onClick={() => handleRoleChange(user)}
            className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-purple-400"
            title={user.role === 'admin' ? '일반 사용자로 변경' : '관리자로 변경'}
          >
            <UserCog className="h-4 w-4" />
          </button>

          {/* 활성/비활성 토글 */}
          <button
            onClick={() => handleToggleActive(user)}
            className={cn(
              'rounded-lg p-2 transition-colors',
              user.isActive
                ? 'text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-yellow-400'
                : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] hover:text-green-400'
            )}
            title={user.isActive ? '비활성화' : '활성화'}
          >
            {user.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
          </button>

          {/* 삭제 */}
          <button
            onClick={() => handleDelete(user)}
            className="rounded-lg p-2 text-[var(--text-tertiary)] transition-colors hover:bg-red-500/10 hover:text-red-400"
            title="사용자 삭제"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: 'w-32',
    },
  ];

  // 검색어 변경 시 페이지 초기화
  React.useEffect(() => {
    setPage(1);
  }, [searchValue, roleFilter, activeFilter]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">사용자 관리</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          시스템 사용자를 관리하고 권한을 설정합니다
        </p>
      </div>

      {/* 검색 및 필터 */}
      <SearchFilter
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="이메일 또는 이름으로 검색..."
        filters={[
          {
            label: '역할',
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { label: '전체 역할', value: 'all' },
              { label: '일반 사용자', value: 'user' },
              { label: '관리자', value: 'admin' },
            ],
          },
          {
            label: '상태',
            value: activeFilter,
            onChange: setActiveFilter,
            options: [
              { label: '전체 상태', value: 'all' },
              { label: '활성', value: 'active' },
              { label: '비활성', value: 'inactive' },
            ],
          },
        ]}
      />

      {/* 통계 요약 */}
      {data && (
        <div className="flex items-center gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--text-tertiary)]">총</span>
            <span className="text-2xl font-bold text-brand-500">{data.data.total}</span>
            <span className="text-sm text-[var(--text-tertiary)]">명</span>
          </div>
          <div className="h-8 w-px bg-[var(--border-default)]" />
          <div className="text-sm text-[var(--text-secondary)]">
            페이지 {data.data.page} / {data.data.totalPages}
          </div>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
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
            data={data.data.users}
            emptyMessage="사용자가 없습니다"
          />

          {/* 페이지네이션 */}
          {data.data.totalPages > 1 && (
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
                {Array.from({ length: data.data.totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === data.data.totalPages ||
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
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.data.totalPages, p + 1))}
                disabled={page === data.data.totalPages}
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
        variant={confirmModal.variant}
        isLoading={
          updateRoleMutation.isPending ||
          toggleActiveMutation.isPending ||
          deleteUserMutation.isPending
        }
      />
    </div>
  );
}
