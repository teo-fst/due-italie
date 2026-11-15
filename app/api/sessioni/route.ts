import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { utenteEHash } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { avviaSessione } from '@/lib/store';
import { assertCatalogVerified } from '@/lib/sim/catalog';

export const runtime = 'nodejs';

/** Avvia una partita: il seme (il "dado" della partita) è crittografico e generato sul server. */
export async function POST(request: Request) {
  const u = await utenteEHash();
  if (!u) return NextResponse.json({ errore: 'Sessione mancante' }, { status: 401 });
  try {
    if (process.env.STRICT_SOURCES === 'true') assertCatalogVerified();
    const { leggi } = await request.json();
    if (!Array.isArray(leggi)) throw new Error('Leggi mancanti');
    const s = await avviaSessione(supabaseAdmin(), u.hash, leggi, randomInt(0, 2 ** 32), new Date());
    return NextResponse.json({ numero: s.numero });
  } catch (e) {
    return NextResponse.json({ errore: (e as Error).message }, { status: 400 });
  }
}
