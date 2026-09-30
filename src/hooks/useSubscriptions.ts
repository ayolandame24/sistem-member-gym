import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { subscriptions as fallbackSubs } from '@/data/mock';
import type { Subscription, RecurringStatus } from '@/data/types';

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.subscriptions.getAll();
      setSubscriptions(data);
    } catch (err) {
      console.warn('[useSubscriptions] Supabase tidak tersedia, menggunakan data lokal.', err);
      setSubscriptions(fallbackSubs);
      setError('Menggunakan data lokal — hubungkan Supabase untuk persistensi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addSubscription = useCallback(async (s: Subscription) => {
    try {
      const created = await db.subscriptions.insert(s);
      setSubscriptions((prev) => [created, ...prev]);
    } catch {
      setSubscriptions((prev) => [s, ...prev]);
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: RecurringStatus) => {
    const nextBillingDate = status === 'Cancelled' ? '—' : undefined;
    const changes = nextBillingDate !== undefined
      ? { status, nextBillingDate }
      : { status };
    try {
      const updated = await db.subscriptions.update(id, changes);
      setSubscriptions((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch {
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status, ...(nextBillingDate ? { nextBillingDate } : {}) }
            : s,
        ),
      );
    }
  }, []);

  return { subscriptions, loading, error, addSubscription, updateStatus, reload: load };
}
