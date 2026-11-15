import { DOMANDE, PNR, type Asse, type Risposte } from './domande';
import { getProposal } from '../sim/catalog';
import type { Indicatore, PuntoSerie, Side } from '../sim/types';

export class Minorenne extends Error {
  constructor() { super('Il gioco è riservato ai maggiorenni.'); }
}

export interface Profilo {
  /** -1 sinistra … +1 destra (null se l'utente non ha risposto) */
  sinistraDestra: number | null;
  /** -1 statalismo … +1 liberismo */
  liberismo: number | null;
  /** -1 centralismo … +1 federalismo */
  federalismo: number | null;
  priorita: Indicatore | null;
}

/** Controlla che ci siano tutte e 30 le risposte e che siano valide. Blocca i minorenni. */
export function validaRisposte(r: Risposte, oggi: Date = new Date()): void {
  for (const d of DOMANDE) {
    const v = r[d.id];
    if (v === undefined || v === '') throw new Error(`Manca la risposta a: ${d.testo}`);
    if (d.tipo === 'anno-da-cf') {
      const anno = Number(v);
      if (!/^\d{4}$/.test(v) || anno < 1900) throw new Error('Anno di nascita non valido');
      // chi nasce dopo (anno corrente - 18) è certamente minorenne; il giorno esatto lo controlla il browser
      if (anno > oggi.getUTCFullYear() - 18) throw new Minorenne();
    } else if (d.tipo === 'scelta') {
      if (!d.opzioni.some((o) => o.valore === v)) throw new Error(`Risposta non valida a: ${d.testo}`);
      if (d.obbligatoria && v === PNR) throw new Error(`Questa risposta è necessaria: ${d.testo}`);
    } else if (v !== PNR) {
      const n = Number(v);
      const [min, max] = d.tipo === 'likert' ? [1, 5] : [d.min, d.max];
      if (!Number.isInteger(n) || n < min || n > max) throw new Error(`Risposta non valida a: ${d.testo}`);
    }
  }
  const sconosciute = Object.keys(r).filter((k) => !DOMANDE.some((d) => d.id === k));
  if (sconosciute.length) throw new Error(`Risposte sconosciute: ${sconosciute.join(', ')}`);
}

const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const r2 = (x: number | null) => (x === null ? null : Math.round(x * 100) / 100);

export function calcolaProfilo(r: Risposte): Profilo {
  const assi: Record<Asse, number[]> = { sinistraDestra: [], liberismo: [], federalismo: [] };
  for (const d of DOMANDE) {
    if (d.tipo !== 'likert') continue;
    const v = r[d.id];
    if (v === undefined || v === PNR) continue;
    assi[d.asse].push(((Number(v) - 3) / 2) * d.verso);
  }
  // sinistra-destra: metà autocollocazione, metà affermazioni
  const auto = r.autocollocazione && r.autocollocazione !== PNR ? (Number(r.autocollocazione) - 5) / 5 : null;
  const affermazioni = media(assi.sinistraDestra);
  const parti = [auto, affermazioni].filter((x): x is number => x !== null);

  const p = r.priorita;
  return {
    sinistraDestra: r2(media(parti)),
    liberismo: r2(media(assi.liberismo)),
    federalismo: r2(media(assi.federalismo)),
    priorita: p && p !== PNR ? (p as Indicatore) : null,
  };
}

export type Esito = 'coerente' | 'si discosta' | 'non misurabile';

export interface RigaConfronto {
  asse: string;
  intervista: string;
  gioco: string;
  esito: Esito;
}

const SOGLIA_CENTRO = 0.2;
const descriviSD = (x: number) => (Math.abs(x) <= SOGLIA_CENTRO ? 'centro' : x < 0 ? 'sinistra' : 'destra');
const descriviLib = (x: number) => (Math.abs(x) <= SOGLIA_CENTRO ? 'equilibrio' : x < 0 ? 'più Stato' : 'più mercato');

const MIGLIORE_SE_ALTO: Record<Indicatore, boolean> = {
  occupazione: true, inflazione: false, debito: false, gradimento: true,
};
const NOME: Record<Indicatore, string> = {
  occupazione: 'lavoro', inflazione: 'prezzi', debito: 'debito', gradimento: 'serenità della gente',
};

/**
 * Fine partita: quanto il profilo dell'intervista è coerente con come si è giocato.
 * Le leggi sono solo quelle dell'Italia scelta, quindi l'asse Stato ↔ mercato
 * si muove in un intervallo limitato: lo diciamo nel testo della pagina.
 */
export function confrontaConGioco(
  profilo: Profilo,
  side: Side,
  leggiGiocatore: string[],
  iniziale: PuntoSerie,
  finale: PuntoSerie,
): RigaConfronto[] {
  const righe: RigaConfronto[] = [];

  // 1. sinistra-destra: intervista vs scelta dell'Italia
  if (profilo.sinistraDestra === null) {
    righe.push({ asse: 'Sinistra ↔ destra', intervista: 'non indicato', gioco: `Italia di ${side}`, esito: 'non misurabile' });
  } else {
    const pos = descriviSD(profilo.sinistraDestra);
    righe.push({
      asse: 'Sinistra ↔ destra',
      intervista: pos,
      gioco: `Italia di ${side}`,
      esito: pos === 'centro' ? 'non misurabile' : pos === side ? 'coerente' : 'si discosta',
    });
  }

  // 2. Stato ↔ mercato: intervista vs media delle leggi scelte
  const libGioco = leggiGiocatore.reduce((a, c) => a + getProposal(c).liberismo, 0) / Math.max(1, leggiGiocatore.length);
  if (profilo.liberismo === null) {
    righe.push({ asse: 'Stato ↔ mercato', intervista: 'non indicato', gioco: descriviLib(libGioco), esito: 'non misurabile' });
  } else {
    righe.push({
      asse: 'Stato ↔ mercato',
      intervista: descriviLib(profilo.liberismo),
      gioco: `${descriviLib(libGioco)} (leggi scelte)`,
      esito: Math.abs(profilo.liberismo - libGioco) <= 0.5 ? 'coerente' : 'si discosta',
    });
  }

  // 3. federalismo: nessuna legge del gioco lo misura in questa versione
  righe.push({
    asse: 'Centralismo ↔ federalismo',
    intervista: profilo.federalismo === null ? 'non indicato' : profilo.federalismo > SOGLIA_CENTRO ? 'federalista' : profilo.federalismo < -SOGLIA_CENTRO ? 'centralista' : 'equilibrio',
    gioco: 'nessuna legge sul tema in questa versione',
    esito: 'non misurabile',
  });

  // 4. priorità: l'obiettivo dichiarato è migliorato rispetto alla partenza?
  if (profilo.priorita) {
    const k = profilo.priorita;
    const prima = iniziale[k];
    const dopo = finale[k];
    const meglio = MIGLIORE_SE_ALTO[k] ? dopo >= prima : dopo <= prima;
    righe.push({
      asse: `Priorità: ${NOME[k]}`,
      intervista: NOME[k],
      gioco: `da ${prima} a ${dopo}`,
      esito: meglio ? 'coerente' : 'si discosta',
    });
  }
  return righe;
}
