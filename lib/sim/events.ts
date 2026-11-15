import type { Evento, Fonte } from './types';

// Imprevisti: frequenze storiche italiane (ultimi 20-30 anni) ed effetti dalla ricerca
// "Due Italie: parametri basati su evidenze" (docs/ricerca-parametri.md).
// p_mese = 1 - (1 - p_anno)^(1/n), con n = mesi in cui l'evento può accadere.
// le differenze tra partite nascono dal seme (quali imprevisti) e dalle leggi (interazioni).
// `impatto` (1 locale … 5 estremo) è la scala mostrata sul grafico della partita.

const F = {
  istatCovid: { etichetta: 'ISTAT: PIL 2020 -8,9%, occupati -456 mila, debito 155,6%', url: 'https://www.ansa.it/sito/notizie/economia/2021/03/12/istat-calo-occupati-senza-precedenti-nel-2020-456-mila_2f9e8250-8fd3-460c-8948-4804a021ecbe.html' },
  inflazione2022: { etichetta: 'ISTAT, prezzi al consumo (picco 11,8% nel 2022)', url: 'https://www.istat.it/wp-content/uploads/2026/10/CS_Prezzi-al-consumo_Prov_Ottobre2026.pdf' },
  spread: { etichetta: 'Spread a 575 pb il 9/11/2011; sensitività interessi Banca d\'Italia/UPB', url: 'https://www.milanofinanza.it/news/9-novembre-2011-dieci-anni-fa-il-gap-tra-btp-e-bund-si-allargo-a-575-2540216' },
  banche: { etichetta: 'Risoluzioni bancarie 2015-2017 (4 banche, banche venete, MPS)' },
  terremoti: { etichetta: 'Danni dei terremoti 2009-2016 (Protezione Civile, ReLUIS)', url: 'https://www.reluis.it/wp-content/uploads/2024/10/SAIE/10_ottobre/5_Di_Ludovico_SAIE.pdf' },
  alluvione: { etichetta: 'Banca d\'Italia, Temi di discussione 1506/2025 (alluvione Emilia-Romagna)', url: 'https://www.bancaditalia.it/pubblicazioni/temi-discussione/2025/2025-1506/index.html' },
  siccita: { etichetta: 'Stime associazioni agricole 2022 (2-6 mld): nessuna stima ISTAT', url: 'https://www.cremonaoggi.it/2022/07/24/siccita-tra-2-e-6-miliardi-il-conto-da-pagare-per-lagricoltura/' },
  dazi: { etichetta: 'UPB / Banca d\'Italia, effetti dei dazi USA 2025', url: 'https://www.milanofinanza.it/news/dazi-usa-upb-a-rischio-lo-0-3-del-pil-italia-e-68-mila-posti-di-lavoro-i-settori-piu-colpiti-202504171233495120' },
  bdi2026: { etichetta: 'Banca d\'Italia, proiezioni ottobre 2026 (scenario avverso)', url: 'https://www.bancaditalia.it/pubblicazioni/proiezioni-macroeconomiche/2026/Proiezioni-macroeconomiche-Italia-ottobre-2026.pdf' },
  morandi: { etichetta: 'Confindustria Genova: crollo del Ponte Morandi, 784 milioni l\'anno di PIL perso (Genova e Nord-ovest)', url: 'https://tg24.sky.it/economia/2018/11/28/genova-senza-ponte-morandi-pil-calo' },
  meyersson: { etichetta: 'Meyersson, "Political Man on Horseback" 2016: nelle democrazie −1/−1,3 punti di crescita l\'anno per un decennio', url: 'https://www.hhs.se/contentassets/5f04e6ceade84bf882ec6bf118022f7c/meyersson_coups_development.pdf' },
  fmiColpi: { etichetta: 'FMI, "Political Fragility: The Economic Impact of Coups d\'État" 2026: −2,3 punti di PIL nell\'anno, −5 in cinque anni', url: 'https://0-bookstore-imf-org.library.svsu.edu/books/political-fragility-the-economic-impact-of-coups-d-a-tat' },
  ipotesi: { etichetta: 'Ipotesi di calibrazione a confidenza bassa' },
} satisfies Record<string, Fonte>;

export const EVENTI: Evento[] = [
  {
    code: 'pandemia', impatto: 5, titolo: 'Pandemia', emoji: '🦠', positivo: false, pAnno: 0.015,
    effetti: [
      { indicatore: 'occupazione', valore: -2, ritardo: 0, rampa: 2, durata: 4, rientro: 18 },
      { indicatore: 'inflazione', valore: -0.25, ritardo: 0, rampa: 3, durata: 9, rientro: 3 },
      { indicatore: 'debito', valore: 18, ritardo: 0, rampa: 12 },
      { indicatore: 'gradimento', valore: 3, ritardo: 0, rampa: 1, durata: 2, rientro: 1 },
      { indicatore: 'gradimento', valore: -4, ritardo: 3, rampa: 3, durata: 6, rientro: 12 },
    ],
    esempio: '2020: PIL -8,9%, debito dal 134,3% al 155,6%', confidenza: 'alta', fonti: [F.istatCovid],
  },
  {
    code: 'crisi-energetica', impatto: 4, titolo: 'Crisi energetica (shock del gas)', emoji: '🔥', positivo: false, pAnno: 0.10,
    interazione: 'gas',
    effetti: [
      { indicatore: 'occupazione', valore: -0.35, ritardo: 3, rampa: 6, durata: 6, rientro: 12 },
      { indicatore: 'inflazione', valore: 5, ritardo: 0, rampa: 6, durata: 6, rientro: 12 },
      { indicatore: 'debito', valore: 1.2, ritardo: 0, rampa: 12 },
      { indicatore: 'gradimento', valore: -4, ritardo: 0, rampa: 3, durata: 6, rientro: 9 },
    ],
    esempio: '2022: inflazione fino all\'11,8%', confidenza: 'alta', fonti: [F.inflazione2022],
  },
  {
    code: 'spread', impatto: 4, titolo: 'Crisi dello spread', emoji: '📉', positivo: false, pAnno: 0.07,
    interazione: 'debito',
    effetti: [
      { indicatore: 'occupazione', valore: -1, ritardo: 3, rampa: 9, durata: 6, rientro: 12 },
      { indicatore: 'inflazione', valore: 0.5, ritardo: 3, rampa: 3, durata: 12, rientro: 3 },
      { indicatore: 'debito', valore: 2, ritardo: 0, rampa: 24 },
      { indicatore: 'gradimento', valore: -4, ritardo: 0, rampa: 2, durata: 6, rientro: 9 },
    ],
    esempio: '2011: spread a 575 punti base', confidenza: 'alta', fonti: [F.spread],
  },
  {
    code: 'crisi-bancaria', impatto: 3, titolo: 'Crisi bancaria', emoji: '🏦', positivo: false, pAnno: 0.05,
    interazione: 'debito',
    effetti: [
      { indicatore: 'occupazione', valore: -0.2, ritardo: 3, rampa: 6, durata: 6, rientro: 12 },
      { indicatore: 'debito', valore: 1, ritardo: 0, rampa: 6 },
      { indicatore: 'gradimento', valore: -2, ritardo: 0, rampa: 1, durata: 3, rientro: 6 },
    ],
    esempio: '2015-2017: risoluzione di quattro banche e banche venete', confidenza: 'media', fonti: [F.banche],
  },
  {
    code: 'terremoto', impatto: 3, titolo: 'Terremoto distruttivo', emoji: '🌍', positivo: false, pAnno: 0.12,
    effetti: [
      { indicatore: 'occupazione', valore: -0.05, ritardo: 0, rampa: 1, durata: 6, rientro: 6 },
      { indicatore: 'debito', tipo: 'flusso', valore: 0.3, ritardo: 1, durata: 60 },
      { indicatore: 'gradimento', valore: 1, ritardo: 0, rampa: 1, durata: 1, rientro: 2 },
      { indicatore: 'gradimento', valore: -1, ritardo: 12, rampa: 6, durata: 6, rientro: 6 },
    ],
    esempio: 'Centro Italia 2016: 23,5 miliardi di danni', confidenza: 'media', fonti: [F.terremoti],
  },
  {
    code: 'alluvione', impatto: 2, titolo: 'Alluvione grave', emoji: '🌊', positivo: false, pAnno: 0.4,
    mesi: [10, 11, 12, 1, 2, 3, 4, 5],
    effetti: [
      { indicatore: 'occupazione', valore: -0.02, ritardo: 0, rampa: 1, durata: 1, rientro: 1 },
      { indicatore: 'inflazione', valore: 0.03, ritardo: 0, rampa: 1, durata: 3, rientro: 1 },
      { indicatore: 'debito', valore: 0.25, ritardo: 0, rampa: 12 },
      { indicatore: 'gradimento', valore: -1, ritardo: 0, rampa: 1, durata: 3, rientro: 6 },
    ],
    esempio: 'Emilia-Romagna 2023: 8,5 miliardi di danni, effetto sull\'attività esaurito in un mese', confidenza: 'alta', fonti: [F.alluvione],
  },
  {
    code: 'siccita', impatto: 2, titolo: 'Siccità', emoji: '☀️', positivo: false, pAnno: 0.2,
    mesi: [5, 6, 7, 8, 9],
    effetti: [
      { indicatore: 'occupazione', valore: -0.02, ritardo: 0, rampa: 2, durata: 4, rientro: 2 },
      { indicatore: 'inflazione', valore: 0.2, ritardo: 0, rampa: 2, durata: 4, rientro: 6 },
      { indicatore: 'debito', valore: 0.05, ritardo: 0, rampa: 6 },
      { indicatore: 'gradimento', valore: -1, ritardo: 0, rampa: 2, durata: 4, rientro: 4 },
    ],
    esempio: '2022: danni agricoli stimati tra 2 e 6 miliardi', confidenza: 'bassa', fonti: [F.siccita],
  },
  {
    code: 'ondata-calore', impatto: 2, titolo: 'Ondata di calore e incendi', emoji: '🥵', positivo: false, pAnno: 0.7,
    mesi: [6, 7, 8],
    effetti: [
      { indicatore: 'inflazione', valore: 0.05, ritardo: 0, rampa: 1, durata: 2, rientro: 1 },
      { indicatore: 'gradimento', valore: -0.5, ritardo: 0, rampa: 1, durata: 1, rientro: 2 },
    ],
    esempio: 'Estati ricorrenti', confidenza: 'bassa', fonti: [F.ipotesi],
  },
  {
    code: 'ondata-migratoria', impatto: 2, titolo: 'Ondata migratoria', emoji: '⛵', positivo: false, pAnno: 0.22,
    effetti: [
      { indicatore: 'debito', valore: 0.035, ritardo: 0, rampa: 6 },
      { indicatore: 'gradimento', valore: -2, ritardo: 0, rampa: 1, durata: 3, rientro: 6 },
    ],
    esempio: 'Picchi del 2011, 2014-2016, 2023', confidenza: 'media', fonti: [F.ipotesi],
  },
  {
    code: 'crisi-geopolitica', impatto: 4, titolo: 'Guerra o crisi geopolitica', emoji: '⚔️', positivo: false, pAnno: 0.15,
    interazione: 'gas',
    effetti: [
      { indicatore: 'occupazione', valore: -0.2, ritardo: 3, rampa: 6, durata: 6, rientro: 12 },
      { indicatore: 'inflazione', valore: 1.2, ritardo: 0, rampa: 3, durata: 9, rientro: 9 },
      { indicatore: 'debito', valore: 0.35, ritardo: 0, rampa: 12 },
      { indicatore: 'gradimento', valore: -2, ritardo: 0, rampa: 1, durata: 6, rientro: 6 },
    ],
    esempio: 'Medio Oriente 2026: gas +18%, petrolio oltre 100 $', confidenza: 'media', fonti: [F.bdi2026],
  },
  {
    code: 'dazi', impatto: 3, titolo: 'Dazi e guerra commerciale', emoji: '🚢', positivo: false, pAnno: 0.15,
    effetti: [
      { indicatore: 'occupazione', valore: -0.2, ritardo: 3, rampa: 12, durata: 12, rientro: 12 },
      { indicatore: 'inflazione', valore: 0.1, ritardo: 3, rampa: 6, durata: 12, rientro: 6 },
      { indicatore: 'debito', valore: 0.2, ritardo: 6, rampa: 18 },
      { indicatore: 'gradimento', valore: -1, ritardo: 0, rampa: 2, durata: 6, rientro: 6 },
    ],
    esempio: 'Dazi USA 2025: fino a 68 mila posti a rischio', confidenza: 'media', fonti: [F.dazi],
  },
  {
    code: 'materie-prime', impatto: 3, titolo: 'Rincaro delle materie prime', emoji: '⛏️', positivo: false, pAnno: 0.15,
    effetti: [
      { indicatore: 'occupazione', valore: -0.1, ritardo: 3, rampa: 6, durata: 6, rientro: 6 },
      { indicatore: 'inflazione', valore: 1, ritardo: 0, rampa: 3, durata: 6, rientro: 9 },
      { indicatore: 'debito', valore: 0.1, ritardo: 0, rampa: 12 },
      { indicatore: 'gradimento', valore: -2, ritardo: 0, rampa: 2, durata: 4, rientro: 6 },
    ],
    esempio: 'Scenario avverso Banca d\'Italia 2026: inflazione +3 punti', confidenza: 'media', fonti: [F.bdi2026],
  },
  {
    code: 'calo-tassi', impatto: 3, titolo: 'La BCE taglia i tassi', emoji: '💶', positivo: true, pAnno: 0.2,
    interazione: 'debito',
    effetti: [
      { indicatore: 'occupazione', valore: 0.07, ritardo: 3, rampa: 6, durata: 12, rientro: 12 },
      { indicatore: 'inflazione', valore: -0.05, ritardo: 3, rampa: 6, durata: 12, rientro: 6 },
      { indicatore: 'debito', valore: -0.3, ritardo: 0, rampa: 24 },
      { indicatore: 'gradimento', valore: 1, ritardo: 0, rampa: 2, durata: 3, rientro: 6 },
    ],
    esempio: 'Ciclo di tagli 2024-2025', confidenza: 'media', fonti: [F.spread],
  },
  {
    code: 'record-turismo', impatto: 2, titolo: 'Anno record per il turismo', emoji: '🏖️', positivo: true, pAnno: 0.3,
    mesi: [6, 7, 8, 9],
    effetti: [
      { indicatore: 'occupazione', valore: 0.07, ritardo: 0, rampa: 1, durata: 3, rientro: 3 },
      { indicatore: 'inflazione', valore: 0.1, ritardo: 0, rampa: 2, durata: 4, rientro: 2 },
      { indicatore: 'debito', valore: -0.1, ritardo: 0, rampa: 6 },
      { indicatore: 'gradimento', valore: 1, ritardo: 0, rampa: 1, durata: 3, rientro: 3 },
    ],
    esempio: 'Presenze record 2023-2025', confidenza: 'media', fonti: [F.ipotesi],
  },
  {
    code: 'boom-export', impatto: 3, titolo: 'Boom dell\'export', emoji: '📦', positivo: true, pAnno: 0.15,
    effetti: [
      { indicatore: 'occupazione', valore: 0.15, ritardo: 3, rampa: 6, durata: 6, rientro: 6 },
      { indicatore: 'inflazione', valore: 0.05, ritardo: 3, rampa: 6, durata: 6, rientro: 6 },
      { indicatore: 'debito', valore: -0.2, ritardo: 0, rampa: 12 },
      { indicatore: 'gradimento', valore: 2, ritardo: 0, rampa: 3, durata: 6, rientro: 6 },
    ],
    esempio: '—', confidenza: 'bassa', fonti: [F.ipotesi],
  },
  {
    code: 'cyberattacco', impatto: 1, titolo: 'Cyberattacco ai servizi pubblici', emoji: '💻', positivo: false, pAnno: 0.15,
    effetti: [
      { indicatore: 'debito', valore: 0.01, ritardo: 0, rampa: 1 },
      { indicatore: 'gradimento', valore: -1, ritardo: 0, rampa: 1, durata: 1, rientro: 2 },
    ],
    esempio: 'Regione Lazio 2021: sistema vaccinale fermo', confidenza: 'bassa', fonti: [F.ipotesi],
  },
  {
    code: 'sciopero', impatto: 1, titolo: 'Sciopero prolungato', emoji: '✊', positivo: false, pAnno: 0.3,
    effetti: [
      { indicatore: 'inflazione', valore: 0.02, ritardo: 0, rampa: 1, durata: 1, rientro: 1 },
      { indicatore: 'gradimento', valore: -1, ritardo: 0, rampa: 1, durata: 1, rientro: 1 },
    ],
    esempio: 'Trasporti e sanità, ricorrente', confidenza: 'bassa', fonti: [F.ipotesi],
  },
];

// Due imprevisti agli estremi della scala d'impatto.
EVENTI.push(
  {
    code: 'crollo-ponte', impatto: 1, titolo: 'Crollo di un ponte', emoji: '🌉', positivo: false, pAnno: 0.1,
    effetti: [
      { indicatore: 'occupazione', valore: -0.01, ritardo: 0, rampa: 1, durata: 12, rientro: 6 },
      { indicatore: 'debito', valore: 0.05, ritardo: 0, rampa: 12 },
      { indicatore: 'gradimento', valore: -2, ritardo: 0, rampa: 1, durata: 2, rientro: 6 },
    ],
    esempio: 'Genova 2018: effetti economici concentrati nell\'area, meno di 1 miliardo l\'anno',
    confidenza: 'media', fonti: [F.morandi],
  },
  {
    code: 'colpo-di-stato', impatto: 5, titolo: 'Colpo di Stato', emoji: '🪖', positivo: false, pAnno: 0.003,
    interazione: 'debito',
    effetti: [
      { indicatore: 'occupazione', valore: -1.5, ritardo: 0, rampa: 12 },
      { indicatore: 'inflazione', valore: 1, ritardo: 0, rampa: 3, durata: 12, rientro: 6 },
      { indicatore: 'debito', valore: 4, ritardo: 0, rampa: 18 },
      { indicatore: 'gradimento', valore: -10, ritardo: 0, rampa: 1, durata: 6, rientro: 18 },
    ],
    esempio: 'Nessun caso riuscito nell\'Italia repubblicana (tentativo del 1970): stime da altri paesi',
    confidenza: 'bassa', fonti: [F.meyersson, F.fmiColpi],
  },
);

export function getEvento(code: string): Evento {
  const e = EVENTI.find((x) => x.code === code);
  if (!e) throw new Error(`Imprevisto sconosciuto: ${code}`);
  return e;
}

/** Probabilità che l'evento accada in un dato mese del calendario (1-12). */
export function probabilitaMese(e: Evento, meseCalendario: number): number {
  const mesiValidi = e.mesi ?? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  if (!mesiValidi.includes(meseCalendario)) return 0;
  return 1 - Math.pow(1 - e.pAnno, 1 / mesiValidi.length);
}
