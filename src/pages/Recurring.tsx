import { useState, useMemo } from 'react';
import {
  Search,
  Repeat,
  Pause,
  Play,
  XCircle,
  Settings2,
  Repeat as RepeatIcon,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import {
  subscriptions as initialSubs,
  formatIDR,
  formatDateID,
  mrr,
} from '@/data/mock';
import type { Subscription, RecurringStatus } from '@/data/types';

const statusOptions: { label: string; value: string }[] = [
  { label: 'Semua Status', value: '' },
  { label: 'Active', value: 'Active' },
  { label: 'Paused', value: 'Paused' },
  { label: 'Cancelled', value: 'Cancelled' },
];

export function Recurring({ search }: { search: string }) {
  const [subs, setSubs] = useState<Subscription[]>(initialSubs);
  const [statusFilter, setStatusFilter] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [manageTarget, setManageTarget] = useState<Subscription | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    sub: Subscription;
    action: 'pause' | 'resume' | 'cancel';
  } | null>(null);
  const [loading] = useState(false);

  const query = (search || localSearch).toLowerCase();

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      const matchQuery =
        !query || s.memberName.toLowerCase().includes(query);
      const matchStatus = !statusFilter || s.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [subs, query, statusFilter]);

  const activeCount = subs.filter((s) => s.status === 'Active').length;
  const pausedCount = subs.filter((s) => s.status === 'Paused').length;
  const cancelledCount = subs.filter((s) => s.status === 'Cancelled').length;

  const applyAction = () => {
    if (!confirmAction) return;
    const { sub, action } = confirmAction;
    const newStatus: RecurringStatus =
      action === 'pause' ? 'Paused' : action === 'resume' ? 'Active' : 'Cancelled';
    setSubs((prev) =>
      prev.map((s) =>
        s.id === sub.id
          ? {
              ...s,
              status: newStatus,
              nextBillingDate:
                action === 'cancel' ? '—' : s.nextBillingDate,
            }
          : s,
      ),
    );
  };

  const actionLabel = confirmAction?.action === 'pause' ? 'Jeda Langganan' : 
    confirmAction?.action === 'resume' ? 'Lanjutkan Langganan' : 'Batalkan Langganan';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Recurring Billing</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            Langganan berulang aktif dan pengelolaannya
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
              <RepeatIcon size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-emerald-700 font-medium">Total MRR</p>
              <p className="text-xl font-bold tnum text-emerald-900">
                {formatIDR(mrr)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-xs text-ink-500 font-medium">Active Subscriptions</p>
          <p className="text-xl font-bold tnum mt-0.5 text-emerald-600">
            {activeCount}
          </p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-xs text-ink-500 font-medium">Paused / Cancelled</p>
          <p className="text-xl font-bold tnum mt-0.5 text-amber-600">
            {pausedCount + cancelledCount}
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
              placeholder="Cari nama member…"
              icon={<Search size={16} />}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
            className="w-40"
          />
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Repeat size={24} />}
            title="Tidak ada langganan ditemukan"
            description="Coba ubah filter atau kata kunci pencarian."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  {['Member', 'Paket', 'Iuran Bulanan', 'Next Billing', 'Status', ''].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold text-ink-500 uppercase tracking-wider px-5 py-3"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-ink-50/50 transition-colors group"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={s.memberName}
                          color="bg-brand-500"
                          size="sm"
                        />
                        <span className="text-sm font-semibold text-ink-900">
                          {s.memberName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-ink-700">
                        {s.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-bold text-ink-900 tnum">
                        {formatIDR(s.monthlyFee)}
                      </span>
                      <span className="text-xs text-ink-400">/bln</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-ink-600">
                        {s.nextBillingDate === '—'
                          ? '—'
                          : formatDateID(s.nextBillingDate)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-5 py-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Settings2 size={14} />}
                        onClick={() => setManageTarget(s)}
                        className={`${
                          s.status === 'Cancelled'
                            ? 'opacity-50'
                            : ''
                        } group-hover:opacity-100`}
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-3 border-t border-ink-100">
          <p className="text-xs text-ink-500">
            Menampilkan {filtered.length} dari {subs.length} langganan
          </p>
        </div>
      </Card>

      {/* Manage Subscription Modal */}
      <Modal
        open={!!manageTarget}
        onClose={() => setManageTarget(null)}
        title="Manage Subscription"
        subtitle={manageTarget?.memberName}
        footer={
          <Button variant="secondary" onClick={() => setManageTarget(null)}>
            Tutup
          </Button>
        }
      >
        {manageTarget && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-ink-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Avatar
                  name={manageTarget.memberName}
                  color="bg-brand-500"
                  size="md"
                />
                <div>
                  <p className="text-sm font-bold text-ink-900">
                    {manageTarget.memberName}
                  </p>
                  <p className="text-xs text-ink-500">
                    Paket {manageTarget.plan}
                  </p>
                </div>
              </div>
              <StatusBadge status={manageTarget.status} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-ink-500 font-medium">Iuran Bulanan</p>
                <p className="text-sm font-bold text-ink-900 tnum">
                  {formatIDR(manageTarget.monthlyFee)}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-500 font-medium">Next Billing</p>
                <p className="text-sm font-bold text-ink-900">
                  {manageTarget.nextBillingDate === '—'
                    ? '—'
                    : formatDateID(manageTarget.nextBillingDate)}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {manageTarget.status === 'Active' && (
                <button
                  onClick={() => {
                    setConfirmAction({ sub: manageTarget, action: 'pause' });
                    setManageTarget(null);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-ink-200 hover:bg-amber-50 hover:border-amber-200 transition-colors text-left"
                >
                  <Pause size={18} className="text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      Jeda Langganan
                    </p>
                    <p className="text-xs text-ink-500">
                      Tidak menagih hingga dilanjutkan
                    </p>
                  </div>
                </button>
              )}
              {manageTarget.status === 'Paused' && (
                <button
                  onClick={() => {
                    setConfirmAction({ sub: manageTarget, action: 'resume' });
                    setManageTarget(null);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-ink-200 hover:bg-emerald-50 hover:border-emerald-200 transition-colors text-left"
                >
                  <Play size={18} className="text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      Lanjutkan Langganan
                    </p>
                    <p className="text-xs text-ink-500">
                      Aktifkan kembali tagihan berulang
                    </p>
                  </div>
                </button>
              )}
              {manageTarget.status !== 'Cancelled' && (
                <button
                  onClick={() => {
                    setConfirmAction({ sub: manageTarget, action: 'cancel' });
                    setManageTarget(null);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-ink-200 hover:bg-rose-50 hover:border-rose-200 transition-colors text-left"
                >
                  <XCircle size={18} className="text-rose-600" />
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      Batalkan Langganan
                    </p>
                    <p className="text-xs text-ink-500">
                      Hentikan langganan secara permanen
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={applyAction}
        title={actionLabel}
        message={
          confirmAction?.action === 'cancel'
            ? `Apakah Anda yakin ingin membatalkan langganan ${confirmAction?.sub.memberName}? Tindakan ini permanen.`
            : `Konfirmasi perubahan status langganan untuk ${confirmAction?.sub.memberName}?`
        }
        confirmLabel="Ya, Lanjutkan"
        danger={confirmAction?.action === 'cancel'}
      />
    </div>
  );
}
