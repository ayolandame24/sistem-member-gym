import { useState, useMemo } from 'react';
import {
  Plus, Search, FileText, Eye, Trash2, CheckCircle,
  ChevronLeft, ChevronRight, Printer, AlertCircle,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useInvoices } from '@/hooks/useInvoices';
import { useMembers } from '@/hooks/useMembers';
import { formatIDR, formatDateID, formatDateLongID } from '@/data/mock';
import type { Invoice } from '@/data/types';

const PAGE_SIZE = 8;

const statusOptions = [
  { label: 'Semua Status', value: '' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Unpaid', value: 'Unpaid' },
  { label: 'Overdue', value: 'Overdue' },
];

function printInvoice(inv: Invoice) {
  const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"/><title>Invoice ${inv.number}</title>
  <style>body{font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:40px auto;color:#1a1a2e}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px}
  .brand{font-size:20px;font-weight:700}.brand span{color:#2563eb}
  h2{font-size:24px;color:#2563eb;margin:0}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;
    background:${inv.status==='Paid'?'#dcfce7':inv.status==='Overdue'?'#fee2e2':'#fef9c3'};
    color:${inv.status==='Paid'?'#166534':inv.status==='Overdue'?'#991b1b':'#854d0e'}}
  hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:20px 0}
  .field label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
  .field p{margin:2px 0 0;font-weight:600}
  .line{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9}
  .total{display:flex;justify-content:space-between;padding:16px 0 0;font-size:18px;font-weight:700;color:#2563eb}
  @media print{button{display:none}}</style></head><body>
  <div class="header"><div><div class="brand">Fit<span>Ledger</span></div><div style="font-size:12px;color:#64748b">Gym Billing</div></div>
  <div style="text-align:right"><h2>${inv.number}</h2><span class="badge">${inv.status}</span></div></div>
  <hr/><div class="grid">
  <div class="field"><label>Member</label><p>${inv.memberName}</p></div>
  <div class="field"><label>Paket</label><p>${inv.plan}</p></div>
  <div class="field"><label>Periode</label><p>${inv.period}</p></div>
  <div class="field"><label>Diterbitkan</label><p>${inv.issuedDate}</p></div>
  <div class="field"><label>Jatuh Tempo</label><p>${inv.dueDate}</p></div></div><hr/>
  <div class="line"><span>Membership ${inv.plan} — ${inv.period}</span><span>${fmt(inv.amount)}</span></div>
  <div class="total"><span>Total</span><span>${fmt(inv.amount)}</span></div>
  <hr style="margin-top:32px"/><p style="font-size:11px;color:#94a3b8;text-align:center">FitLedger · ${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}</p>
  <script>window.onload=()=>window.print();<\/script></body></html>`;
  const w = window.open('', '_blank', 'width=700,height=900');
  if (w) { w.document.write(html); w.document.close(); }
}

type FormErrors = { memberId?: string; period?: string; dueDate?: string };

function validateForm(f: { memberId: string; period: string; dueDate: string }): FormErrors {
  const e: FormErrors = {};
  if (!f.memberId) e.memberId = 'Pilih member terlebih dahulu.';
  if (!f.period.trim()) e.period = 'Periode wajib diisi.';
  if (!f.dueDate) e.dueDate = 'Tanggal jatuh tempo wajib diisi.';
  return e;
}

export function Billing({ search }: { search: string }) {
  const { invoices, loading, error, addInvoice, markPaid, deleteInvoice } = useInvoices();
  const { members } = useMembers();

  // Dibangun ulang setiap kali daftar member berubah (termasuk member baru)
  const memberSelectOptions = [
    { label: '— Pilih anggota —', value: '' },
    ...members.map((m) => ({ label: `${m.name} — ${m.plan}`, value: m.id })),
  ];

  const [statusFilter, setStatusFilter] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);
  const [markPaidTarget, setMarkPaidTarget] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ memberId: '', period: '', dueDate: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const query = (search || localSearch).toLowerCase();

  const filtered = useMemo(() => {
    setPage(1);
    return invoices.filter((inv) => {
      const match = !query || inv.number.toLowerCase().includes(query) || inv.memberName.toLowerCase().includes(query);
      return match && (!statusFilter || inv.status === statusFilter);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const paidCount = invoices.filter((i) => i.status === 'Paid').length;
  const unpaidCount = invoices.filter((i) => i.status === 'Unpaid').length;
  const outstandingTotal = invoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);

  const openAdd = () => {
    const now = new Date();
    const period = now.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    setForm({ memberId: '', period, dueDate: '' });
    setFormErrors({});
    setAddOpen(true);
  };

  const handleAdd = async () => {
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
    const member = members.find((m) => m.id === form.memberId);
    if (!member) return;
    const newInvoice: Invoice = {
      id: crypto.randomUUID(),
      number: `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(invoices.length + 1).padStart(3, '0')}`,
      memberId: member.id,
      memberName: member.name,
      plan: member.plan,
      period: form.period,
      amount: member.monthlyFee,
      dueDate: form.dueDate,
      status: 'Unpaid',
      issuedDate: new Date().toISOString().slice(0, 10),
    };
    await addInvoice(newInvoice);
    setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertCircle size={16} className="shrink-0" />{error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Billing</h1>
          <p className="text-sm text-ink-500 mt-0.5">Kelola invoice dan tagihan anggota</p>
        </div>
        <Button icon={<Plus size={16} />} onClick={openAdd}>Add Invoice</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Invoice', value: invoices.length, tone: 'text-ink-900' },
          { label: 'Paid', value: paidCount, tone: 'text-emerald-600' },
          { label: 'Unpaid', value: unpaidCount, tone: 'text-amber-600' },
          { label: 'Outstanding', value: formatIDR(outstandingTotal), tone: 'text-rose-600' },
        ].map((s) => (
          <Card key={s.label} className="px-4 py-3">
            <p className="text-xs text-ink-500 font-medium">{s.label}</p>
            <p className={`text-xl font-bold tnum mt-0.5 ${s.tone}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-5 py-4 border-b border-ink-100">
          <div className="flex-1 max-w-xs">
            <Input value={localSearch} onChange={setLocalSearch} placeholder="Cari no. invoice, nama member…" icon={<Search size={16} />} />
          </div>
          <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} className="w-40" />
        </div>

        {loading ? <TableSkeleton rows={6} cols={8} /> : paginated.length === 0 ? (
          <EmptyState icon={<FileText size={24} />} title="Tidak ada invoice ditemukan"
            description="Coba ubah filter atau tambahkan invoice baru."
            action={<Button variant="secondary" size="sm" onClick={() => { setStatusFilter(''); setLocalSearch(''); }}>Reset Filter</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  {['Invoice', 'Member', 'Paket', 'Periode', 'Jumlah', 'Jatuh Tempo', 'Status', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-ink-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {paginated.map((inv) => (
                  <tr key={inv.id} className="hover:bg-ink-50/50 transition-colors group cursor-pointer" onClick={() => setViewInvoice(inv)}>
                    <td className="px-5 py-3"><span className="text-sm font-semibold text-ink-900 tnum">{inv.number}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={inv.memberName} color="bg-brand-500" size="sm" />
                        <span className="text-sm font-medium text-ink-700 truncate">{inv.memberName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className="text-sm text-ink-600">{inv.plan}</span></td>
                    <td className="px-5 py-3"><span className="text-sm text-ink-600">{inv.period}</span></td>
                    <td className="px-5 py-3"><span className="text-sm font-bold text-ink-900 tnum">{formatIDR(inv.amount)}</span></td>
                    <td className="px-5 py-3"><span className="text-sm text-ink-600">{formatDateID(inv.dueDate)}</span></td>
                    <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {inv.status !== 'Paid' && (
                          <button onClick={(e) => { e.stopPropagation(); setMarkPaidTarget(inv); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-emerald-50 hover:text-emerald-600" title="Tandai Lunas"><CheckCircle size={16} /></button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setViewInvoice(inv); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-100 hover:text-brand-600"><Eye size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(inv); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-3 border-t border-ink-100">
          <p className="text-xs text-ink-500">{filtered.length === 0 ? 'Tidak ada data' : `Menampilkan ${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,filtered.length)} dari ${filtered.length} invoice`}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1,p-1))} disabled={page===1} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft size={16}/></button>
            {Array.from({length:totalPages},(_,i)=>i+1).map((p)=>(
              <button key={p} onClick={()=>setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-semibold ${p===page?'text-white bg-brand-600':'text-ink-600 hover:bg-ink-100'}`}>{p}</button>
            ))}
            <button onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight size={16}/></button>
          </div>
        </div>
      </Card>

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Invoice" subtitle="Buat invoice tagihan untuk anggota"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Batal</Button><Button onClick={handleAdd}>Buat Invoice</Button></>}>
        <div className="space-y-4">
          <Select label="Pilih Member" value={form.memberId} onChange={(v) => setForm({ ...form, memberId: v })} options={memberSelectOptions} required />
          {formErrors.memberId && <p className="text-xs text-rose-600 -mt-2">{formErrors.memberId}</p>}
          <Input label="Periode Tagihan" value={form.period} onChange={(v) => setForm({ ...form, period: v })} placeholder="cth. Okt 2026" required error={formErrors.period} />
          <Input label="Tanggal Jatuh Tempo" type="date" value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} required error={formErrors.dueDate} />
          {form.memberId && (() => { const m = members.find((x) => x.id === form.memberId); return m ? (
            <div className="p-4 bg-brand-50 rounded-xl border border-brand-100">
              <p className="text-xs text-brand-700 font-medium">Jumlah Invoice</p>
              <p className="text-lg font-bold text-brand-900 tnum mt-0.5">{formatIDR(m.monthlyFee)}</p>
              <p className="text-xs text-brand-600 mt-0.5">Sesuai paket {m.plan}</p>
            </div>
          ) : null; })()}
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!viewInvoice} onClose={() => setViewInvoice(null)} title="Invoice Details" subtitle={viewInvoice?.number} size="lg"
        footer={<><Button variant="secondary" icon={<Printer size={16}/>} onClick={() => { if(viewInvoice) printInvoice(viewInvoice); }}>Print / PDF</Button><Button onClick={() => setViewInvoice(null)}>Tutup</Button></>}>
        {viewInvoice && (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-ink-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Avatar name={viewInvoice.memberName} color="bg-brand-500" size="md" />
                <div>
                  <p className="text-sm font-bold text-ink-900">{viewInvoice.memberName}</p>
                  <p className="text-xs text-ink-500">Paket {viewInvoice.plan}</p>
                </div>
              </div>
              <StatusBadge status={viewInvoice.status} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[['No. Invoice', viewInvoice.number], ['Periode', viewInvoice.period], ['Diterbitkan', formatDateLongID(viewInvoice.issuedDate)], ['Jatuh Tempo', formatDateLongID(viewInvoice.dueDate)]].map(([l,v])=>(
                <div key={l}><p className="text-xs font-medium text-ink-500 mb-0.5">{l}</p><p className="text-sm font-semibold text-ink-900">{v}</p></div>
              ))}
            </div>
            <div className="p-4 border border-ink-100 rounded-xl">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-ink-600">Membership {viewInvoice.plan} — {viewInvoice.period}</span>
                <span className="text-sm font-semibold text-ink-900 tnum">{formatIDR(viewInvoice.amount)}</span>
              </div>
              <div className="border-t border-ink-100 mt-2 pt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-ink-900">Total</span>
                <span className="text-lg font-bold text-brand-600 tnum">{formatIDR(viewInvoice.amount)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!markPaidTarget} onClose={() => setMarkPaidTarget(null)} onConfirm={() => { if(markPaidTarget) markPaid(markPaidTarget.id); }}
        title="Tandai Invoice Lunas" message={`Konfirmasi pembayaran untuk ${markPaidTarget?.number}?`} confirmLabel="Tandai Lunas" />
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { if(deleteTarget) deleteInvoice(deleteTarget.id); }}
        title="Hapus Invoice" message={`Yakin ingin menghapus invoice ${deleteTarget?.number}?`} confirmLabel="Hapus" danger />
    </div>
  );
}
