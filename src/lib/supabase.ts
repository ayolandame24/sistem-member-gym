import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || supabaseUrl.includes('YOUR_PROJECT_REF')) {
  console.warn(
    '[FitLedger] VITE_SUPABASE_URL belum diisi di .env.local — ' +
      'aplikasi berjalan dengan data lokal sementara.',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
