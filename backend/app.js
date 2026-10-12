/**
 * FitLedger — Backend Server (app.js)
 * REST API sederhana menggunakan Express.js + Supabase
 *
 * Instalasi dependensi:
 *   npm install express @supabase/supabase-js cors dotenv
 *
 * Menjalankan server:
 *   node backend/app.js
 *   atau dengan nodemon: nodemon backend/app.js
 *
 * Endpoint tersedia di: http://localhost:3000
 */

const express  = require('express');
const cors     = require('cors');
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// ── Konfigurasi ────────────────────────────────────────────────
const PORT           = process.env.PORT || 3000;
const SUPABASE_URL   = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY   = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[FitLedger] ERROR: VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY harus diisi di .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const app      = express();

// ── Middleware ─────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Log setiap request
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Helper ─────────────────────────────────────────────────────
function sendError(res, error, code = 500) {
  console.error('[Error]', error.message || error);
  res.status(code).json({ success: false, error: error.message || 'Terjadi kesalahan server' });
}

// ── Root ───────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name:    'FitLedger API',
    version: '1.0.0',
    status:  'running',
    endpoints: [
      'GET  /api/members',
      'POST /api/members',
      'PUT  /api/members/:id',
      'DELETE /api/members/:id',
      'GET  /api/invoices',
      'POST /api/invoices',
      'PATCH /api/invoices/:id/paid',
      'DELETE /api/invoices/:id',
      'GET  /api/payments',
      'POST /api/payments',
      'GET  /api/subscriptions',
      'POST /api/subscriptions',
      'PATCH /api/subscriptions/:id/status',
      'GET  /api/monthly-revenue',
      'GET  /api/dashboard',
    ],
  });
});

// ══════════════════════════════════════════════════════════════
// MEMBERS
// ══════════════════════════════════════════════════════════════

/** GET /api/members — Ambil semua member, urutkan terbaru */
app.get('/api/members', async (_req, res) => {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return sendError(res, error);
  res.json({ success: true, data });
});

/** POST /api/members — Tambah member baru */
app.post('/api/members', async (req, res) => {
  const { id, code, name, email, phone, plan, monthly_fee,
          join_date, start_date, expiry_date, status, avatar_color } = req.body;

  if (!name || !email || !plan) {
    return res.status(400).json({ success: false, error: 'name, email, dan plan wajib diisi' });
  }

  const { data, error } = await supabase
    .from('members')
    .insert({ id, code, name, email, phone, plan, monthly_fee,
              join_date, start_date, expiry_date, status, avatar_color })
    .select()
    .single();

  if (error) return sendError(res, error);
  res.status(201).json({ success: true, data });
});

/** PUT /api/members/:id — Update data member */
app.put('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, plan, monthly_fee,
          start_date, expiry_date, status, avatar_color } = req.body;

  const { data, error } = await supabase
    .from('members')
    .update({ name, email, phone, plan, monthly_fee,
              start_date, expiry_date, status, avatar_color })
    .eq('id', id)
    .select()
    .single();

  if (error) return sendError(res, error);
  if (!data) return res.status(404).json({ success: false, error: 'Member tidak ditemukan' });
  res.json({ success: true, data });
});

/** DELETE /api/members/:id — Hapus member */
app.delete('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('members').delete().eq('id', id);

  if (error) return sendError(res, error);
  res.json({ success: true, message: 'Member berhasil dihapus' });
});

// ══════════════════════════════════════════════════════════════
// INVOICES
// ══════════════════════════════════════════════════════════════

/** GET /api/invoices — Ambil semua invoice */
app.get('/api/invoices', async (_req, res) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return sendError(res, error);
  res.json({ success: true, data });
});

/** POST /api/invoices — Buat invoice baru */
app.post('/api/invoices', async (req, res) => {
  const { id, number, member_id, member_name, plan,
          period, amount, due_date, status, issued_date } = req.body;

  if (!member_id || !due_date) {
    return res.status(400).json({ success: false, error: 'member_id dan due_date wajib diisi' });
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert({ id, number, member_id, member_name, plan,
              period, amount, due_date, status, issued_date })
    .select()
    .single();

  if (error) return sendError(res, error);
  res.status(201).json({ success: true, data });
});

/** PATCH /api/invoices/:id/paid — Tandai invoice sebagai Paid */
app.patch('/api/invoices/:id/paid', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'Paid' })
    .eq('id', id)
    .select()
    .single();

  if (error) return sendError(res, error);
  if (!data) return res.status(404).json({ success: false, error: 'Invoice tidak ditemukan' });
  res.json({ success: true, data });
});

/** DELETE /api/invoices/:id — Hapus invoice */
app.delete('/api/invoices/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('invoices').delete().eq('id', id);

  if (error) return sendError(res, error);
  res.json({ success: true, message: 'Invoice berhasil dihapus' });
});

// ══════════════════════════════════════════════════════════════
// PAYMENTS
// ══════════════════════════════════════════════════════════════

/** GET /api/payments — Ambil semua pembayaran */
app.get('/api/payments', async (_req, res) => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('date', { ascending: false });

  if (error) return sendError(res, error);
  res.json({ success: true, data });
});

/** POST /api/payments — Catat pembayaran baru */
app.post('/api/payments', async (req, res) => {
  const { id, date, member_id, member_name,
          invoice_number, amount, method, status } = req.body;

  if (!member_id || !invoice_number || !amount) {
    return res.status(400).json({ success: false, error: 'member_id, invoice_number, dan amount wajib diisi' });
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({ id, date, member_id, member_name,
              invoice_number, amount, method, status })
    .select()
    .single();

  if (error) return sendError(res, error);
  res.status(201).json({ success: true, data });
});

// ══════════════════════════════════════════════════════════════
// SUBSCRIPTIONS
// ══════════════════════════════════════════════════════════════

/** GET /api/subscriptions — Ambil semua langganan */
app.get('/api/subscriptions', async (_req, res) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return sendError(res, error);
  res.json({ success: true, data });
});

/** POST /api/subscriptions — Tambah langganan baru */
app.post('/api/subscriptions', async (req, res) => {
  const { id, member_id, member_name, plan,
          monthly_fee, next_billing_date, status, start_date } = req.body;

  if (!member_id || !plan) {
    return res.status(400).json({ success: false, error: 'member_id dan plan wajib diisi' });
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({ id, member_id, member_name, plan,
              monthly_fee, next_billing_date, status, start_date })
    .select()
    .single();

  if (error) return sendError(res, error);
  res.status(201).json({ success: true, data });
});

/** PATCH /api/subscriptions/:id/status — Update status langganan */
app.patch('/api/subscriptions/:id/status', async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;

  if (!['Active', 'Paused', 'Cancelled'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Status harus: Active, Paused, atau Cancelled' });
  }

  const updates = { status };
  if (status === 'Cancelled') updates.next_billing_date = '—';

  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return sendError(res, error);
  if (!data) return res.status(404).json({ success: false, error: 'Langganan tidak ditemukan' });
  res.json({ success: true, data });
});

// ══════════════════════════════════════════════════════════════
// MONTHLY REVENUE
// ══════════════════════════════════════════════════════════════

/** GET /api/monthly-revenue — Ambil data revenue bulanan */
app.get('/api/monthly-revenue', async (_req, res) => {
  const { data, error } = await supabase
    .from('monthly_revenue')
    .select('*')
    .order('year',  { ascending: true })
    .order('id',    { ascending: true });

  if (error) return sendError(res, error);
  res.json({ success: true, data });
});

// ══════════════════════════════════════════════════════════════
// DASHBOARD SUMMARY
// ══════════════════════════════════════════════════════════════

/** GET /api/dashboard — Ringkasan statistik untuk dashboard */
app.get('/api/dashboard', async (_req, res) => {
  try {
    const [membersRes, invoicesRes, paymentsRes, subsRes, revenueRes] = await Promise.all([
      supabase.from('members').select('status'),
      supabase.from('invoices').select('status, amount'),
      supabase.from('payments').select('status, amount, date'),
      supabase.from('subscriptions').select('status, monthly_fee'),
      supabase.from('monthly_revenue').select('*').order('year').order('id'),
    ]);

    if (membersRes.error)  throw membersRes.error;
    if (invoicesRes.error) throw invoicesRes.error;
    if (paymentsRes.error) throw paymentsRes.error;
    if (subsRes.error)     throw subsRes.error;
    if (revenueRes.error)  throw revenueRes.error;

    const members     = membersRes.data;
    const invoices    = invoicesRes.data;
    const payments    = paymentsRes.data;
    const subs        = subsRes.data;
    const revenue     = revenueRes.data;

    const totalRevenue    = revenue.reduce((s, m) => s + m.revenue, 0);
    const mrr             = subs.filter(s => s.status === 'Active').reduce((s, x) => s + x.monthly_fee, 0);
    const outstandingTotal= invoices.filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);
    const activeMember    = members.filter(m => m.status === 'Active').length;

    res.json({
      success: true,
      data: {
        totalRevenue,
        mrr,
        activeMembersCount:    activeMember,
        expiredMembersCount:   members.filter(m => m.status === 'Expired').length,
        suspendedMembersCount: members.filter(m => m.status === 'Suspended').length,
        outstandingTotal,
        outstandingInvoicesCount: invoices.filter(i => i.status !== 'Paid').length,
        totalPayments:         payments.filter(p => p.status === 'Success').reduce((s, p) => s + p.amount, 0),
        monthlyRevenue:        revenue,
      },
    });
  } catch (err) {
    sendError(res, err);
  }
});

// ── 404 Handler ────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint tidak ditemukan' });
});

// ── Start Server ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏋️  FitLedger API berjalan di http://localhost:${PORT}`);
  console.log(`📊  Supabase URL : ${SUPABASE_URL}`);
  console.log(`📋  Endpoints    : http://localhost:${PORT}/\n`);
});

module.exports = app;
