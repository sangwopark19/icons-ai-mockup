'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface FailureChartProps {
  data: { hour: string; count: number }[];
}

function formatHour(isoString: string): string {
  try {
    const date = new Date(isoString);
    return `${date.getHours()}시`;
  } catch {
    return isoString;
  }
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (active && payload && payload.length > 0) {
    return (
      <div className="rounded border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-2 text-sm shadow">
        <p className="text-[var(--text-secondary)]">{label ? formatHour(label) : ''}</p>
        <p className="font-semibold text-[var(--text-primary)]">{payload[0].value}건</p>
      </div>
    );
  }
  return null;
}

export function FailureChart({ data }: FailureChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-[var(--text-secondary)]">
        최근 24시간 실패 없음
      </div>
    );
  }

  return (
    // NOTE: ResponsiveContainer may render blank in some React 19.2.x builds.
    // If that occurs, replace with explicit width/height on BarChart directly.
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default, #e5e7eb)" />
        <XAxis
          dataKey="hour"
          tickFormatter={formatHour}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={32}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default FailureChart;
