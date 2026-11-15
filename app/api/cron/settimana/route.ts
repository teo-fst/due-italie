import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { eseguiSettimana } from '@/lib/gioco';
import { assertCatalogVerified } from '@/lib/sim/catalog';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Chiamata da Vercel Cron ogni sabato (vercel.json). Idempotente:
// risolve il turno chiuso, oppure avvia il gioco a soglia raggiunta, oppure non fa nulla.
export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ errore: 'non autorizzato' }, { status: 401 });
  }
  try {
    if (process.env.STRICT_SOURCES === 'true') assertCatalogVerified();
    const soglia = Number(process.env.SOGLIA_AVVIO ?? 1000);
    const esito = await eseguiSettimana(supabaseAdmin(), new Date(), soglia);
    return NextResponse.json(esito);
  } catch (e) {
    console.error('[cron settimana]', e);
    return NextResponse.json({ errore: (e as Error).message }, { status: 500 });
  }
}
