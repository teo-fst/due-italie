import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Client con chiave SECRET: salta la RLS. Usarlo SOLO nella route cron.
 * Non importare mai questo file da componenti client.
 */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('SUPABASE_SECRET_KEY mancante');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
