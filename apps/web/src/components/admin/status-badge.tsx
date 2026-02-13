'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

/**
 * 상태 타입
 */
export type Status = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * 상태 배지 Props
 */
export interface StatusBadgeProps {
  status: Status;
  className?: string;
}

/**
 * 상태별 설정
 */
const statusConfig: Record<
  Status,
  {
    label: string;
    className: string;
    dotClassName: string;
  }
> = {
  pending: {
    label: '대기중',
    className: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    dotClassName: 'bg-gray-400',
  },
  processing: {
    label: '처리중',
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    dotClassName: 'bg-blue-400',
  },
  completed: {
    label: '완료',
    className: 'bg-green-500/10 text-green-400 border-green-500/20',
    dotClassName: 'bg-green-400',
  },
  failed: {
    label: '실패',
    className: 'bg-red-500/10 text-red-400 border-red-500/20',
    dotClassName: 'bg-red-400',
  },
};

/**
 * 상태 배지 컴포넌트
 */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        config.className,
        className
      )}
      role="status"
      aria-label={`상태: ${config.label}`}
    >
      {/* 애니메이션 도트 */}
      <span className="relative flex h-2 w-2">
        {status === 'processing' && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              config.dotClassName
            )}
          />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', config.dotClassName)} />
      </span>
      {config.label}
    </span>
  );
}
