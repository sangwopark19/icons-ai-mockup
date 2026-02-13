'use client';

import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * 통계 카드 Props
 */
export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

/**
 * 통계 카드 컴포넌트
 */
export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 transition-all duration-300',
        'hover:border-[var(--border-hover)] hover:bg-[var(--bg-tertiary)] hover:shadow-md',
        className
      )}
    >
      {/* 배경 그라데이션 효과 */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-500/5 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-0" />

      <div className="relative flex items-start justify-between">
        {/* 아이콘 */}
        <div className="rounded-lg bg-brand-500/10 p-3 transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-6 w-6 text-brand-500" />
        </div>

        {/* 트렌드 배지 */}
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
              trend.isPositive
                ? 'bg-green-500/10 text-green-500'
                : 'bg-red-500/10 text-red-500'
            )}
          >
            <svg
              className={cn('h-3 w-3', !trend.isPositive && 'rotate-180')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      {/* 통계 정보 */}
      <div className="mt-4 space-y-1">
        <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
        <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}
