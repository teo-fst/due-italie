import { getProposal } from './catalog';
import { EVENTI, probabilitaMese } from './events';
import type {
  Contributo, Evento, Indicators, Proposal, PuntoSerie, RisultatoSessione, Side,
} from './types';

// Modello mensile v1. Tutte le costanti sono pubbliche nella pagina /metodo.

/** Partenza "calma" 2025 (ricerca: ISTAT, Banca d'Italia). Identica per le due Italie. */
export const STATO_INIZIALE: Indicators = {
  occupazione: 62.6,
  inflazione: 1.6,
  debito: 136.7,
  gradimento: 50,
};

export const MESI_SESSIONE = 24;
/** 1 ora reale = 1 mese simulato. */
export const MS_PER_MESE = 60 * 60 * 1000;
/** La sessione simulata parte a gennaio (serve per gli eventi stagionali). */
export const MESE_CALENDARIO_INIZIALE = 1;

export const MODELLO = {
  inflazioneTarget: 2,
  /**
   * Andamento del debito senza nuove leggi né imprevisti, in punti all'anno:
   * identità Δd = (i − g)/(1 + g)·d − avanzo primario con i ≈ 2,8%, g ≈ 2,6%, avanzo 0,8% → circa −0,56;
   * nel primo anno +1,8 per l'eredità dei crediti dei bonus edilizi (UPB).
   */
  debitoBaseAnnuo: -0.56,
  ereditaCreditiAnno1: 1.8,
  debitoRiferimento: 136.7,
  /** Gradimento: consenso di una legge → effetto con memoria (emivita circa 6-12 mesi). */
  consenso: { rampa: 2, durata: 6, rientro: 12 },
  /** Reazione della gente ai risultati, per mese. */
  reazione: { occupazione: 3, inflazione: 0.25, debito: 0.3, memoria: 0.92 },
  esposizioneGasMinima: 0.3,
  punteggio: { occupazione: 1, inflazione: 2, debito: 0.05, gradimento: 0.2 },
} as const;

// ───────────── numeri casuali deterministici ─────────────

/** mulberry32: piccolo generatore con seme, identico su server e nei test. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ───────────── profilo nel tempo ─────────────

/** Intensità (0-1) di un effetto `dt` mesi dopo il suo avvio. */
export function profilo(c: Pick<Contributo, 'ritardo' | 'rampa' | 'durata' | 'rientro'>, dt: number): number {
  const t = dt - c.ritardo;
  if (t <= 0) return 0;
  const rampa = Math.max(1, c.rampa ?? 1);
  const durata = c.durata ?? Infinity;
  const rientro = c.rientro ?? 0;
  if (t < rampa) return t / rampa;
  if (t < rampa + durata) return 1;
  if (rientro > 0 && t < rampa + durata + rientro) return 1 - (t - rampa - durata) / rientro;
  return 0;
}

/** Valore di un contributo al mese `dt` dal suo avvio (i flussi si accumulano mese per mese). */
export function valoreContributo(c: Contributo, dt: number): number {
  if (c.tipo === 'flusso') {
    let somma = 0;
    for (let k = 1; k <= dt; k++) somma += (c.valore / 12) * profilo(c, k);
    return somma;
  }
  return c.valore * profilo(c, dt);
}

export function punteggio(s: Indicators): number {
  const p = MODELLO.punteggio;
  return round2(
    s.occupazione * p.occupazione
      - Math.abs(s.inflazione - MODELLO.inflazioneTarget) * p.inflazione
      - s.debito * p.debito
      + s.gradimento * p.gradimento,
  );
}

// ───────────── simulazione ─────────────

interface EventoAttivo { evento: Evento; mese: number; fattore: { debito: number; gas: number } }

/** Imprevisti della partita: dipendono solo dal seme ("il dado"), non dalle leggi. */
export function estraiEventi(seed: number): Evento[][] {
  const dado = rng(seed >>> 0);
  const perMese: Evento[][] = [[]];
  for (let m = 1; m <= MESI_SESSIONE; m++) {
    const meseCal = ((MESE_CALENDARIO_INIZIALE - 1 + m - 1) % 12) + 1;
    // si "tira" per ogni evento nello stesso ordine, così la sequenza non dipende dagli esiti
    perMese.push(EVENTI.filter((e) => dado() < probabilitaMese(e, meseCal)));
  }
  return perMese;
}

/**
 * Simula `mesi` mesi di una partita nell'Italia del giocatore.
 * Deterministica e "a prefisso": simulare 10 mesi dà gli stessi primi 10 mesi di una simulazione da 24.
 */
export function simulaSessione(
  input: { seed: number; side: Side; leggi: string[] },
  mesi: number = MESI_SESSIONE,
): RisultatoSessione {
  const n = Math.max(0, Math.min(MESI_SESSIONE, Math.floor(mesi)));
  const leggi: Proposal[] = input.leggi.map(getProposal);
  if (leggi.some((p) => p.side !== input.side)) throw new Error(`Leggi non valide per l'Italia di ${input.side}`);

  const eventiPerMese = estraiEventi(input.seed);
  const punti: PuntoSerie[] = [{ mese: 0, ...STATO_INIZIALE, punteggio: punteggio(STATO_INIZIALE) }];
  const attivi: EventoAttivo[] = [];
  let reazione = 0;

  for (let m = 1; m <= n; m++) {
    const prec = punti[m - 1];
    for (const e of eventiPerMese[m]) {
      attivi.push({
        evento: e,
        mese: m,
        fattore: {
          debito: e.interazione === 'debito' ? prec.debito / MODELLO.debitoRiferimento : 1,
          gas: e.interazione === 'gas' ? esposizioneGas(leggi, m) : 1,
        },
      });
    }

    const s: Indicators = { ...STATO_INIZIALE };
    s.debito += (MODELLO.debitoBaseAnnuo / 12) * m + (MODELLO.ereditaCreditiAnno1 / 12) * Math.min(m, 12);

    for (const p of leggi) {
      for (const c of p.effetti) s[c.indicatore] += valoreContributo(c, m);
      s.gradimento += p.consenso * profilo({ ritardo: 0, ...MODELLO.consenso }, m);
    }

    for (const a of attivi) {
      for (const c of a.evento.effetti) {
        let v = valoreContributo(c, m - a.mese + 1);
        if (c.indicatore === 'debito') v *= a.fattore.debito;
        if (c.indicatore === 'inflazione') v *= a.fattore.gas;
        s[c.indicatore] += v;
      }
    }

    // la gente reagisce ai risultati ("contenta o stufa"), con memoria
    const dOcc = s.occupazione - prec.occupazione;
    const dDeb = Math.max(0, s.debito - prec.debito);
    const eccessoInfl = Math.max(0, s.inflazione - MODELLO.inflazioneTarget);
    reazione = reazione * MODELLO.reazione.memoria
      + dOcc * MODELLO.reazione.occupazione
      - eccessoInfl * MODELLO.reazione.inflazione
      - dDeb * MODELLO.reazione.debito;
    s.gradimento += reazione;

    const finale: Indicators = {
      occupazione: round2(clamp(s.occupazione, 30, 85)),
      inflazione: round2(clamp(s.inflazione, -5, 30)),
      debito: round2(clamp(s.debito, 0, 400)),
      gradimento: round2(clamp(s.gradimento, 0, 100)),
    };
    punti.push({ mese: m, ...finale, punteggio: punteggio(finale) });
  }

  const eventi = eventiPerMese
    .flatMap((lista, mese) => lista.map((e) => ({ mese, code: e.code })))
    .filter((e) => e.mese >= 1 && e.mese <= n);

  return { mesi: n, side: input.side, leggi: [...input.leggi], eventi, serie: punti };
}

/** Quota dell'impatto di uno shock del gas che arriva sull'inflazione (1 = piena esposizione). */
export function esposizioneGas(leggi: Proposal[], mese: number): number {
  let riduzione = 0;
  for (const p of leggi) {
    if (p.riduceEsposizioneGas) riduzione += p.riduceEsposizioneGas.valore * profilo({ ...p.riduceEsposizioneGas }, mese);
  }
  return Math.max(MODELLO.esposizioneGasMinima, 1 - riduzione);
}

/** Mesi trascorsi in una sessione iniziata a `inizio` (1 ora = 1 mese, massimo 24). */
export function mesiTrascorsi(inizio: Date, ora: Date): number {
  const ms = ora.getTime() - inizio.getTime();
  if (ms <= 0) return 0;
  return Math.min(MESI_SESSIONE, Math.floor(ms / MS_PER_MESE));
}

const round2 = (x: number) => Math.round(x * 100) / 100;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
