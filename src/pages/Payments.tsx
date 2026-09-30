import { useState, useMemo } from 'react';
import { Search, CreditCard, Download, Eye, Wallet, Plus, ChevronLeft, ChevronRight, Receipt, CalendarDays, Banknote, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { usePayments } from '@/hooks/usePayments';
import { useMembers } from '@/hooks/useMembers';
import { formatIDR, formatDateID, formatDateLongID } from '@/data/mock';
import type { Payment, PaymentMethod } from '@/data/types';

const PAGE_SIZE = 8;

const statusOptions = [
  { label: 'Semua Status', value: '' },
  { label: 'Success', value: 'Success' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Failed', value: 'Failed' },
];

const methodOptions = [
  { label: 'Semua Metode', value: '' },
  { label: 'Transfer Bank', value: 'Transfer Bank' },
  { label: 'Cash', value: 'Cash' },
  { label: 'Debit Card', value: 'Debit Card' },
  { label: 'QRIS', value: 'QRIS' },
  { label: 'E-Wallet', value: 'E-Wallet' },
];

const methodIcons: Record<string, string> = {
  'Transfer Bank': '🏦', Cash: '💵', 'Debit Card': '💳', QRIS: '📱', 'E-Wallet': '👛',
};

function escapeCSV(val: string | number): string {
  const s = String(val);
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportPaymentsCSV(data: Payment[]) {
  const headers = ['Tanggal', 'Member', 'Invoice', 'Jumlah', 'Metode', 'Status'];
  const rows = data.map((p) => [p.date, p.memberName, p.invoiceNumber, p.amount, p.method, p.status]);
  const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `payments_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

type AddForm = { memberId: string; invoiceNumber: string; amount: string; method: PaymentMethod; date: string; status: 'Success' | 'Pending' | 'Failed' };
type AddErrors = Partial<Record<keyof AddForm, string>>;

function validateAddForm(f: AddForm): AddErrors {
  const e: AddErrors = {};
  if (!f.memberId) e.memberId = 'Pilih member terlebih dahulu.';
  if (!f.invoiceNumber.trim()) e.invoiceNumber = 'Nomor invoice wajib diisi.';
  if (!f.amount || isNaN(Number(f.amount)) || Number(f.amount) <= 0) e.amount = 'Jumlah harus berupa angka positif.';
  if (!f.date) e.date = 'Tanggal pembayaran wajib diisi.';
  return e;
}

export function Payments({ search }: { search: string }) {
  const { payments, loading, error, addPayment } = usePayments();
  const { members } = useMembers();

  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [page, setPage] = useState(1);
  const [viewPayment, setViewPayment] = useState<Payment | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>({ memberId: '', invoiceNumber: '', amount: '', method: 'Transfer Bank', date: new Date().toISOString().slice(0,10), status: 'Success' });
  const [addErrors, setAddErrors] = useState<AddErrors>({});

  const query = (search || localSearch).toLowerCase();

  const filtered = useMemo(() => {
    setPage(1);
    return payments.filter((p) => {
      const match = !query || p.memberName.toLowerCase().includes(query) || p.invoiceNumber.toLowerCase().includes(query);
      return match && (!statusFilter || p.status === statusFilter) && (!methodFilter || p.method === methodFilter);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments, query, statusFilter, methodFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const totalReceived = payments.filter((p) => p.status === 'Success').reduce((s,p) => s+p.amount, 0);
  const pendingAmount = payments.filter((p) => p.status === 'Pending').reduce((s,p) => s+p.amount, 0);

  const openAdd = () => {
    setAddForm({ memberId: '', invoiceNumber: '', amount: '', method: 'Transfer Bank', date: new Date().toISOString().slice(0,10), status: 'Success' });
    setAddErrors({});
    setAddOpen(true);
  };

  const handleMemberChange = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    setAddForm((f) => ({ ...f, memberId, amount: member ? String(member.monthlyFee) : f.amount }));
  };

  const handleAdd = async () => {
    const errors = validateAddForm(addForm);
    if (Object.keys(errors).length > 0) { setAddErrors(errors); return; }
    const member = members.find((m) => m.id === addForm.memberId);
    if (!member) return;
    const newPayment: Payment = {
      id: crypto.randomUUID(),
      date: addForm.date,
      memberId: member.id,
      memberName: member.name,
      invoiceNumber: addForm.invoiceNumber.trim(),
      amount: Number(addForm.amount),
      method: addForm.method,
      status: addForm.status,
    };
    await addPayment(newPayment);
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
          <h1 className="text-xl font-bold text-ink-900">Payments</h1>
          <p className="text-sm text-ink-500 mt-0.5">Riwayat pembayaran anggota gym</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={<Download size={16}/>} onClick={() => exportPaymentsCSV(filtered)}>Export CSV</Button>
          <Button icon={<Plus size={16}/>} onClick={openAdd}>Catat Pembayaran</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Wallet size={20} className="text-emerald-600"/></div>
            <div><p className="text-xs text-ink-500 font-medium">Total Diterima</p><p className="text-xl font-bold tnum text-ink-900">{formatIDR(totalReceived)}</p></div>
          </div>
        </Card>
        <Card className="px-4 py-3"><p className="text-xs text-ink-500 font-medium">Pending</p><p className="text-xl font-bold tnum mt-0.5 text-amber-600">{formatIDR(pendingAmount)}</p></Card>
        <Card className="px-4 py-3"><p className="text-xs text-ink-500 font-medium">Total Transaksi</p><p className="text-xl font-bold tnum mt-0.5 text-ink-900">{payments.length}</p></Card>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-5 py-4 border-b border-ink-100">
          <div className="flex-1 max-w-xs">
            <Input value={localSearch} onChange={setLocalSearch} placeholder="Cari nama, no. invoice…" icon={<Search size={16}/>} />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} className="w-36" />
            <Select value={methodFilter} onChange={setMethodFilter} options={methodOptions} className="w-40" />
          </div>
        </div>

        {loading ? <TableSkeleton rows={6} cols={7}/> : paginated.length === 0 ? (
          <EmptyState icon={<CreditCard size={24}/>} title="Tidak ada pembayaran ditemukan" description="Coba ubah filter atau kata kunci pencarian." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  {['Tanggal','Member','Invoice','Jumlah','Metode','Status',''].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-ink-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {paginated.map((p) => (
                  <tr key={p.id} className="hover:bg-ink-50/50 transition-colors group cursor-pointer" onClick={() => setViewPayment(p)}>
                    <td className="px-5 py-3"><span className="text-sm text-ink-600">{formatDateID(p.date)}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.memberName} color="bg-brand-500" size="sm"/>
                        <span className="text-sm font-semibold text-ink-900">{p.memberName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className="text-sm text-ink-600 tnum">{p.invoiceNumber}</span></td>
                    <td className="px-5 py-3"><span className="text-sm font-bold text-ink-900 tnum">{formatIDR(p.amount)}</span></td>
                    <td className="px-5 py-3"><Badge tone="neutral"><span className="mr-1">{methodIcons[p.method]}</span>{p.method}</Badge></td>
                    <td className="px-5 py-3"><StatusBadge status={p.status}/></td>
                    <td className="px-5 py-3">
                      <button onClick={(e) => { e.stopPropagation(); setViewPayment(p); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-100 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity"><Eye size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-3 border-t border-ink-100">
          <p className="text-xs text-ink-500">{filtered.length===0?'Tidak ada data':`Menampilkan ${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,filtered.length)} dari ${filtered.length} pembayaran`}</p>
          <div className="flex items-center gap-1">
            <button onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={page===1} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft size={16}/></button>
            {Array.from({length:totalPages},(_,i)=>i+1).map((p)=>(
              <button key={p} onClick={()=>setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-semibold ${p===page?'text-white bg-brand-600':'text-ink-600 hover:bg-ink-100'}`}>{p}</button>
            ))}
            <button onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight size={16}/></button>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal open={!!viewPayment} onClose={() => setViewPayment(null)} title="Detail Pembayaran" subtitle={viewPayment?.invoiceNumber} size="lg"
        footer={<Button onClick={() => setViewPayment(null)}>Tutup</Button>}>
        {viewPayment && (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-ink-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Avatar name={viewPayment.memberName} color="bg-brand-500" size="md"/>
                <div>
                  <p className="text-sm font-bold text-ink-900">{viewPayment.memberName}</p>
                  <p className="text-xs text-ink-500">{viewPayment.invoiceNumber}</p>
                </div>
              </div>
              <StatusBadge status={viewPayment.status}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                [<CalendarDays size={16}/>, 'Tanggal Pembayaran', formatDateLongID(viewPayment.date)],
                [<Banknote size={16}/>, 'Jumlah', formatIDR(viewPayment.amount)],
                [<CreditCard size={16}/>, 'Metode', `${methodIcons[viewPayment.method]} ${viewPayment.method}`],
                [<Receipt size={16}/>, 'No. Invoice', viewPayment.invoiceNumber],
              ].map(([icon, label, value]) => (
                <div key={String(label)} className="flex items-start gap-3 p-3 bg-ink-50/50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-ink-400 shrink-0">{icon}</div>
                  <div><p className="text-xs font-medium text-ink-500">{String(label)}</p><p className="text-sm font-semibold text-ink-900">{String(value)}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Catat Pembayaran Baru" subtitle="Rekam transaksi pembayaran anggota"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Batal</Button><Button onClick={handleAdd}>Simpan Pembayaran</Button></>}>
        <div className="space-y-4">
          <Select label="Member" value={addForm.memberId} onChange={handleMemberChange} options={[{label:'— Pilih anggota —',value:''},...members.map((m)=>({label:`${m.name} — ${m.plan}`,value:m.id}))]} required/>
          {addErrors.memberId && <p className="text-xs text-rose-600 -mt-2">{addErrors.memberId}</p>}
          <Input label="Nomor Invoice" value={addForm.invoiceNumber} onChange={(v) => setAddForm({...addForm,invoiceNumber:v})} placeholder="cth. INV-2026-10-001" required error={addErrors.invoiceNumber} icon={<Receipt size={16}/>}/>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Jumlah (Rp)" type="number" value={addForm.amount} onChange={(v) => setAddForm({...addForm,amount:v})} placeholder="cth. 450000" required icon={<Banknote size={16}/>} error={addErrors.amount}/>
            <Input label="Tanggal" type="date" value={addForm.date} onChange={(v) => setAddForm({...addForm,date:v})} required error={addErrors.date}/>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Metode" value={addForm.method} onChange={(v) => setAddForm({...addForm,method:v as PaymentMethod})} options={[{label:'🏦 Transfer Bank',value:'Transfer Bank'},{label:'💵 Cash',value:'Cash'},{label:'💳 Debit Card',value:'Debit Card'},{label:'📱 QRIS',value:'QRIS'},{label:'👛 E-Wallet',value:'E-Wallet'}]} required/>
            <Select label="Status" value={addForm.status} onChange={(v) => setAddForm({...addForm,status:v as 'Success'|'Pending'|'Failed'})} options={[{label:'Success',value:'Success'},{label:'Pending',value:'Pending'},{label:'Failed',value:'Failed'}]} required/>
          </div>
        </div>
      </Modal>
    </div>
  );
}
