import { useMemo } from 'react';
import { Download, TrendingUp, Receipt, Users as UsersIcon } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { RevenueBarChart } from '@/components/ui/Charts';
import { useMonthlyRevenue } from '@/hooks/useMonthlyRevenue';
import { useInvoices } from '@/hooks/useInvoices';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useMembers } from '@/hooks/useMembers';
import { formatIDR, formatDateID } from '@/data/mock';

function escapeCSV(val: string | number): string {
  const s = String(val);
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

export function Reports() {
  const { monthlyRevenue } = useMonthlyRevenue();
  const { invoices } = useInvoices();
  const { subscriptions } = useSubscriptions();
  const { members } = useMembers();

  const totalRevenue = useMemo(() => monthlyRevenue.reduce((s, m) => s + m.revenue, 0), [monthlyRevenue]);
  const recognizedRevenue = useMemo(() => monthlyRevenue.reduce((s, m) => s + m.recognized, 0), [monthlyRevenue]);
  const mrr = useMemo(() => subscriptions.filter((s) => s.status === 'Active').reduce((acc, s) => acc + s.monthlyFee, 0), [subscriptions]);
  const outstandingInvoices = useMemo(() => invoices.filter((i) => i.status !== 'Paid'), [invoices]);
  const accountsReceivable = useMemo(() => outstandingInvoices.reduce((s, i) => s + i.amount, 0), [outstandingInvoices]);
  const paidRevenue = useMemo(() => invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0), [invoices]);

  const planRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    subscriptions.filter((s) => s.status === 'Active').forEach((s) => {
      map[s.plan] = (map[s.plan] || 0) + s.monthlyFee;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [subscriptions]);

  const mrrTrend = monthlyRevenue.slice(-6).map((m) => ({ month: m.month, revenue: m.recognized, recognized: m.recognized }));

  const exportCSV = () => {
    const headers = ['Bulan', 'Revenue', 'Recognized', 'Growth (%)'];
    const rows = monthlyRevenue.map((m, i) => {
      const growth = i > 0 ? (((m.revenue - monthlyRevenue[i-1].revenue) / monthlyRevenue[i-1].revenue) * 100).toFixed(1) : '0';
      return [m.month + ` ${new Date().getFullYear()}`, m.revenue, m.recognized, growth];
    });
    const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `reports_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Reports</h1>
          <p className="text-sm text-ink-500 mt-0.5">Laporan keuangan dan analisis pendapatan</p>
        </div>
        <Button variant="secondary" icon={<Download size={16}/>} className="hidden sm:inline-flex" onClick={exportCSV}>Export CSV</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ReportCard icon={<TrendingUp size={20} className="text-brand-600"/>} iconBg="bg-brand-50" title="Revenue Report" desc={formatIDR(totalRevenue)} meta={`${monthlyRevenue.length} bulan`}/>
        <ReportCard icon={<Receipt size={20} className="text-rose-600"/>} iconBg="bg-rose-50" title="Outstanding Receivables" desc={formatIDR(accountsReceivable)} meta={`${outstandingInvoices.length} invoice`}/>
        <ReportCard icon={<UsersIcon size={20} className="text-violet-600"/>} iconBg="bg-violet-50" title="Membership Revenue" desc={formatIDR(mrr)} meta="MRR bulanan"/>
      </div>

      <Card>
        <CardHeader title="Revenue Report" subtitle="Laporan pendapatan bulanan" action={<Badge tone="brand">YTD {new Date().getFullYear()}</Badge>}/>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-100">
                {['Bulan','Revenue','Recognized','Growth','Status'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-ink-500 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {monthlyRevenue.map((m, i) => {
                const growth = i > 0 ? ((m.revenue - monthlyRevenue[i-1].revenue) / monthlyRevenue[i-1].revenue) * 100 : 0;
                return (
                  <tr key={m.month} className="hover:bg-ink-50/50">
                    <td className="px-5 py-3"><span className="text-sm font-semibold text-ink-900">{m.month} {new Date().getFullYear()}</span></td>
                    <td className="px-5 py-3"><span className="text-sm font-bold text-ink-900 tnum">{formatIDR(m.revenue)}</span></td>
                    <td className="px-5 py-3"><span className="text-sm text-ink-600 tnum">{formatIDR(m.recognized)}</span></td>
                    <td className="px-5 py-3">
                      {i > 0 ? <span className={`text-xs font-semibold ${growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{growth >= 0 ? '+' : ''}{growth.toFixed(1)}%</span>
                        : <span className="text-xs text-ink-400">—</span>}
                    </td>
                    <td className="px-5 py-3"><Badge tone="success" dot>Selesai</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Outstanding Receivables" subtitle="Invoice belum dibayar"/>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  {['Invoice','Member','Jumlah','Jatuh Tempo'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-ink-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {outstandingInvoices.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-6 text-sm text-ink-400 text-center">Semua invoice sudah lunas 🎉</td></tr>
                ) : outstandingInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-ink-50/50">
                    <td className="px-5 py-3"><span className="text-sm font-semibold text-ink-900 tnum">{inv.number}</span></td>
                    <td className="px-5 py-3"><span className="text-sm text-ink-700">{inv.memberName}</span></td>
                    <td className="px-5 py-3"><span className="text-sm font-bold text-ink-900 tnum">{formatIDR(inv.amount)}</span></td>
                    <td className="px-5 py-3"><span className="text-sm text-ink-600">{formatDateID(inv.dueDate)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Membership Revenue" subtitle="Pendapatan per paket membership"/>
          <div className="px-5 pb-5 space-y-3">
            {planRevenue.length === 0 ? (
              <div className="py-6 text-sm text-ink-400 text-center">Belum ada data subscription</div>
            ) : planRevenue.map(([plan, revenue]) => {
              const maxRev = Math.max(...planRevenue.map((r) => r[1]));
              const pct = (revenue / maxRev) * 100;
              const memberCount = members.filter((m) => m.plan === plan && m.status === 'Active').length;
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div><span className="text-sm font-semibold text-ink-900">{plan}</span><span className="text-xs text-ink-400 ml-2">{memberCount} anggota aktif</span></div>
                    <span className="text-sm font-bold text-ink-900 tnum">{formatIDR(revenue)}/bln</span>
                  </div>
                  <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}/>
                  </div>
                </div>
              );
            })}
            <div className="pt-3 border-t border-ink-100 flex items-center justify-between">
              <span className="text-sm font-bold text-ink-900">Total MRR</span>
              <span className="text-sm font-bold text-brand-600 tnum">{formatIDR(mrr)}/bln</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Monthly Recurring Revenue (MRR)" subtitle="Tren MRR 6 bulan terakhir" action={<Badge tone="success" dot>{formatIDR(mrr)}/bln saat ini</Badge>}/>
        {mrrTrend.length > 0 ? <RevenueBarChart data={mrrTrend} height={240} showRecognized={false}/> : (
          <div className="h-48 flex items-center justify-center text-sm text-ink-400">Belum ada data</div>
        )}
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="px-4 py-3"><p className="text-xs text-ink-500 font-medium">Total Revenue YTD</p><p className="text-lg font-bold tnum mt-0.5 text-ink-900">{formatIDR(totalRevenue)}</p></Card>
        <Card className="px-4 py-3"><p className="text-xs text-ink-500 font-medium">Recognized Revenue</p><p className="text-lg font-bold tnum mt-0.5 text-emerald-600">{formatIDR(recognizedRevenue)}</p></Card>
        <Card className="px-4 py-3"><p className="text-xs text-ink-500 font-medium">Collected (Paid)</p><p className="text-lg font-bold tnum mt-0.5 text-brand-600">{formatIDR(paidRevenue)}</p></Card>
      </div>
    </div>
  );
}

function ReportCard({ icon, iconBg, title, desc, meta }: { icon: React.ReactNode; iconBg: string; title: string; desc: string; meta: string }) {
  return (
    <Card hover className="p-5">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-xs font-medium text-ink-500">{title}</p>
      <p className="text-lg font-bold text-ink-900 tnum mt-1">{desc}</p>
      <p className="text-[11px] text-ink-400 mt-1">{meta}</p>
    </Card>
  );
}
