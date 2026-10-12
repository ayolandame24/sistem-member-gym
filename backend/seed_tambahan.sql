-- ============================================================
-- FitLedger — Seed Data Tambahan
-- Data Oktober 2026: invoice baru, pembayaran, member baru
-- Jalankan SETELAH seed.sql berhasil dieksekusi
-- ============================================================

-- ── Member Baru Oktober 2026 ───────────────────────────────────
INSERT INTO members (id, code, name, email, phone, plan, monthly_fee, join_date, start_date, expiry_date, status, avatar_color) VALUES
  ('a1000000-0000-0000-0000-000000000013','MBR-2026-013','Rina Kartika',    'rina.kartika@email.com',    '0821-1111-2222','Basic',           250000,'2026-10-01','2026-10-01','2027-01-01','Active','bg-violet-500'),
  ('a1000000-0000-0000-0000-000000000014','MBR-2026-014','Dimas Pratama',   'dimas.pratama@email.com',   '0812-3333-4444','Premium',        450000,'2026-10-05','2026-10-05','2027-01-05','Active','bg-cyan-500'),
  ('a1000000-0000-0000-0000-000000000015','MBR-2026-015','Ayu Widiastuti',  'ayu.widiastuti@email.com',  '0857-5555-6666','Elite',           750000,'2026-10-10','2026-10-10','2027-01-10','Active','bg-orange-500')
ON CONFLICT (id) DO NOTHING;

-- ── Invoice Oktober 2026 ───────────────────────────────────────
INSERT INTO invoices (id, number, member_id, member_name, plan, period, amount, due_date, status, issued_date) VALUES
  -- Member lama
  ('b2000000-0000-0000-0000-000000000001','INV-2026-10-001','a1000000-0000-0000-0000-000000000001','Budi Santoso',   'Premium',        'Okt 2026', 450000,'2026-10-10','Unpaid','2026-10-01'),
  ('b2000000-0000-0000-0000-000000000002','INV-2026-10-002','a1000000-0000-0000-0000-000000000002','Siti Nurhaliza', 'Elite',           'Okt 2026', 750000,'2026-10-15','Unpaid','2026-10-01'),
  ('b2000000-0000-0000-0000-000000000003','INV-2026-10-003','a1000000-0000-0000-0000-000000000004','Dewi Lestari',   'Personal Trainer','Okt 2026',1200000,'2026-10-05','Unpaid','2026-10-01'),
  ('b2000000-0000-0000-0000-000000000004','INV-2026-10-004','a1000000-0000-0000-0000-000000000006','Putri Anggraini','Elite',           'Okt 2026', 750000,'2026-10-28','Unpaid','2026-10-01'),
  ('b2000000-0000-0000-0000-000000000005','INV-2026-10-005','a1000000-0000-0000-0000-000000000007','Joko Prasetyo',  'Basic',           'Okt 2026', 250000,'2026-10-18','Unpaid','2026-10-01'),
  -- Member baru
  ('b2000000-0000-0000-0000-000000000006','INV-2026-10-006','a1000000-0000-0000-0000-000000000013','Rina Kartika',   'Basic',           'Okt 2026', 250000,'2026-10-31','Unpaid','2026-10-01'),
  ('b2000000-0000-0000-0000-000000000007','INV-2026-10-007','a1000000-0000-0000-0000-000000000014','Dimas Pratama',  'Premium',        'Okt 2026', 450000,'2026-10-31','Unpaid','2026-10-05'),
  ('b2000000-0000-0000-0000-000000000008','INV-2026-10-008','a1000000-0000-0000-0000-000000000015','Ayu Widiastuti', 'Elite',           'Okt 2026', 750000,'2026-10-31','Unpaid','2026-10-10')
ON CONFLICT (id) DO NOTHING;

-- ── Pembayaran Oktober 2026 ────────────────────────────────────
INSERT INTO payments (id, date, member_id, member_name, invoice_number, amount, method, status) VALUES
  ('c2000000-0000-0000-0000-000000000001','2026-10-03','a1000000-0000-0000-0000-000000000001','Budi Santoso',   'INV-2026-10-001', 450000,'Transfer Bank','Success'),
  ('c2000000-0000-0000-0000-000000000002','2026-10-05','a1000000-0000-0000-0000-000000000004','Dewi Lestari',   'INV-2026-10-003',1200000,'QRIS',         'Success'),
  ('c2000000-0000-0000-0000-000000000003','2026-10-08','a1000000-0000-0000-0000-000000000007','Joko Prasetyo',  'INV-2026-10-005', 250000,'Cash',         'Success'),
  ('c2000000-0000-0000-0000-000000000004','2026-10-02','a1000000-0000-0000-0000-000000000013','Rina Kartika',   'INV-2026-10-006', 250000,'E-Wallet',     'Success'),
  ('c2000000-0000-0000-0000-000000000005','2026-10-06','a1000000-0000-0000-0000-000000000014','Dimas Pratama',  'INV-2026-10-007', 450000,'Debit Card',   'Pending')
ON CONFLICT (id) DO NOTHING;

-- ── Subscriptions untuk member baru ────────────────────────────
INSERT INTO subscriptions (id, member_id, member_name, plan, monthly_fee, next_billing_date, status, start_date) VALUES
  ('d2000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000013','Rina Kartika',  'Basic',  250000,'2026-11-01','Active','2026-10-01'),
  ('d2000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000014','Dimas Pratama', 'Premium',450000,'2026-11-05','Active','2026-10-05'),
  ('d2000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000015','Ayu Widiastuti','Elite',  750000,'2026-11-10','Active','2026-10-10')
ON CONFLICT (id) DO NOTHING;

-- ── Revenue Oktober 2026 ───────────────────────────────────────
INSERT INTO monthly_revenue (month, revenue, recognized, year) VALUES
  ('Okt', 27200000, 26800000, 2026)
ON CONFLICT (month, year) DO NOTHING;
