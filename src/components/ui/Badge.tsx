type Tone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'brand'
  | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}

const toneStyles: Record<Tone, { bg: string; text: string; dot: string }> = {
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  danger: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  info: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  neutral: { bg: 'bg-ink-100', text: 'text-ink-600', dot: 'bg-ink-400' },
  brand: { bg: 'bg-brand-50', text: 'text-brand-700', dot: 'bg-brand-500' },
  purple: { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500' },
};

export function Badge({ children, tone = 'neutral', dot = false, className = '' }: BadgeProps) {
  const t = toneStyles[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${t.bg} ${t.text} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />}
      {children}
    </span>
  );
}

// Convenience helpers for common domain statuses
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Tone> = {
    Active: 'success',
    Paid: 'success',
    Success: 'success',
    Expired: 'warning',
    Unpaid: 'warning',
    Pending: 'warning',
    Suspended: 'danger',
    Overdue: 'danger',
    Failed: 'danger',
    Cancelled: 'neutral',
    Paused: 'info',
  };
  return (
    <Badge tone={map[status] ?? 'neutral'} dot>
      {status}
    </Badge>
  );
}
