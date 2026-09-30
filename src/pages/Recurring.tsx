import { useState, useMemo } from 'react';
import { Search, Repeat, Pause, Play, XCircle, Settings2, Repeat as RepeatIcon, Plus, Calendar, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useMembers } from '@/hooks/useMembers';
import { formatIDR, formatDateID, planOptions } from '@/data/mock';
import type { Subscription, RecurringStatus, MembershipPlan } from '@/data/types';

const PAGE_SIZE = 8;

const statusOptions = [
  { label: 'Semua Status', value: '' },
  { label: 'Active', value: 'Active' },
  { label: 'Paused', value: 'Paused' },
  { label: 'Cancelled', value: 'Cancelled' },
];

type AddSubForm = { memberId: string; plan: MembershipPlan; startDate: string; nextBillingDate: string };
type AddSubErrors = Partial<Record<keyof AddSubForm, string>>;

function validateSubForm(f: AddSubForm): AddSubErrors {
  const e: AddSubErrors = {};
  if (!f.memberId) e.memberId = 'Pilih member terlebih dahulu.';
  if (!f.startDate) e.startDate = 'Tanggal mulai wajib diisi.';
  if (!f.nextBillingDate) e.nextBillingDate = 'Tanggal tagihan berikutnya wajib diisi.';
  if (f.startDate && f.nextBillingDate && f.nextBillingDate < f.startDate) e.nextBillingDate = 'Tanggal tagihan harus setelah tanggal mulai.';
  return e;
}

export function Recurring({ search }: { search: string }) {
  const { subscriptions, loading, error, addSubscription, updateStatus } = useSubscriptions();
  const { members } = useMembers();

  const [statusFilter, setStatusFilter] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [manageTarget, setManageTarget] = useState<Subscription | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ sub: Subscription; action: 'pause' | 'resume' | 'cancel' } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [addForm, setAddForm] = useState<AddSubForm>({ memberId: '', plan: 'Basic', startDate: '', nextBillingDate: '' });
  const [addErrors, setAddErrors] = useState<AddSubErrors>({});

  const query = (search || localSearch).toLowerCase();

  const filtered = useMemo(() => {
    setPage(1);
    return subscriptions.filter((s) => {
      const match = !query || s.memberName.toLowerCase().includes(query);
      return match && (!statusFilter || s.status === statusFilter);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const activeCount = subscriptions.filter((s) => s.status === 'Active').length;
  const pausedCount = subscriptions.filter((s) => s.status === 'Paused').length;
  const cancelledCount = subscriptions.filter((s) => s.status === 'Cancelled').length;
  const mrr = subscriptions.filter((s) => s.status === 'Active').reduce((acc, s) => acc + s.monthlyFee, 0);

  const applyAction = async () => {
    if (!confirmAction) return;
    const { sub, action } = confirmAction;
    const newStatus: RecurringStatus = action === 'pause' ? 'Paused' : action === 'resume' ? 'Active' : 'Cancelled';
    await updateStatus(sub.id, newStatus);
  };

  const openAdd = () => { setAddForm({ memberId: '', plan: 'Basic', startDate: '', nextBillingDate: '' }); setAddErrors({}); setAddOpen(true); };

  const handleAdd = async () => {
    const errors = validateSubForm(addForm);
    if (Object.keys(errors).length > 0) { setAddErrors(errors); return; }
    const member = members.find((m) => m.id === addForm.memberId);
    if (!member) return;
    const plan = planOptions.find((p) => p.value === addForm.plan)!;
    const newSub: Subscription = {
      id: crypto.randomUUID(),
      memberId: member.id,
      memberName: member.name,
      plan: addForm.plan,
      monthlyFee: plan.fee,
      nextBillingDate: addForm.nextBillingDate,
      status: 'Active',
      startDate: addForm.startDate,
    };
    await addSubscription(newSub);
    setAddOpen(false);
  };

  const actionLabel = confirmAction?.action === 'pause' ? 'Jeda Langganan' : confirmAction?.action === 'resume' ? 'Lanjutkan Langganan' : 'Batalkan Langganan';

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertCircle size={16} className="shrink-0"/>{error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Recurring Billing</h1>
          <p className="text-sm text-ink-500 mt-0.5">Langganan berulang aktif dan pengelolaannya</p>
        </div>
        <Button icon={<Plus size={16}/>} onClick={openAdd}>Tambah Langganan</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center"><RepeatIcon size={20} className="text-white"/></div>
            <div><p className="text-xs text-emerald-700 font-medium">Total MRR</p><p className="text-xl font-bold tnum text-emerald-900">{formatIDR(mrr)}</p></div>
          </div>
        </Card>
        <Card className="px-4 py-3"><p className="text-xs text-ink-500 font-medium">Active Subscriptions</p><p className="text-xl font-bold tnum mt-0.5 text-emerald-600">{activeCount}</p></Card>
        <Card className="px-4 py-3"><p className="text-xs text-ink-500 font-medium">Paused / Cancelled</p><p className="text-xl font-bold tnum mt-0.5 text-amber-600">{pausedCount + cancelledCount}</p></Card>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 px-5 py-4 border-b border-ink-100">
          <div className="flex-1 max-w-xs"><Input value={localSearch} onChange={setLocalSearch} placeholder="Cari nama member…" icon={<Search size={16}/>}/></div>
          <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} className="w-40"/>
        </div>

        {loading ? <TableSkeleton rows={6} cols={6}/> : paginated.length === 0 ? (
          <EmptyState icon={<Repeat size={24}/>} title="Tidak ada langganan ditemukan" description="Coba ubah filter atau tambahkan langganan baru."
            action={<Button variant="secondary" size="sm" onClick={openAdd} icon={<Plus size={14}/>}>Tambah Langganan</Button>}/>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  {['Member','Paket','Iuran Bulanan','Next Billing','Status',''].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-ink-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {paginated.map((s) => (
                  <tr key={s.id} className="hover:bg-ink-50/50 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.memberName} color="bg-brand-500" size="sm"/>
                        <span className="text-sm font-semibold text-ink-900">{s.memberName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className="text-sm font-medium text-ink-700">{s.plan}</span></td>
                    <td className="px-5 py-3"><span className="text-sm font-bold text-ink-900 tnum">{formatIDR(s.monthlyFee)}</span><span className="text-xs text-ink-400">/bln</span></td>
                    <td className="px-5 py-3"><span className="text-sm text-ink-600">{s.nextBillingDate === '—' ? '—' : formatDateID(s.nextBillingDate)}</span></td>
                    <td className="px-5 py-3"><StatusBadge status={s.status}/></td>
                    <td className="px-5 py-3">
                      <Button variant="secondary" size="sm" icon={<Settings2 size={14}/>} onClick={() => setManageTarget(s)} disabled={s.status === 'Cancelled'}>Manage</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-3 border-t border-ink-100">
          <p className="text-xs text-ink-500">{filtered.length===0?'Tidak ada data':`Menampilkan ${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,filtered.length)} dari ${filtered.length} langganan`}</p>
          <div className="flex items-center gap-1">
            <button onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={page===1} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft size={16}/></button>
            {Array.from({length:totalPages},(_,i)=>i+1).map((p)=>(
              <button key={p} onClick={()=>setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-semibold ${p===page?'text-white bg-brand-600':'text-ink-600 hover:bg-ink-100'}`}>{p}</button>
            ))}
            <button onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight size={16}/></button>
          </div>
        </div>
      </Card>

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Tambah Langganan Baru" subtitle="Daftarkan langganan berulang anggota"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Batal</Button><Button onClick={handleAdd}>Simpan Langganan</Button></>}>
        <div className="space-y-4">
          <Select label="Member" value={addForm.memberId} onChange={(v) => { const m = members.find((x) => x.id === v); setAddForm({...addForm, memberId:v, plan: m?.plan ?? 'Basic'}); }}
            options={[{label:'— Pilih anggota aktif —',value:''},...members.filter((m)=>m.status==='Active').map((m)=>({label:`${m.name} — ${m.plan}`,value:m.id}))]} required/>
          {addErrors.memberId && <p className="text-xs text-rose-600 -mt-2">{addErrors.memberId}</p>}
          <Select label="Paket" value={addForm.plan} onChange={(v) => setAddForm({...addForm, plan:v as MembershipPlan})} options={planOptions.map((p)=>({label:`${p.label} — ${formatIDR(p.fee)}/bln`,value:p.value}))} required/>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Tanggal Mulai" type="date" value={addForm.startDate} onChange={(v) => setAddForm({...addForm,startDate:v})} required icon={<Calendar size={16}/>} error={addErrors.startDate}/>
            <Input label="Next Billing Date" type="date" value={addForm.nextBillingDate} onChange={(v) => setAddForm({...addForm,nextBillingDate:v})} required icon={<Calendar size={16}/>} error={addErrors.nextBillingDate}/>
          </div>
          {addForm.plan && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs text-emerald-700 font-medium">Iuran Bulanan</p>
              <p className="text-lg font-bold text-emerald-900 tnum mt-0.5">{formatIDR(planOptions.find((p) => p.value === addForm.plan)?.fee ?? 0)}/bln</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Manage Modal */}
      <Modal open={!!manageTarget} onClose={() => setManageTarget(null)} title="Manage Subscription" subtitle={manageTarget?.memberName}
        footer={<Button variant="secondary" onClick={() => setManageTarget(null)}>Tutup</Button>}>
        {manageTarget && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-ink-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Avatar name={manageTarget.memberName} color="bg-brand-500" size="md"/>
                <div><p className="text-sm font-bold text-ink-900">{manageTarget.memberName}</p><p className="text-xs text-ink-500">Paket {manageTarget.plan}</p></div>
              </div>
              <StatusBadge status={manageTarget.status}/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-ink-500 font-medium">Iuran Bulanan</p><p className="text-sm font-bold text-ink-900 tnum">{formatIDR(manageTarget.monthlyFee)}</p></div>
              <div><p className="text-xs text-ink-500 font-medium">Next Billing</p><p className="text-sm font-bold text-ink-900">{manageTarget.nextBillingDate === '—' ? '—' : formatDateID(manageTarget.nextBillingDate)}</p></div>
            </div>
            <div className="space-y-2 pt-2">
              {manageTarget.status === 'Active' && (
                <button onClick={() => { setConfirmAction({sub:manageTarget,action:'pause'}); setManageTarget(null); }} className="w-full flex items-center gap-3 p-3 rounded-xl border border-ink-200 hover:bg-amber-50 hover:border-amber-200 transition-colors text-left">
                  <Pause size={18} className="text-amber-600"/>
                  <div><p className="text-sm font-semibold text-ink-900">Jeda Langganan</p><p className="text-xs text-ink-500">Tidak menagih hingga dilanjutkan</p></div>
                </button>
              )}
              {manageTarget.status === 'Paused' && (
                <button onClick={() => { setConfirmAction({sub:manageTarget,action:'resume'}); setManageTarget(null); }} className="w-full flex items-center gap-3 p-3 rounded-xl border border-ink-200 hover:bg-emerald-50 hover:border-emerald-200 transition-colors text-left">
                  <Play size={18} className="text-emerald-600"/>
                  <div><p className="text-sm font-semibold text-ink-900">Lanjutkan Langganan</p><p className="text-xs text-ink-500">Aktifkan kembali tagihan berulang</p></div>
                </button>
              )}
              {manageTarget.status !== 'Cancelled' && (
                <button onClick={() => { setConfirmAction({sub:manageTarget,action:'cancel'}); setManageTarget(null); }} className="w-full flex items-center gap-3 p-3 rounded-xl border border-ink-200 hover:bg-rose-50 hover:border-rose-200 transition-colors text-left">
                  <XCircle size={18} className="text-rose-600"/>
                  <div><p className="text-sm font-semibold text-ink-900">Batalkan Langganan</p><p className="text-xs text-ink-500">Hentikan langganan secara permanen</p></div>
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!confirmAction} onClose={() => setConfirmAction(null)} onConfirm={applyAction} title={actionLabel}
        message={confirmAction?.action === 'cancel' ? `Yakin ingin membatalkan langganan ${confirmAction?.sub.memberName}? Tindakan ini permanen.` : `Konfirmasi perubahan status untuk ${confirmAction?.sub.memberName}?`}
        confirmLabel="Ya, Lanjutkan" danger={confirmAction?.action === 'cancel'}/>
    </div>
  );
}
