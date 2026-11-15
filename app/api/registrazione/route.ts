import { NextResponse } from 'next/server';
import { utenteEHash } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { registra } from '@/lib/store';
import { Minorenne } from '@/lib/intervista/profilo';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const u = await utenteEHash();
  if (!u) return NextResponse.json({ errore: 'Sessione mancante' }, { status: 401 });
  try {
    const body = await request.json();
    const profilo = await registra(supabaseAdmin(), u.hash, {
      side: body.side,
      risposte: body.risposte ?? {},
      consensoDatiDelicati: body.consensoDatiDelicati === true,
    }, new Date());
    return NextResponse.json({ profilo });
  } catch (e) {
    if (e instanceof Minorenne) {
      // nessun dato salvato: si elimina anche l'utente anonimo appena creato
      await supabaseAdmin().auth.admin.deleteUser(u.userId).catch(() => undefined);
      return NextResponse.json({ errore: e.message, minorenne: true }, { status: 403 });
    }
    return NextResponse.json({ errore: (e as Error).message }, { status: 400 });
  }
}
