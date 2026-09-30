import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

export const supabaseConfigured =
  supabaseUrl.length > 0 && !supabaseUrl.includes('YOUR_PROJECT_REF');

if (!supabaseConfigured) {
  console.warn(
    '[FitLedger] Supabase belum dikonfigurasi — aplikasi berjalan dengan data lokal.',
  );
}

// Sediakan URL/key dummy agar createClient tidak throw saat belum dikonfigurasi
export const supabase = createClient<Database>(
  supabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseConfigured ? supabaseAnonKey : 'placeholder-key',
);
