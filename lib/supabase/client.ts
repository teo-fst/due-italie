'use client';
import { createBrowserClient } from '@supabase/ssr';

/** Client per il browser: solo chiave publishable, tutto passa dalla RLS. */
export function supabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
