-- ============================================================
-- FitLedger — Database Triggers & Functions
-- Otomasi bisnis: update status member, invoice, notifikasi
-- Jalankan SETELAH schema.sql berhasil dieksekusi
-- ============================================================

-- ============================================================
-- TRIGGER 1: Auto-update status member saat expiry_date lewat
-- Setiap kali tabel members di-UPDATE, cek apakah membership
-- sudah expired dan update statusnya secara otomatis
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_member_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika member Active tapi expiry_date sudah lewat, set Expired
  IF NEW.status = 'Active' AND NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE THEN
    NEW.status := 'Expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_member_expiry ON members;
CREATE TRIGGER trg_check_member_expiry
  BEFORE INSERT OR UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION fn_check_member_expiry();

-- ============================================================
-- TRIGGER 2: Auto-update status invoice menjadi Overdue
-- Setiap kali tabel invoices di-UPDATE, cek apakah due_date
-- sudah lewat dan statusnya masih Unpaid
-- ============================================================
CREATE OR REPLACE FUNCTION fn_check_invoice_overdue()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika invoice Unpaid tapi due_date sudah lewat, set Overdue
  IF NEW.status = 'Unpaid' AND NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'Overdue';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_invoice_overdue ON invoices;
CREATE TRIGGER trg_check_invoice_overdue
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION fn_check_invoice_overdue();

-- ============================================================
-- TRIGGER 3: Auto-update invoice status menjadi Paid
-- Ketika ada payment baru dengan status Success, tandai
-- invoice terkait sebagai Paid secara otomatis
-- ============================================================
CREATE OR REPLACE FUNCTION fn_mark_invoice_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Jika payment baru berhasil (Success), update invoice terkait
  IF NEW.status = 'Success' THEN
    UPDATE invoices
    SET status = 'Paid'
    WHERE number = NEW.invoice_number
      AND status != 'Paid';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_mark_invoice_paid ON payments;
CREATE TRIGGER trg_mark_invoice_paid
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION fn_mark_invoice_paid();

-- ============================================================
-- TRIGGER 4: Auto-set next_billing_date ke '—' saat cancelled
-- Ketika status subscription berubah menjadi Cancelled,
-- hapus next_billing_date secara otomatis
-- ============================================================
CREATE OR REPLACE FUNCTION fn_cancel_subscription_billing()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Cancelled' AND OLD.status != 'Cancelled' THEN
    NEW.next_billing_date := '—';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cancel_subscription_billing ON subscriptions;
CREATE TRIGGER trg_cancel_subscription_billing
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION fn_cancel_subscription_billing();

-- ============================================================
-- FUNCTION: Hitung total outstanding (invoice belum dibayar)
-- Penggunaan: SELECT get_outstanding_total();
-- ============================================================
CREATE OR REPLACE FUNCTION get_outstanding_total()
RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM invoices
  WHERE status != 'Paid';
$$ LANGUAGE sql STABLE;

-- ============================================================
-- FUNCTION: Hitung MRR (Monthly Recurring Revenue) saat ini
-- Penggunaan: SELECT get_current_mrr();
-- ============================================================
CREATE OR REPLACE FUNCTION get_current_mrr()
RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(monthly_fee), 0)
  FROM subscriptions
  WHERE status = 'Active';
$$ LANGUAGE sql STABLE;

-- ============================================================
-- FUNCTION: Hitung jumlah member aktif
-- Penggunaan: SELECT get_active_members_count();
-- ============================================================
CREATE OR REPLACE FUNCTION get_active_members_count()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM members
  WHERE status = 'Active';
$$ LANGUAGE sql STABLE;

-- ============================================================
-- VIEW: Ringkasan dashboard (digunakan oleh frontend)
-- Penggunaan: SELECT * FROM view_dashboard_summary;
-- ============================================================
CREATE OR REPLACE VIEW view_dashboard_summary AS
SELECT
  (SELECT COUNT(*)    FROM members WHERE status = 'Active')      AS active_members,
  (SELECT COUNT(*)    FROM members WHERE status = 'Expired')     AS expired_members,
  (SELECT COUNT(*)    FROM members WHERE status = 'Suspended')   AS suspended_members,
  (SELECT COUNT(*)    FROM invoices WHERE status != 'Paid')      AS outstanding_invoices,
  (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status != 'Paid') AS outstanding_total,
  (SELECT COALESCE(SUM(monthly_fee), 0) FROM subscriptions WHERE status = 'Active') AS current_mrr,
  (SELECT COUNT(*)    FROM payments WHERE status = 'Success' AND date >= date_trunc('month', CURRENT_DATE)) AS payments_this_month,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'Success' AND date >= date_trunc('month', CURRENT_DATE)) AS revenue_this_month;
