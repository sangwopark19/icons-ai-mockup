'use client';

import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  delta?: { value: number; percentage: number } | null;
  format?: 'number' | 'bytes';
  placeholder?: boolean;
  subtitle?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(1)} ${units[i]}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value);
}

export function KpiCard({ label, value, icon, delta, format = 'number', placeholder = false, subtitle }: KpiCardProps) {
  const displayValue = (() => {
    if (placeholder) return 'N/A';
    if (typeof value === 'string') return value;
    if (format === 'bytes') return formatBytes(value);
    return formatNumber(value);
  })();

  const deltaColor =
    delta === null || delta === undefined
      ? ''
      : delta.value > 0
        ? 'text-green-600 dark:text-green-400'
        : delta.value < 0
          ? 'text-red-600 dark:text-red-400'
          : 'text-[var(--text-secondary)]';

  const DeltaIcon =
    delta && delta.value > 0 ? ArrowUp : delta && delta.value < 0 ? ArrowDown : null;

  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card,#fff)] p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
        <span className="text-[var(--text-secondary)]">{icon}</span>
      </div>

      <p className={`mb-1 text-3xl font-bold ${placeholder ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
        {displayValue}
      </p>

      {delta !== null && delta !== undefined ? (
        <div className={`flex items-center gap-0.5 text-sm font-medium ${deltaColor}`}>
          {DeltaIcon && <DeltaIcon className="h-4 w-4" />}
          <span>
            {delta.value > 0 ? '+' : ''}
            {formatNumber(delta.value)} ({delta.percentage > 0 ? '+' : ''}
            {delta.percentage.toFixed(1)}%)
          </span>
        </div>
      ) : subtitle ? (
        <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>
      ) : (
        <p className="text-sm text-[var(--text-secondary)]">—</p>
      )}
    </div>
  );
}

export default KpiCard;
