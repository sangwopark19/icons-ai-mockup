'use client';

import { useEffect, useState } from 'react';
import { Users, Image as ImageIcon, AlertTriangle, ListOrdered, HardDrive, Key } from 'lucide-react';
import { adminApi, DashboardStats, HourlyChartPoint } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { KpiCard } from '@/components/admin/kpi-card';
import { KpiSkeleton } from '@/components/admin/kpi-skeleton';
import { FailureChart } from '@/components/admin/failure-chart';

function computeDelta(
  current: number,
  yesterday: number
): { value: number; percentage: number } | null {
  if (yesterday === 0 && current === 0) return null;
  const value = current - yesterday;
  const percentage = yesterday === 0 ? 100 : Math.round((value / yesterday) * 1000) / 10;
  return { value, percentage };
}

export default function DashboardPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chart, setChart] = useState<HourlyChartPoint[] | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!accessToken || !mounted) return;
      try {
        const [statsRes, chartRes] = await Promise.all([
          adminApi.getDashboardStats(accessToken),
          adminApi.getFailureChart(accessToken),
        ]);
        if (mounted) {
          setStats(statsRes.data);
          setChart(chartRes.data);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
    };

    fetchData();
    const id = setInterval(fetchData, 30_000);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [accessToken]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">대시보드</h1>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {stats === null ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              label="전체 사용자"
              value={stats.userCount}
              icon={<Users className="h-5 w-5" />}
              delta={computeDelta(stats.userCount, stats.userCountYesterday)}
            />
            <KpiCard
              label="전체 생성 수"
              value={stats.generationCount}
              icon={<ImageIcon className="h-5 w-5" />}
              delta={computeDelta(stats.generationCount, stats.generationCountYesterday)}
            />
            <KpiCard
              label="실패 작업 (24h)"
              value={stats.failedJobCount}
              icon={<AlertTriangle className="h-5 w-5" />}
              delta={computeDelta(stats.failedJobCount, stats.failedJobCountYesterday)}
            />
            <KpiCard
              label="대기열 깊이"
              value={stats.queueDepth}
              icon={<ListOrdered className="h-5 w-5" />}
            />
            <KpiCard
              label="스토리지 사용량"
              value={stats.storageBytes}
              icon={<HardDrive className="h-5 w-5" />}
              format="bytes"
            />
            <KpiCard
              label="활성 API 키"
              value={stats.activeApiKeys ? stats.activeApiKeys.callCount : '없음'}
              icon={<Key className="h-5 w-5" />}
              subtitle={stats.activeApiKeys ? `키: ${stats.activeApiKeys.alias}` : '활성 키 미설정'}
            />
          </>
        )}
      </div>

      {/* Failure Chart */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
          시간대별 실패 건수 (24시간)
        </h2>
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] p-4 shadow-sm">
          {chart === null ? (
            <div className="h-[250px] animate-pulse rounded bg-muted" />
          ) : (
            <FailureChart data={chart} />
          )}
        </div>
      </section>
    </div>
  );
}
