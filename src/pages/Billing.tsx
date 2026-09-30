import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  FileText,
  Eye,
  Trash2,
  Download,
  CheckCircle,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import {
  invoices as initialInvoices,
  members,
  formatIDR,
  formatDateID,
  formatDateLongID,
  planOptions,
  outstandingTotal,
} from '@/data/mock';
import type { Invoice, PaymentStatus, MembershipPlan } from '@/data/types';

const statusOptions: { label: string; value: string }[] = [
  { label: 'Semua Status', value: '' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Unpaid', value: 'Unpaid' },
  { label: 'Overdue', value: 'Overdue' },
];

const memberSelectOptions = members.map((m) => ({
  label: `${m.name} — ${m.plan}`,
  value: m.id,
}));

export function Billing({ search }: { search: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [statusFilter, setStatusFilter] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [markPaidTarget, setMarkPaidTarget] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [loading] = useState(false);

  const [form, setForm] = useState({
    memberId: '',
    period: 'Okt 2026',
    dueDate: '',
  });

  const query = (search || localSearch).toLowerCase();

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchQuery =
        !query ||
        inv.number.toLowerCase().includes(query) ||
        inv.memberName.toLowerCase().includes(query);
      const matchStatus = !statusFilter || inv.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [invoices, query, statusFilter]);

  const paidCount = invoices.filter((i) => i.status === 'Paid').length;
  const unpaidCount = invoices.filter((i) => i.status === 'Unpaid').length;
  const overdueCount = invoices.filter((i) => i.status === 'Overdue').length;

  const handleAdd = () => {
    if (!form.memberId || !form.dueDate) return;
    const member = members.find((m) => m.id === form.memberId);
    if (!member) return;
    const newInvoice: Invoice = {
      id: `inv${Date.now()}`,
      number: `INV-2026-10-${String(invoices.length + 1).padStart(3, '0')}`,
      memberId: member.id,
      memberName: member.name,
      plan: member.plan,
      period: form.period,
      amount: member.monthlyFee,
      dueDate: form.dueDate,
      status: 'Unpaid',
      issuedDate: new Date().toISOString().slice(0, 10),
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    setForm({ memberId: '', period: 'Okt 2026', dueDate: '' });
    setAddOpen(false);
  };

  const handleMarkPaid = () => {
    if (!markPaidTarget) return;
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === markPaidTarget.id ? { ...i, status: 'Paid' as PaymentStatus } : i,
      ),
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setInvoices((prev) => prev.filter((i) => i.id !== deleteTarget.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Billing</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            Kelola invoice dan tagihan anggota
          </p>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
          Add Invoice
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="px-4 py-3">
          <p className="text-xs text-ink-500 font-medium">Total Invoice</p>
          <p className="text-xl font-bold tnum mt-0.5 text-ink-900">
            {invoices.length}
          </p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-xs text-ink-500 font-medium">Paid</p>
          <p className="text-xl font-bold tnum mt-0.5 text-emerald-600">
            {paidCount}
          </p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-xs text-ink-500 font-medium">Unpaid</p>
          <p className="text-xl font-bold tnum mt-0.5 text-amber-600">
            {unpaidCount}
          </p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-xs text-ink-500 font-medium">Outstanding</p>
          <p className="text-xl font-bold tnum mt-0.5 text-rose-600">
            {formatIDR(outstandingTotal)}
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
              placeholder="Cari no. invoice, nama member…"
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
          <TableSkeleton rows={6} cols={7} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} />}
            title="Tidak ada invoice ditemukan"
            description="Coba ubah filter atau tambahkan invoice baru."
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setStatusFilter('');
                  setLocalSearch('');
                }}
              >
                Reset Filter
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  {[
                    'Invoice',
                    'Member',
                    'Paket',
                    'Periode',
                    'Jumlah',
                    'Jatuh Tempo',
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
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-ink-50/50 transition-colors group cursor-pointer"
                    onClick={() => setViewInvoice(inv)}
                  >
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-ink-900 tnum">
                        {inv.number}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={inv.memberName}
                          color="bg-brand-500"
                          size="sm"
                        />
                        <span className="text-sm font-medium text-ink-700 truncate">
                          {inv.memberName}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-ink-600">{inv.plan}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-ink-600">{inv.period}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-bold text-ink-900 tnum">
                        {formatIDR(inv.amount)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm text-ink-600">
                        {formatDateID(inv.dueDate)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {inv.status !== 'Paid' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMarkPaidTarget(inv);
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-emerald-50 hover:text-emerald-600"
                            title="Tandai Lunas"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewInvoice(inv);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-100 hover:text-brand-600"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(inv);
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-3 border-t border-ink-100">
          <p className="text-xs text-ink-500">
            Menampilkan {filtered.length} dari {invoices.length} invoice
          </p>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg text-sm text-ink-400 hover:bg-ink-100 disabled:opacity-40" disabled>
              ‹
            </button>
            <button className="w-8 h-8 rounded-lg text-sm font-semibold text-white bg-brand-600">
              1
            </button>
            <button className="w-8 h-8 rounded-lg text-sm text-ink-600 hover:bg-ink-100">
              ›
            </button>
          </div>
        </div>
      </Card>

      {/* Add Invoice Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add New Invoice"
        subtitle="Buat invoice tagihan untuk anggota"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAdd}>Buat Invoice</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Pilih Member"
            value={form.memberId}
            onChange={(v) => setForm({ ...form, memberId: v })}
            options={memberSelectOptions}
            placeholder="— Pilih anggota —"
            required
          />
          <Input
            label="Periode Tagihan"
            value={form.period}
            onChange={(v) => setForm({ ...form, period: v })}
            placeholder="cth. Okt 2026"
            required
          />
          <Input
            label="Tanggal Jatuh Tempo"
            type="date"
            value={form.dueDate}
            onChange={(v) => setForm({ ...form, dueDate: v })}
            required
          />
          <div className="p-4 bg-ink-50 rounded-xl">
            <p className="text-xs text-ink-500 font-medium">
              Jumlah akan otomatis mengikuti paket member yang dipilih.
            </p>
          </div>
        </div>
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal
        open={!!viewInvoice}
        onClose={() => setViewInvoice(null)}
        title="Invoice Details"
        subtitle={viewInvoice?.number}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              icon={<Download size={16} />}
              onClick={() => setViewInvoice(null)}
            >
              Download PDF
            </Button>
            <Button onClick={() => setViewInvoice(null)}>Tutup</Button>
          </>
        }
      >
        {viewInvoice && (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-ink-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Avatar
                  name={viewInvoice.memberName}
                  color="bg-brand-500"
                  size="md"
                />
                <div>
                  <p className="text-sm font-bold text-ink-900">
                    {viewInvoice.memberName}
                  </p>
                  <p className="text-xs text-ink-500">
                    Paket {viewInvoice.plan}
                  </p>
                </div>
              </div>
              <StatusBadge status={viewInvoice.status} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="No. Invoice" value={viewInvoice.number} />
              <Field label="Periode" value={viewInvoice.period} />
              <Field
                label="Tanggal Diterbitkan"
                value={formatDateLongID(viewInvoice.issuedDate)}
              />
              <Field
                label="Jatuh Tempo"
                value={formatDateLongID(viewInvoice.dueDate)}
              />
            </div>

            <div className="p-4 border border-ink-100 rounded-xl">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-ink-600">
                  Membership {viewInvoice.plan} — {viewInvoice.period}
                </span>
                <span className="text-sm font-semibold text-ink-900 tnum">
                  {formatIDR(viewInvoice.amount)}
                </span>
              </div>
              <div className="border-t border-ink-100 mt-2 pt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-ink-900">Total</span>
                <span className="text-lg font-bold text-brand-600 tnum">
                  {formatIDR(viewInvoice.amount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!markPaidTarget}
        onClose={() => setMarkPaidTarget(null)}
        onConfirm={handleMarkPaid}
        title="Tandai Invoice Lunas"
        message={`Konfirmasi pembayaran untuk invoice ${markPaidTarget?.number} — ${markPaidTarget?.memberName}?`}
        confirmLabel="Tandai Lunas"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Invoice"
        message={`Apakah Anda yakin ingin menghapus invoice ${deleteTarget?.number}?`}
        confirmLabel="Hapus"
        danger
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-ink-900">{value}</p>
    </div>
  );
}
