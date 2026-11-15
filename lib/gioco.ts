import 'server-only';
import { randomInt } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { proposalsFor, getProposal, topicForYear } from './sim/catalog';
import { EVENTI, tiraDado } from './sim/events';
import { risolviAnno, statoIniziale, leggeVincente, punteggio, ANNO_INIZIALE } from './sim/engine';
import { SIDES, type PendingEffect, type Side, type WorldState } from './sim/types';
import { prossimaFinestraVoto } from './calendario';

type Db = SupabaseClient;

function check<T>(res: { data: T; error: { message: string } | null }, cosa: string): T {
  if (res.error) throw new Error(`${cosa}: ${res.error.message}`);
  return res.data;
}

/** Crea il turno di un anno con le proposte di entrambe le Italie (R2, R5). */
async function creaTurno(db: Db, anno: number, ora: Date) {
  const topic = topicForYear(anno);
  const { apre, chiude } = prossimaFinestraVoto(ora);
  const turno = check(
    await db.from('turns')
      .insert({ anno, topic, vote_opens_at: apre.toISOString(), vote_closes_at: chiude.toISOString() })
      .select('id')
      .single(),
    'creazione turno',
  ) as { id: number };

  const righe = SIDES.flatMap((side) =>
    proposalsFor(side, topic).map((p) => ({
      turn_id: turno.id, side, code: p.code, titolo: p.titolo, descrizione: p.descrizione,
    })));
  check(await db.from('proposals').insert(righe), 'inserimento proposte');
  return { turnId: turno.id, topic, apre, chiude };
}

/** R10: avvio del gioco al raggiungimento della soglia. */
export async function avviaSeSoglia(db: Db, ora: Date, soglia: number) {
  const contatori = check(await db.from('counters').select('key, value'), 'lettura contatori') as
    { key: string; value: number }[];
  const iscritti = contatori.reduce((a, c) => a + Number(c.value), 0);
  if (iscritti < soglia) return { stato: 'in-attesa' as const, iscritti, soglia };

  // R1: stessa partenza per entrambe
  const iniziali = SIDES.map((side) => {
    const s = statoIniziale(side);
    return {
      side, anno: s.anno, occupazione: s.occupazione, inflazione: s.inflazione,
      debito: s.debito, gradimento: s.gradimento, punteggio: punteggio(s), pending: [],
    };
  });
  check(await db.from('world_states').insert(iniziali), 'stati iniziali');
  const turno = await creaTurno(db, ANNO_INIZIALE, ora);
  return { stato: 'avviato' as const, iscritti, turno };
}

/** Sabato: dado + risultati per un turno con urne chiuse, poi crea il turno successivo. */
export async function risolviTurno(db: Db, turno: { id: number; anno: number }, ora: Date) {
  // R8: un solo tiro, lo stesso per entrambe le Italie, con generatore crittografico
  const faccia = tiraDado((max) => randomInt(max));
  const evento = EVENTI[faccia];

  const proposte = check(
    await db.from('proposals').select('id, code, side').eq('turn_id', turno.id),
    'lettura proposte',
  ) as { id: number; code: string; side: Side }[];
  const conteggi = check(
    await db.from('vote_counts').select('proposal_id, voti').eq('turn_id', turno.id),
    'lettura conteggi',
  ) as { proposal_id: number; voti: number }[];

  const nuoviStati = [];
  const esiti: Record<string, unknown> = {};
  for (const side of SIDES) {
    const riga = check(
      await db.from('world_states').select('*').eq('side', side).eq('anno', turno.anno).single(),
      `stato ${side} ${turno.anno}`,
    ) as Record<string, unknown>;
    const stato: WorldState = {
      side,
      anno: Number(riga.anno),
      occupazione: Number(riga.occupazione),
      inflazione: Number(riga.inflazione),
      debito: Number(riga.debito),
      gradimento: Number(riga.gradimento),
      pending: (riga.pending as PendingEffect[]) ?? [],
    };

    const voti: Record<string, number> = {};
    for (const p of proposte.filter((x) => x.side === side)) {
      voti[p.code] = Number(conteggi.find((c) => c.proposal_id === p.id)?.voti ?? 0);
    }
    const codice = leggeVincente(voti);
    const { stato: dopo, report } = risolviAnno(stato, codice ? getProposal(codice) : null, evento);

    nuoviStati.push({
      side, anno: dopo.anno, occupazione: dopo.occupazione, inflazione: dopo.inflazione,
      debito: dopo.debito, gradimento: dopo.gradimento, punteggio: report.punteggio,
      legge_code: codice, evento: evento.code, pending: dopo.pending,
    });
    esiti[side] = { legge: codice, voti, frecce: report.frecce, punteggio: report.punteggio };
  }

  // La PK (side, anno) impedisce una doppia risoluzione se il cron parte due volte.
  check(await db.from('world_states').insert(nuoviStati), 'salvataggio risultati');
  check(
    await db.from('turns')
      .update({ dado: faccia, evento: evento.code, resolved_at: ora.toISOString() })
      .eq('id', turno.id),
    'chiusura turno',
  );
  const prossimo = await creaTurno(db, turno.anno + 1, ora);
  return { stato: 'risolto' as const, anno: turno.anno, dado: faccia, evento: evento.titolo, esiti, prossimo };
}

export async function eseguiSettimana(db: Db, ora: Date, soglia: number) {
  const daRisolvere = check(
    await db.from('turns').select('id, anno')
      .is('resolved_at', null)
      .lte('vote_closes_at', ora.toISOString())
      .order('anno')
      .limit(1)
      .maybeSingle(),
    'ricerca turno',
  ) as { id: number; anno: number } | null;
  if (daRisolvere) return risolviTurno(db, daRisolvere, ora);

  const { count, error } = await db.from('turns').select('id', { count: 'exact', head: true });
  if (error) throw new Error(`conteggio turni: ${error.message}`);
  if (!count) return avviaSeSoglia(db, ora, soglia);

  return { stato: 'niente-da-fare' as const };
}
