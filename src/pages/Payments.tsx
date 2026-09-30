import { useState, useMemo } from 'react';
import {
  Search,
  CreditCard,
  Download,
  Eye,
  Wallet,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import {
  payments as initialPayments,
  formatIDR,
  formatDateID,
} from '@/data/mock';
import type { Payment } from '@/data/types';

const statusOptions: { label: string; value: string }[] = [
  { label: 'Semua Status', value: '' },
  { label: 'Success', value: 'Success' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Failed', value: 'Failed' },
];

const methodOptions: { label: string; value: string }[] = [
  { label: 'Semua Metode', value: '' },
  { label: 'Transfer Bank', value: 'Transfer Bank' },
  { label: 'Cash', value: 'Cash' },
  { label: 'Debit Card', value: 'Debit Card' },
  { label: 'QRIS', value: 'QRIS' },
  { label: 'E-Wallet', value: 'E-Wallet' },
];

const methodIcons: Record<string, string> = {
  'Transfer Bank': '🏦',
  Cash: '💵',
  'Debit Card': '💳',
  QRIS: '📱',
  'E-Wallet': '👛',
};

export function Payments({ search }: { search: string }) {
  const [payments] = useState<Payment[]>(initialPayments);
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [loading] = useState(false);

  const query = (search || localSearch).toLowerCase();

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchQuery =
        !query ||
        p.memberName.toLowerCase().includes(query) ||
        p.invoiceNumber.toLowerCase().includes(query);
      const matchStatus = !statusFilter || p.status === statusFilter;
      const matchMethod = !methodFilter || p.method === methodFilter;
      return matchQuery && matchStatus && matchMethod;
    });
  }, [payments, query, statusFilter, methodFilter]);

  const totalReceived = payments
    .filter((p) => p.status === 'Success')
    .reduce((s, p) => s + p.amount, 0);
  const pendingAmount = payments
    .filter((p) => p.status === 'Pending')
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Payments</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            Riwayat pembayaran anggota gym
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<Download size={16} />}
          className="hidden sm:inline-flex"
        >
          Export
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Wallet size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-ink-500 font-medium">Total Diterima</p>
              <p className="text-xl font-bold tnum text-ink-900">
                {formatIDR(totalReceived)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-xs text-ink-500 font-medium">Pending</p>
          <p className="text-xl font-bold tnum mt-0.5 text-amber-600">
            {formatIDR(pendingAmount)}
          </p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-xs text-ink-500 font-medium">Total Transaksi</p>
          <p className="text-xl font-bold tnum mt-0.5 text-ink-900">
            {payments.length}
          </p>
        </Card>
      </div>

      <Card>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-5 py-4 border-b border-ink-100">
          <div className="flex-1 max-w-xs">
            <Input
              value={localSearch}
              onChange={setLocalSearch}
              placeholder="Cari nama, no. invoice…"
              icon={<Search size={16} />}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              className="w-36"
            />
            <Select
              value={methodFilter}
              onChange={setMethodFilter}
              options={methodOptions}
              className="w-40"
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={24} />}
            title="Tidak ada pembayaran ditemukan"
            description="Coba ubah filter atau kata kunci pencarian."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  {[
                    'Tanggal',
                    'Member',
                    'Invoice',
                    'Jumlah',
                    'Metode',
                    'Status',
                    '',
                  ].map((h) => (
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
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-ink-50/50 transition-colors group"
                  >
                    <td className="px-5 py-3">
                      <span className="text-sm text-ink-600">
                        {formatDateID(p.date)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={p.memberName}
                          color="bg-brand-500"
                          size="sm"
                        />
                        <span className="text-sm font-semibold text-ink-900">
                          {p.memberName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-ink-600 tnum">
                        {p.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-bold text-ink-900 tnum">
                        {formatIDR(p.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone="neutral">
                        <span className="mr-1">
                          {methodIcons[p.method]}
                        </span>
                        {p.method}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-3">
                      <button className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-100 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-3 border-t border-ink-100">
          <p className="text-xs text-ink-500">
            Menampilkan {filtered.length} dari {payments.length} pembayaran
          </p>
        </div>
      </Card>
    </div>
  );
}
