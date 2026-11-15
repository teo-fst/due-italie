import type {
  Effect, Evento, Freccia, Indicators, Proposal, Side, WorldState, YearReport,
} from './types';

// Modello v0: volutamente semplice e trasparente. Ogni costante qui sotto
// è una scelta di modello: è pubblicata nella pagina /metodo (app/metodo/page.tsx).

/** R1: stato iniziale identico per le due Italie. Valori indicativi: aggiornare con ISTAT/Banca d'Italia. */
export const STATO_INIZIALE: Indicators = {
  occupazione: 62.5,
  inflazione: 1.7,
  debito: 135,
  gradimento: 50,
};
export const ANNO_INIZIALE = 2026;

export const MODELLO = {
  /** Obiettivo d'inflazione BCE. */
  inflazioneTarget: 2,
  /** Quota di rientro annuo dell'inflazione verso il target. */
  rientroInflazione: 0.3,
  /** Quota di rientro annuo del gradimento verso 50 (la gente dimentica). */
  rientroGradimento: 0.1,
  /** Debito di riferimento per scalare gli shock (es. pandemia). */
  debitoRiferimento: 135,
  /** Peso dei risultati sul gradimento. */
  pesoOccupazioneSuGradimento: 3,
  pesoInflazioneSuGradimento: 2,
  pesoDebitoSuGradimento: 0.3,
  /** Pesi del punteggio "chi arriva più lontano" (R11). Pubblici e configurabili. */
  punteggio: { occupazione: 1, inflazione: 2, debito: 0.05, gradimento: 0.2 },
} as const;

const KEYS: (keyof Indicators)[] = ['occupazione', 'inflazione', 'debito', 'gradimento'];

export function statoIniziale(side: Side): WorldState {
  return { side, anno: ANNO_INIZIALE, pending: [], ...STATO_INIZIALE };
}

function applica(s: Indicators, e: Effect, scala = 1): Indicators {
  const out = { ...s };
  for (const k of KEYS) out[k] += (e[k] ?? 0) * scala;
  return out;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function freccia(prima: number, dopo: number): Freccia {
  const d = dopo - prima;
  if (Math.abs(d) < 0.05) return 'stabile';
  return d > 0 ? 'su' : 'giu';
}

/** R11: punteggio composito. Più alto = più lontano. */
export function punteggio(s: Indicators): number {
  const p = MODELLO.punteggio;
  return round2(
    s.occupazione * p.occupazione
      - Math.abs(s.inflazione - MODELLO.inflazioneTarget) * p.inflazione
      - s.debito * p.debito
      + s.gradimento * p.gradimento,
  );
}

/**
 * Risolve un anno (= una settimana di gioco) per una delle due Italie.
 * @param legge  proposta vincente del mercoledì, o null se nessuno ha votato
 * @param evento esito del dado, uguale per entrambe le Italie
 */
export function risolviAnno(
  stato: WorldState,
  legge: Proposal | null,
  evento: Evento,
): { stato: WorldState; report: YearReport } {
  if (legge && legge.side !== stato.side) {
    throw new Error(`La legge ${legge.code} è della ${legge.side}, ma questa è l'Italia di ${stato.side}`);
  }
  const prima: Indicators = pick(stato);
  const annoNuovo = stato.anno + 1;

  // 1. dinamica di base: l'inflazione rientra verso il target
  let s: Indicators = { ...prima };
  s.inflazione += (MODELLO.inflazioneTarget - s.inflazione) * MODELLO.rientroInflazione;

  // 2. effetto immediato della legge
  if (legge) s = applica(s, legge.immediato);

  // 3. effetti ritardati di leggi passate che maturano quest'anno
  const maturi = stato.pending.filter((p) => p.anno <= annoNuovo);
  const ancoraInAttesa = stato.pending.filter((p) => p.anno > annoNuovo);
  for (const p of maturi) s = applica(s, p.effetto);

  // 4. imprevisto (dado)
  const scalaDebito = evento.scalaConDebito ? s.debito / MODELLO.debitoRiferimento : 1;
  const { debito: dDebitoEvento, ...restoEvento } = evento.effetto;
  s = applica(s, restoEvento);
  if (dDebitoEvento) s.debito += dDebitoEvento * scalaDebito;

  // 5. la gente reagisce ai risultati ("contenta o stufa")
  const dOcc = s.occupazione - prima.occupazione;
  const eccessoInfl = Math.max(0, s.inflazione - MODELLO.inflazioneTarget);
  const dDeb = Math.max(0, s.debito - prima.debito);
  s.gradimento += dOcc * MODELLO.pesoOccupazioneSuGradimento
    - eccessoInfl * MODELLO.pesoInflazioneSuGradimento
    - dDeb * MODELLO.pesoDebitoSuGradimento;
  s.gradimento += (50 - s.gradimento) * MODELLO.rientroGradimento;

  // 6. limiti e arrotondamenti
  s = {
    occupazione: round2(clamp(s.occupazione, 30, 85)),
    inflazione: round2(clamp(s.inflazione, -5, 30)),
    debito: round2(clamp(s.debito, 0, 400)),
    gradimento: round2(clamp(s.gradimento, 0, 100)),
  };

  const pending = [...ancoraInAttesa];
  if (legge?.ritardato) {
    pending.push({
      anno: annoNuovo + legge.ritardato.dopoAnni,
      effetto: legge.ritardato.effetto,
      origine: legge.code,
    });
  }

  const nuovo: WorldState = { side: stato.side, anno: annoNuovo, pending, ...s };
  const frecce = Object.fromEntries(KEYS.map((k) => [k, freccia(prima[k], s[k])])) as YearReport['frecce'];

  return {
    stato: nuovo,
    report: {
      side: stato.side,
      annoDa: stato.anno,
      annoA: annoNuovo,
      legge: legge?.code ?? null,
      evento: evento.code,
      prima,
      dopo: s,
      frecce,
      punteggio: punteggio(s),
    },
  };
}

function pick(s: Indicators): Indicators {
  return {
    occupazione: s.occupazione,
    inflazione: s.inflazione,
    debito: s.debito,
    gradimento: s.gradimento,
  };
}

/** Sceglie la legge vincente dai voti. Pareggio: vince la proposta con code alfabeticamente minore (deterministico). */
export function leggeVincente(voti: Record<string, number>): string | null {
  const entries = Object.entries(voti).filter(([, n]) => n > 0);
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return entries[0][0];
}
