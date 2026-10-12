/* ============================================================
   FitLedger — Frontend Script
   Koneksi Supabase + CRUD semua modul
   ============================================================ */

// ── Konfigurasi Supabase ───────────────────────────────────
const SUPABASE_URL  = 'https://ecujqknlysbaxchevsdg.supabase.co';
const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjdWpxa25seXNiYXhjaGV2c2RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3Njc3ODYsImV4cCI6MjEwNjM0Mzc4Nn0.ESm4VkFxMtO6V1xuqhbJNgCdFHMlPGTjR0emo5sEFLY';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── State Aplikasi ─────────────────────────────────────────
const state = {
  page: 'dashboard',
  members: [], invoices: [], payments: [], subscriptions: [], monthlyRevenue: [],
  memberPage: 1, invoicePage: 1, paymentPage: 1, subPage: 1,
  PAGE_SIZE: 8,
  globalSearch: '',
};

// ── Utilitas Format ────────────────────────────────────────
const fmtIDR = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n ?? 0);
const fmtDate = (iso) => {
  if (!iso || iso === '—') return '—';
  try { return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)); }
  catch { return iso; }
};
const fmtDateLong = (iso) => {
  if (!iso || iso === '—') return '—';
  try { return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)); }
  catch { return iso; }
};
const initials = (name) => name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
const avatarClass = (color) => {
  if (!color) return '';
  if (color.includes('emerald')) return 'emerald';
  if (color.includes('amber'))   return 'amber';
  if (color.includes('rose'))    return 'rose';
  if (color.includes('violet'))  return 'violet';
  return '';
};
const uuid = () => crypto.randomUUID();
const today = () => new Date().toISOString().slice(0, 10);

const PLAN_FEE = { 'Basic': 250000, 'Premium': 450000, 'Elite': 750000, 'Personal Trainer': 1200000 };

// ── Badge HTML ─────────────────────────────────────────────
function badge(text, tone) {
  const cls = { success:'badge-success', warning:'badge-warning', danger:'badge-danger', info:'badge-info', neutral:'badge-neutral', brand:'badge-brand' };
  return `<span class="badge ${cls[tone] || 'badge-neutral'}">${text}</span>`;
}

function statusBadge(status) {
  const map = {
    'Active':'success', 'Expired':'warning', 'Suspended':'danger',
    'Paid':'success', 'Unpaid':'warning', 'Overdue':'danger',
    'Success':'success', 'Pending':'warning', 'Failed':'danger',
    'Paused':'info', 'Cancelled':'neutral',
  };
  return badge(status, map[status] || 'neutral');
}

// ── Toast ──────────────────────────────────────────────────
function toast(msg, type = 'success') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── Modal ──────────────────────────────────────────────────
function openModal({ title, sub = '', body, footer, large = false }) {
  document.getElementById('modalTitle').textContent  = title;
  document.getElementById('modalSub').textContent    = sub;
  document.getElementById('modalBody').innerHTML     = body;
  document.getElementById('modalFooter').innerHTML   = footer || '';
  document.getElementById('modalBox').className      = `modal-box${large ? ' lg' : ''}`;
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal(e) {
  if (!e || e.target === document.getElementById('modalOverlay') || !e.target) {
    document.getElementById('modalOverlay').classList.remove('open');
  }
}
window.closeModal = closeModal;

// ── Confirm Dialog ─────────────────────────────────────────
function confirm(title, msg, onConfirm, danger = false) {
  openModal({
    title,
    body: `<p style="font-size:14px;color:var(--ink-600)">${msg}</p>`,
    footer: `
      <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirmBtn">Konfirmasi</button>`,
  });
  setTimeout(() => {
    const btn = document.getElementById('confirmBtn');
    if (btn) btn.onclick = () => { closeModal(); onConfirm(); };
  }, 50);
}

// ── Dropdown toggle ────────────────────────────────────────
function toggleNotif()    { document.getElementById('notifDropdown').classList.toggle('open'); document.getElementById('profileDropdown').classList.remove('open'); }
function toggleProfile()  { document.getElementById('profileDropdown').classList.toggle('open'); document.getElementById('notifDropdown').classList.remove('open'); }
function closeDropdowns() { document.getElementById('notifDropdown').classList.remove('open'); document.getElementById('profileDropdown').classList.remove('open'); }
window.toggleNotif = toggleNotif; window.toggleProfile = toggleProfile; window.closeDropdowns = closeDropdowns;

document.addEventListener('click', (e) => {
  if (!e.target.closest('.notif-wrap') && !e.target.closest('.profile-wrap')) closeDropdowns();
});

// ── Sidebar mobile ─────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
}
window.toggleSidebar = toggleSidebar; window.closeSidebar = closeSidebar;

// ── Navigasi ───────────────────────────────────────────────
function navigate(page) {
  state.page = page;
  state.globalSearch = '';
  document.getElementById('globalSearch').value = '';

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById(`page-${page}`)?.classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  document.getElementById('pageTitle').textContent = {
    dashboard: 'Dashboard', members: 'Members', billing: 'Billing',
    recurring: 'Recurring Billing', payments: 'Payments',
    accounting: 'Accounting', reports: 'Reports',
  }[page] || page;

  closeSidebar();
  renderPage(page);
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.page));
});

// ── Tanggal ────────────────────────────────────────────────
function setDate() {
  document.getElementById('pageDate').textContent =
    new Intl.DateTimeFormat('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).format(new Date());
}

// ── Global Search ──────────────────────────────────────────
function handleSearch(val) {
  state.globalSearch = val.toLowerCase();
  renderPage(state.page);
}
window.handleSearch = handleSearch;

// ══════════════════════════════════════════════════════════
// DATA LOADING (Supabase)
// ══════════════════════════════════════════════════════════
async function loadAll() {
  try {
    const [m, i, p, s, r] = await Promise.all([
      db.from('members').select('*').order('created_at', { ascending: false }),
      db.from('invoices').select('*').order('created_at', { ascending: false }),
      db.from('payments').select('*').order('date', { ascending: false }),
      db.from('subscriptions').select('*').order('created_at', { ascending: false }),
      db.from('monthly_revenue').select('*').order('year').order('id'),
    ]);
    state.members      = m.data || [];
    state.invoices     = i.data || [];
    state.payments     = p.data || [];
    state.subscriptions= s.data || [];
    state.monthlyRevenue = r.data || [];
    renderPage(state.page);
    buildNotifications();
  } catch (err) {
    toast('Gagal memuat data dari Supabase', 'error');
    console.error(err);
  }
}

// ── Render halaman ─────────────────────────────────────────
function renderPage(page) {
  if      (page === 'dashboard')  renderDashboard();
  else if (page === 'members')    renderMembers();
  else if (page === 'billing')    renderBilling();
  else if (page === 'recurring')  renderRecurring();
  else if (page === 'payments')   renderPayments();
  else if (page === 'accounting') renderAccounting();
  else if (page === 'reports')    renderReports();
}

// ══════════════════════════════════════════════════════════
// PAGINATION helper
// ══════════════════════════════════════════════════════════
function paginate(arr, page) {
  const total = Math.max(1, Math.ceil(arr.length / state.PAGE_SIZE));
  const p = Math.min(Math.max(1, page), total);
  return { items: arr.slice((p - 1) * state.PAGE_SIZE, p * state.PAGE_SIZE), total, current: p };
}

function paginationHTML(current, total, onPage) {
  if (total <= 1) return '';
  let html = '<div class="pagination">';
  html += `<button class="pg-btn" ${current === 1 ? 'disabled' : ''} onclick="${onPage}(${current - 1})">‹</button>`;
  for (let i = 1; i <= total; i++) {
    html += `<button class="pg-btn ${i === current ? 'active' : ''}" onclick="${onPage}(${i})">${i}</button>`;
  }
  html += `<button class="pg-btn" ${current === total ? 'disabled' : ''} onclick="${onPage}(${current + 1})">›</button>`;
  html += '</div>';
  return html;
}

function footerHTML(filtered, total, current, totalPages, onPage, noun) {
  const from = filtered === 0 ? 0 : (current - 1) * state.PAGE_SIZE + 1;
  const to   = Math.min(current * state.PAGE_SIZE, filtered);
  return `
    <span>${filtered === 0 ? 'Tidak ada data' : `Menampilkan ${from}–${to} dari ${filtered} ${noun}`}</span>
    ${paginationHTML(current, totalPages, onPage)}`;
}

// ══════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════
function renderDashboard() {
  const m   = state.members;
  const inv = state.invoices;
  const pay = state.payments;
  const sub = state.subscriptions;
  const rev = state.monthlyRevenue;

  const totalRev   = rev.reduce((s, r) => s + r.revenue, 0);
  const mrr        = sub.filter(s => s.status === 'Active').reduce((s, x) => s + x.monthly_fee, 0);
  const activeM    = m.filter(x => x.status === 'Active').length;
  const outstanding= inv.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);

  // Stat cards
  document.getElementById('dashStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">💰</div>
      <div class="stat-label">Total Revenue</div>
      <div class="stat-value tnum">${fmtIDR(totalRev)}</div>
      <div class="stat-sub">${rev.length} bulan akumulasi</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">🔁</div>
      <div class="stat-label">Monthly Recurring Revenue</div>
      <div class="stat-value tnum">${fmtIDR(mrr)}</div>
      <div class="stat-sub">Dari langganan aktif</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">👥</div>
      <div class="stat-label">Active Members</div>
      <div class="stat-value">${activeM}</div>
      <div class="stat-sub">dari ${m.length} total anggota</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">⚠️</div>
      <div class="stat-label">Outstanding Bills</div>
      <div class="stat-value tnum text-rose">${fmtIDR(outstanding)}</div>
      <div class="stat-sub">${inv.filter(i=>i.status!=='Paid').length} invoice belum dibayar</div>
    </div>`;

  // Recent payments
  const recent = [...pay].sort((a,b) => b.date.localeCompare(a.date)).slice(0,6);
  document.getElementById('recentPaymentsList').innerHTML = recent.length
    ? recent.map(p => `
        <div class="list-item">
          <div class="av ${avatarClass(p.member_name)}">${initials(p.member_name)}</div>
          <div class="list-item-body">
            <div class="list-item-title">${p.member_name}</div>
            <div class="list-item-sub">${p.invoice_number} · ${p.method} · ${fmtDate(p.date)}</div>
          </div>
          <div class="list-item-right">
            <div class="list-item-amount tnum">${fmtIDR(p.amount)}</div>
            ${statusBadge(p.status)}
          </div>
        </div>`).join('')
    : '<div class="empty-state"><div class="empty-state-icon">💳</div><div class="empty-state-title">Belum ada pembayaran</div></div>';

  // Outstanding invoices
  const outs = inv.filter(i => i.status !== 'Paid').slice(0,6);
  document.getElementById('outstandingList').innerHTML = outs.length
    ? outs.map(i => `
        <div class="list-item">
          <div style="font-size:22px">🧾</div>
          <div class="list-item-body">
            <div class="list-item-title">${i.member_name}</div>
            <div class="list-item-sub">${i.number} · Jatuh tempo ${fmtDate(i.due_date)}</div>
          </div>
          <div class="list-item-right">
            <div class="list-item-amount tnum">${fmtIDR(i.amount)}</div>
            ${statusBadge(i.status)}
          </div>
        </div>`).join('')
    : '<div class="empty-state"><div class="empty-state-icon">🎉</div><div class="empty-state-title">Semua invoice sudah lunas!</div></div>';
}

// ══════════════════════════════════════════════════════════
// MEMBERS
// ══════════════════════════════════════════════════════════
function getFilteredMembers() {
  const q  = (document.getElementById('memberSearch')?.value || state.globalSearch).toLowerCase();
  const st = document.getElementById('memberStatusFilter')?.value || '';
  const pl = document.getElementById('memberPlanFilter')?.value   || '';
  return state.members.filter(m =>
    (!q  || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)) &&
    (!st || m.status === st) &&
    (!pl || m.plan === pl)
  );
}

function filterMembers()  { state.memberPage = 1; renderMembers(); }
window.filterMembers = filterMembers;
window.memberGoPage  = (p) => { state.memberPage = p; renderMembers(); };

function renderMembers() {
  const m = state.members;
  // Chips
  document.getElementById('memberChips').innerHTML = [
    { label: 'Total Members', value: m.length, tone: 'var(--ink-900)' },
    { label: 'Active',    value: m.filter(x=>x.status==='Active').length,    tone: 'var(--emerald)' },
    { label: 'Expired',   value: m.filter(x=>x.status==='Expired').length,   tone: 'var(--amber)' },
    { label: 'Suspended', value: m.filter(x=>x.status==='Suspended').length, tone: 'var(--rose)' },
  ].map(c => `<div class="chip"><div class="chip-label">${c.label}</div><div class="chip-value" style="color:${c.tone}">${c.value}</div></div>`).join('');

  const filtered = getFilteredMembers();
  const { items, total, current } = paginate(filtered, state.memberPage);

  document.getElementById('membersBody').innerHTML = items.length
    ? items.map(m => `
      <tr onclick="viewMember('${m.id}')">
        <td><div class="member-cell">
          <div class="av ${avatarClass(m.avatar_color)}">${initials(m.name)}</div>
          <div><div class="cell-name">${m.name}</div><div class="cell-sub">${m.email}</div></div>
        </div></td>
        <td class="tnum">${m.code}</td>
        <td><div>${m.plan}</div><div class="cell-sub tnum">${fmtIDR(m.monthly_fee)}/bln</div></td>
        <td>${fmtDate(m.start_date)}</td>
        <td>${m.expiry_date ? fmtDate(m.expiry_date) : '—'}</td>
        <td>${statusBadge(m.status)}</td>
        <td><div class="row-actions">
          <button class="act-btn success" title="Edit" onclick="event.stopPropagation();editMember('${m.id}')">✏️</button>
          <button class="act-btn danger" title="Hapus" onclick="event.stopPropagation();deleteMember('${m.id}','${m.name}')">🗑️</button>
        </div></td>
      </tr>`).join('')
    : `<tr><td colspan="7"><div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-title">Tidak ada member ditemukan</div></div></td></tr>`;

  document.getElementById('memberFooter').innerHTML =
    footerHTML(filtered.length, m.length, current, total, 'memberGoPage', 'member');
}

// View detail member
function viewMember(id) {
  const m = state.members.find(x => x.id === id); if (!m) return;
  openModal({
    title: 'Member Details', sub: m.code, large: true,
    body: `
      <div class="member-banner">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="av ${avatarClass(m.avatar_color)}" style="width:48px;height:48px;font-size:16px">${initials(m.name)}</div>
          <div><div class="member-banner-name">${m.name}</div><div class="member-banner-sub">${m.code}</div></div>
        </div>
        ${statusBadge(m.status)}
      </div>
      <div class="info-grid">
        ${[['Email',m.email],['Telepon',m.phone],['Bergabung',fmtDateLong(m.join_date)],['Mulai',fmtDateLong(m.start_date)],['Jatuh Tempo',m.expiry_date?fmtDateLong(m.expiry_date):'—'],['Iuran',fmtIDR(m.monthly_fee)+'/bln']].map(([l,v])=>`
        <div class="info-field"><div class="info-field-label">${l}</div><div class="info-field-value">${v}</div></div>`).join('')}
      </div>
      <div class="form-info" style="margin-top:14px">
        <div style="font-size:11px;font-weight:700;margin-bottom:4px">MEMBERSHIP PLAN</div>
        <div style="font-size:16px;font-weight:700">${m.plan}</div>
        <div style="font-size:12px">${fmtIDR(m.monthly_fee)} per bulan</div>
      </div>`,
    footer: `<button class="btn btn-secondary" onclick="closeModal()">Tutup</button>
             <button class="btn btn-primary" onclick="closeModal();editMember('${m.id}')">✏️ Edit Member</button>`,
  });
}
window.viewMember = viewMember;

// Form member (shared add/edit)
function memberFormHTML(m = {}) {
  return `
    <div class="form-group"><label>Nama Lengkap <span class="req">*</span></label>
      <input class="form-control" id="fName" value="${m.name||''}" placeholder="cth. Budi Santoso" /></div>
    <div class="form-row">
      <div class="form-group"><label>Email <span class="req">*</span></label>
        <input class="form-control" id="fEmail" type="email" value="${m.email||''}" placeholder="nama@email.com" /></div>
      <div class="form-group"><label>No. Telepon</label>
        <input class="form-control" id="fPhone" value="${m.phone&&m.phone!=='-'?m.phone:''}" placeholder="08xx-xxxx-xxxx" /></div>
    </div>
    <div class="form-group"><label>Membership Plan <span class="req">*</span></label>
      <select class="form-control" id="fPlan">
        ${Object.entries(PLAN_FEE).map(([k,v])=>`<option value="${k}" ${m.plan===k?'selected':''}>${k} — ${fmtIDR(v)}/bln</option>`).join('')}
      </select></div>
    <div class="form-group"><label>Status</label>
      <select class="form-control" id="fStatus">
        ${['Active','Expired','Suspended'].map(s=>`<option value="${s}" ${(m.status||'Active')===s?'selected':''}>${s}</option>`).join('')}
      </select></div>
    <div class="form-row">
      <div class="form-group"><label>Tanggal Mulai</label>
        <input class="form-control" id="fStart" type="date" value="${m.start_date||''}" /></div>
      <div class="form-group"><label>Tanggal Jatuh Tempo</label>
        <input class="form-control" id="fExpiry" type="date" value="${m.expiry_date||''}" /></div>
    </div>`;
}

function validateMemberForm() {
  const name  = document.getElementById('fName').value.trim();
  const email = document.getElementById('fEmail').value.trim();
  if (!name)  { toast('Nama lengkap wajib diisi', 'error'); return null; }
  if (!email) { toast('Email wajib diisi', 'error'); return null; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Format email tidak valid', 'error'); return null; }
  return {
    name, email,
    phone:       document.getElementById('fPhone').value.trim() || '-',
    plan:        document.getElementById('fPlan').value,
    status:      document.getElementById('fStatus').value,
    start_date:  document.getElementById('fStart').value || today(),
    expiry_date: document.getElementById('fExpiry').value || null,
    monthly_fee: PLAN_FEE[document.getElementById('fPlan').value],
  };
}

function openAddMember() {
  const colors = ['bg-brand-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-violet-500'];
  openModal({
    title: 'Add New Member', sub: 'Daftarkan anggota gym baru',
    body: memberFormHTML(),
    footer: `<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
             <button class="btn btn-primary" onclick="submitAddMember()">Simpan Member</button>`,
  });
  window._editMemberId = null;
  window._memberColors = colors;
}
window.openAddMember = openAddMember;

async function submitAddMember() {
  const f = validateMemberForm(); if (!f) return;
  const colors = window._memberColors || ['bg-brand-500'];
  const newM = {
    id: uuid(),
    code: `MBR-${new Date().getFullYear()}-${String(state.members.length+1).padStart(3,'0')}`,
    avatar_color: colors[state.members.length % colors.length],
    join_date: f.start_date,
    ...f,
  };
  const { data, error } = await db.from('members').insert(newM).select().single();
  if (error) { toast('Gagal menambah member: ' + error.message, 'error'); return; }
  state.members.unshift(data);
  closeModal(); toast('Member berhasil ditambahkan!');
  renderMembers(); buildNotifications();
}
window.submitAddMember = submitAddMember;

function editMember(id) {
  const m = state.members.find(x => x.id === id); if (!m) return;
  openModal({
    title: 'Edit Member', sub: m.name,
    body: memberFormHTML(m),
    footer: `<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
             <button class="btn btn-primary" onclick="submitEditMember('${id}')">Simpan Perubahan</button>`,
  });
}
window.editMember = editMember;

async function submitEditMember(id) {
  const f = validateMemberForm(); if (!f) return;
  const { data, error } = await db.from('members').update(f).eq('id', id).select().single();
  if (error) { toast('Gagal mengupdate member: ' + error.message, 'error'); return; }
  state.members = state.members.map(m => m.id === id ? data : m);
  closeModal(); toast('Member berhasil diupdate!');
  renderMembers();
}
window.submitEditMember = submitEditMember;

function deleteMember(id, name) {
  confirm('Hapus Member', `Apakah Anda yakin ingin menghapus <b>${name}</b>? Tindakan ini tidak dapat dibatalkan.`, async () => {
    const { error } = await db.from('members').delete().eq('id', id);
    if (error) { toast('Gagal menghapus member: ' + error.message, 'error'); return; }
    state.members = state.members.filter(m => m.id !== id);
    toast('Member berhasil dihapus!');
    renderMembers();
  }, true);
}
window.deleteMember = deleteMember;

// ══════════════════════════════════════════════════════════
// BILLING (INVOICES)
// ══════════════════════════════════════════════════════════
function getFilteredInvoices() {
  const q  = (document.getElementById('invoiceSearch')?.value || state.globalSearch).toLowerCase();
  const st = document.getElementById('invoiceStatusFilter')?.value || '';
  return state.invoices.filter(i =>
    (!q  || i.number.toLowerCase().includes(q) || i.member_name.toLowerCase().includes(q)) &&
    (!st || i.status === st)
  );
}
function filterInvoices()  { state.invoicePage = 1; renderBilling(); }
window.filterInvoices = filterInvoices;
window.invoiceGoPage  = (p) => { state.invoicePage = p; renderBilling(); };

function renderBilling() {
  const inv = state.invoices;
  const paid = inv.filter(i=>i.status==='Paid').length;
  const unpaid = inv.filter(i=>i.status==='Unpaid').length;
  const outs = inv.filter(i=>i.status!=='Paid').reduce((s,i)=>s+i.amount,0);

  document.getElementById('billingChips').innerHTML = [
    { label:'Total Invoice',  value:inv.length,       color:'var(--ink-900)' },
    { label:'Paid',           value:paid,              color:'var(--emerald)' },
    { label:'Unpaid',         value:unpaid,            color:'var(--amber)' },
    { label:'Outstanding',    value:fmtIDR(outs),      color:'var(--rose)' },
  ].map(c=>`<div class="chip"><div class="chip-label">${c.label}</div><div class="chip-value tnum" style="color:${c.color}">${c.value}</div></div>`).join('');

  const filtered = getFilteredInvoices();
  const { items, total, current } = paginate(filtered, state.invoicePage);

  document.getElementById('invoicesBody').innerHTML = items.length
    ? items.map(i => `
      <tr onclick="viewInvoice('${i.id}')">
        <td class="tnum" style="font-weight:600">${i.number}</td>
        <td><div class="member-cell"><div class="av">${initials(i.member_name)}</div><span>${i.member_name}</span></div></td>
        <td>${i.plan}</td>
        <td>${i.period}</td>
        <td class="tnum" style="font-weight:700">${fmtIDR(i.amount)}</td>
        <td>${fmtDate(i.due_date)}</td>
        <td>${statusBadge(i.status)}</td>
        <td><div class="row-actions">
          ${i.status!=='Paid'?`<button class="act-btn success" title="Tandai Lunas" onclick="event.stopPropagation();markInvoicePaid('${i.id}','${i.number}')">✅</button>`:''}
          <button class="act-btn danger" title="Hapus" onclick="event.stopPropagation();deleteInvoice('${i.id}','${i.number}')">🗑️</button>
        </div></td>
      </tr>`).join('')
    : `<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">🧾</div><div class="empty-state-title">Tidak ada invoice ditemukan</div></div></td></tr>`;

  document.getElementById('invoiceFooter').innerHTML =
    footerHTML(filtered.length, inv.length, current, total, 'invoiceGoPage', 'invoice');
}

function viewInvoice(id) {
  const i = state.invoices.find(x=>x.id===id); if(!i) return;
  openModal({
    title:'Invoice Details', sub:i.number, large:true,
    body:`
      <div class="member-banner">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="av">${initials(i.member_name)}</div>
          <div><div class="member-banner-name">${i.member_name}</div><div class="member-banner-sub">Paket ${i.plan}</div></div>
        </div>${statusBadge(i.status)}
      </div>
      <div class="info-grid">
        ${[['No. Invoice',i.number],['Periode',i.period],['Diterbitkan',fmtDateLong(i.issued_date)],['Jatuh Tempo',fmtDateLong(i.due_date)]].map(([l,v])=>`<div class="info-field"><div class="info-field-label">${l}</div><div class="info-field-value">${v}</div></div>`).join('')}
      </div>
      <div style="border:1px solid var(--ink-200);border-radius:10px;padding:14px;margin-top:14px">
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--ink-100)">
          <span>Membership ${i.plan} — ${i.period}</span>
          <span class="tnum" style="font-weight:600">${fmtIDR(i.amount)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding-top:12px">
          <span style="font-weight:700">Total</span>
          <span class="tnum" style="font-size:18px;font-weight:700;color:var(--brand-600)">${fmtIDR(i.amount)}</span>
        </div>
      </div>`,
    footer:`<button class="btn btn-secondary" onclick="printInvoice('${i.id}')">🖨️ Print/PDF</button>
            <button class="btn btn-primary" onclick="closeModal()">Tutup</button>`,
  });
}
window.viewInvoice = viewInvoice;

function printInvoice(id) {
  const i = state.invoices.find(x=>x.id===id); if(!i) return;
  const w = window.open('','_blank','width=700,height=900');
  if(!w) return;
  w.document.write(`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"/><title>Invoice ${i.number}</title>
  <style>body{font-family:Arial,sans-serif;max-width:600px;margin:40px auto;color:#1a1a2e}
  .hd{display:flex;justify-content:space-between;margin-bottom:30px}
  .brand{font-size:20px;font-weight:700}.brand span{color:#2563eb}
  h2{font-size:22px;color:#2563eb;margin:0}
  .badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600;background:${i.status==='Paid'?'#dcfce7':i.status==='Overdue'?'#fee2e2':'#fef9c3'};color:${i.status==='Paid'?'#166534':i.status==='Overdue'?'#991b1b':'#854d0e'}}
  hr{border:none;border-top:1px solid #e2e8f0;margin:20px 0}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:20px 0}
  .f label{font-size:11px;color:#64748b;text-transform:uppercase}
  .f p{margin:2px 0 0;font-weight:600}
  .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9}
  .total{display:flex;justify-content:space-between;padding:14px 0 0;font-size:18px;font-weight:700;color:#2563eb}
  @media print{button{display:none}}</style></head>
  <body><div class="hd"><div><div class="brand">Fit<span>Ledger</span></div><div style="font-size:12px;color:#64748b">Gym Billing & Accounting</div></div>
  <div style="text-align:right"><h2>${i.number}</h2><span class="badge">${i.status}</span></div></div>
  <hr/><div class="grid">
  <div class="f"><label>Member</label><p>${i.member_name}</p></div>
  <div class="f"><label>Paket</label><p>${i.plan}</p></div>
  <div class="f"><label>Periode</label><p>${i.period}</p></div>
  <div class="f"><label>Diterbitkan</label><p>${i.issued_date}</p></div>
  <div class="f"><label>Jatuh Tempo</label><p>${i.due_date}</p></div></div><hr/>
  <div class="row"><span>Membership ${i.plan} — ${i.period}</span><span>${fmtIDR(i.amount)}</span></div>
  <div class="total"><span>Total</span><span>${fmtIDR(i.amount)}</span></div>
  <hr style="margin-top:30px"/><p style="font-size:11px;color:#94a3b8;text-align:center">FitLedger · ${fmtDateLong(today())}</p>
  <script>window.onload=()=>window.print();<\/script></body></html>`);
  w.document.close();
}
window.printInvoice = printInvoice;

function openAddInvoice() {
  const opts = state.members.map(m=>`<option value="${m.id}">${m.name} — ${m.plan}</option>`).join('');
  openModal({
    title:'Add New Invoice', sub:'Buat tagihan untuk anggota',
    body:`
      <div class="form-group"><label>Pilih Member <span class="req">*</span></label>
        <select class="form-control" id="iMember" onchange="updateInvoicePreview()">
          <option value="">— Pilih anggota —</option>${opts}
        </select></div>
      <div class="form-group"><label>Periode Tagihan <span class="req">*</span></label>
        <input class="form-control" id="iPeriod" value="${new Date().toLocaleDateString('id-ID',{month:'short',year:'numeric'})}" /></div>
      <div class="form-group"><label>Tanggal Jatuh Tempo <span class="req">*</span></label>
        <input class="form-control" id="iDue" type="date" /></div>
      <div id="invoicePreview"></div>`,
    footer:`<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
            <button class="btn btn-primary" onclick="submitAddInvoice()">Buat Invoice</button>`,
  });
}
window.openAddInvoice = openAddInvoice;

function updateInvoicePreview() {
  const m = state.members.find(x=>x.id===document.getElementById('iMember')?.value);
  document.getElementById('invoicePreview').innerHTML = m
    ? `<div class="form-info">💰 Jumlah invoice: <strong class="tnum">${fmtIDR(m.monthly_fee)}</strong> (Paket ${m.plan})</div>`
    : '';
}
window.updateInvoicePreview = updateInvoicePreview;

async function submitAddInvoice() {
  const memberId = document.getElementById('iMember').value;
  const period   = document.getElementById('iPeriod').value.trim();
  const dueDate  = document.getElementById('iDue').value;
  if (!memberId) { toast('Pilih member terlebih dahulu', 'error'); return; }
  if (!period)   { toast('Periode wajib diisi', 'error'); return; }
  if (!dueDate)  { toast('Tanggal jatuh tempo wajib diisi', 'error'); return; }
  const m = state.members.find(x=>x.id===memberId);
  if (!m) return;
  const yr  = new Date().getFullYear();
  const mo  = String(new Date().getMonth()+1).padStart(2,'0');
  const newInv = {
    id: uuid(),
    number: `INV-${yr}-${mo}-${String(state.invoices.length+1).padStart(3,'0')}`,
    member_id: m.id, member_name: m.name, plan: m.plan,
    period, amount: m.monthly_fee, due_date: dueDate,
    status: 'Unpaid', issued_date: today(),
  };
  const { data, error } = await db.from('invoices').insert(newInv).select().single();
  if (error) { toast('Gagal membuat invoice: '+error.message,'error'); return; }
  state.invoices.unshift(data);
  closeModal(); toast('Invoice berhasil dibuat!');
  renderBilling();
}
window.submitAddInvoice = submitAddInvoice;

function markInvoicePaid(id, number) {
  confirm('Tandai Invoice Lunas', `Konfirmasi pembayaran untuk invoice <b>${number}</b>?`, async () => {
    const { data, error } = await db.from('invoices').update({ status:'Paid' }).eq('id',id).select().single();
    if (error) { toast('Gagal update invoice','error'); return; }
    state.invoices = state.invoices.map(i=>i.id===id?data:i);
    toast('Invoice ditandai lunas!');
    renderBilling(); renderDashboard();
  });
}
window.markInvoicePaid = markInvoicePaid;

function deleteInvoice(id, number) {
  confirm('Hapus Invoice', `Yakin ingin menghapus invoice <b>${number}</b>?`, async () => {
    const { error } = await db.from('invoices').delete().eq('id',id);
    if (error) { toast('Gagal menghapus invoice','error'); return; }
    state.invoices = state.invoices.filter(i=>i.id!==id);
    toast('Invoice berhasil dihapus!');
    renderBilling();
  }, true);
}
window.deleteInvoice = deleteInvoice;

// ══════════════════════════════════════════════════════════
// RECURRING
// ══════════════════════════════════════════════════════════
function getFilteredSubs() {
  const q  = (document.getElementById('recurringSearch')?.value || state.globalSearch).toLowerCase();
  const st = document.getElementById('recurringStatusFilter')?.value || '';
  return state.subscriptions.filter(s =>
    (!q  || s.member_name.toLowerCase().includes(q)) &&
    (!st || s.status === st)
  );
}
function filterSubscriptions()  { state.subPage = 1; renderRecurring(); }
window.filterSubscriptions = filterSubscriptions;
window.subGoPage = (p) => { state.subPage = p; renderRecurring(); };

function renderRecurring() {
  const subs = state.subscriptions;
  const active    = subs.filter(s=>s.status==='Active').length;
  const paused    = subs.filter(s=>s.status==='Paused').length;
  const cancelled = subs.filter(s=>s.status==='Cancelled').length;
  const mrr       = subs.filter(s=>s.status==='Active').reduce((acc,s)=>acc+s.monthly_fee,0);

  document.getElementById('recurringChips').innerHTML = [
    { label:'Total MRR',         value:fmtIDR(mrr), color:'var(--emerald)' },
    { label:'Active',            value:active,       color:'var(--emerald)' },
    { label:'Paused',            value:paused,       color:'var(--amber)' },
    { label:'Cancelled',         value:cancelled,    color:'var(--rose)' },
  ].map(c=>`<div class="chip"><div class="chip-label">${c.label}</div><div class="chip-value tnum" style="color:${c.color}">${c.value}</div></div>`).join('');

  const filtered = getFilteredSubs();
  const { items, total, current } = paginate(filtered, state.subPage);

  document.getElementById('subscriptionsBody').innerHTML = items.length
    ? items.map(s=>`
      <tr>
        <td><div class="member-cell"><div class="av">${initials(s.member_name)}</div><span style="font-weight:600">${s.member_name}</span></div></td>
        <td>${s.plan}</td>
        <td class="tnum" style="font-weight:700">${fmtIDR(s.monthly_fee)}<span style="color:var(--ink-400);font-size:11px">/bln</span></td>
        <td>${s.next_billing_date==='—'?'—':fmtDate(s.next_billing_date)}</td>
        <td>${statusBadge(s.status)}</td>
        <td><button class="btn btn-secondary btn-sm" ${s.status==='Cancelled'?'disabled':''} onclick="manageSubscription('${s.id}')">⚙️ Manage</button></td>
      </tr>`).join('')
    : `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">🔁</div><div class="empty-state-title">Tidak ada langganan ditemukan</div></div></td></tr>`;

  document.getElementById('recurringFooter').innerHTML =
    footerHTML(filtered.length, subs.length, current, total, 'subGoPage', 'langganan');
}

function manageSubscription(id) {
  const s = state.subscriptions.find(x=>x.id===id); if(!s) return;
  let actions = '';
  if (s.status==='Active')  actions += `<button class="manage-action pause"  onclick="changeSubStatus('${id}','Paused')"><span class="manage-action-icon">⏸️</span><div><div class="manage-action-title">Jeda Langganan</div><div class="manage-action-desc">Tidak menagih hingga dilanjutkan</div></div></button>`;
  if (s.status==='Paused')  actions += `<button class="manage-action resume" onclick="changeSubStatus('${id}','Active')"><span class="manage-action-icon">▶️</span><div><div class="manage-action-title">Lanjutkan Langganan</div><div class="manage-action-desc">Aktifkan kembali tagihan berulang</div></div></button>`;
  if (s.status!=='Cancelled') actions += `<button class="manage-action cancel" onclick="changeSubStatus('${id}','Cancelled')"><span class="manage-action-icon">❌</span><div><div class="manage-action-title">Batalkan Langganan</div><div class="manage-action-desc">Hentikan langganan secara permanen</div></div></button>`;
  if (!actions) actions = `<p style="color:var(--ink-500);font-size:13px">Tidak ada aksi tersedia untuk langganan yang dibatalkan.</p>`;

  openModal({
    title:'Manage Subscription', sub:s.member_name,
    body:`
      <div class="member-banner">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="av">${initials(s.member_name)}</div>
          <div><div class="member-banner-name">${s.member_name}</div><div class="member-banner-sub">Paket ${s.plan}</div></div>
        </div>${statusBadge(s.status)}
      </div>
      <div class="info-grid" style="margin-bottom:14px">
        <div class="info-field"><div class="info-field-label">Iuran Bulanan</div><div class="info-field-value tnum">${fmtIDR(s.monthly_fee)}</div></div>
        <div class="info-field"><div class="info-field-label">Next Billing</div><div class="info-field-value">${s.next_billing_date==='—'?'—':fmtDate(s.next_billing_date)}</div></div>
      </div>
      ${actions}`,
    footer:`<button class="btn btn-secondary" onclick="closeModal()">Tutup</button>`,
  });
}
window.manageSubscription = manageSubscription;

async function changeSubStatus(id, newStatus) {
  const updates = { status: newStatus };
  if (newStatus === 'Cancelled') updates.next_billing_date = '—';
  const { data, error } = await db.from('subscriptions').update(updates).eq('id',id).select().single();
  if (error) { toast('Gagal update langganan','error'); return; }
  state.subscriptions = state.subscriptions.map(s=>s.id===id?data:s);
  closeModal(); toast(`Langganan berhasil diubah ke ${newStatus}!`);
  renderRecurring();
}
window.changeSubStatus = changeSubStatus;

function openAddSubscription() {
  const activeMembers = state.members.filter(m=>m.status==='Active');
  const opts = activeMembers.map(m=>`<option value="${m.id}" data-plan="${m.plan}">${m.name} — ${m.plan}</option>`).join('');
  openModal({
    title:'Tambah Langganan Baru', sub:'Daftarkan recurring billing anggota',
    body:`
      <div class="form-group"><label>Member <span class="req">*</span></label>
        <select class="form-control" id="sMember" onchange="updateSubPlan()">
          <option value="">— Pilih anggota aktif —</option>${opts}
        </select></div>
      <div class="form-group"><label>Paket <span class="req">*</span></label>
        <select class="form-control" id="sPlan" onchange="updateSubFeePreview()">
          ${Object.entries(PLAN_FEE).map(([k,v])=>`<option value="${k}">${k} — ${fmtIDR(v)}/bln</option>`).join('')}
        </select></div>
      <div class="form-row">
        <div class="form-group"><label>Tanggal Mulai <span class="req">*</span></label>
          <input class="form-control" id="sStart" type="date" value="${today()}" /></div>
        <div class="form-group"><label>Next Billing Date <span class="req">*</span></label>
          <input class="form-control" id="sNext" type="date" /></div>
      </div>
      <div id="subFeePreview"></div>`,
    footer:`<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
            <button class="btn btn-primary" onclick="submitAddSubscription()">Simpan Langganan</button>`,
  });
  setTimeout(()=>updateSubFeePreview(), 100);
}
window.openAddSubscription = openAddSubscription;

function updateSubPlan() {
  const sel = document.getElementById('sMember');
  const opt = sel?.options[sel.selectedIndex];
  if (opt?.dataset.plan) document.getElementById('sPlan').value = opt.dataset.plan;
  updateSubFeePreview();
}
function updateSubFeePreview() {
  const plan = document.getElementById('sPlan')?.value;
  const fee  = PLAN_FEE[plan] || 0;
  const el   = document.getElementById('subFeePreview');
  if (el) el.innerHTML = plan ? `<div class="form-info">💰 Iuran bulanan: <strong class="tnum">${fmtIDR(fee)}/bln</strong></div>` : '';
}
window.updateSubPlan = updateSubPlan; window.updateSubFeePreview = updateSubFeePreview;

async function submitAddSubscription() {
  const memberId = document.getElementById('sMember').value;
  const plan     = document.getElementById('sPlan').value;
  const start    = document.getElementById('sStart').value;
  const next     = document.getElementById('sNext').value;
  if (!memberId) { toast('Pilih member terlebih dahulu','error'); return; }
  if (!start)    { toast('Tanggal mulai wajib diisi','error'); return; }
  if (!next)     { toast('Next billing date wajib diisi','error'); return; }
  const m = state.members.find(x=>x.id===memberId);
  if (!m) return;
  const newSub = { id:uuid(), member_id:m.id, member_name:m.name, plan, monthly_fee:PLAN_FEE[plan], next_billing_date:next, status:'Active', start_date:start };
  const { data, error } = await db.from('subscriptions').insert(newSub).select().single();
  if (error) { toast('Gagal menambah langganan: '+error.message,'error'); return; }
  state.subscriptions.unshift(data);
  closeModal(); toast('Langganan berhasil ditambahkan!');
  renderRecurring();
}
window.submitAddSubscription = submitAddSubscription;

// ══════════════════════════════════════════════════════════
// PAYMENTS
// ══════════════════════════════════════════════════════════
const METHOD_ICON = { 'Transfer Bank':'🏦', 'Cash':'💵', 'Debit Card':'💳', 'QRIS':'📱', 'E-Wallet':'👛' };

function getFilteredPayments() {
  const q  = (document.getElementById('paymentSearch')?.value || state.globalSearch).toLowerCase();
  const st = document.getElementById('paymentStatusFilter')?.value || '';
  const mt = document.getElementById('paymentMethodFilter')?.value || '';
  return state.payments.filter(p =>
    (!q  || p.member_name.toLowerCase().includes(q) || p.invoice_number.toLowerCase().includes(q)) &&
    (!st || p.status  === st) &&
    (!mt || p.method  === mt)
  );
}
function filterPayments()  { state.paymentPage = 1; renderPayments(); }
window.filterPayments = filterPayments;
window.paymentGoPage  = (p) => { state.paymentPage = p; renderPayments(); };

function renderPayments() {
  const pay = state.payments;
  const received = pay.filter(p=>p.status==='Success').reduce((s,p)=>s+p.amount,0);
  const pending  = pay.filter(p=>p.status==='Pending').reduce((s,p)=>s+p.amount,0);

  document.getElementById('paymentChips').innerHTML = [
    { label:'Total Diterima', value:fmtIDR(received), color:'var(--emerald)' },
    { label:'Pending',        value:fmtIDR(pending),  color:'var(--amber)' },
    { label:'Total Transaksi',value:pay.length,        color:'var(--ink-900)' },
  ].map(c=>`<div class="chip"><div class="chip-label">${c.label}</div><div class="chip-value tnum" style="color:${c.color}">${c.value}</div></div>`).join('');

  const filtered = getFilteredPayments();
  const { items, total, current } = paginate(filtered, state.paymentPage);

  document.getElementById('paymentsBody').innerHTML = items.length
    ? items.map(p=>`
      <tr onclick="viewPayment('${p.id}')">
        <td>${fmtDate(p.date)}</td>
        <td><div class="member-cell"><div class="av">${initials(p.member_name)}</div><span style="font-weight:600">${p.member_name}</span></div></td>
        <td class="tnum">${p.invoice_number}</td>
        <td class="tnum" style="font-weight:700">${fmtIDR(p.amount)}</td>
        <td><span class="badge badge-neutral">${METHOD_ICON[p.method]||''} ${p.method}</span></td>
        <td>${statusBadge(p.status)}</td>
      </tr>`).join('')
    : `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">💳</div><div class="empty-state-title">Tidak ada pembayaran ditemukan</div></div></td></tr>`;

  document.getElementById('paymentFooter').innerHTML =
    footerHTML(filtered.length, pay.length, current, total, 'paymentGoPage', 'pembayaran');
}

function viewPayment(id) {
  const p = state.payments.find(x=>x.id===id); if(!p) return;
  openModal({
    title:'Detail Pembayaran', sub:p.invoice_number, large:true,
    body:`
      <div class="member-banner">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="av">${initials(p.member_name)}</div>
          <div><div class="member-banner-name">${p.member_name}</div><div class="member-banner-sub">${p.invoice_number}</div></div>
        </div>${statusBadge(p.status)}
      </div>
      <div class="info-grid">
        ${[['Tanggal',fmtDateLong(p.date)],['Jumlah',fmtIDR(p.amount)],['Metode',METHOD_ICON[p.method]+' '+p.method],['No. Invoice',p.invoice_number]].map(([l,v])=>`<div class="info-field"><div class="info-field-label">${l}</div><div class="info-field-value tnum">${v}</div></div>`).join('')}
      </div>`,
    footer:`<button class="btn btn-primary" onclick="closeModal()">Tutup</button>`,
  });
}
window.viewPayment = viewPayment;

function openAddPayment() {
  const opts = state.members.map(m=>`<option value="${m.id}">${m.name} — ${m.plan}</option>`).join('');
  openModal({
    title:'Catat Pembayaran Baru', sub:'Rekam transaksi pembayaran',
    body:`
      <div class="form-group"><label>Member <span class="req">*</span></label>
        <select class="form-control" id="pMember" onchange="prefillPaymentAmount()">
          <option value="">— Pilih anggota —</option>${opts}
        </select></div>
      <div class="form-group"><label>Nomor Invoice <span class="req">*</span></label>
        <input class="form-control" id="pInvoice" placeholder="cth. INV-2026-10-001" /></div>
      <div class="form-row">
        <div class="form-group"><label>Jumlah (Rp) <span class="req">*</span></label>
          <input class="form-control" id="pAmount" type="number" placeholder="cth. 450000" /></div>
        <div class="form-group"><label>Tanggal <span class="req">*</span></label>
          <input class="form-control" id="pDate" type="date" value="${today()}" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Metode Pembayaran</label>
          <select class="form-control" id="pMethod">
            ${Object.keys(METHOD_ICON).map(k=>`<option value="${k}">${METHOD_ICON[k]} ${k}</option>`).join('')}
          </select></div>
        <div class="form-group"><label>Status</label>
          <select class="form-control" id="pStatus">
            <option value="Success">Success</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select></div>
      </div>`,
    footer:`<button class="btn btn-secondary" onclick="closeModal()">Batal</button>
            <button class="btn btn-primary" onclick="submitAddPayment()">Simpan Pembayaran</button>`,
  });
}
window.openAddPayment = openAddPayment;

function prefillPaymentAmount() {
  const m = state.members.find(x=>x.id===document.getElementById('pMember')?.value);
  if (m) document.getElementById('pAmount').value = m.monthly_fee;
}
window.prefillPaymentAmount = prefillPaymentAmount;

async function submitAddPayment() {
  const memberId     = document.getElementById('pMember').value;
  const invoiceNumber= document.getElementById('pInvoice').value.trim();
  const amount       = Number(document.getElementById('pAmount').value);
  const date         = document.getElementById('pDate').value;
  if (!memberId)        { toast('Pilih member terlebih dahulu','error'); return; }
  if (!invoiceNumber)   { toast('Nomor invoice wajib diisi','error'); return; }
  if (!amount || amount<=0){ toast('Jumlah harus berupa angka positif','error'); return; }
  if (!date)            { toast('Tanggal pembayaran wajib diisi','error'); return; }
  const m = state.members.find(x=>x.id===memberId);
  if (!m) return;
  const newPay = {
    id: uuid(), date, member_id:m.id, member_name:m.name,
    invoice_number:invoiceNumber, amount,
    method: document.getElementById('pMethod').value,
    status: document.getElementById('pStatus').value,
  };
  const { data, error } = await db.from('payments').insert(newPay).select().single();
  if (error) { toast('Gagal mencatat pembayaran: '+error.message,'error'); return; }
  state.payments.unshift(data);
  closeModal(); toast('Pembayaran berhasil dicatat!');
  renderPayments(); renderDashboard();
}
window.submitAddPayment = submitAddPayment;

function exportPaymentsCSV() {
  const filtered = getFilteredPayments();
  const header = ['Tanggal','Member','Invoice','Jumlah','Metode','Status'];
  const rows = filtered.map(p=>[p.date,p.member_name,p.invoice_number,p.amount,p.method,p.status]);
  downloadCSV([header,...rows], `payments_${today()}.csv`);
  toast('File CSV berhasil diunduh!');
}
window.exportPaymentsCSV = exportPaymentsCSV;

// ══════════════════════════════════════════════════════════
// ACCOUNTING
// ══════════════════════════════════════════════════════════
function renderAccounting() {
  const rev  = state.monthlyRevenue;
  const inv  = state.invoices;
  const subs = state.subscriptions;
  const totalRev    = rev.reduce((s,r)=>s+r.revenue,0);
  const recog       = rev.reduce((s,r)=>s+r.recognized,0);
  const mrr         = subs.filter(s=>s.status==='Active').reduce((acc,s)=>acc+s.monthly_fee,0);
  const outstanding = inv.filter(i=>i.status!=='Paid').reduce((s,i)=>s+i.amount,0);

  const cur  = rev[rev.length-1]||{revenue:0};
  const prev = rev[rev.length-2]||{revenue:0};
  const growth = prev.revenue ? ((cur.revenue-prev.revenue)/prev.revenue*100).toFixed(1) : 0;

  document.getElementById('accountingStats').innerHTML = [
    { label:'Total Revenue',     value:fmtIDR(totalRev),  icon:'💰', sub:`${growth>0?'+':''}${growth}% vs bulan lalu` },
    { label:'Recognized Revenue',value:fmtIDR(recog),     icon:'✅', sub:`${totalRev?((recog/totalRev)*100).toFixed(1):0}% dari total` },
    { label:'Accounts Receivable',value:fmtIDR(outstanding),icon:'⏳',sub:`${inv.filter(i=>i.status!=='Paid').length} invoice outstanding` },
    { label:'MRR',               value:fmtIDR(mrr),       icon:'🔁', sub:'Dari langganan aktif' },
  ].map(s=>`<div class="stat-card"><div class="stat-icon">${s.icon}</div><div class="stat-label">${s.label}</div><div class="stat-value tnum">${s.value}</div><div class="stat-sub">${s.sub}</div></div>`).join('');

  // Revenue table (5 bulan terakhir)
  const last5 = rev.slice(-5);
  document.getElementById('revenueBody').innerHTML = last5.map(r=>{
    const diff = r.revenue - r.recognized;
    return `<tr>
      <td style="font-weight:600">${r.month} ${r.year||2026}</td>
      <td class="tnum" style="font-weight:700">${fmtIDR(r.revenue)}</td>
      <td class="tnum">${fmtIDR(r.recognized)}</td>
      <td class="tnum text-amber">${fmtIDR(diff)}</td>
    </tr>`;
  }).join('');
  document.getElementById('revenueFoot').innerHTML = `<tr>
    <td>Total</td>
    <td class="tnum text-brand">${fmtIDR(totalRev)}</td>
    <td class="tnum text-emerald">${fmtIDR(recog)}</td>
    <td class="tnum text-amber">${fmtIDR(totalRev-recog)}</td>
  </tr>`;

  // Outstanding list
  const outs = inv.filter(i=>i.status!=='Paid');
  document.getElementById('accountingOutstanding').innerHTML = outs.length
    ? outs.map(i=>`
      <div class="list-item">
        <div style="font-size:20px">📄</div>
        <div class="list-item-body">
          <div class="list-item-title">${i.member_name}</div>
          <div class="list-item-sub">${i.number} · Jatuh tempo ${fmtDate(i.due_date)}</div>
        </div>
        <div class="list-item-right">
          <div class="list-item-amount tnum">${fmtIDR(i.amount)}</div>
          ${statusBadge(i.status)}
        </div>
      </div>`).join('')
    : '<div class="empty-state"><div class="empty-state-icon">🎉</div><div class="empty-state-title">Semua invoice sudah lunas!</div></div>';
}

function exportAccountingCSV() {
  const rows = [['Bulan','Revenue','Recognized','Selisih'],
    ...state.monthlyRevenue.map(r=>[`${r.month} ${r.year||2026}`,r.revenue,r.recognized,r.revenue-r.recognized])];
  downloadCSV(rows, `accounting_${today()}.csv`);
  toast('File CSV berhasil diunduh!');
}
window.exportAccountingCSV = exportAccountingCSV;

// ══════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════
function renderReports() {
  const rev  = state.monthlyRevenue;
  const inv  = state.invoices;
  const subs = state.subscriptions;
  const m    = state.members;
  const totalRev = rev.reduce((s,r)=>s+r.revenue,0);
  const recog    = rev.reduce((s,r)=>s+r.recognized,0);
  const mrr      = subs.filter(s=>s.status==='Active').reduce((acc,s)=>acc+s.monthly_fee,0);
  const outs     = inv.filter(i=>i.status!=='Paid').reduce((s,i)=>s+i.amount,0);
  const collected= inv.filter(i=>i.status==='Paid').reduce((s,i)=>s+i.amount,0);

  document.getElementById('reportStats').innerHTML = [
    { label:'Revenue Report',       value:fmtIDR(totalRev), icon:'📈', sub:`${rev.length} bulan` },
    { label:'Outstanding Receivables',value:fmtIDR(outs),  icon:'📋', sub:`${inv.filter(i=>i.status!=='Paid').length} invoice` },
    { label:'Membership Revenue',   value:fmtIDR(mrr),      icon:'👥', sub:'MRR bulanan' },
  ].map(s=>`<div class="stat-card"><div class="stat-icon">${s.icon}</div><div class="stat-label">${s.label}</div><div class="stat-value tnum">${s.value}</div><div class="stat-sub">${s.sub}</div></div>`).join('');

  // Revenue table YTD
  document.getElementById('reportsBody').innerHTML = rev.map((r,i)=>{
    const growth = i>0 ? ((r.revenue-rev[i-1].revenue)/rev[i-1].revenue*100).toFixed(1) : null;
    return `<tr>
      <td style="font-weight:600">${r.month} ${r.year||2026}</td>
      <td class="tnum" style="font-weight:700">${fmtIDR(r.revenue)}</td>
      <td class="tnum">${fmtIDR(r.recognized)}</td>
      <td>${growth!==null?`<span style="font-size:11px;font-weight:700;color:${growth>=0?'var(--emerald)':'var(--rose)'}">${growth>=0?'+':''}${growth}%</span>`:'<span style="color:var(--ink-400)">—</span>'}</td>
    </tr>`;
  }).join('');

  // Plan revenue bars
  const planRev = {};
  subs.filter(s=>s.status==='Active').forEach(s=>{ planRev[s.plan]=(planRev[s.plan]||0)+s.monthly_fee; });
  const maxRev = Math.max(...Object.values(planRev),1);
  document.getElementById('planRevenueList').innerHTML = Object.entries(planRev).sort((a,b)=>b[1]-a[1]).map(([plan,rev])=>{
    const pct = (rev/maxRev*100).toFixed(0);
    const cnt = m.filter(x=>x.plan===plan&&x.status==='Active').length;
    return `<div class="plan-row">
      <div class="plan-row-header">
        <div>${plan} <span class="plan-row-sub">${cnt} anggota aktif</span></div>
        <span class="tnum">${fmtIDR(rev)}/bln</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('') + `<div style="display:flex;justify-content:space-between;padding-top:14px;border-top:1px solid var(--ink-100);font-weight:700">
    <span>Total MRR</span><span class="tnum text-brand">${fmtIDR(mrr)}/bln</span>
  </div>`;

  // Footer stats
  document.getElementById('reportStats').insertAdjacentHTML('afterend',`
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:0;margin-bottom:16px">
      <div class="chip"><div class="chip-label">Total Revenue YTD</div><div class="chip-value tnum">${fmtIDR(totalRev)}</div></div>
      <div class="chip"><div class="chip-label">Recognized Revenue</div><div class="chip-value tnum text-emerald">${fmtIDR(recog)}</div></div>
      <div class="chip"><div class="chip-label">Collected (Paid)</div><div class="chip-value tnum text-brand">${fmtIDR(collected)}</div></div>
    </div>`);
}

function exportReportsCSV() {
  const rev = state.monthlyRevenue;
  const rows = [['Bulan','Revenue','Recognized','Growth (%)'],
    ...rev.map((r,i)=>{ const g=i>0?((r.revenue-rev[i-1].revenue)/rev[i-1].revenue*100).toFixed(1):'0'; return [`${r.month} ${r.year||2026}`,r.revenue,r.recognized,g]; })];
  downloadCSV(rows, `reports_${today()}.csv`);
  toast('File CSV berhasil diunduh!');
}
window.exportReportsCSV = exportReportsCSV;

// ══════════════════════════════════════════════════════════
// NOTIFIKASI dari data nyata
// ══════════════════════════════════════════════════════════
function buildNotifications() {
  const notifs = [];
  state.payments.filter(p=>p.status==='Success').slice(0,2).forEach(p=>{
    notifs.push({ title:'Pembayaran Diterima', desc:`${p.member_name} — ${p.invoice_number}`, time:p.date, tone:'success' });
  });
  state.invoices.filter(i=>i.status==='Overdue').slice(0,2).forEach(i=>{
    notifs.push({ title:'Invoice Jatuh Tempo', desc:`${i.member_name} — ${i.number}`, time:i.due_date, tone:'warning' });
  });
  state.subscriptions.filter(s=>s.status==='Paused').slice(0,1).forEach(s=>{
    notifs.push({ title:'Langganan Dijeda', desc:`${s.member_name} — ${s.plan}`, time:'', tone:'info' });
  });

  const unread = notifs.length;
  document.getElementById('notifBadge').textContent = unread;
  document.getElementById('notifBadge').style.display = unread ? 'flex' : 'none';
  document.getElementById('notifList').innerHTML = notifs.length
    ? notifs.map(n=>`
        <div class="notif-item">
          <div class="notif-dot ${n.tone}"></div>
          <div>
            <div class="notif-title">${n.title}</div>
            <div class="notif-desc">${n.desc}</div>
            <div class="notif-time">${n.time ? fmtDate(n.time) : 'Baru-baru ini'}</div>
          </div>
        </div>`).join('')
    : '<div style="padding:16px;font-size:13px;color:var(--ink-400);text-align:center">Tidak ada notifikasi</div>';
}

function markAllRead() {
  document.getElementById('notifBadge').style.display = 'none';
  document.getElementById('notifBadge').textContent = '0';
  closeDropdowns();
}
window.markAllRead = markAllRead;

// ══════════════════════════════════════════════════════════
// CSV DOWNLOAD helper
// ══════════════════════════════════════════════════════════
function downloadCSV(rows, filename) {
  const csv = rows.map(r=>r.map(v=>{ const s=String(v); return s.includes(',')||s.includes('"')?`"${s.replace(/"/g,'""')}"`  :s; }).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
}

// ══════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  setDate();
  navigate('dashboard');
  loadAll();
});
