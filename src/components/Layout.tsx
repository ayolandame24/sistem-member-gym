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
} from 'lucide-react';
import { type ReactNode, useState } from 'react';

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

interface LayoutProps {
  current: PageKey;
  onNavigate: (key: PageKey) => void;
  children: ReactNode;
  search: string;
  onSearchChange: (v: string) => void;
}

export function Layout({
  current,
  onNavigate,
  children,
  search,
  onSearchChange,
}: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const currentLabel =
    navItems.find((n) => n.key === current)?.label ?? 'Dashboard';

  const notifications = [
    { id: 1, title: 'Pembayaran Diterima', desc: 'Putri Anggraini — INV-2026-09-006', time: '2 jam lalu', tone: 'success' },
    { id: 2, title: 'Invoice Jatuh Tempo', desc: 'Agus Wijaya — INV-2026-09-003', time: '5 jam lalu', tone: 'warning' },
    { id: 3, title: 'Langganan Dijeda', desc: 'Rudi Hartono — Premium', time: '1 hari lalu', tone: 'info' },
  ];

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
            <h1 className="text-base font-bold text-ink-900 leading-none">
              FitLedger
            </h1>
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
          <p className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider px-3 mb-2">
            Menu
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = current === item.key;
              return (
                <li key={item.key}>
                  <button
                    onClick={() => {
                      onNavigate(item.key);
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                    }`}
                  >
                    <span
                      className={`${
                        active ? 'text-brand-600' : 'text-ink-400'
                      } transition-colors`}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Upgrade card */}
        <div className="p-3 shrink-0">
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl p-4 text-white">
            <p className="text-sm font-semibold">MVP Demo</p>
            <p className="text-xs text-brand-100 mt-1 leading-relaxed">
              Data sampel Indonesia untuk demonstrasi klien.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-950/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
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
            <h2 className="text-sm font-semibold text-ink-900">
              {currentLabel}
            </h2>
            <p className="text-xs text-ink-400">
              Selasa, 30 September 2026
            </p>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-auto sm:mx-0 sm:ml-auto">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              />
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
              onClick={() => {
                setNotifOpen((v) => !v);
                setProfileOpen(false);
              }}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center text-ink-600 hover:bg-ink-100 transition-colors"
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            {notifOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setNotifOpen(false)}
                />
                <div className="absolute right-0 top-12 z-40 w-80 bg-white rounded-xl shadow-pop border border-ink-100 animate-scale-in origin-top-right">
                  <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink-900">
                      Notifikasi
                    </span>
                    <span className="text-xs text-brand-600 font-medium cursor-pointer hover:underline">
                      Tandai semua dibaca
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="px-4 py-3 hover:bg-ink-50 cursor-pointer border-b border-ink-50 last:border-0"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                              n.tone === 'success'
                                ? 'bg-emerald-500'
                                : n.tone === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-cyan-500'
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink-900">
                              {n.title}
                            </p>
                            <p className="text-xs text-ink-500 truncate">
                              {n.desc}
                            </p>
                            <p className="text-[11px] text-ink-400 mt-0.5">
                              {n.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 border-t border-ink-100">
                    <button className="w-full text-center text-xs font-semibold text-brand-600 hover:text-brand-700 py-1">
                      Lihat semua notifikasi
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen((v) => !v);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg hover:bg-ink-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold">
                AD
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-ink-900 leading-none">
                  Admin
                </p>
                <p className="text-[11px] text-ink-400 mt-0.5">Super Admin</p>
              </div>
              <ChevronDown size={15} className="text-ink-400 hidden md:block" />
            </button>
            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 top-12 z-40 w-56 bg-white rounded-xl shadow-pop border border-ink-100 animate-scale-in origin-top-right py-1.5">
                  <div className="px-3 py-2.5 border-b border-ink-100 mb-1">
                    <p className="text-sm font-semibold text-ink-900">Admin</p>
                    <p className="text-xs text-ink-400">admin@fitledger.id</p>
                  </div>
                  {[
                    { icon: <User size={16} />, label: 'Profil Saya' },
                    { icon: <Settings size={16} />, label: 'Pengaturan' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
                    >
                      <span className="text-ink-400">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                  <div className="border-t border-ink-100 mt-1 pt-1">
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors">
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
    </div>
  );
}
