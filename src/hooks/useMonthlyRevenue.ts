import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { monthlyRevenue as fallbackRevenue } from '@/data/mock';
import type { MonthRevenue } from '@/data/types';

export function useMonthlyRevenue() {
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.monthlyRevenue.getAll();
      // Jika DB kosong, pakai fallback
      setMonthlyRevenue(data.length > 0 ? data : fallbackRevenue);
    } catch {
      setMonthlyRevenue(fallbackRevenue);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { monthlyRevenue, loading };
}
