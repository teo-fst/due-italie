import { createHmac } from 'node:crypto';

/**
 * Pseudonimo del giocatore: HMAC-SHA256 dell'id utente di Supabase Auth con una chiave segreta
 * (PLAYER_HASH_PEPPER) che esiste solo sul server. Senza la chiave non si risale all'utente
 * nemmeno con l'accesso al database. Per il GDPR resta comunque un dato pseudonimizzato
 * (non anonimo): vedi docs/privacy.md.
 */
export function hashGiocatore(userId: string, pepper: string | undefined = process.env.PLAYER_HASH_PEPPER): string {
  if (!pepper || pepper.length < 32) throw new Error('PLAYER_HASH_PEPPER mancante o troppo corta (min. 32 caratteri)');
  if (!userId) throw new Error('userId mancante');
  return createHmac('sha256', pepper).update(userId).digest('hex');
}
