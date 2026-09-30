import {
  Wallet,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Download,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RevenueBarChart } from '@/components/ui/Charts';
import { Badge } from '@/components/ui/Badge';
import {
  formatIDR,
  formatDateID,
  monthlyRevenue,
  totalRevenue,
  recognizedRevenue,
  accountsReceivable,
  outstandingInvoices,
  mrr,
} from '@/data/mock';

export function Accounting() {
  const currentMonth = monthlyRevenue[monthlyRevenue.length - 1];
  const prevMonth = monthlyRevenue[monthlyRevenue.length - 2];
  const revGrowth =
    ((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100;
  const recognizedPct = (recognizedRevenue / totalRevenue) * 100;
  const arPct = (accountsReceivable / totalRevenue) * 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">
            Accounting & Revenue
          </h1>
          <p className="text-sm text-ink-500 mt-0.5">
            Ringkasan keuangan dan pengakuan pendapatan
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<Download size={16} />}
          className="hidden sm:inline-flex"
        >
          Export Laporan
        </Button>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Revenue"
          value={formatIDR(totalRevenue)}
          icon={<Wallet size={20} className="text-brand-600" />}
          iconBg="bg-brand-50"
          sub={`${monthlyRevenue.length} bulan akumulasi`}
          trend={revGrowth}
        />
        <SummaryCard
          label="Recognized Revenue"
          value={formatIDR(recognizedRevenue)}
          icon={<CheckCircle size={20} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          sub={`${recognizedPct.toFixed(1)}% dari total revenue`}
        />
        <SummaryCard
          label="Accounts Receivable"
          value={formatIDR(accountsReceivable)}
          icon={<Clock size={20} className="text-amber-600" />}
          iconBg="bg-amber-50"
          sub={`${arPct.toFixed(1)}% dari total revenue`}
        />
        <SummaryCard
          label="Monthly Recurring Revenue"
          value={formatIDR(mrr)}
          icon={<TrendingUp size={20} className="text-violet-600" />}
          iconBg="bg-violet-50"
          sub="Dari langganan aktif"
        />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader
          title="Monthly Revenue Chart"
          subtitle="Revenue vs Recognized Revenue per bulan"
          action={
            <Badge tone="brand" dot>
              {formatIDR(currentMonth.revenue)} bulan ini
            </Badge>
          }
        />
        <RevenueBarChart data={monthlyRevenue} height={280} />
      </Card>

      {/* Revenue summary table + outstanding */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue summary */}
        <Card>
          <CardHeader
            title="Revenue Summary"
            subtitle="Rincian pendapatan bulanan"
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  {['Bulan', 'Revenue', 'Recognized', 'Selisih'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-ink-500 uppercase tracking-wider px-5 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {monthlyRevenue.slice(-5).map((m) => {
                  const diff = m.revenue - m.recognized;
                  return (
                    <tr key={m.month} className="hover:bg-ink-50/50">
                      <td className="px-5 py-3">
                        <span className="text-sm font-semibold text-ink-900">
                          {m.month} 2026
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-bold text-ink-900 tnum">
                          {formatIDR(m.revenue)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-ink-600 tnum">
                          {formatIDR(m.recognized)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-amber-600 tnum">
                          {formatIDR(diff)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink-100 bg-ink-50/50">
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold text-ink-900">
                      Total
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold text-brand-600 tnum">
                      {formatIDR(totalRevenue)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold text-emerald-600 tnum">
                      {formatIDR(recognizedRevenue)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold text-amber-600 tnum">
                      {formatIDR(totalRevenue - recognizedRevenue)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Outstanding invoices */}
        <Card>
          <CardHeader
            title="Outstanding Invoices"
            subtitle={`${outstandingInvoices.length} invoice belum dibayar`}
            action={
              <Badge tone="danger" dot>
                {formatIDR(accountsReceivable)}
              </Badge>
            }
          />
          <div className="px-2 pb-3">
            {outstandingInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-ink-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center">
                  <AlertCircle size={16} className="text-rose-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900 truncate">
                    {inv.memberName}
                  </p>
                  <p className="text-xs text-ink-500 truncate">
                    {inv.number} · Jatuh tempo {formatDateID(inv.dueDate)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-ink-900 tnum">
                    {formatIDR(inv.amount)}
                  </p>
                  <Badge tone={inv.status === 'Overdue' ? 'danger' : 'warning'}>
                    {inv.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  iconBg,
  sub,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  sub: string;
  trend?: number;
}) {
  const trendUp = (trend ?? 0) >= 0;
  return (
    <Card hover className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs font-semibold ${
              trendUp ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trendUp ? '+' : ''}
            {trend.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className="text-2xl font-bold text-ink-900 tnum mt-1">{value}</p>
      <p className="text-[11px] text-ink-400 mt-2">{sub}</p>
    </Card>
  );
}
