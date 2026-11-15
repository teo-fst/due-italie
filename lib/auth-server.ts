import 'server-only';
import { supabaseServer } from './supabase/server';
import { supabaseAdmin } from './supabase/admin';
import { hashGiocatore } from './privacy';
import { getGiocatore, type Giocatore } from './store';

/**
 * Utente corrente → pseudonimo. L'id di Supabase Auth non esce mai da questa funzione:
 * tutto il resto dell'app lavora solo con l'hash.
 */
export async function contesto(): Promise<{ hash: string; giocatore: Giocatore | null } | null> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const hash = hashGiocatore(user.id);
  return { hash, giocatore: await getGiocatore(supabaseAdmin(), hash) };
}

/** Per le route API: anche l'id utente, serve solo per cancellare l'account anonimo. */
export async function utenteEHash(): Promise<{ userId: string; hash: string } | null> {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { userId: user.id, hash: hashGiocatore(user.id) };
}
