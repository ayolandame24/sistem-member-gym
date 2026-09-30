-- ============================================================
-- FitLedger — Supabase Schema
-- Jalankan seluruh file ini di Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================

-- ── Extensions ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tipe / Enums ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE membership_plan AS ENUM ('Basic','Premium','Elite','Personal Trainer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE membership_status AS ENUM ('Active','Expired','Suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('Paid','Unpaid','Overdue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('Transfer Bank','Cash','Debit Card','QRIS','E-Wallet');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE recurring_status AS ENUM ('Active','Paused','Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE txn_status AS ENUM ('Success','Pending','Failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tabel members ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT NOT NULL DEFAULT '-',
  plan          membership_plan NOT NULL DEFAULT 'Basic',
  monthly_fee   INTEGER NOT NULL DEFAULT 0,
  join_date     DATE NOT NULL,
  start_date    DATE NOT NULL,
  expiry_date   DATE,
  status        membership_status NOT NULL DEFAULT 'Active',
  avatar_color  TEXT NOT NULL DEFAULT 'bg-brand-500',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Tabel invoices ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number        TEXT NOT NULL UNIQUE,
  member_id     UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_name   TEXT NOT NULL,
  plan          membership_plan NOT NULL,
  period        TEXT NOT NULL,
  amount        INTEGER NOT NULL DEFAULT 0,
  due_date      DATE NOT NULL,
  status        payment_status NOT NULL DEFAULT 'Unpaid',
  issued_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_member_id  ON invoices(member_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status     ON invoices(status);

-- ── Tabel payments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            DATE NOT NULL,
  member_id       UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_name     TEXT NOT NULL,
  invoice_number  TEXT NOT NULL,
  amount          INTEGER NOT NULL DEFAULT 0,
  method          payment_method NOT NULL DEFAULT 'Cash',
  status          txn_status NOT NULL DEFAULT 'Pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_date      ON payments(date DESC);

-- ── Tabel subscriptions ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id           UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_name         TEXT NOT NULL,
  plan                membership_plan NOT NULL,
  monthly_fee         INTEGER NOT NULL DEFAULT 0,
  next_billing_date   TEXT NOT NULL DEFAULT '—',
  status              recurring_status NOT NULL DEFAULT 'Active',
  start_date          DATE NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_member_id ON subscriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status    ON subscriptions(status);

-- ── Tabel monthly_revenue ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_revenue (
  id          SERIAL PRIMARY KEY,
  month       TEXT NOT NULL,
  revenue     BIGINT NOT NULL DEFAULT 0,
  recognized  BIGINT NOT NULL DEFAULT 0,
  year        INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(month, year)
);

-- ── Row Level Security (RLS) ───────────────────────────────────
-- Aktifkan RLS pada setiap tabel
ALTER TABLE members         ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_revenue ENABLE ROW LEVEL SECURITY;

-- Policy: izinkan semua operasi dari anon key (cocok untuk MVP tanpa auth)
-- Ganti policy ini dengan autentikasi berbasis user ketika siap produksi.
CREATE POLICY "public_all" ON members         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON invoices        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON payments        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON subscriptions   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON monthly_revenue FOR ALL USING (true) WITH CHECK (true);
