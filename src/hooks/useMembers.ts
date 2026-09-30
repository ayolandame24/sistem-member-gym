import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/db';
import { members as fallbackMembers } from '@/data/mock';
import type { Member } from '@/data/types';

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await db.members.getAll();
      setMembers(data);
    } catch (err) {
      console.warn('[useMembers] Supabase tidak tersedia, menggunakan data lokal.', err);
      setMembers(fallbackMembers);
      setError('Menggunakan data lokal — hubungkan Supabase untuk persistensi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addMember = useCallback(async (m: Member) => {
    try {
      const created = await db.members.insert(m);
      setMembers((prev) => [created, ...prev]);
    } catch {
      // Fallback: update lokal saja
      setMembers((prev) => [m, ...prev]);
    }
  }, []);

  const updateMember = useCallback(async (id: string, changes: Partial<Omit<Member, 'id'>>) => {
    try {
      const updated = await db.members.update(id, changes);
      setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...changes } : m)),
      );
    }
  }, []);

  const deleteMember = useCallback(async (id: string) => {
    try {
      await db.members.delete(id);
    } catch {
      // lanjut
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return { members, setMembers, loading, error, addMember, updateMember, deleteMember, reload: load };
}
