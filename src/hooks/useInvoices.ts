import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { invoices as fallbackInvoices } from '@/data/mock';
import type { Invoice, PaymentStatus } from '@/data/types';

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.invoices.getAll();
      setInvoices(data);
    } catch (err) {
      console.warn('[useInvoices] Supabase tidak tersedia, menggunakan data lokal.', err);
      setInvoices(fallbackInvoices);
      setError('Menggunakan data lokal — hubungkan Supabase untuk persistensi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addInvoice = useCallback(async (inv: Invoice) => {
    try {
      const created = await db.invoices.insert(inv);
      setInvoices((prev) => [created, ...prev]);
    } catch {
      setInvoices((prev) => [inv, ...prev]);
    }
  }, []);

  const markPaid = useCallback(async (id: string) => {
    try {
      const updated = await db.invoices.update(id, { status: 'Paid' });
      setInvoices((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch {
      setInvoices((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: 'Paid' as PaymentStatus } : i)),
      );
    }
  }, []);

  const deleteInvoice = useCallback(async (id: string) => {
    try {
      await db.invoices.delete(id);
    } catch {
      // lanjut
    }
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { invoices, loading, error, addInvoice, markPaid, deleteInvoice, reload: load };
}
