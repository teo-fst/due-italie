import type { Proposal, Topic, Side } from './types';

// ATTENZIONE (R7 "dati veri"): i coefficienti qui sotto sono SEGNAPOSTO dimostrativi.
// Prima di pubblicare, ogni proposta va ancorata a stime documentate
// (UPB, Banca d'Italia, ISTAT, MEF/Relazioni tecniche, OCSE, ARERA, letteratura accademica)
// e marcata `verificato: true`. Con STRICT_SOURCES=true la route cron rifiuta di girare
// finché esistono proposte non verificate (vedi assertCatalogVerified).
//
// Regole di neutralità applicate (verificate dai test):
//  - ogni tema ha lo stesso numero di proposte per parte;
//  - nessuna proposta è "gratis": ognuna ha almeno un effetto positivo e uno negativo;
//  - l'ampiezza complessiva degli effetti è comparabile tra le due parti.

const DA_VERIFICARE = (dove: string) => [{ etichetta: `DA VERIFICARE – cercare in: ${dove}` }];

export const TOPICS: readonly Topic[] = ['casa', 'immigrazione', 'tasse', 'energia'] as const;

export const TOPIC_LABEL: Record<Topic, string> = {
  casa: 'Case',
  immigrazione: 'Immigrazione',
  tasse: 'Tasse',
  energia: 'Prezzo della luce',
};

export const CATALOG: Proposal[] = [
  // ───────────── CASA ─────────────
  {
    code: 'sx-casa-edilizia-pubblica',
    side: 'sinistra',
    topic: 'casa',
    titolo: 'Piano di edilizia pubblica',
    descrizione: 'Lo Stato finanzia nuovi alloggi popolari e il recupero di quelli sfitti.',
    immediato: { occupazione: 0.15, debito: 0.4, gradimento: 0.5 },
    ritardato: { dopoAnni: 3, effetto: { inflazione: -0.1, gradimento: 1 } },
    fonti: DA_VERIFICARE('Federcasa, Corte dei conti, moltiplicatori spesa per investimenti (UPB)'),
    verificato: false,
  },
  {
    code: 'sx-casa-limite-affitti-brevi',
    side: 'sinistra',
    topic: 'casa',
    titolo: 'Limiti agli affitti brevi nelle città',
    descrizione: 'Tetto ai giorni di affitto turistico per riportare case sul mercato residenziale.',
    immediato: { inflazione: -0.05, occupazione: -0.05, gradimento: 0.5 },
    fonti: DA_VERIFICARE('studi su Barcellona/Amsterdam/Berlino, Banca d\'Italia (mercato abitativo)'),
    verificato: false,
  },
  {
    code: 'dx-casa-sgravi-costruzione',
    side: 'destra',
    topic: 'casa',
    titolo: 'Sgravi a chi costruisce e ristruttura',
    descrizione: 'Incentivi fiscali e semplificazioni urbanistiche per aumentare l\'offerta di case.',
    immediato: { occupazione: 0.2, debito: 0.35, inflazione: 0.05 },
    ritardato: { dopoAnni: 2, effetto: { inflazione: -0.05, gradimento: 0.5 } },
    fonti: DA_VERIFICARE('UPB e Corte dei conti su bonus edilizi, ANCE'),
    verificato: false,
  },
  {
    code: 'dx-casa-tutela-proprietari',
    side: 'destra',
    topic: 'casa',
    titolo: 'Sfratti più rapidi e cedolare secca estesa',
    descrizione: 'Più garanzie ai proprietari per spingerli ad affittare le case vuote.',
    immediato: { inflazione: -0.05, debito: 0.1, gradimento: -0.25 },
    ritardato: { dopoAnni: 2, effetto: { gradimento: 0.5 } },
    fonti: DA_VERIFICARE('MEF (gettito cedolare secca), ISTAT (abitazioni non occupate)'),
    verificato: false,
  },

  // ───────────── IMMIGRAZIONE ─────────────
  {
    code: 'sx-imm-regolarizzazione',
    side: 'sinistra',
    topic: 'immigrazione',
    titolo: 'Regolarizzazione e corsi di lingua',
    descrizione: 'Permesso a chi lavora già in nero, con percorsi di lingua e formazione.',
    immediato: { debito: 0.1, gradimento: -1 },
    ritardato: { dopoAnni: 2, effetto: { occupazione: 0.25, debito: -0.15 } },
    fonti: DA_VERIFICARE('INPS (contributi stranieri), regolarizzazione 2020, Fondazione Moressa'),
    verificato: false,
  },
  {
    code: 'sx-imm-accoglienza-diffusa',
    side: 'sinistra',
    topic: 'immigrazione',
    titolo: 'Più ingressi legali e accoglienza diffusa',
    descrizione: 'Più quote d\'ingresso e piccoli centri di accoglienza distribuiti nei comuni.',
    immediato: { occupazione: 0.15, debito: 0.2, gradimento: -0.5 },
    fonti: DA_VERIFICARE('Ministero dell\'Interno, ANCI (SAI), OCSE International Migration Outlook'),
    verificato: false,
  },
  {
    code: 'dx-imm-stretta-rimpatri',
    side: 'destra',
    topic: 'immigrazione',
    titolo: 'Stretta sugli ingressi e più rimpatri',
    descrizione: 'Controlli più severi e accordi con i paesi d\'origine per i rimpatri.',
    immediato: { debito: 0.2, gradimento: 1, occupazione: -0.1 },
    fonti: DA_VERIFICARE('Ministero dell\'Interno (costi rimpatri), Coldiretti/Confagricoltura (fabbisogno manodopera)'),
    verificato: false,
  },
  {
    code: 'dx-imm-quote-contratto',
    side: 'destra',
    topic: 'immigrazione',
    titolo: 'Ingressi solo con contratto di lavoro',
    descrizione: 'Quote per settore: entra chi ha già un\'offerta di lavoro firmata.',
    immediato: { occupazione: 0.1, debito: 0.05, gradimento: 0.25 },
    ritardato: { dopoAnni: 1, effetto: { inflazione: 0.05 } },
    fonti: DA_VERIFICARE('Decreto flussi (domande vs. quote), Unioncamere Excelsior'),
    verificato: false,
  },

  // ───────────── TASSE ─────────────
  {
    code: 'sx-tasse-patrimoniale',
    side: 'sinistra',
    topic: 'tasse',
    titolo: 'Tassa sui grandi patrimoni, meno IRPEF ai redditi bassi',
    descrizione: 'Prelievo sui patrimoni più alti; il gettito riduce le tasse sul lavoro dei redditi bassi.',
    immediato: { debito: -0.2, occupazione: -0.05, gradimento: 0.75 },
    fonti: DA_VERIFICARE('Banca d\'Italia (distribuzione ricchezza), esperienze di Francia/Spagna/Svizzera'),
    verificato: false,
  },
  {
    code: 'sx-tasse-evasione',
    side: 'sinistra',
    topic: 'tasse',
    titolo: 'Lotta all\'evasione con pagamenti tracciati',
    descrizione: 'Più controlli incrociati e obbligo di pagamenti elettronici.',
    immediato: { debito: -0.4, gradimento: -0.75, occupazione: -0.05 },
    fonti: DA_VERIFICARE('MEF – Relazione sull\'economia non osservata e sull\'evasione'),
    verificato: false,
  },
  {
    code: 'dx-tasse-flat-tax',
    side: 'destra',
    topic: 'tasse',
    titolo: 'Flat tax incrementale',
    descrizione: 'Aliquota agevolata sui redditi in più rispetto agli anni precedenti.',
    immediato: { occupazione: 0.15, debito: 0.45, gradimento: 0.75 },
    fonti: DA_VERIFICARE('UPB (audizioni sulla flat tax), Relazione tecnica legge di bilancio'),
    verificato: false,
  },
  {
    code: 'dx-tasse-cuneo-tagli-spesa',
    side: 'destra',
    topic: 'tasse',
    titolo: 'Taglio del cuneo fiscale coperto da tagli di spesa',
    descrizione: 'Più soldi in busta paga, finanziati riducendo la spesa pubblica corrente.',
    immediato: { occupazione: 0.15, inflazione: 0.05, gradimento: -0.25 },
    fonti: DA_VERIFICARE('UPB, Banca d\'Italia (effetti del taglio del cuneo 2023-24)'),
    verificato: false,
  },

  // ───────────── ENERGIA ─────────────
  {
    code: 'sx-energia-rinnovabili',
    side: 'sinistra',
    topic: 'energia',
    titolo: 'Rinnovabili e comunità energetiche',
    descrizione: 'Investimenti pubblici in solare, eolico, reti e accumuli.',
    immediato: { debito: 0.3, occupazione: 0.1 },
    ritardato: { dopoAnni: 3, effetto: { inflazione: -0.25, gradimento: 0.5 } },
    fonti: DA_VERIFICARE('ARERA, Terna, GSE, IEA World Energy Outlook'),
    verificato: false,
  },
  {
    code: 'sx-energia-bonus-bollette',
    side: 'sinistra',
    topic: 'energia',
    titolo: 'Bonus bollette per le famiglie a basso reddito',
    descrizione: 'Sconto in bolletta per le famiglie sotto una soglia ISEE.',
    immediato: { gradimento: 1, debito: 0.3, inflazione: -0.05 },
    fonti: DA_VERIFICARE('ARERA (bonus sociale), UPB'),
    verificato: false,
  },
  {
    code: 'dx-energia-nucleare',
    side: 'destra',
    topic: 'energia',
    titolo: 'Ritorno al nucleare',
    descrizione: 'Nuove centrali di nuova generazione (reattori modulari).',
    immediato: { debito: 0.35, gradimento: -0.5, occupazione: 0.05 },
    ritardato: { dopoAnni: 5, effetto: { inflazione: -0.3, gradimento: 0.5 } },
    fonti: DA_VERIFICARE('IEA/NEA (costi e tempi di costruzione), ENEA, MASE'),
    verificato: false,
  },
  {
    code: 'dx-energia-gas-nazionale',
    side: 'destra',
    topic: 'energia',
    titolo: 'Più estrazione di gas nazionale',
    descrizione: 'Nuove concessioni nell\'Adriatico e in Sicilia per ridurre le importazioni.',
    immediato: { inflazione: -0.1, debito: -0.05, gradimento: -0.25 },
    fonti: DA_VERIFICARE('MASE (riserve), ARERA, Nomisma Energia'),
    verificato: false,
  },
];

export function proposalsFor(side: Side, topic: Topic): Proposal[] {
  return CATALOG.filter((p) => p.side === side && p.topic === topic);
}

export function getProposal(code: string): Proposal {
  const p = CATALOG.find((x) => x.code === code);
  if (!p) throw new Error(`Proposta sconosciuta: ${code}`);
  return p;
}

/** R5: un tema per anno, a rotazione, a partire dal 2026. */
export function topicForYear(anno: number): Topic {
  const i = (((anno - 2026) % TOPICS.length) + TOPICS.length) % TOPICS.length;
  return TOPICS[i];
}

/** R7: blocca la produzione se ci sono parametri senza fonte verificata. */
export function assertCatalogVerified(catalog: Proposal[] = CATALOG): void {
  const mancanti = catalog.filter((p) => !p.verificato).map((p) => p.code);
  if (mancanti.length) {
    throw new Error(`Proposte senza fonti verificate (${mancanti.length}): ${mancanti.join(', ')}`);
  }
}
