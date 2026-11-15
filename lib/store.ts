import type { SupabaseClient } from '@supabase/supabase-js';
import { validaLeggi } from './sim/catalog';
import { mesiTrascorsi, simulaSessione, MESI_SESSIONE } from './sim/engine';
import type { RisultatoSessione, Side } from './sim/types';
import { validaRisposte, calcolaProfilo, type Profilo } from './intervista/profilo';
import type { Risposte } from './intervista/domande';
import { sessioniDaCancellare, nuovoRecord, type SessioneChiusa } from './sessioni';

// Accesso ai dati di gioco. Usato SOLO lato server con il client secret, dopo aver
// trasformato l'utente autenticato nel suo hash (lib/privacy.ts).

type Db = SupabaseClient;

function ok<T>(res: { data: T; error: { message: string } | null }, cosa: string): T {
  if (res.error) throw new Error(`${cosa}: ${res.error.message}`);
  return res.data;
}

export interface Giocatore { hash: string; side: Side }

export async function getGiocatore(db: Db, hash: string): Promise<Giocatore | null> {
  return ok(await db.from('giocatori').select('hash, side').eq('hash', hash).maybeSingle(), 'lettura giocatore') as Giocatore | null;
}

export async function getProfilo(db: Db, hash: string): Promise<Profilo | null> {
  const r = ok(await db.from('profili').select('punteggio').eq('hash', hash).maybeSingle(), 'lettura punteggio') as { punteggio: Profilo } | null;
  return r?.punteggio ?? null;
}

/**
 * Registrazione: consenso, scelta dell'Italia (per sempre) e intervista, in un colpo solo.
 *
 * Le risposte NON vengono salvate: servono qui per la convalida (completezza, blocco
 * minorenni) e per calcolare il punteggio, poi restano solo in memoria per la durata della
 * richiesta. Nel database finisce il solo punteggio, che basta al confronto di fine partita
 * anche se la partita dura giorni e viene chiusa e riaperta.
 */
export async function registra(
  db: Db,
  hash: string,
  dati: { side: Side; risposte: Risposte; consensoDatiDelicati: boolean },
  ora: Date,
): Promise<Profilo> {
  if (!dati.consensoDatiDelicati) throw new Error('Serve il consenso esplicito al trattamento dei dati delicati.');
  if (dati.side !== 'sinistra' && dati.side !== 'destra') throw new Error('Italia non valida');
  validaRisposte(dati.risposte);
  if (await getGiocatore(db, hash)) throw new Error('Sei già registrato: l\'intervista si fa una volta sola.');

  const profilo = calcolaProfilo(dati.risposte);
  ok(await db.from('giocatori').insert({ hash, side: dati.side, consenso_dati_delicati_at: ora.toISOString() }), 'registrazione');
  const res = await db.from('profili').insert({ hash, punteggio: profilo });
  if (res.error) {
    await db.from('giocatori').delete().eq('hash', hash); // niente giocatori senza punteggio
    throw new Error(`punteggio: ${res.error.message}`);
  }
  return profilo;
}

interface RigaSessione {
  hash: string; numero: number; side: Side; seed: number;
  leggi: string[]; iniziata_at: string; chiusa_at: string | null;
  punteggio_finale: number | null; serie: RisultatoSessione | null;
}

async function prossimoNumero(db: Db, hash: string): Promise<number> {
  const s = ok(await db.from('sessioni').select('numero').eq('hash', hash).order('numero', { ascending: false }).limit(1), 'numero') as { numero: number }[];
  const r = ok(await db.from('record_sessioni').select('numero').eq('hash', hash).maybeSingle(), 'record') as { numero: number } | null;
  return Math.max(s[0]?.numero ?? 0, r?.numero ?? 0) + 1;
}

export async function sessioneAperta(db: Db, hash: string): Promise<RigaSessione | null> {
  return ok(await db.from('sessioni').select('*').eq('hash', hash).is('chiusa_at', null).maybeSingle(), 'sessione aperta') as RigaSessione | null;
}

/** Avvia una partita nella sola Italia del giocatore: una legge per tema. */
export async function avviaSessione(db: Db, hash: string, leggiGiocatore: string[], seed: number, ora: Date): Promise<RigaSessione> {
  const g = await getGiocatore(db, hash);
  if (!g) throw new Error('Prima registrati e fai l\'intervista.');
  validaLeggi(g.side, leggiGiocatore);
  if (await sessioneAperta(db, hash)) throw new Error('Hai già una partita in corso.');

  const riga = {
    hash,
    numero: await prossimoNumero(db, hash),
    side: g.side,
    seed,
    leggi: leggiGiocatore,
    iniziata_at: ora.toISOString(),
  };
  return ok(await db.from('sessioni').insert(riga).select('*').single(), 'avvio sessione') as RigaSessione;
}

export interface VistaSessione {
  sessione: RigaSessione;
  risultato: RisultatoSessione;
  chiusa: boolean;
}

/** Stato della partita in corso: simula fino all'ora attuale e la chiude se sono passati 24 mesi. */
export async function aggiornaSessione(db: Db, hash: string, ora: Date): Promise<VistaSessione | null> {
  const s = await sessioneAperta(db, hash);
  if (!s) return null;
  const mesi = mesiTrascorsi(new Date(s.iniziata_at), ora);
  const risultato = simulaSessione({ seed: Number(s.seed), side: s.side, leggi: s.leggi }, mesi);
  if (mesi < MESI_SESSIONE) return { sessione: s, risultato, chiusa: false };
  await chiudiSessione(db, s, risultato, ora);
  return { sessione: { ...s, chiusa_at: ora.toISOString(), serie: risultato }, risultato, chiusa: true };
}

async function chiudiSessione(db: Db, s: RigaSessione, risultato: RisultatoSessione, ora: Date) {
  const punteggioFinale = risultato.serie[MESI_SESSIONE].punteggio;
  const chiusaAt = ora.toISOString();
  ok(
    await db.from('sessioni')
      .update({ chiusa_at: chiusaAt, punteggio_finale: punteggioFinale, serie: risultato })
      .eq('hash', s.hash).eq('numero', s.numero).is('chiusa_at', null),
    'chiusura sessione',
  );

  // record salvato a parte
  const record = ok(await db.from('record_sessioni').select('punteggio_finale').eq('hash', s.hash).maybeSingle(), 'lettura record') as
    { punteggio_finale: number } | null;
  if (nuovoRecord(record ? { punteggioFinale: Number(record.punteggio_finale) } : null, { punteggioFinale })) {
    ok(
      await db.from('record_sessioni').upsert({
        hash: s.hash, numero: s.numero, side: s.side, punteggio_finale: punteggioFinale,
        serie: risultato, iniziata_at: s.iniziata_at, chiusa_at: chiusaAt,
      }),
      'salvataggio record',
    );
  }

  // si tengono solo le ultime 30 sessioni chiuse
  const chiuse = ok(
    await db.from('sessioni').select('numero').eq('hash', s.hash).not('chiusa_at', 'is', null),
    'elenco sessioni',
  ) as { numero: number }[];
  const via = sessioniDaCancellare(chiuse.map((c) => c.numero));
  if (via.length) ok(await db.from('sessioni').delete().eq('hash', s.hash).in('numero', via), 'pulizia sessioni');
}

const comeChiusa = (r: { numero: number; side: Side; punteggio_finale: number; serie: RisultatoSessione }): SessioneChiusa => ({
  numero: r.numero,
  side: r.side,
  punteggioFinale: Number(r.punteggio_finale),
  serie: r.serie.serie.map((p) => p.punteggio),
});

/** Dati per il grafico: ultime sessioni chiuse e record. */
export async function storico(db: Db, hash: string): Promise<{ sessioni: SessioneChiusa[]; record: SessioneChiusa | null; totale: number }> {
  const righe = ok(
    await db.from('sessioni').select('numero, side, punteggio_finale, serie')
      .eq('hash', hash).not('chiusa_at', 'is', null).order('numero', { ascending: false }).limit(30),
    'storico',
  ) as Parameters<typeof comeChiusa>[0][];
  const rec = ok(await db.from('record_sessioni').select('numero, side, punteggio_finale, serie').eq('hash', hash).maybeSingle(), 'record') as
    Parameters<typeof comeChiusa>[0] | null;
  return { sessioni: righe.map(comeChiusa), record: rec ? comeChiusa(rec) : null, totale: righe.length };
}

/** Ultima sessione chiusa con il risultato completo (per la pagina di fine partita). */
export async function ultimaChiusa(db: Db, hash: string): Promise<RigaSessione | null> {
  const r = ok(
    await db.from('sessioni').select('*').eq('hash', hash).not('chiusa_at', 'is', null).order('numero', { ascending: false }).limit(1),
    'ultima sessione',
  ) as RigaSessione[];
  return r[0] ?? null;
}

/** Diritto all'oblio: cancella giocatore, punteggio, sessioni e record (a cascata). */
export async function cancellaDati(db: Db, hash: string): Promise<void> {
  ok(await db.from('giocatori').delete().eq('hash', hash), 'cancellazione');
}
