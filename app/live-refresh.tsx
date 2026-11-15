'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

/** Supabase Realtime: quando cambiano le tabelle indicate, ricarica i dati della pagina. */
export function LiveRefresh({ tables }: { tables: string[] }) {
  const router = useRouter();
  const key = tables.join(',');
  useEffect(() => {
    const supabase = supabaseBrowser();
    const channel = supabase.channel(`live-${key}`);
    for (const table of key.split(',')) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => router.refresh());
    }
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router, key]);
  return null;
}
