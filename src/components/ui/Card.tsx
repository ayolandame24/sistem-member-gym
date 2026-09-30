import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-ink-100 shadow-card ${
        hover ? 'transition-all duration-200 hover:shadow-card-hover' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  subtitle,
  action,
  className = '',
}: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 px-5 pt-5 pb-4 ${className}`}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-ink-900 truncate">{title}</h3>
        {subtitle && (
          <p className="text-xs text-ink-500 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
