'use client';

export function KpiSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card,#fff)] p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        {/* Label area */}
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        {/* Icon area */}
        <div className="h-5 w-5 animate-pulse rounded bg-muted" />
      </div>
      {/* Value area */}
      <div className="mb-2 h-9 w-32 animate-pulse rounded bg-muted" />
      {/* Delta area */}
      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
    </div>
  );
}

export default KpiSkeleton;
