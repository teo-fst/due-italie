import { NextResponse } from 'next/server';
import { utenteEHash } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { cancellaDati } from '@/lib/store';

export const runtime = 'nodejs';

/** Diritto all'oblio: cancella tutti i dati di gioco e l'account anonimo. */
export async function DELETE() {
  const u = await utenteEHash();
  if (!u) return NextResponse.json({ errore: 'Sessione mancante' }, { status: 401 });
  const admin = supabaseAdmin();
  await cancellaDati(admin, u.hash);
  const { error } = await admin.auth.admin.deleteUser(u.userId);
  if (error) return NextResponse.json({ errore: error.message }, { status: 500 });
  return NextResponse.json({ cancellato: true });
}
