import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { payments as fallbackPayments } from '@/data/mock';
import type { Payment } from '@/data/types';

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.payments.getAll();
      setPayments(data);
    } catch (err) {
      console.warn('[usePayments] Supabase tidak tersedia, menggunakan data lokal.', err);
      setPayments(fallbackPayments);
      setError('Menggunakan data lokal — hubungkan Supabase untuk persistensi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addPayment = useCallback(async (p: Payment) => {
    try {
      const created = await db.payments.insert(p);
      setPayments((prev) => [created, ...prev]);
    } catch {
      setPayments((prev) => [p, ...prev]);
    }
  }, []);

  return { payments, loading, error, addPayment, reload: load };
}
