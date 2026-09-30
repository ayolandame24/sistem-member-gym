import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BarChartProps {
  data: { month: string; revenue: number; recognized: number }[];
  height?: number;
  showRecognized?: boolean;
}

export function RevenueBarChart({
  data,
  height = 240,
  showRecognized = true,
}: BarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.revenue)) * 1.1;
  const formatShort = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
    return String(v);
  };

  return (
    <div className="px-5 pb-5">
      <div className="flex items-end gap-3" style={{ height }}>
        {data.map((d, i) => {
          const revH = (d.revenue / max) * (height - 30);
          const recH = (d.recognized / max) * (height - 30);
          const isHovered = hovered === i;
          return (
            <div
              key={d.month}
              className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {isHovered && (
                <div className="absolute -translate-y-2 z-10 bg-ink-900 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-pop whitespace-nowrap tnum">
                  <div>Revenue: Rp {formatShort(d.revenue)}</div>
                  {showRecognized && (
                    <div className="text-ink-300">
                      Recognized: Rp {formatShort(d.recognized)}
                    </div>
                  )}
                </div>
              )}
              <div className="w-full flex items-end justify-center gap-1 flex-1 relative">
                {showRecognized && (
                  <div
                    className="w-2.5 rounded-t-md bg-brand-200 transition-all duration-300 group-hover:bg-brand-300"
                    style={{ height: `${recH}px` }}
                  />
                )}
                <div
                  className={`w-2.5 rounded-t-md transition-all duration-300 ${
                    isHovered ? 'bg-brand-600' : 'bg-brand-500'
                  }`}
                  style={{ height: `${revH}px` }}
                />
              </div>
              <span className="text-[11px] font-medium text-ink-500">
                {d.month}
              </span>
            </div>
          );
        })}
      </div>
      {showRecognized && (
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-ink-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-500" />
            <span className="text-xs text-ink-600 font-medium">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-200" />
            <span className="text-xs text-ink-600 font-medium">Recognized</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface DonutProps {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}

export function DonutChart({ segments, size = 160 }: DonutProps) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const radius = size / 2;
  const stroke = 22;
  const circumference = 2 * Math.PI * (radius - stroke / 2);
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={radius}
            cy={radius}
            r={radius - stroke / 2}
            fill="none"
            stroke="#eef0f4"
            strokeWidth={stroke}
          />
          {segments.map((seg) => {
            const dash = (seg.value / total) * circumference;
            const el = (
              <circle
                key={seg.label}
                cx={radius}
                cy={radius}
                r={radius - stroke / 2}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className={seg.color}
              />
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-ink-900 tnum">
            {total}
          </span>
          <span className="text-xs text-ink-500 font-medium">Total</span>
        </div>
      </div>
      <div className="space-y-2.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2.5">
            <span className={`w-3 h-3 rounded-sm ${seg.color}`} />
            <span className="text-sm text-ink-700 font-medium">{seg.label}</span>
            <span className="text-sm text-ink-400 tnum ml-auto">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  showTrend?: boolean;
}

export function Sparkline({
  data,
  color = 'text-brand-500',
  height = 40,
  showTrend = true,
}: SparklineProps) {
  if (data.length < 2) return null;
  const w = 100;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = height - ((d - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');
  const trendUp = data[data.length - 1] >= data[0];
  const pct = ((data[data.length - 1] - data[0]) / data[0]) * 100;

  return (
    <div className="flex items-center gap-3">
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className={`${color} flex-1`}
        preserveAspectRatio="none"
        style={{ height }}
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showTrend && (
        <span
          className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
            trendUp ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {Math.abs(pct).toFixed(1)}%
        </span>
      )}
    </div>
  );
}
