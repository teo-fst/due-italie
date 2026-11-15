import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOMANDE, PNR, type Risposte } from './domande';
import { validaRisposte, calcolaProfilo, confrontaConGioco, Minorenne } from './profilo';
import { proposalsFor, TOPICS } from '../sim/catalog';
import { STATO_INIZIALE } from '../sim/engine';

/** Risposte complete: likert al valore dato (con il verso), il resto "preferisco non rispondere". */
function risposte(likert: (verso: number, asse: string) => string, extra: Risposte = {}): Risposte {
  const r: Risposte = {};
  for (const d of DOMANDE) {
    if (d.tipo === 'anno-da-cf') r[d.id] = '1985';
    else if (d.tipo === 'likert') r[d.id] = likert(d.verso, d.asse);
    else if (d.tipo === 'scelta') r[d.id] = d.opzioni.some((o) => o.valore === PNR) ? PNR : d.opzioni[1].valore;
    else r[d.id] = PNR;
  }
  return { ...r, ...extra };
}

test('sono esattamente 30 domande con id univoci', () => {
  assert.equal(DOMANDE.length, 30);
  assert.equal(new Set(DOMANDE.map((d) => d.id)).size, 30);
});

test('ogni domanda delicata permette di non rispondere', () => {
  for (const d of DOMANDE) {
    if (d.tipo === 'scelta' && d.delicata) assert.ok(d.opzioni.some((o) => o.valore === PNR), d.id);
  }
});

test('affermazioni bilanciate: per ogni asse ci sono versi in entrambe le direzioni', () => {
  for (const asse of ['sinistraDestra', 'liberismo', 'federalismo']) {
    const versi = DOMANDE.filter((d) => d.tipo === 'likert' && d.asse === asse).map((d) => (d as { verso: number }).verso);
    assert.ok(versi.includes(1) && versi.includes(-1), asse);
  }
});

test('i minorenni vengono fermati (anno ricavato dal codice fiscale)', () => {
  const oggi = new Date('2026-11-15');
  assert.throws(() => validaRisposte(risposte(() => '3', { anno: '2009' }), oggi), Minorenne);
  assert.doesNotThrow(() => validaRisposte(risposte(() => '3', { anno: '2008' }), oggi), 'il giorno esatto lo controlla il browser');
  assert.throws(() => validaRisposte(risposte(() => '3', { anno: '85' }), oggi));
});

test('l\'anno di nascita non si può saltare; le altre domande sì', () => {
  assert.throws(() => validaRisposte(risposte(() => '3', { anno: PNR })));
  assert.doesNotThrow(() => validaRisposte(risposte(() => PNR)));
});

test('risposte mancanti, fuori scala o sconosciute vengono rifiutate', () => {
  const r = risposte(() => '3');
  delete r.genere;
  assert.throws(() => validaRisposte(r));
  assert.throws(() => validaRisposte(risposte(() => '7')));
  assert.throws(() => validaRisposte({ ...risposte(() => '3'), extra: 'x' }));
});

test('profilo: tutto "molto d\'accordo" nel verso destra/mercato/regioni → +1 sugli assi', () => {
  const p = calcolaProfilo(risposte((verso) => (verso === 1 ? '5' : '1'), { autocollocazione: '10' }));
  assert.equal(p.sinistraDestra, 1);
  assert.equal(p.liberismo, 1);
  assert.equal(p.federalismo, 1);
});

test('profilo: chi non risponde alle domande politiche ha assi nulli', () => {
  const p = calcolaProfilo(risposte(() => PNR));
  assert.deepEqual(p, { sinistraDestra: null, liberismo: null, federalismo: null, priorita: null });
});

test('confronto: profilo di sinistra che gioca nell\'Italia di sinistra è coerente', () => {
  const p = calcolaProfilo(risposte((verso) => (verso === 1 ? '1' : '5'), { autocollocazione: '1', priorita: 'occupazione' }));
  const leggi = TOPICS.map((t) => proposalsFor('sinistra', t)[0].code);
  const inizio = { mese: 0, ...STATO_INIZIALE, punteggio: 0 };
  const fine = { mese: 24, ...STATO_INIZIALE, occupazione: 63, punteggio: 0 };
  const righe = confrontaConGioco(p, 'sinistra', leggi, inizio, fine);
  assert.equal(righe[0].esito, 'coerente');
  assert.equal(righe[1].esito, 'coerente');
  assert.equal(righe[2].esito, 'non misurabile');
  assert.equal(righe[3].esito, 'coerente');
  const dx = confrontaConGioco(p, 'destra', TOPICS.map((t) => proposalsFor('destra', t)[0].code), inizio, { ...fine, occupazione: 62 });
  assert.equal(dx[3].esito, 'si discosta', 'occupazione scesa rispetto alla partenza');
  assert.equal(dx[0].esito, 'si discosta');
});

test('codice fiscale: anno, maggiore età, omocodia, errori', async () => {
  const { leggiCodiceFiscale, carattereDiControllo } = await import('./codice-fiscale');
  const oggi = new Date('2026-11-15T12:00:00Z');
  assert.deepEqual(leggiCodiceFiscale('RSSMRA85T10A562S', oggi), { ok: true, annoNascita: 1985, maggiorenne: true });
  assert.deepEqual(leggiCodiceFiscale(' rssmra85t10a562s ', oggi), { ok: true, annoNascita: 1985, maggiorenne: true });
  assert.equal(leggiCodiceFiscale('RSSMRA85T10A562X', oggi).ok, false, 'carattere di controllo sbagliato');
  assert.equal(leggiCodiceFiscale('RSSMRA85', oggi).ok, false);
  // omocodia: cifre dell'anno sostituite da lettere (8→U, 5→R)
  const base = 'RSSMRAURT10A562';
  assert.deepEqual(leggiCodiceFiscale(base + carattereDiControllo(base), oggi), { ok: true, annoNascita: 1985, maggiorenne: true });
  // nata il 20/11/2008 (giorno + 40): il 15/11/2026 ha ancora 17 anni, il 20/11/2026 ne compie 18
  const ragazza = 'BNCLRA08S60H501';
  const cf = ragazza + carattereDiControllo(ragazza);
  assert.deepEqual(leggiCodiceFiscale(cf, oggi), { ok: true, annoNascita: 2008, maggiorenne: false });
  assert.deepEqual(leggiCodiceFiscale(cf, new Date('2026-11-20T12:00:00Z')), { ok: true, annoNascita: 2008, maggiorenne: true });
});
