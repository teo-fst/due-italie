// Intervista di registrazione: 30 domande, poste una sola volta.
// Tutte le domande su dati delicati (genere, orientamento sessuale, opinioni politiche, reddito)
// hanno l'opzione "Preferisco non rispondere" e non bloccano la registrazione.
// L'unica risposta che blocca è la minore età, ricavata dal codice fiscale (che poi si dimentica).

export type Asse = 'sinistraDestra' | 'liberismo' | 'federalismo';
export const PNR = 'pnr';
export const OPZIONE_PNR = { valore: PNR, testo: 'Preferisco non rispondere' } as const;

export interface Opzione { valore: string; testo: string }

export type Domanda =
  | { id: string; sezione: Sezione; tipo: 'anno-da-cf'; testo: string; obbligatoria: true }
  | { id: string; sezione: Sezione; tipo: 'scelta'; testo: string; opzioni: Opzione[]; delicata?: boolean; obbligatoria?: boolean }
  | { id: string; sezione: Sezione; tipo: 'scala'; testo: string; min: number; max: number; etichette: [string, string]; asse?: Asse; verso?: 1 | -1; delicata?: boolean }
  | { id: string; sezione: Sezione; tipo: 'likert'; testo: string; asse: Asse; verso: 1 | -1; delicata: true };

export type Sezione = 'chi-sei' | 'lavoro-economia' | 'politica';

export const SEZIONI: Record<Sezione, string> = {
  'chi-sei': 'Chi sei',
  'lavoro-economia': 'Lavoro ed economia',
  politica: 'Opinioni politiche',
};

/** Scala d'accordo usata dalle domande likert (1-5). */
export const LIKERT: Opzione[] = [
  { valore: '1', testo: 'Per niente d\'accordo' },
  { valore: '2', testo: 'Poco d\'accordo' },
  { valore: '3', testo: 'Né d\'accordo né in disaccordo' },
  { valore: '4', testo: 'Abbastanza d\'accordo' },
  { valore: '5', testo: 'Molto d\'accordo' },
];

const L = (id: string, testo: string, asse: Asse, verso: 1 | -1): Domanda =>
  ({ id, sezione: 'politica', tipo: 'likert', testo, asse, verso, delicata: true });

// verso: +1 = essere d'accordo sposta verso destra / liberismo / federalismo; -1 = il contrario.
// Le affermazioni sono bilanciate (metà in un verso, metà nell'altro) per ridurre la tendenza a dire sempre sì.
export const DOMANDE: Domanda[] = [
  // ── Chi sei (4) ──
  {
    // Il codice fiscale si legge solo nel browser (lib/intervista/codice-fiscale.ts):
    // al server arriva e si salva solo l'anno di nascita.
    id: 'anno', sezione: 'chi-sei', tipo: 'anno-da-cf', obbligatoria: true,
    testo: 'Il tuo codice fiscale (serve solo a ricavare l\'anno di nascita: non lo salviamo e non lo inviamo)',
  },
  {
    id: 'genere', sezione: 'chi-sei', tipo: 'scelta', testo: 'Come descrivi il tuo genere?', delicata: true,
    opzioni: [
      { valore: 'donna', testo: 'Donna' }, { valore: 'uomo', testo: 'Uomo' }, { valore: 'non-binario', testo: 'Non binario' },
      { valore: 'altro', testo: 'In un altro modo' }, OPZIONE_PNR,
    ],
  },
  {
    id: 'orientamento', sezione: 'chi-sei', tipo: 'scelta', testo: 'Come descrivi il tuo orientamento sessuale?', delicata: true,
    opzioni: [
      { valore: 'eterosessuale', testo: 'Eterosessuale' }, { valore: 'gay-lesbica', testo: 'Gay o lesbica' },
      { valore: 'bisessuale', testo: 'Bisessuale' }, { valore: 'altro', testo: 'In un altro modo' }, OPZIONE_PNR,
    ],
  },
  {
    id: 'area', sezione: 'chi-sei', tipo: 'scelta', testo: 'In quale zona vivi?',
    opzioni: [
      { valore: 'nord-ovest', testo: 'Nord-ovest' }, { valore: 'nord-est', testo: 'Nord-est' }, { valore: 'centro', testo: 'Centro' },
      { valore: 'sud', testo: 'Sud' }, { valore: 'isole', testo: 'Isole' }, { valore: 'estero', testo: 'All\'estero' }, OPZIONE_PNR,
    ],
  },

  // ── Lavoro ed economia (8) ──
  {
    id: 'condizione', sezione: 'lavoro-economia', tipo: 'scelta', testo: 'Qual è la tua condizione principale?',
    opzioni: [
      { valore: 'dip-pubblico', testo: 'Dipendente pubblico' }, { valore: 'dip-privato', testo: 'Dipendente privato' },
      { valore: 'autonomo', testo: 'Autonomo / partita IVA' }, { valore: 'imprenditore', testo: 'Imprenditore' },
      { valore: 'disoccupato', testo: 'In cerca di lavoro' }, { valore: 'studente', testo: 'Studente' },
      { valore: 'pensionato', testo: 'Pensionato' }, { valore: 'casa', testo: 'Lavoro di cura in famiglia' },
      { valore: 'altro', testo: 'Altro' }, OPZIONE_PNR,
    ],
  },
  {
    id: 'settore', sezione: 'lavoro-economia', tipo: 'scelta', testo: 'In quale settore lavori (o hai lavorato)?',
    opzioni: [
      { valore: 'agricoltura', testo: 'Agricoltura' }, { valore: 'industria', testo: 'Industria' }, { valore: 'edilizia', testo: 'Edilizia' },
      { valore: 'commercio-turismo', testo: 'Commercio e turismo' }, { valore: 'servizi', testo: 'Altri servizi privati' },
      { valore: 'pa', testo: 'Pubblica amministrazione, scuola, sanità' }, { valore: 'mai', testo: 'Non ho mai lavorato' }, OPZIONE_PNR,
    ],
  },
  {
    id: 'studio', sezione: 'lavoro-economia', tipo: 'scelta', testo: 'Titolo di studio più alto',
    opzioni: [
      { valore: 'medie', testo: 'Licenza media o meno' }, { valore: 'diploma', testo: 'Diploma' },
      { valore: 'laurea', testo: 'Laurea' }, { valore: 'post-laurea', testo: 'Master o dottorato' }, OPZIONE_PNR,
    ],
  },
  {
    id: 'reddito', sezione: 'lavoro-economia', tipo: 'scelta', testo: 'Reddito netto mensile della tua famiglia', delicata: true,
    opzioni: [
      { valore: 'r1', testo: 'Meno di 1.500 €' }, { valore: 'r2', testo: '1.500 – 2.500 €' }, { valore: 'r3', testo: '2.500 – 4.000 €' },
      { valore: 'r4', testo: 'Più di 4.000 €' }, OPZIONE_PNR,
    ],
  },
  {
    id: 'casa', sezione: 'lavoro-economia', tipo: 'scelta', testo: 'La casa in cui vivi è…',
    opzioni: [
      { valore: 'proprieta', testo: 'Di proprietà' }, { valore: 'affitto', testo: 'In affitto' },
      { valore: 'famiglia', testo: 'Della mia famiglia d\'origine' }, { valore: 'altro', testo: 'Altro' }, OPZIONE_PNR,
    ],
  },
  {
    id: 'fine-mese', sezione: 'lavoro-economia', tipo: 'scala', testo: 'Quanto è facile arrivare a fine mese?',
    min: 1, max: 4, etichette: ['Molto difficile', 'Molto facile'],
  },
  {
    id: 'andamento', sezione: 'lavoro-economia', tipo: 'scelta', testo: 'Negli ultimi 12 mesi la tua situazione economica è…',
    opzioni: [
      { valore: 'migliorata', testo: 'Migliorata' }, { valore: 'uguale', testo: 'Rimasta uguale' }, { valore: 'peggiorata', testo: 'Peggiorata' }, OPZIONE_PNR,
    ],
  },
  {
    id: 'priorita', sezione: 'lavoro-economia', tipo: 'scelta', testo: 'Per il Paese, la cosa più importante è…',
    opzioni: [
      { valore: 'occupazione', testo: 'Più lavoro' }, { valore: 'inflazione', testo: 'Prezzi stabili' },
      { valore: 'debito', testo: 'Conti pubblici in ordine' }, { valore: 'gradimento', testo: 'Una società serena e unita' }, OPZIONE_PNR,
    ],
  },

  // ── Opinioni politiche (18) ──
  {
    id: 'autocollocazione', sezione: 'politica', tipo: 'scala', delicata: true,
    testo: 'Dove ti collochi politicamente?', min: 0, max: 10, etichette: ['Sinistra', 'Destra'],
    asse: 'sinistraDestra', verso: 1,
  },
  // sinistra ↔ destra
  L('sd-redistribuzione', 'Lo Stato deve ridurre le differenze di reddito tra ricchi e poveri.', 'sinistraDestra', -1),
  L('sd-immigrazione', 'L\'immigrazione è più un\'opportunità che un problema per l\'Italia.', 'sinistraDestra', -1),
  L('sd-pene', 'Servono pene più severe per ridurre la criminalità.', 'sinistraDestra', 1),
  L('sd-famiglia', 'La famiglia tradizionale va tutelata più delle altre forme di famiglia.', 'sinistraDestra', 1),
  L('sd-diritti', 'I diritti civili, come il matrimonio tra persone dello stesso sesso, vanno estesi.', 'sinistraDestra', -1),
  // statalismo ↔ liberismo
  L('lib-tasse-imprese', 'Le tasse sulle imprese vanno abbassate, anche a costo di meno servizi pubblici.', 'liberismo', 1),
  L('lib-sanita-pubblica', 'Sanità e scuola devono restare soprattutto pubbliche.', 'liberismo', -1),
  L('lib-mercato', 'L\'economia funziona meglio quando lo Stato interviene poco.', 'liberismo', 1),
  L('lib-aziende-strategiche', 'Lo Stato deve possedere le aziende strategiche, come energia e trasporti.', 'liberismo', -1),
  L('lib-salario-minimo', 'Un salario minimo fissato per legge è giusto.', 'liberismo', -1),
  L('lib-flat-tax', 'Meglio un fisco semplice con un\'aliquota unica, anche se meno progressivo.', 'liberismo', 1),
  // centralismo ↔ federalismo
  L('fed-poteri-regioni', 'Le regioni devono avere più poteri e trattenere più tasse sul loro territorio.', 'federalismo', 1),
  L('fed-regole-uguali', 'Sanità e scuola devono avere le stesse regole in tutta Italia.', 'federalismo', -1),
  L('fed-autonomia', 'L\'autonomia differenziata è una buona riforma.', 'federalismo', 1),
  L('fed-solidarieta', 'Le regioni più ricche devono contribuire di più per quelle più povere.', 'federalismo', -1),
  L('fed-comuni', 'I comuni devono poter decidere da soli su più materie.', 'federalismo', 1),
  // 18ª domanda politica, sull'Europa (non entra negli assi)
  {
    id: 'europa', sezione: 'politica', tipo: 'scala', testo: 'Quanto ti fidi dell\'Unione europea?', delicata: true,
    min: 1, max: 5, etichette: ['Per niente', 'Molto'],
  },
];

export type Risposte = Record<string, string>;
