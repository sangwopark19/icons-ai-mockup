'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Users, FolderKanban, Sparkles, HardDrive } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { adminApi } from '@/lib/api';
import { StatCard } from '@/components/admin/stat-card';
import { StatusBadge } from '@/components/admin/status-badge';

/**
 * 관리자 대시보드 페이지
 */
export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading } = useAuthStore();

  // 인증 및 권한 확인
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // 통계 데이터 로드
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      if (!accessToken) throw new Error('No access token');
      const response = await adminApi.getStats(accessToken);
      return response.data;
    },
    enabled: !!accessToken && user?.role === 'admin',
    refetchInterval: 30000, // 30초마다 자동 갱신
  });

  // 로딩 중
  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  // 스토리지 사용량 계산 (GB 단위)
  const storageGB = stats?.storageUsageBytes
    ? (stats.storageUsageBytes / (1024 * 1024 * 1024)).toFixed(2)
    : '0.00';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b border-[var(--border-default)] bg-[var(--bg-secondary)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-xl shadow-lg shadow-brand-500/20">
              ⚡
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)]">
                관리자 대시보드
              </h1>
              <p className="text-xs text-[var(--text-tertiary)]">System Overview</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
              <p className="text-xs text-[var(--text-tertiary)]">Administrator</p>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* 시스템 통계 카드 */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              시스템 통계
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              실시간 시스템 현황을 확인하세요
            </p>
          </div>

          {isStatsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-xl bg-[var(--bg-secondary)]"
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="총 사용자 수"
                value={stats?.totalUsers ?? 0}
                icon={Users}
              />
              <StatCard
                title="총 프로젝트 수"
                value={stats?.totalProjects ?? 0}
                icon={FolderKanban}
              />
              <StatCard
                title="총 생성 작업 수"
                value={stats?.totalGenerations ?? 0}
                icon={Sparkles}
              />
              <StatCard
                title="스토리지 사용량"
                value={`${storageGB} GB`}
                icon={HardDrive}
              />
            </div>
          )}
        </section>

        {/* 생성 작업 상태별 통계 */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              생성 작업 현황
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              작업 상태별 분류 및 통계
            </p>
          </div>

          {isStatsLoading ? (
            <div className="h-40 animate-pulse rounded-xl bg-[var(--bg-secondary)]" />
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)]">
              <div className="grid gap-px bg-[var(--border-default)] sm:grid-cols-2 lg:grid-cols-4">
                {/* Pending */}
                <div className="bg-[var(--bg-secondary)] p-6 transition-all hover:bg-[var(--bg-tertiary)]">
                  <div className="mb-3 flex items-center justify-between">
                    <StatusBadge status="pending" />
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-500/10">
                      <span className="text-2xl">⏳</span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
                    {stats?.generationsByStatus.pending ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">대기 중인 작업</p>
                </div>

                {/* Processing */}
                <div className="bg-[var(--bg-secondary)] p-6 transition-all hover:bg-[var(--bg-tertiary)]">
                  <div className="mb-3 flex items-center justify-between">
                    <StatusBadge status="processing" />
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <span className="text-2xl">⚙️</span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
                    {stats?.generationsByStatus.processing ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">처리 중인 작업</p>
                </div>

                {/* Completed */}
                <div className="bg-[var(--bg-secondary)] p-6 transition-all hover:bg-[var(--bg-tertiary)]">
                  <div className="mb-3 flex items-center justify-between">
                    <StatusBadge status="completed" />
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                      <span className="text-2xl">✅</span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
                    {stats?.generationsByStatus.completed ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">완료된 작업</p>
                </div>

                {/* Failed */}
                <div className="bg-[var(--bg-secondary)] p-6 transition-all hover:bg-[var(--bg-tertiary)]">
                  <div className="mb-3 flex items-center justify-between">
                    <StatusBadge status="failed" />
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                      <span className="text-2xl">❌</span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
                    {stats?.generationsByStatus.failed ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">실패한 작업</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
