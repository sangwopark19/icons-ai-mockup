'use client';

import * as React from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * 필터 옵션
 */
export interface FilterOption {
  label: string;
  value: string;
}

/**
 * 검색 필터 Props
 */
export interface SearchFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    label: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
  className?: string;
}

/**
 * 검색 필터 컴포넌트
 */
export function SearchFilter({
  searchValue,
  onSearchChange,
  searchPlaceholder = '검색...',
  filters = [],
  className,
}: SearchFilterProps) {
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // 검색어 초기화
  const handleClearSearch = () => {
    onSearchChange('');
    searchInputRef.current?.focus();
  };

  // Ctrl/Cmd + K로 검색 포커스
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center', className)}>
      {/* 검색 입력 */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          ref={searchInputRef}
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={cn(
            'h-10 w-full rounded-lg border bg-[var(--bg-tertiary)] pl-10 pr-10 text-sm text-[var(--text-primary)] transition-colors',
            'border-[var(--border-default)]',
            'placeholder:text-[var(--text-tertiary)]',
            'hover:border-[var(--border-hover)]',
            'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'
          )}
          aria-label="검색"
        />
        {searchValue && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
            aria-label="검색어 지우기"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* 키보드 단축키 힌트 */}
        {!searchValue && (
          <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 text-xs text-[var(--text-tertiary)] sm:flex">
            <kbd className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono">⌘</kbd>
            <kbd className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono">K</kbd>
          </div>
        )}
      </div>

      {/* 필터 드롭다운 */}
      {filters.map((filter, index) => (
        <div key={index} className="relative min-w-[160px]">
          <label className="sr-only">{filter.label}</label>
          <select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className={cn(
              'h-10 w-full appearance-none rounded-lg border bg-[var(--bg-tertiary)] pl-3 pr-10 text-sm text-[var(--text-primary)] transition-colors',
              'border-[var(--border-default)]',
              'hover:border-[var(--border-hover)]',
              'focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
              'cursor-pointer'
            )}
            aria-label={filter.label}
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        </div>
      ))}
    </div>
  );
}
