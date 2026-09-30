import {
  LayoutDashboard,
  Users,
  FileText,
  Repeat,
  CreditCard,
  BarChart3,
  Receipt,
  Dumbbell,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Menu,
  X,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
} from 'lucide-react';
import { type ReactNode, useState, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { invoices, payments, subscriptions } from '@/data/mock';

export type PageKey =
  | 'dashboard'
  | 'members'
  | 'billing'
  | 'recurring'
  | 'payments'
  | 'accounting'
  | 'reports';

interface NavItem {
  key: PageKey;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { key: 'members', label: 'Members', icon: <Users size={18} /> },
  { key: 'billing', label: 'Billing', icon: <FileText size={18} /> },
  { key: 'recurring', label: 'Recurring Billing', icon: <Repeat size={18} /> },
  { key: 'payments', label: 'Payments', icon: <CreditCard size={18} /> },
  { key: 'accounting', label: 'Accounting', icon: <BarChart3 size={18} /> },
  { key: 'reports', label: 'Reports', icon: <Receipt size={18} /> },
];

/** Format current date in Indonesian locale */
function formatTodayID(): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

/** Generate notifications from live data */
function buildNotifications() {
  const notifs: { id: string; title: string; desc: string; time: string; tone: 'success' | 'warning' | 'info' }[] = [];

  // Recent successful payments
  payments
    .filter((p) => p.status === 'Success')
    .slice(0, 2)
    .forEach((p) => {
      notifs.push({
        id: `pay-${p.id}`,
        title: 'Pembayaran Diterima',
        desc: `${p.memberName} — ${p.invoiceNumber}`,
        time: p.date,
        tone: 'success',
      });
    });

  // Overdue invoices
  invoices
    .filter((i) => i.status === 'Overdue')
    .slice(0, 2)
    .forEach((i) => {
      notifs.push({
        id: `inv-${i.id}`,
        title: 'Invoice Jatuh Tempo',
        desc: `${i.memberName} — ${i.number}`,
        time: i.dueDate,
        tone: 'warning',
      });
    });

  // Paused subscriptions
  subscriptions
    .filter((s) => s.status === 'Paused')
    .slice(0, 1)
    .forEach((s) => {
      notifs.push({
        id: `sub-${s.id}`,
        title: 'Langganan Dijeda',
        desc: `${s.memberName} — ${s.plan}`,
        time: s.nextBillingDate === '—' ? '—' : s.nextBillingDate,
        tone: 'info',
      });
    });

  return notifs;
}

/** Relative time label */
function relativeTime(dateStr: string): string {
  if (dateStr === '—') return 'Baru-baru ini';
  try {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (diff === 0) return 'Hari ini';
    if (diff === 1) return '1 hari lalu';
    return `${diff} hari lalu`;
  } catch {
    return dateStr;
  }
}

interface LayoutProps {
  current: PageKey;
  onNavigate: (key: PageKey) => void;
  children: ReactNode;
  search: string;
  onSearchChange: (v: string) => void;
}

export function Layout({ current, onNavigate, children, search, onSearchChange }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const currentLabel = navItems.find((n) => n.key === current)?.label ?? 'Dashboard';
  const today = useMemo(() => formatTodayID(), []);
  const allNotifs = useMemo(() => buildNotifications(), []);
  const unreadCount = allNotifs.filter((n) => !readIds.has(n.id)).length;

  const markAllRead = () => setReadIds(new Set(allNotifs.map((n) => n.id)));

  const toneIcon = (tone: string) => {
    if (tone === 'success') return <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />;
    if (tone === 'warning') return <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />;
    return <PauseCircle size={16} className="text-cyan-500 shrink-0 mt-0.5" />;
  };

  return (
    <div className="min-h-screen bg-ink-50 flex">
      {/* Sidebar — desktop */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-ink-100 flex flex-col transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-ink-100 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
            <Dumbbell size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-ink-900 leading-none">FitLedger</h1>
            <p className="text-[11px] text-ink-400 mt-0.5">Gym Billing & Accounting</p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:bg-ink-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider px-3 mb-2">Menu</p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = current === item.key;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => { onNavigate(item.key); setMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium transition-all duration-150 ${
                      active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                    }`}
                  >
                    <span className={`${active ? 'text-brand-600' : 'text-ink-400'} transition-colors`}>
                      {item.icon}
                    </span>
                    {item.label}
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom card */}
        <div className="p-3 shrink-0">
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl p-4 text-white">
            <p className="text-sm font-semibold">FitLedger</p>
            <p className="text-xs text-brand-100 mt-1 leading-relaxed">Sistem manajemen gym profesional.</p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-ink-950/30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-ink-100 sticky top-0 z-20 flex items-center gap-3 px-4 lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-ink-600 hover:bg-ink-100"
          >
            <Menu size={20} />
          </button>

          <div className="hidden sm:block">
            <h2 className="text-sm font-semibold text-ink-900">{currentLabel}</h2>
            <p className="text-xs text-ink-400">{today}</p>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-auto sm:mx-0 sm:ml-auto">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Cari member, invoice, pembayaran…"
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-ink-50 border border-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:bg-white focus:border-ink-200 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center text-ink-600 hover:bg-ink-100 transition-colors"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 ring-2 ring-white text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-12 z-40 w-80 bg-white rounded-xl shadow-pop border border-ink-100 animate-scale-in origin-top-right">
                  <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-900">
                      Notifikasi {unreadCount > 0 && <span className="ml-1 text-xs font-bold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                    </span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-brand-600 font-medium hover:underline">
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {allNotifs.map((n) => {
                      const read = readIds.has(n.id);
                      return (
                        <div
                          key={n.id}
                          onClick={() => setReadIds((prev) => new Set([...prev, n.id]))}
                          className={`px-4 py-3 hover:bg-ink-50 cursor-pointer border-b border-ink-50 last:border-0 ${read ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-start gap-2.5">
                            {toneIcon(n.tone)}
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-semibold text-ink-900 ${!read ? '' : 'font-normal'}`}>{n.title}</p>
                              <p className="text-xs text-ink-500 truncate">{n.desc}</p>
                              <p className="text-[11px] text-ink-400 mt-0.5">{relativeTime(n.time)}</p>
                            </div>
                            {!read && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1" />}
                          </div>
                        </div>
                      );
                    })}
                    {allNotifs.length === 0 && (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-ink-500">Tidak ada notifikasi</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
              className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg hover:bg-ink-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold">
                AD
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-ink-900 leading-none">Admin</p>
                <p className="text-[11px] text-ink-400 mt-0.5">Super Admin</p>
              </div>
              <ChevronDown size={15} className="text-ink-400 hidden md:block" />
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-12 z-40 w-56 bg-white rounded-xl shadow-pop border border-ink-100 animate-scale-in origin-top-right py-1.5">
                  <div className="px-3 py-2.5 border-b border-ink-100 mb-1">
                    <p className="text-sm font-semibold text-ink-900">Admin</p>
                    <p className="text-xs text-ink-400">admin@fitledger.id</p>
                  </div>
                  <button
                    onClick={() => { setProfileOpen(false); setProfileModal(true); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
                  >
                    <User size={16} className="text-ink-400" />
                    Profil Saya
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); setSettingsModal(true); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
                  >
                    <Settings size={16} className="text-ink-400" />
                    Pengaturan
                  </button>
                  <div className="border-t border-ink-100 mt-1 pt-1">
                    <button
                      onClick={() => { setProfileOpen(false); if (window.confirm('Yakin ingin keluar dari FitLedger?')) { window.location.reload(); } }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Keluar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>

      {/* ── Profile Modal ──────────────────────────────────────────────────────── */}
      <Modal
        open={profileModal}
        onClose={() => setProfileModal(false)}
        title="Profil Saya"
        subtitle="Informasi akun administrator"
        footer={<Button onClick={() => setProfileModal(false)}>Tutup</Button>}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-ink-50 rounded-xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xl font-bold">
              AD
            </div>
            <div>
              <p className="text-lg font-bold text-ink-900">Admin</p>
              <p className="text-sm text-ink-500">Super Admin</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Nama', value: 'Admin FitLedger' },
              { label: 'Role', value: 'Super Admin' },
              { label: 'Email', value: 'admin@fitledger.id' },
              { label: 'Bergabung', value: '1 Jan 2026' },
            ].map((f) => (
              <div key={f.label} className="p-3 bg-ink-50/50 rounded-lg">
                <p className="text-xs font-medium text-ink-500">{f.label}</p>
                <p className="text-sm font-semibold text-ink-900 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* ── Settings Modal ─────────────────────────────────────────────────────── */}
      <Modal
        open={settingsModal}
        onClose={() => setSettingsModal(false)}
        title="Pengaturan"
        subtitle="Konfigurasi sistem FitLedger"
        footer={<Button onClick={() => setSettingsModal(false)}>Tutup</Button>}
      >
        <div className="space-y-3">
          {[
            { label: 'Nama Gym', value: 'FitLedger Gym' },
            { label: 'Alamat', value: 'Jl. Sudirman No. 1, Jakarta' },
            { label: 'Mata Uang', value: 'IDR (Rupiah)' },
            { label: 'Zona Waktu', value: 'WIB (UTC+7)' },
            { label: 'Bahasa', value: 'Bahasa Indonesia' },
            { label: 'Versi Aplikasi', value: 'v1.0.0' },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between py-2.5 border-b border-ink-100 last:border-0">
              <p className="text-sm text-ink-600">{s.label}</p>
              <p className="text-sm font-semibold text-ink-900">{s.value}</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
