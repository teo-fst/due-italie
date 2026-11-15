import type { EventoAccaduto, Impatto, Side } from './sim/types';
import { getEvento } from './sim/events';

// Regole di conservazione e grafico delle sessioni:
// - si conservano solo le ultime 30 sessioni chiuse di ogni giocatore;
// - la sessione record è salvata a parte, così sopravvive anche quando esce dalle ultime 30
//   (es. 40 sessioni con record la n. 6 → restano la 11…40 più la copia della 6);
// - si gioca con una sola Italia: il grafico sovrappone le ultime 5 partite per vedere come divergono
//   (Italia di destra = grigio pieno, di sinistra = grigio tratteggiato) e colora d'arancione
//   la partita record, aggiunta come sesta linea se non è già tra le 5.

export const MAX_SESSIONI = 30;
export const SESSIONI_NEL_GRAFICO = 5;

export interface SessioneChiusa {
  numero: number;
  /** Italia del giocatore. */
  side: Side;
  /** Punteggio finale dell'Italia del giocatore: decide il record. */
  punteggioFinale: number;
  /** Traguardo mese per mese (0…24). */
  serie: number[];
}

/** Numeri delle sessioni da cancellare: tutte tranne le ultime `max`. */
export function sessioniDaCancellare(numeri: number[], max: number = MAX_SESSIONI): number[] {
  const ordinati = [...numeri].sort((a, b) => b - a);
  return ordinati.slice(max).sort((a, b) => a - b);
}

/** True se la nuova sessione batte il record (a parità resta il record più vecchio). */
export function nuovoRecord(record: Pick<SessioneChiusa, 'punteggioFinale'> | null, nuova: Pick<SessioneChiusa, 'punteggioFinale'>): boolean {
  return record === null || nuova.punteggioFinale > record.punteggioFinale;
}

export interface Linea {
  numero: number;
  side: Side;
  tratteggio: boolean;
  colore: 'grigio' | 'arancione';
  record: boolean;
  valori: number[];
}

/** Linee del grafico: ultime 5 sessioni + record (sesta linea, se non è già tra le 5). */
export function lineeGrafico(sessioni: SessioneChiusa[], record: SessioneChiusa | null): Linea[] {
  const ultime = [...sessioni].sort((a, b) => b.numero - a.numero).slice(0, SESSIONI_NEL_GRAFICO);
  const mostrate = [...ultime];
  if (record && !ultime.some((s) => s.numero === record.numero)) mostrate.push(record);
  mostrate.sort((a, b) => a.numero - b.numero);

  const linee: Linea[] = mostrate.map((s) => {
    const isRecord = record?.numero === s.numero;
    return {
      numero: s.numero,
      side: s.side,
      tratteggio: s.side === 'sinistra',
      colore: isRecord ? 'arancione' : 'grigio',
      record: isRecord,
      valori: s.serie,
    };
  });
  // il record va disegnato per ultimo, sopra le linee grigie
  return linee.sort((a, b) => Number(a.record) - Number(b.record));
}

/** Tracciato SVG di una serie in un riquadro largo `w` e alto `h`, con scala verticale [min, max]. */
export function tracciato(valori: number[], w: number, h: number, min: number, max: number, mesi = 24): string {
  const span = max - min || 1;
  return valori
    .map((v, i) => {
      const x = (i / mesi) * w;
      const y = h - ((v - min) / span) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/** Estremi della scala verticale con un piccolo margine. */
export function estremi(linee: Linea[]): [number, number] {
  const tutti = linee.flatMap((l) => l.valori);
  if (!tutti.length) return [0, 1];
  const lo = Math.min(...tutti);
  const hi = Math.max(...tutti);
  const m = Math.max(0.5, (hi - lo) * 0.08);
  return [Math.floor(lo - m), Math.ceil(hi + m)];
}

export interface Marcatore {
  mese: number;
  valore: number;
  impatto: Impatto;
  raggio: number;
  positivo: boolean;
  etichetta: string;
}

/** Segni degli imprevisti sul grafico della partita: più grande l'impatto, più grande il cerchio. */
export function marcatori(eventi: EventoAccaduto[], serie: number[]): Marcatore[] {
  return eventi
    .filter((e) => e.mese < serie.length)
    .map((e) => {
      const ev = getEvento(e.code);
      return {
        mese: e.mese,
        valore: serie[e.mese],
        impatto: ev.impatto,
        raggio: 2 + ev.impatto * 2,
        positivo: ev.positivo,
        etichetta: `${ev.emoji} ${ev.titolo}`,
      };
    })
    .sort((a, b) => b.impatto - a.impatto); // i più grandi sotto, i piccoli restano visibili
}
