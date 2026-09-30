import { useMemo } from 'react';
import { Wallet, CheckCircle, Clock, AlertCircle, TrendingUp, Download } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RevenueBarChart } from '@/components/ui/Charts';
import { Badge } from '@/components/ui/Badge';
import { StatsSkeleton } from '@/components/ui/Skeleton';
import { useMonthlyRevenue } from '@/hooks/useMonthlyRevenue';
import { useInvoices } from '@/hooks/useInvoices';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { formatIDR, formatDateID } from '@/data/mock';

function escapeCSV(val: string | number): string {
  const s = String(val);
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

export function Accounting() {
  const { monthlyRevenue, loading: loadingRevenue } = useMonthlyRevenue();
  const { invoices, loading: loadingInvoices } = useInvoices();
  const { subscriptions } = useSubscriptions();

  const totalRevenue = useMemo(() => monthlyRevenue.reduce((s, m) => s + m.revenue, 0), [monthlyRevenue]);
  const recognizedRevenue = useMemo(() => monthlyRevenue.reduce((s, m) => s + m.recognized, 0), [monthlyRevenue]);
  const mrr = useMemo(() => subscriptions.filter((s) => s.status === 'Active').reduce((acc, s) => acc + s.monthlyFee, 0), [subscriptions]);
  const outstandingInvoices = useMemo(() => invoices.filter((i) => i.status !== 'Paid'), [invoices]);
  const accountsReceivable = useMemo(() => outstandingInvoices.reduce((s, i) => s + i.amount, 0), [outstandingInvoices]);

  const currentMonth = monthlyRevenue[monthlyRevenue.length - 1];
  const prevMonth = monthlyRevenue[monthlyRevenue.length - 2];
  const revGrowth = currentMonth && prevMonth ? ((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 : 0;
  const recognizedPct = totalRevenue > 0 ? (recognizedRevenue / totalRevenue) * 100 : 0;
  const arPct = totalRevenue > 0 ? (accountsReceivable / totalRevenue) * 100 : 0;

  const exportCSV = () => {
    const headers = ['Bulan', 'Revenue', 'Recognized', 'Selisih'];
    const rows = monthlyRevenue.map((m) => [m.month + ` ${new Date().getFullYear()}`, m.revenue, m.recognized, m.revenue - m.recognized]);
    const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `accounting_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Accounting & Revenue</h1>
          <p className="text-sm text-ink-500 mt-0.5">Ringkasan keuangan dan pengakuan pendapatan</p>
        </div>
        <Button variant="secondary" icon={<Download size={16}/>} className="hidden sm:inline-flex" onClick={exportCSV}>Export CSV</Button>
      </div>

      {loadingRevenue ? <StatsSkeleton/> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard label="Total Revenue" value={formatIDR(totalRevenue)} icon={<Wallet size={20} className="text-brand-600"/>} iconBg="bg-brand-50" sub={`${monthlyRevenue.length} bulan akumulasi`} trend={revGrowth}/>
          <SummaryCard label="Recognized Revenue" value={formatIDR(recognizedRevenue)} icon={<CheckCircle size={20} className="text-emerald-600"/>} iconBg="bg-emerald-50" sub={`${recognizedPct.toFixed(1)}% dari total revenue`}/>
          <SummaryCard label="Accounts Receivable" value={formatIDR(accountsReceivable)} icon={<Clock size={20} className="text-amber-600"/>} iconBg="bg-amber-50" sub={`${arPct.toFixed(1)}% dari total revenue`}/>
          <SummaryCard label="Monthly Recurring Revenue" value={formatIDR(mrr)} icon={<TrendingUp size={20} className="text-violet-600"/>} iconBg="bg-violet-50" sub="Dari langganan aktif"/>
        </div>
      )}

      <Card>
        <CardHeader title="Monthly Revenue Chart" subtitle="Revenue vs Recognized Revenue per bulan"
          action={currentMonth ? <Badge tone="brand" dot>{formatIDR(currentMonth.revenue)} bulan ini</Badge> : undefined}/>
        {monthlyRevenue.length > 0 ? <RevenueBarChart data={monthlyRevenue} height={280}/> : (
          <div className="h-64 flex items-center justify-center text-sm text-ink-400">Belum ada data revenue</div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Revenue Summary" subtitle="Rincian pendapatan bulanan"/>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  {['Bulan','Revenue','Recognized','Selisih'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-ink-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {monthlyRevenue.slice(-5).map((m) => {
                  const diff = m.revenue - m.recognized;
                  return (
                    <tr key={m.month} className="hover:bg-ink-50/50">
                      <td className="px-5 py-3"><span className="text-sm font-semibold text-ink-900">{m.month} {new Date().getFullYear()}</span></td>
                      <td className="px-5 py-3"><span className="text-sm font-bold text-ink-900 tnum">{formatIDR(m.revenue)}</span></td>
                      <td className="px-5 py-3"><span className="text-sm text-ink-600 tnum">{formatIDR(m.recognized)}</span></td>
                      <td className="px-5 py-3"><span className="text-sm text-amber-600 tnum">{formatIDR(diff)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink-100 bg-ink-50/50">
                  <td className="px-5 py-3"><span className="text-sm font-bold text-ink-900">Total</span></td>
                  <td className="px-5 py-3"><span className="text-sm font-bold text-brand-600 tnum">{formatIDR(totalRevenue)}</span></td>
                  <td className="px-5 py-3"><span className="text-sm font-bold text-emerald-600 tnum">{formatIDR(recognizedRevenue)}</span></td>
                  <td className="px-5 py-3"><span className="text-sm font-bold text-amber-600 tnum">{formatIDR(totalRevenue - recognizedRevenue)}</span></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Outstanding Invoices" subtitle={`${outstandingInvoices.length} invoice belum dibayar`}
            action={<Badge tone="danger" dot>{formatIDR(accountsReceivable)}</Badge>}/>
          {loadingInvoices ? (
            <div className="px-5 py-4 text-sm text-ink-400">Memuat...</div>
          ) : outstandingInvoices.length === 0 ? (
            <div className="px-5 py-6 text-sm text-ink-400 text-center">Semua invoice sudah lunas 🎉</div>
          ) : (
            <div className="px-2 pb-3">
              {outstandingInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-ink-50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center"><AlertCircle size={16} className="text-rose-600"/></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900 truncate">{inv.memberName}</p>
                    <p className="text-xs text-ink-500 truncate">{inv.number} · Jatuh tempo {formatDateID(inv.dueDate)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-ink-900 tnum">{formatIDR(inv.amount)}</p>
                    <Badge tone={inv.status === 'Overdue' ? 'danger' : 'warning'}>{inv.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, iconBg, sub, trend }: { label: string; value: string; icon: React.ReactNode; iconBg: string; sub: string; trend?: number }) {
  const trendUp = (trend ?? 0) >= 0;
  return (
    <Card hover className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>{icon}</div>
        {trend !== undefined && (
          <span className={`text-xs font-semibold ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trendUp ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-ink-500">{label}</p>
      <p className="text-2xl font-bold text-ink-900 tnum mt-1">{value}</p>
      <p className="text-[11px] text-ink-400 mt-2">{sub}</p>
    </Card>
  );
}
