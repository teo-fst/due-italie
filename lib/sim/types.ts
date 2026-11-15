// Tipi del motore di simulazione "Due Italie".
// Il motore è puro (nessun I/O): lo usano sia la route cron su Vercel sia i test.

export type Side = 'sinistra' | 'destra';
export const SIDES: readonly Side[] = ['sinistra', 'destra'] as const;

export type Topic = 'casa' | 'immigrazione' | 'tasse' | 'energia';

/** Indicatori mostrati il sabato (R9). */
export interface Indicators {
  /** Tasso di occupazione 15-64, in punti percentuali. */
  occupazione: number;
  /** Inflazione annua, in %. */
  inflazione: number;
  /** Debito pubblico in % del PIL. */
  debito: number;
  /** Gradimento della popolazione 0-100 ("contenta o stufa"). */
  gradimento: number;
}

/** Variazione degli indicatori (tutti opzionali). */
export type Effect = Partial<Indicators>;

export interface Fonte {
  etichetta: string;
  url?: string;
}

export interface Proposal {
  /** Chiave stabile, usata anche nel DB (proposals.code). */
  code: string;
  side: Side;
  topic: Topic;
  titolo: string;
  descrizione: string;
  /** Effetto applicato nell'anno in cui la legge passa. */
  immediato: Effect;
  /** Effetto che arriva dopo N anni (es. centrali, cantieri). */
  ritardato?: { dopoAnni: number; effetto: Effect };
  /** R7: ogni parametro deve avere una fonte prima di andare in produzione. */
  fonti: Fonte[];
  verificato: boolean;
}

export interface PendingEffect {
  /** Anno (incluso) in cui l'effetto si applica. */
  anno: number;
  effetto: Effect;
  origine: string;
}

export interface WorldState extends Indicators {
  side: Side;
  anno: number;
  pending: PendingEffect[];
}

export type DiceFace = 1 | 2 | 3 | 4 | 5 | 6;

export interface Evento {
  faccia: DiceFace;
  code: string;
  titolo: string;
  effetto: Effect;
  /** Se true, l'effetto sul debito scala con il debito di partenza. */
  scalaConDebito?: boolean;
}

export type Freccia = 'su' | 'giu' | 'stabile';

export interface YearReport {
  side: Side;
  annoDa: number;
  annoA: number;
  legge: string | null;
  evento: string;
  prima: Indicators;
  dopo: Indicators;
  frecce: Record<keyof Indicators, Freccia>;
  punteggio: number;
}
