import type { Proposal, Side, Topic, Fonte } from './types';

// Parametri derivati dalla ricerca "Due Italie: parametri basati su evidenze" (novembre 2026),
// riportata in docs/ricerca-parametri.md. Valori centrali degli intervalli, dose di riferimento
// circa 0,5% del PIL l'anno. `verificato` resta false finché una persona non ricontrolla
// parametri e fonti: con STRICT_SOURCES=true l'app rifiuta di avviare sessioni.
//
// Neutralità: stesso numero di proposte per parte e per tema, stessi campi (pro, contro,
// confidenza, fonti) per tutte. Le ampiezze NON sono forzate a essere uguali: seguono le evidenze.

const F = {
  upb2025: { etichetta: 'UPB, Rapporto sulla politica di bilancio 2025', url: 'https://www.upbilancio.it/wp-content/uploads/2025/06/UPB-Rapporto-sulla-politica-di-bilancio-2025.pdf' },
  garciaLopez: { etichetta: 'Garcia-López et al., Journal of Urban Economics 2020 (Airbnb Barcellona)', url: 'https://ieb.ub.edu/wp-content/uploads/2019/07/2019-IEB-WorkingPaper-05-1.pdf' },
  eroStraniero: { etichetta: 'Ero Straniero, monitoraggio sanatoria 2020', url: 'https://erostraniero.it/sanatoria-senza-fine/' },
  pinotti: { etichetta: 'Pinotti, American Economic Review 2017 (regolarizzazione e criminalità)' },
  flussi: { etichetta: 'ActionAid / Ero Straniero, dati decreto flussi', url: 'https://www.actionaid.it/press-area/decreto-flussi-dati/' },
  rimpatri: { etichetta: 'ActionAid–Università di Bari, "Trattenuti" 2026', url: 'https://www.osservatoriodiritti.it/2026/11/11/centri-di-permanenza-per-i-rimpatri/' },
  zucman: { etichetta: 'Garbinti, Goupille-Lebret, Muñoz, Stantcheva, Zucman 2024', url: 'https://gabriel-zucman.eu/files/GGMSZ2024.pdf' },
  agrawal: { etichetta: 'Agrawal, Foremny, Martínez-Toledano (imposta patrimoniale in Spagna)' },
  mefEvasione: { etichetta: 'MEF, Relazione sull\'evasione fiscale e contributiva 2026', url: 'https://www.mef.gov.it/export/sites/MEF/inevidenza/2026/article_00390/Relazione-evasione-fiscale-e-contributiva-2026_09_30.pdf' },
  mefSpeseFiscali: { etichetta: 'MEF, Rapporto annuale sulle spese fiscali; UPB, audizioni sul regime forfettario' },
  clo: { etichetta: 'Clò, Cataldi, Zoppoli, Energy Policy 2015 (merit order in Italia)', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0301421514006661' },
  arera: { etichetta: 'ARERA, Relazione annuale 2025', url: 'https://www.arera.it/fileadmin/allegati/com_stampa/26/Comunicato_stampa_ARERA__I_numeri_della_Relazione_Annuale_2025.pdf' },
  courComptes: { etichetta: 'Cour des comptes, gennaio 2025 (EPR Flamanville)', url: 'https://reporterre.net/L-EPR-n-est-pas-rentable-tranche-la-Cour-des-comptes' },
  unmig: { etichetta: 'MASE-UNMIG, riserve e produzione nazionale di gas 2025' },
  dustmann: { etichetta: 'Dustmann et al., Quarterly Journal of Economics 2022; ISTAT, audizione 11/07/2023' },
  quota100: { etichetta: 'Corte dei conti; Dachille, Di Porto, Paiella (sostituzione pensionati Quota 100)' },
  ipotesi: { etichetta: 'Ipotesi di calibrazione: nessuna stima italiana robusta (vedi docs/ricerca-parametri.md)' },
} satisfies Record<string, Fonte>;

export const TOPICS: readonly Topic[] = ['casa', 'immigrazione', 'tasse', 'energia', 'lavoro'] as const;

export const TOPIC_LABEL: Record<Topic, string> = {
  casa: 'Case',
  immigrazione: 'Immigrazione',
  tasse: 'Tasse',
  energia: 'Prezzo della luce',
  lavoro: 'Lavoro, pensioni e sostegni',
};

export const CATALOG: Proposal[] = [
  // ───────────── CASA ─────────────
  {
    code: 'sx-casa-edilizia-pubblica', side: 'sinistra', topic: 'casa',
    titolo: 'Piano di edilizia pubblica',
    descrizione: 'Lo Stato finanzia nuovi alloggi popolari e il recupero di quelli sfitti.',
    pro: 'Più case a canone basso, cantieri attivi.',
    contro: 'Costo a debito ogni anno, tempi lunghi per le nuove costruzioni.',
    effetti: [
      { indicatore: 'occupazione', valore: 0.1, ritardo: 12, rampa: 12 },
      { indicatore: 'debito', tipo: 'flusso', valore: 0.4, ritardo: 0 },
    ],
    consenso: 2, liberismo: -1, confidenza: 'bassa', fonti: [F.ipotesi], verificato: false,
  },
  {
    code: 'sx-casa-limite-affitti-brevi', side: 'sinistra', topic: 'casa',
    titolo: 'Limiti agli affitti brevi nelle città',
    descrizione: 'Tetto ai giorni di affitto turistico per riportare case sul mercato dei residenti.',
    pro: 'Affitti più bassi nei quartieri più turistici (-2/-7% a livello locale).',
    contro: 'Effetto nazionale piccolo, meno reddito per proprietari e turismo locale, controlli costosi.',
    effetti: [
      { indicatore: 'inflazione', valore: -0.02, ritardo: 6, rampa: 12 },
      { indicatore: 'occupazione', valore: -0.01, ritardo: 6, rampa: 6 },
    ],
    consenso: 0, liberismo: -1, confidenza: 'media', fonti: [F.garciaLopez], verificato: false,
  },
  {
    code: 'dx-casa-sgravi-costruzione', side: 'destra', topic: 'casa',
    titolo: 'Sgravi a chi costruisce e ristruttura',
    descrizione: 'Incentivi fiscali (aliquote 50-65%) e semplificazioni per aumentare l\'offerta di case.',
    pro: 'Edilizia attivata in pochi mesi, efficientamento energetico.',
    contro: 'Costo che pesa sul debito per anni (lezione Superbonus), effetto negativo quando finisce.',
    effetti: [
      { indicatore: 'occupazione', valore: 0.2, ritardo: 3, rampa: 6, durata: 24, rientro: 12 },
      { indicatore: 'inflazione', valore: 0.05, ritardo: 3, rampa: 6, durata: 24, rientro: 6 },
      { indicatore: 'debito', tipo: 'flusso', valore: 0.375, ritardo: 0 },
    ],
    consenso: 2, liberismo: 0.5, confidenza: 'media', fonti: [F.upb2025], verificato: false,
  },
  {
    code: 'dx-casa-tutela-proprietari', side: 'destra', topic: 'casa',
    titolo: 'Sfratti più rapidi e cedolare secca estesa',
    descrizione: 'Più garanzie ai proprietari per spingerli ad affittare le case vuote.',
    pro: 'Meno rischio per chi affitta, possibile aumento delle case in affitto.',
    contro: 'Meno gettito, effetto sugli sfitti non dimostrato, più rischio per gli inquilini in difficoltà.',
    effetti: [
      { indicatore: 'inflazione', valore: -0.01, ritardo: 12, rampa: 24 },
      { indicatore: 'debito', tipo: 'flusso', valore: 0.075, ritardo: 0 },
    ],
    consenso: 0, liberismo: 1, confidenza: 'bassa', fonti: [F.upb2025, F.ipotesi], verificato: false,
  },

  // ───────────── IMMIGRAZIONE ─────────────
  {
    code: 'sx-imm-regolarizzazione', side: 'sinistra', topic: 'immigrazione',
    titolo: 'Regolarizzazione e corsi di lingua',
    descrizione: 'Permesso a chi lavora già in nero, con percorsi di lingua e formazione.',
    pro: 'Emersione di lavoro e contributi, più tutele.',
    contro: 'Pratiche lente (60% di permessi in 5 anni nel 2020), consenso polarizzato.',
    effetti: [
      { indicatore: 'occupazione', valore: 0.275, ritardo: 6, rampa: 36 },
      { indicatore: 'debito', tipo: 'flusso', valore: -0.075, ritardo: 6, rampa: 12 },
    ],
    consenso: 0, liberismo: -0.5, confidenza: 'media', fonti: [F.eroStraniero, F.pinotti], verificato: false,
  },
  {
    code: 'sx-imm-accoglienza-diffusa', side: 'sinistra', topic: 'immigrazione',
    titolo: 'Più ingressi legali e accoglienza diffusa',
    descrizione: 'Più quote d\'ingresso e piccoli centri di accoglienza (SAI) nei comuni.',
    pro: 'Più lavoratori nei settori in carenza (agricoltura, cura, turismo).',
    contro: 'Costo iniziale di accoglienza, effetti occupazionali non valutati in Italia.',
    effetti: [
      { indicatore: 'occupazione', valore: 0.15, ritardo: 12, rampa: 12 },
      { indicatore: 'inflazione', valore: -0.05, ritardo: 12, rampa: 12 },
      { indicatore: 'debito', tipo: 'flusso', valore: 0.05, ritardo: 0, durata: 24 },
    ],
    consenso: 0, liberismo: -1, confidenza: 'bassa', fonti: [F.ipotesi], verificato: false,
  },
  {
    code: 'dx-imm-stretta-rimpatri', side: 'destra', topic: 'immigrazione',
    titolo: 'Stretta sugli ingressi e più rimpatri',
    descrizione: 'Controlli più severi e accordi con i paesi d\'origine per i rimpatri.',
    pro: 'Risponde alla domanda di controllo dei confini, effetto di deterrenza.',
    contro: 'Rimpatri eseguiti 22 su 100, costo alto per rimpatrio, meno manodopera in agricoltura e cura.',
    effetti: [
      { indicatore: 'occupazione', valore: -0.025, ritardo: 3, rampa: 6 },
      { indicatore: 'inflazione', valore: 0.025, ritardo: 3, rampa: 6 },
      { indicatore: 'debito', tipo: 'flusso', valore: 0.02, ritardo: 0 },
    ],
    consenso: 2, liberismo: 0, confidenza: 'media', fonti: [F.rimpatri], verificato: false,
  },
  {
    code: 'dx-imm-quote-contratto', side: 'destra', topic: 'immigrazione',
    titolo: 'Ingressi solo con contratto di lavoro',
    descrizione: 'Quote per settore: entra chi ha già un\'offerta di lavoro firmata.',
    pro: 'Ingressi legati al fabbisogno delle imprese.',
    contro: 'Bassa resa: solo l\'8-24% delle quote diventa lavoro regolare.',
    effetti: [
      { indicatore: 'occupazione', valore: 0.06, ritardo: 9, rampa: 9 },
    ],
    consenso: 1, liberismo: 0.5, confidenza: 'media', fonti: [F.flussi], verificato: false,
  },

  // ───────────── TASSE ─────────────
  {
    code: 'sx-tasse-patrimoniale', side: 'sinistra', topic: 'tasse',
    titolo: 'Tassa sui grandi patrimoni, meno IRPEF ai redditi bassi',
    descrizione: 'Prelievo sui patrimoni più alti; il gettito riduce le tasse sul lavoro dei redditi bassi.',
    pro: 'Più progressività, più reddito ai redditi bassi.',
    contro: 'Gettito incerto (0,1-0,4% del PIL), possibile fuga dei patrimoni: letteratura divisa.',
    effetti: [
      { indicatore: 'occupazione', valore: 0.025, ritardo: 12, rampa: 12 },
      { indicatore: 'inflazione', valore: 0.025, ritardo: 12, rampa: 12 },
      { indicatore: 'debito', tipo: 'flusso', valore: 0.05, ritardo: 12 },
    ],
    consenso: 2, liberismo: -1, confidenza: 'media', fonti: [F.zucman, F.agrawal], verificato: false,
  },
  {
    code: 'sx-tasse-tracciabilita', side: 'sinistra', topic: 'tasse',
    titolo: 'Lotta all\'evasione con pagamenti tracciati',
    descrizione: 'Più controlli incrociati e obbligo di pagamenti elettronici.',
    pro: 'Recupero di gettito senza alzare le aliquote (evidenza solida).',
    contro: 'Costi di adempimento, calo dell\'attività nel sommerso, resistenze sul contante.',
    effetti: [
      { indicatore: 'occupazione', valore: -0.025, ritardo: 12, rampa: 12 },
      { indicatore: 'inflazione', valore: 0.025, ritardo: 12, rampa: 12 },
      { indicatore: 'debito', tipo: 'flusso', valore: -0.2, ritardo: 12, rampa: 12 },
    ],
    consenso: 0, liberismo: -0.5, confidenza: 'alta', fonti: [F.mefEvasione], verificato: false,
  },
  {
    code: 'dx-tasse-flat-tax', side: 'destra', topic: 'tasse',
    titolo: 'Flat tax incrementale e forfettario esteso',
    descrizione: 'Aliquota agevolata sui redditi in più e soglia del forfettario più alta.',
    pro: 'Meno tasse e più semplicità per gli autonomi, incentivo a dichiarare il reddito in più.',
    contro: 'Costo per l\'erario, disparità con i dipendenti a parità di reddito.',
    effetti: [
      { indicatore: 'occupazione', valore: 0.025, ritardo: 12, rampa: 12 },
      { indicatore: 'debito', tipo: 'flusso', valore: 0.2, ritardo: 12 },
    ],
    consenso: 2, liberismo: 1, confidenza: 'media', fonti: [F.mefSpeseFiscali], verificato: false,
  },
  {
    code: 'dx-tasse-cuneo-tagli-spesa', side: 'destra', topic: 'tasse',
    titolo: 'Taglio del cuneo fiscale coperto da tagli di spesa',
    descrizione: 'Più soldi in busta paga, finanziati riducendo la spesa pubblica.',
    pro: 'Più reddito netto per i dipendenti, costo del lavoro più basso.',
    contro: 'Tagli ai servizi; nel breve periodo effetto netto vicino a zero (moltiplicatori contestati).',
    effetti: [
      { indicatore: 'occupazione', valore: -0.025, ritardo: 1, rampa: 3, durata: 12, rientro: 6 },
      { indicatore: 'occupazione', valore: 0.05, ritardo: 12, rampa: 24 },
      { indicatore: 'inflazione', valore: -0.025, ritardo: 1, rampa: 3 },
    ],
    consenso: 1, liberismo: 1, confidenza: 'media', fonti: [F.upb2025], verificato: false,
  },

  // ───────────── ENERGIA ─────────────
  {
    code: 'sx-energia-rinnovabili', side: 'sinistra', topic: 'energia',
    titolo: 'Rinnovabili, reti e comunità energetiche',
    descrizione: 'Investimenti pubblici in solare, eolico, reti e accumuli.',
    pro: 'Prezzo all\'ingrosso più basso e meno esposizione agli shock del gas.',
    contro: 'Costo a debito, reti e accumuli richiedono 3-7 anni.',
    effetti: [
      { indicatore: 'occupazione', valore: 0.075, ritardo: 12, rampa: 12 },
      { indicatore: 'inflazione', valore: -0.25, ritardo: 18, rampa: 24 },
      { indicatore: 'debito', tipo: 'flusso', valore: 0.4, ritardo: 0 },
    ],
    riduceEsposizioneGas: { valore: 0.3, ritardo: 12, rampa: 24 },
    consenso: 2, liberismo: -1, confidenza: 'media', fonti: [F.clo], verificato: false,
  },
  {
    code: 'sx-energia-bonus-bollette', side: 'sinistra', topic: 'energia',
    titolo: 'Bonus bollette per le famiglie a basso reddito',
    descrizione: 'Sconto automatico in bolletta per le famiglie sotto una soglia ISEE.',
    pro: 'Rapido e mirato: protegge subito il potere d\'acquisto.',
    contro: 'Non abbassa il prezzo dell\'energia, il costo cresce con lo shock.',
    effetti: [
      { indicatore: 'inflazione', valore: -0.05, ritardo: 1, rampa: 2 },
      { indicatore: 'debito', tipo: 'flusso', valore: 0.04, ritardo: 0 },
    ],
    consenso: 2, liberismo: -1, confidenza: 'alta', fonti: [F.arera], verificato: false,
  },
  {
    code: 'dx-energia-nucleare', side: 'destra', topic: 'energia',
    titolo: 'Ritorno al nucleare',
    descrizione: 'Nuove centrali di nuova generazione (reattori modulari).',
    pro: 'Elettricità programmabile a basse emissioni nel lungo periodo.',
    contro: 'Nessun effetto sul prezzo per almeno 10 anni; costi e tempi storicamente sottostimati.',
    effetti: [
      { indicatore: 'debito', tipo: 'flusso', valore: 0.2, ritardo: 0 },
    ],
    riduceEsposizioneGas: { valore: 0.3, ritardo: 120, rampa: 60 },
    consenso: 0, liberismo: 0, confidenza: 'alta', fonti: [F.courComptes], verificato: false,
  },
  {
    code: 'dx-energia-gas-nazionale', side: 'destra', topic: 'energia',
    titolo: 'Più estrazione di gas nazionale',
    descrizione: 'Nuove concessioni per ridurre le importazioni.',
    pro: 'Più sicurezza degli approvvigionamenti e royalties.',
    contro: 'Il prezzo lo fa il mercato europeo (TTF): effetto sulle bollette quasi nullo; 2-5 anni per produrre.',
    effetti: [
      { indicatore: 'occupazione', valore: 0.005, ritardo: 36, rampa: 12 },
      { indicatore: 'inflazione', valore: -0.01, ritardo: 36, rampa: 12 },
      { indicatore: 'debito', tipo: 'flusso', valore: -0.01, ritardo: 36 },
    ],
    consenso: 0, liberismo: 0.5, confidenza: 'alta', fonti: [F.unmig], verificato: false,
  },

  // ───────────── LAVORO, PENSIONI E SOSTEGNI ─────────────
  {
    code: 'sx-lavoro-salario-minimo', side: 'sinistra', topic: 'lavoro',
    titolo: 'Salario minimo legale a 9 € l\'ora',
    descrizione: 'Soglia minima per legge, valida anche dove i contratti collettivi pagano meno.',
    pro: 'Paghe più alte per circa 3 milioni di lavoratori.',
    contro: 'Prezzi un po\' più alti, rischio di lavoro nero dove i salari sono più bassi.',
    effetti: [
      { indicatore: 'occupazione', valore: -0.025, ritardo: 6, rampa: 6 },
      { indicatore: 'inflazione', valore: 0.1, ritardo: 6, rampa: 6, durata: 12, rientro: 6 },
    ],
    consenso: 2, liberismo: -1, confidenza: 'media', fonti: [F.dustmann], verificato: false,
  },
  {
    code: 'dx-lavoro-detassazione-straordinari', side: 'destra', topic: 'lavoro',
    titolo: 'Detassazione di straordinari, premi e tredicesime',
    descrizione: 'Tassa ridotta sulle ore e sui premi in più dei dipendenti.',
    pro: 'Più reddito netto per chi lavora di più.',
    contro: 'Costo per l\'erario, rischio di riclassificare le retribuzioni per pagare meno.',
    effetti: [
      { indicatore: 'occupazione', valore: 0.025, ritardo: 1, rampa: 3 },
      { indicatore: 'debito', tipo: 'flusso', valore: 0.15, ritardo: 0 },
    ],
    consenso: 2, liberismo: 1, confidenza: 'bassa', fonti: [F.ipotesi], verificato: false,
  },

  {
    code: 'sx-lavoro-reddito-minimo', side: 'sinistra', topic: 'lavoro',
    titolo: 'Reddito minimo universale',
    descrizione: 'Sostegno a tutte le famiglie povere, simile al Reddito di cittadinanza.',
    pro: 'Meno povertà.',
    contro: 'Costo permanente, possibili disincentivi al lavoro (stime contestate).',
    effetti: [
      { indicatore: 'occupazione', valore: -0.025, ritardo: 3, rampa: 6 },
      { indicatore: 'inflazione', valore: 0.025, ritardo: 3, rampa: 6 },
      { indicatore: 'debito', tipo: 'flusso', valore: 0.25, ritardo: 3 },
    ],
    consenso: 0, liberismo: -1, confidenza: 'media', fonti: [F.ipotesi], verificato: false,
  },
  {
    code: 'dx-lavoro-quota-41', side: 'destra', topic: 'lavoro',
    titolo: 'Pensione anticipata con 41 anni di contributi',
    descrizione: 'Si può andare in pensione dopo 41 anni di lavoro, a qualunque età.',
    pro: 'Uscita anticipata per chi ha iniziato a lavorare presto.',
    contro: 'Meno occupati (circa 0,4-0,6 assunti per ogni pensionato), costo crescente per l\'INPS.',
    effetti: [
      { indicatore: 'occupazione', valore: -0.15, ritardo: 3, rampa: 6 },
      { indicatore: 'debito', tipo: 'flusso', valore: 0.15, ritardo: 3 },
    ],
    consenso: 2, liberismo: -0.5, confidenza: 'media', fonti: [F.quota100], verificato: false,
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

/** Controlla che il giocatore abbia scelto una legge per tema, tutte della sua Italia. */
export function validaLeggi(side: Side, codes: string[]): void {
  if (codes.length !== TOPICS.length) throw new Error(`Serve una legge per ognuno dei ${TOPICS.length} temi`);
  const temi = new Set<Topic>();
  for (const c of codes) {
    const p = getProposal(c);
    if (p.side !== side) throw new Error(`${c} non è una proposta dell'Italia di ${side}`);
    if (temi.has(p.topic)) throw new Error(`Due leggi sullo stesso tema: ${p.topic}`);
    temi.add(p.topic);
  }
}

/** R7: blocca la produzione se ci sono parametri non ricontrollati da una persona. */
export function assertCatalogVerified(catalog: Proposal[] = CATALOG): void {
  const mancanti = catalog.filter((p) => !p.verificato).map((p) => p.code);
  if (mancanti.length) {
    throw new Error(`Proposte non ancora verificate (${mancanti.length}): ${mancanti.join(', ')}`);
  }
}
