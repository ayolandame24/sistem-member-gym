import { useMemo } from 'react';
import { Wallet, Users as UsersIcon, Repeat, AlertCircle, ArrowRight, Calendar } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { RevenueBarChart, DonutChart } from '@/components/ui/Charts';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatsSkeleton } from '@/components/ui/Skeleton';
import { useMembers } from '@/hooks/useMembers';
import { usePayments } from '@/hooks/usePayments';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useInvoices } from '@/hooks/useInvoices';
import { useMonthlyRevenue } from '@/hooks/useMonthlyRevenue';
import { formatIDR, formatDateID } from '@/data/mock';
import type { PageKey } from '@/components/Layout';

interface DashboardProps {
  onNavigate: (key: PageKey) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { members, loading: loadingMembers } = useMembers();
  const { payments, loading: loadingPayments } = usePayments();
  const { subscriptions, loading: loadingSubscriptions } = useSubscriptions();
  const { invoices, loading: loadingInvoices } = useInvoices();
  const { monthlyRevenue, loading: loadingRevenue } = useMonthlyRevenue();

  const isLoading = loadingMembers || loadingPayments || loadingSubscriptions || loadingInvoices || loadingRevenue;

  const totalRevenue = useMemo(() => monthlyRevenue.reduce((s, m) => s + m.revenue, 0), [monthlyRevenue]);
  const mrr = useMemo(() => subscriptions.filter((s) => s.status === 'Active').reduce((acc, s) => acc + s.monthlyFee, 0), [subscriptions]);
  const activeMembersCount = useMemo(() => members.filter((m) => m.status === 'Active').length, [members]);
  const outstandingInvoices = useMemo(() => invoices.filter((i) => i.status !== 'Paid'), [invoices]);
  const outstandingTotal = useMemo(() => outstandingInvoices.reduce((s, i) => s + i.amount, 0), [outstandingInvoices]);
  const recentPayments = useMemo(() => [...payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6), [payments]);
  const activeSubs = useMemo(() => subscriptions.filter((s) => s.status === 'Active'), [subscriptions]);
  const expiringSoon = useMemo(
    () => members.filter((m) => m.status === 'Active' && m.expiryDate).sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)).slice(0, 4),
    [members],
  );

  const membershipStatusSummary = useMemo(() => [
    { label: 'Active', value: members.filter((m) => m.status === 'Active').length, color: 'bg-emerald-500' },
    { label: 'Expired', value: members.filter((m) => m.status === 'Expired').length, color: 'bg-amber-500' },
    { label: 'Suspended', value: members.filter((m) => m.status === 'Suspended').length, color: 'bg-rose-500' },
  ], [members]);

  const revenueSpark = monthlyRevenue.slice(-6).map((m) => m.revenue);
  const mrrSpark = monthlyRevenue.slice(-6).map((m) => m.recognized);
  const memberSpark = [activeMembersCount - 2, activeMembersCount - 1, activeMembersCount];
  const outstandingSpark = [outstandingTotal * 0.8, outstandingTotal * 1.1, outstandingTotal * 0.9, outstandingTotal];

  const currentMonth = monthlyRevenue[monthlyRevenue.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Selamat datang kembali, Admin</h1>
          <p className="text-sm text-ink-500 mt-0.5">Ringkasan performa gym Anda hari ini</p>
        </div>
        <Button variant="secondary" size="md" icon={<Calendar size={16}/>} className="hidden sm:inline-flex">
          {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
        </Button>
      </div>

      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Total Revenue" value={formatIDR(totalRevenue)} icon={<Wallet size={20} className="text-brand-600"/>} iconBg="bg-brand-50" trend={6.6} sparkData={revenueSpark.length > 0 ? revenueSpark : [0]} />
          <StatCard label="Monthly Recurring Revenue" value={formatIDR(mrr)} icon={<Repeat size={20} className="text-emerald-600"/>} iconBg="bg-emerald-50" trend={4.2} sparkData={mrrSpark.length > 0 ? mrrSpark : [0]} />
          <StatCard label="Active Members" value={String(activeMembersCount)} icon={<UsersIcon size={20} className="text-violet-600"/>} iconBg="bg-violet-50" trend={12.5} sparkData={memberSpark} />
          <StatCard label="Outstanding Bills" value={formatIDR(outstandingTotal)} icon={<AlertCircle size={20} className="text-rose-600"/>} iconBg="bg-rose-50" trend={-3.1} sparkData={outstandingSpark} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Revenue Chart"
            subtitle="Pendapatan bulanan vs revenue yang diakui"
            action={currentMonth ? <Badge tone="brand" dot>{formatIDR(currentMonth.revenue)} bulan ini</Badge> : undefined}
          />
          {monthlyRevenue.length > 0 ? <RevenueBarChart data={monthlyRevenue} height={260}/> : (
            <div className="h-64 flex items-center justify-center text-sm text-ink-400">Belum ada data revenue</div>
          )}
        </Card>
        <Card>
          <CardHeader title="Membership Status" subtitle="Distribusi status anggota"/>
          <div className="px-5 pb-6 pt-2">
            {members.length > 0 ? (
              <DonutChart segments={membershipStatusSummary.map((s) => ({ label: s.label, value: s.value, color: s.color }))} />
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-ink-400">Belum ada data member</div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Recent Payments" subtitle="Pembayaran terbaru diterima"
            action={<Button variant="ghost" size="sm" icon={<ArrowRight size={14}/>} onClick={() => onNavigate('payments')}>Lihat semua</Button>}/>
          {recentPayments.length === 0 ? (
            <EmptyState icon={<Wallet size={24}/>} title="Belum ada pembayaran" description="Pembayaran yang diterima akan muncul di sini."/>
          ) : (
            <div className="px-2 pb-3">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-ink-50 transition-colors cursor-pointer">
                  <Avatar name={p.memberName} color="bg-brand-500" size="sm"/>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900 truncate">{p.memberName}</p>
                    <p className="text-xs text-ink-500 truncate">{p.invoiceNumber} · {p.method} · {formatDateID(p.date)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-ink-900 tnum">{formatIDR(p.amount)}</p>
                    <StatusBadge status={p.status}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Expiring Soon" subtitle="Membership akan jatuh tempo"/>
            <div className="px-2 pb-3">
              {expiringSoon.length === 0 ? (
                <div className="px-3 py-4 text-sm text-ink-400 text-center">Tidak ada yang akan jatuh tempo</div>
              ) : expiringSoon.map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-ink-50 transition-colors cursor-pointer">
                  <Avatar name={m.name} color={m.avatarColor} size="sm"/>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900 truncate">{m.name}</p>
                    <p className="text-xs text-ink-500 truncate">Expired: {formatDateID(m.expiryDate)}</p>
                  </div>
                  <Badge tone="warning">Soon</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-brand-600 to-brand-800 text-white border-0">
            <p className="text-xs font-medium text-brand-100">Outstanding Invoices</p>
            <p className="text-2xl font-bold tnum mt-1">{formatIDR(outstandingTotal)}</p>
            <p className="text-xs text-brand-100 mt-1">{outstandingInvoices.length} invoice belum dibayar</p>
            <Button variant="secondary" size="sm" className="mt-4 bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => onNavigate('billing')} icon={<ArrowRight size={14}/>}>Kelola Invoice</Button>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader title="Active Recurring Subscriptions" subtitle={`${activeSubs.length} langganan aktif`}
          action={<Button variant="ghost" size="sm" icon={<ArrowRight size={14}/>} onClick={() => onNavigate('recurring')}>Kelola</Button>}/>
        {activeSubs.length === 0 ? (
          <div className="px-5 py-6 text-sm text-ink-400 text-center">Belum ada langganan aktif</div>
        ) : (
          <div className="px-2 pb-3">
            {activeSubs.slice(0, 4).map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-ink-50 transition-colors cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center"><Repeat size={16} className="text-emerald-600"/></div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900 truncate">{s.memberName}</p>
                  <p className="text-xs text-ink-500 truncate">{s.plan} · Next: {s.nextBillingDate === '—' ? '—' : formatDateID(s.nextBillingDate)}</p>
                </div>
                <p className="text-sm font-bold text-ink-900 tnum shrink-0">{formatIDR(s.monthlyFee)}</p>
                <StatusBadge status={s.status}/>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
