// Tipi del motore "Due Italie" – versione a sessioni individuali.
// Scala temporale: 1 ora reale = 1 mese simulato; una sessione dura 24 mesi.
// Il motore è puro e deterministico: stesso seme + stesse leggi = stessa storia.
// Si gioca con una sola Italia; le partite si confrontano tra loro.

export type Side = 'sinistra' | 'destra';
export const SIDES: readonly Side[] = ['sinistra', 'destra'] as const;

export type Topic = 'casa' | 'immigrazione' | 'tasse' | 'energia' | 'lavoro';
export type Indicatore = 'occupazione' | 'inflazione' | 'debito' | 'gradimento';

export interface Indicators {
  /** Tasso di occupazione 15-64, punti %. */
  occupazione: number;
  /** Inflazione annua, %. */
  inflazione: number;
  /** Debito pubblico, % del PIL. */
  debito: number;
  /** Gradimento della popolazione, 0-100 ("contenta o stufa"). */
  gradimento: number;
}

/**
 * Un effetto nel tempo, misurato in mesi dall'approvazione della legge o dall'imprevisto.
 * Profilo: zero fino a `ritardo`, sale in `rampa` mesi, resta pieno per `durata` mesi,
 * poi torna a zero in `rientro` mesi (vedi nota metodologica della ricerca).
 */
export interface Contributo {
  indicatore: Indicatore;
  /** livello: spostamento al picco. flusso: punti all'anno che si accumulano (solo debito). */
  valore: number;
  tipo?: 'livello' | 'flusso';
  ritardo: number;
  rampa?: number;
  durata?: number;
  rientro?: number;
}

export type Confidenza = 'alta' | 'media' | 'bassa';

export type Impatto = 1 | 2 | 3 | 4 | 5;
export const IMPATTO_LABEL: Record<Impatto, string> = {
  1: 'locale', 2: 'regionale', 3: 'nazionale', 4: 'grave', 5: 'estremo',
};

export interface Fonte {
  etichetta: string;
  url?: string;
}

export interface Proposal {
  code: string;
  side: Side;
  topic: Topic;
  titolo: string;
  descrizione: string;
  pro: string;
  contro: string;
  /** Dose di riferimento: circa 0,5% del PIL l'anno, salvo dove indicato. */
  effetti: Contributo[];
  /** Effetto sul gradimento nazionale: da -4 (↓↓) a +4 (↑↑), con memoria che svanisce. */
  consenso: number;
  /** Riduzione dell'esposizione agli shock del gas (0-1), per l'interazione con gli imprevisti. */
  riduceEsposizioneGas?: { valore: number; ritardo: number; rampa: number };
  /** Posizione sull'asse statalismo (-1) ↔ liberismo (+1), per il confronto con l'intervista. */
  liberismo: number;
  confidenza: Confidenza;
  fonti: Fonte[];
  /** true solo dopo una revisione umana dei parametri e delle fonti. */
  verificato: boolean;
}

export interface Evento {
  code: string;
  titolo: string;
  emoji: string;
  positivo: boolean;
  /** Probabilità annua (frequenza storica italiana). */
  pAnno: number;
  /** Mesi del calendario in cui può accadere (1-12). Assente = tutto l'anno. */
  mesi?: number[];
  effetti: Contributo[];
  /** Scala d'impatto 1-5 (1 locale … 5 estremo): dimensione del segno sul grafico. */
  impatto: Impatto;
  /** Interazione con lo stato: 'debito' scala gli effetti sul debito, 'gas' quelli sull'inflazione. */
  interazione?: 'debito' | 'gas';
  esempio: string;
  confidenza: Confidenza;
  fonti: Fonte[];
}

export interface PuntoSerie extends Indicators {
  mese: number;
  punteggio: number;
}

export interface EventoAccaduto {
  mese: number;
  code: string;
}

/** Una partita si gioca con una sola Italia: quella scelta alla registrazione. */
export interface RisultatoSessione {
  mesi: number;
  side: Side;
  leggi: string[];
  eventi: EventoAccaduto[];
  serie: PuntoSerie[];
}
