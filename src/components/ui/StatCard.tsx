import { type ReactNode } from 'react';
import { Card } from './Card';
import { Sparkline } from './Charts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  iconBg: string;
  trend?: number;
  trendLabel?: string;
  sparkData?: number[];
}

export function StatCard({
  label,
  value,
  icon,
  iconBg,
  trend,
  trendLabel = 'vs bulan lalu',
  sparkData,
}: StatCardProps) {
  const trendUp = (trend ?? 0) >= 0;
  return (
    <Card hover className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              trendUp ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className="text-2xl font-bold text-ink-900 tnum mt-1">{value}</p>
      {sparkData && (
        <div className="mt-3">
          <Sparkline data={sparkData} showTrend={false} height={32} />
        </div>
      )}
      {trend !== undefined && (
        <p className="text-[11px] text-ink-400 mt-2">{trendLabel}</p>
      )}
    </Card>
  );
}
