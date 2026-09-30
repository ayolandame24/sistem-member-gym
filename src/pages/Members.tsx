import { useState, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  Eye,
  Trash2,
  Users as UsersIcon,
  Pencil,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useMembers } from '@/hooks/useMembers';
import {
  formatIDR,
  formatDateID,
  formatDateLongID,
  planOptions,
} from '@/data/mock';
import type { Member, MembershipPlan, MembershipStatus } from '@/data/types';

const PAGE_SIZE = 8;

const statusOptions = [
  { label: 'Semua Status', value: '' },
  { label: 'Active', value: 'Active' },
  { label: 'Expired', value: 'Expired' },
  { label: 'Suspended', value: 'Suspended' },
];

const planFilterOptions = [
  { label: 'Semua Paket', value: '' },
  { label: 'Basic', value: 'Basic' },
  { label: 'Premium', value: 'Premium' },
  { label: 'Elite', value: 'Elite' },
  { label: 'Personal Trainer', value: 'Personal Trainer' },
];

const memberStatusOptions = [
  { label: 'Active', value: 'Active' },
  { label: 'Expired', value: 'Expired' },
  { label: 'Suspended', value: 'Suspended' },
];

type FormState = {
  name: string; email: string; phone: string;
  plan: MembershipPlan; startDate: string; expiryDate: string; status: MembershipStatus;
};
type FormErrors = Partial<Record<keyof FormState, string>>;

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'Nama lengkap wajib diisi.';
  if (!form.email.trim()) errors.email = 'Email wajib diisi.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Format email tidak valid.';
  if (form.phone && !/^[0-9+\-\s()]{7,20}$/.test(form.phone)) errors.phone = 'Format nomor telepon tidak valid.';
  if (form.startDate && form.expiryDate && form.expiryDate < form.startDate)
    errors.expiryDate = 'Jatuh tempo harus setelah tanggal mulai.';
  return errors;
}

const emptyForm: FormState = { name: '', email: '', phone: '', plan: 'Basic', startDate: '', expiryDate: '', status: 'Active' };

export function Members({ search }: { search: string }) {
  const { members, loading, error, addMember, updateMember, deleteMember } = useMembers();

  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [detailMember, setDetailMember] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [page, setPage] = useState(1);

  const [addForm, setAddForm] = useState<FormState>(emptyForm);
  const [addErrors, setAddErrors] = useState<FormErrors>({});
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [editErrors, setEditErrors] = useState<FormErrors>({});

  const query = (search || localSearch).toLowerCase();

  const filtered = useMemo(() => {
    setPage(1);
    return members.filter((m) => {
      const matchQuery = !query || m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query) || m.code.toLowerCase().includes(query);
      return matchQuery && (!statusFilter || m.status === statusFilter) && (!planFilter || m.plan === planFilter);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, query, statusFilter, planFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const colors = ['bg-brand-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'];

  const openAdd = () => { setAddForm(emptyForm); setAddErrors({}); setAddOpen(true); };

  const handleAdd = async () => {
    const errors = validateForm(addForm);
    if (Object.keys(errors).length > 0) { setAddErrors(errors); return; }
    const plan = planOptions.find((p) => p.value === addForm.plan)!;
    const newMember: Member = {
      id: crypto.randomUUID(),
      code: `MBR-${new Date().getFullYear()}-${String(members.length + 1).padStart(3, '0')}`,
      name: addForm.name.trim(),
      email: addForm.email.trim(),
      phone: addForm.phone.trim() || '-',
      plan: addForm.plan,
      monthlyFee: plan.fee,
      joinDate: addForm.startDate || new Date().toISOString().slice(0, 10),
      startDate: addForm.startDate || new Date().toISOString().slice(0, 10),
      expiryDate: addForm.expiryDate || '',
      status: addForm.status,
      avatarColor: colors[members.length % colors.length],
    };
    await addMember(newMember);
    setAddOpen(false);
  };

  const openEdit = (m: Member) => {
    setEditForm({ name: m.name, email: m.email, phone: m.phone === '-' ? '' : m.phone, plan: m.plan, startDate: m.startDate, expiryDate: m.expiryDate, status: m.status });
    setEditErrors({});
    setDetailMember(null);
    setEditMember(m);
  };

  const handleEdit = async () => {
    if (!editMember) return;
    const errors = validateForm(editForm);
    if (Object.keys(errors).length > 0) { setEditErrors(errors); return; }
    const plan = planOptions.find((p) => p.value === editForm.plan)!;
    await updateMember(editMember.id, {
      name: editForm.name.trim(), email: editForm.email.trim(),
      phone: editForm.phone.trim() || '-', plan: editForm.plan,
      monthlyFee: plan.fee, startDate: editForm.startDate,
      expiryDate: editForm.expiryDate, status: editForm.status,
    });
    setEditMember(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMember(deleteTarget.id);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Members</h1>
          <p className="text-sm text-ink-500 mt-0.5">Kelola data anggota gym dan membership</p>
        </div>
        <Button icon={<UserPlus size={16} />} onClick={openAdd}>Add Member</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Members', value: members.length, tone: 'text-ink-900' },
          { label: 'Active', value: members.filter((m) => m.status === 'Active').length, tone: 'text-emerald-600' },
          { label: 'Expired', value: members.filter((m) => m.status === 'Expired').length, tone: 'text-amber-600' },
          { label: 'Suspended', value: members.filter((m) => m.status === 'Suspended').length, tone: 'text-rose-600' },
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
            <Input value={localSearch} onChange={setLocalSearch} placeholder="Cari nama, email, kode…" icon={<Search size={16} />} />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-ink-400" />
            <Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} className="w-36" />
            <Select value={planFilter} onChange={setPlanFilter} options={planFilterOptions} className="w-44" />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={7} />
        ) : paginated.length === 0 ? (
          <EmptyState
            icon={<UsersIcon size={24} />}
            title="Tidak ada member ditemukan"
            description="Coba ubah filter atau kata kunci pencarian."
            action={<Button variant="secondary" size="sm" onClick={() => { setStatusFilter(''); setPlanFilter(''); setLocalSearch(''); }}>Reset Filter</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  {['Member', 'Kode', 'Paket', 'Mulai', 'Jatuh Tempo', 'Status', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-ink-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {paginated.map((m) => (
                  <tr key={m.id} className="hover:bg-ink-50/50 transition-colors cursor-pointer group" onClick={() => setDetailMember(m)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} color={m.avatarColor} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-ink-900 truncate">{m.name}</p>
                          <p className="text-xs text-ink-500 truncate">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><span className="text-sm text-ink-600 tnum">{m.code}</span></td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-ink-700">{m.plan}</span>
                      <p className="text-xs text-ink-400 tnum">{formatIDR(m.monthlyFee)}/bln</p>
                    </td>
                    <td className="px-5 py-3"><span className="text-sm text-ink-600">{formatDateID(m.startDate)}</span></td>
                    <td className="px-5 py-3"><span className="text-sm text-ink-600">{m.expiryDate ? formatDateID(m.expiryDate) : '—'}</span></td>
                    <td className="px-5 py-3"><StatusBadge status={m.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(m); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-brand-50 hover:text-brand-600" title="Edit"><Pencil size={15} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setDetailMember(m); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-100 hover:text-brand-600" title="Detail"><Eye size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(m); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-rose-50 hover:text-rose-600" title="Hapus"><Trash2 size={16} /></button>
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
            {filtered.length === 0 ? 'Tidak ada data' : `Menampilkan ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} dari ${filtered.length} member`}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'text-white bg-brand-600' : 'text-ink-600 hover:bg-ink-100'}`}>{p}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
          </div>
        </div>
      </Card>

      {/* Add Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Member" subtitle="Daftarkan anggota gym baru"
        footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Batal</Button><Button onClick={handleAdd}>Simpan Member</Button></>}>
        <MemberForm form={addForm} errors={addErrors} onChange={setAddForm} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editMember} onClose={() => setEditMember(null)} title="Edit Member" subtitle={editMember?.name}
        footer={<><Button variant="secondary" onClick={() => setEditMember(null)}>Batal</Button><Button onClick={handleEdit}>Simpan Perubahan</Button></>}>
        <MemberForm form={editForm} errors={editErrors} onChange={setEditForm} />
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailMember} onClose={() => setDetailMember(null)} title="Member Details" subtitle="Informasi lengkap keanggotaan" size="lg"
        footer={<><Button variant="secondary" onClick={() => setDetailMember(null)}>Tutup</Button><Button icon={<Pencil size={15} />} onClick={() => detailMember && openEdit(detailMember)}>Edit Member</Button></>}>
        {detailMember && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-ink-50 rounded-xl">
              <Avatar name={detailMember.name} color={detailMember.avatarColor} size="lg" />
              <div>
                <h3 className="text-lg font-bold text-ink-900">{detailMember.name}</h3>
                <p className="text-sm text-ink-500 tnum">{detailMember.code}</p>
                <div className="mt-1.5"><StatusBadge status={detailMember.status} /></div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField icon={<Mail size={16} />} label="Email" value={detailMember.email} />
              <DetailField icon={<Phone size={16} />} label="No. Telepon" value={detailMember.phone} />
              <DetailField icon={<Calendar size={16} />} label="Bergabung" value={formatDateLongID(detailMember.joinDate)} />
              <DetailField icon={<Calendar size={16} />} label="Membership Mulai" value={formatDateLongID(detailMember.startDate)} />
              <DetailField icon={<Calendar size={16} />} label="Jatuh Tempo" value={detailMember.expiryDate ? formatDateLongID(detailMember.expiryDate) : '—'} />
              <DetailField icon={<Calendar size={16} />} label="Iuran Bulanan" value={`${formatIDR(detailMember.monthlyFee)}/bln`} />
            </div>
            <div className="p-4 bg-brand-50 rounded-xl border border-brand-100">
              <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider">Membership Plan</p>
              <p className="text-lg font-bold text-brand-900 mt-1">{detailMember.plan}</p>
              <p className="text-sm text-brand-600 mt-0.5 tnum">{formatIDR(detailMember.monthlyFee)} per bulan</p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Hapus Member" message={`Apakah Anda yakin ingin menghapus ${deleteTarget?.name}?`} confirmLabel="Hapus" danger />
    </div>
  );
}

function MemberForm({ form, errors, onChange }: { form: FormState; errors: FormErrors; onChange: (f: FormState) => void }) {
  return (
    <div className="space-y-4">
      <Input label="Nama Lengkap" value={form.name} onChange={(v) => onChange({ ...form, name: v })} placeholder="cth. Budi Santoso" required error={errors.name} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Email" type="email" value={form.email} onChange={(v) => onChange({ ...form, email: v })} placeholder="nama@email.com" required icon={<Mail size={16} />} error={errors.email} />
        <Input label="No. Telepon" value={form.phone} onChange={(v) => onChange({ ...form, phone: v })} placeholder="08xx-xxxx-xxxx" icon={<Phone size={16} />} error={errors.phone} />
      </div>
      <Select label="Membership Plan" value={form.plan} onChange={(v) => onChange({ ...form, plan: v as MembershipPlan })} options={planOptions.map((p) => ({ label: `${p.label} — ${formatIDR(p.fee)}/bln`, value: p.value }))} required />
      <Select label="Status" value={form.status} onChange={(v) => onChange({ ...form, status: v as MembershipStatus })} options={[{ label: 'Active', value: 'Active' }, { label: 'Expired', value: 'Expired' }, { label: 'Suspended', value: 'Suspended' }]} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Tanggal Mulai" type="date" value={form.startDate} onChange={(v) => onChange({ ...form, startDate: v })} />
        <Input label="Tanggal Jatuh Tempo" type="date" value={form.expiryDate} onChange={(v) => onChange({ ...form, expiryDate: v })} error={errors.expiryDate} />
      </div>
    </div>
  );
}

function DetailField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-ink-50/50 rounded-lg">
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-ink-400 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-ink-500">{label}</p>
        <p className="text-sm font-semibold text-ink-900 truncate">{value}</p>
      </div>
    </div>
  );
}
