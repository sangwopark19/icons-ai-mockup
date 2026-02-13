'use client';

import * as React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * 사이드바 링크 Props
 */
export interface SidebarLinkProps {
  href: string;
  icon: LucideIcon;
  label: string;
  isActive?: boolean;
  badge?: string | number;
  className?: string;
}

/**
 * 사이드바 링크 컴포넌트
 */
export function SidebarLink({
  href,
  icon: Icon,
  label,
  isActive = false,
  badge,
  className,
}: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-brand-500/10 text-brand-400 shadow-sm'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
        className
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* 활성 상태 인디케이터 */}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" />
      )}

      {/* 아이콘 */}
      <Icon
        className={cn(
          'h-5 w-5 transition-transform duration-200 group-hover:scale-110',
          isActive && 'text-brand-500'
        )}
      />

      {/* 레이블 */}
      <span className="flex-1">{label}</span>

      {/* 배지 */}
      {badge !== undefined && (
        <span
          className={cn(
            'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums',
            isActive
              ? 'bg-brand-500 text-white'
              : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)]'
          )}
        >
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}
