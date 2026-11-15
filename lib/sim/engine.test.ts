import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, TOPICS, proposalsFor, validaLeggi, assertCatalogVerified } from './catalog';
import { EVENTI, probabilitaMese } from './events';
import {
  simulaSessione, estraiEventi, profilo, valoreContributo, mesiTrascorsi, esposizioneGas,
  STATO_INIZIALE, MESI_SESSIONE, MS_PER_MESE,
} from './engine';
import { IMPATTO_LABEL, type Side } from './types';

const prime = (side: Side) => TOPICS.map((t) => proposalsFor(side, t)[0].code);
const seconde = (side: Side) => TOPICS.map((t) => proposalsFor(side, t)[1].code);

test('catalogo: stesso numero di proposte per parte e per tema, codici univoci', () => {
  for (const t of TOPICS) {
    assert.equal(proposalsFor('sinistra', t).length, 2, t);
    assert.equal(proposalsFor('destra', t).length, 2, t);
  }
  const codes = CATALOG.map((p) => p.code);
  assert.equal(new Set(codes).size, codes.length);
  for (const p of CATALOG) assert.ok(p.code.startsWith(p.side === 'sinistra' ? 'sx-' : 'dx-'), p.code);
});

test('neutralità: ogni proposta dichiara pro, contro, confidenza e almeno una fonte', () => {
  for (const p of CATALOG) {
    assert.ok(p.pro.length > 5 && p.contro.length > 5, p.code);
    assert.ok(['alta', 'media', 'bassa'].includes(p.confidenza), p.code);
    assert.ok(p.fonti.length > 0, p.code);
    assert.ok(p.liberismo >= -1 && p.liberismo <= 1, p.code);
  }
  for (const e of EVENTI) assert.ok(e.fonti.length > 0 && e.pAnno > 0 && e.pAnno < 1, e.code);
});

test('validaLeggi: una per tema e solo della propria Italia', () => {
  assert.doesNotThrow(() => validaLeggi('sinistra', prime('sinistra')));
  assert.throws(() => validaLeggi('sinistra', prime('destra')));
  assert.throws(() => validaLeggi('destra', prime('destra').slice(1)));
  const doppia = [...prime('destra')];
  doppia[1] = doppia[0];
  assert.throws(() => validaLeggi('destra', doppia));
});

test('profilo: ritardo, rampa, durata, rientro', () => {
  const c = { ritardo: 2, rampa: 4, durata: 3, rientro: 2 };
  assert.equal(profilo(c, 2), 0);
  assert.equal(profilo(c, 4), 0.5);
  assert.equal(profilo(c, 7), 1);
  assert.equal(profilo(c, 10), 0.5);
  assert.equal(profilo(c, 11), 0);
  assert.equal(profilo({ ritardo: 0 }, 50), 1, 'permanente per default');
});

test('flusso: 0,6 punti l\'anno diventano 1,2 in 24 mesi', () => {
  const v = valoreContributo({ indicatore: 'debito', tipo: 'flusso', valore: 0.6, ritardo: 0 }, 24);
  assert.ok(Math.abs(v - 1.2) < 1e-9);
});

test('probabilità mensili: eventi stagionali solo nei loro mesi', () => {
  const siccita = EVENTI.find((e) => e.code === 'siccita')!;
  assert.equal(probabilitaMese(siccita, 1), 0);
  assert.ok(probabilitaMese(siccita, 7) > 0);
  const p = probabilitaMese(EVENTI.find((e) => e.code === 'spread')!, 3);
  assert.ok(Math.abs(1 - Math.pow(1 - p, 12) - 0.07) < 1e-12, 'riconverte alla probabilità annua');
});

test('stesso seme e stesse leggi: stessa storia (deterministico)', () => {
  const input = { seed: 12345, side: 'sinistra' as const, leggi: prime('sinistra') };
  assert.deepEqual(simulaSessione(input), simulaSessione(input));
});

test('a prefisso: 10 mesi coincidono con i primi 10 di una sessione intera', () => {
  const input = { seed: 777, side: 'destra' as const, leggi: seconde('destra') };
  const corta = simulaSessione(input, 10);
  const lunga = simulaSessione(input, 24);
  assert.deepEqual(corta.serie, lunga.serie.slice(0, 11));
  assert.deepEqual(corta.eventi, lunga.eventi.filter((e) => e.mese <= 10));
});

test('ogni partita parte dallo stesso stato; gli imprevisti dipendono solo dal seme', () => {
  const a = simulaSessione({ seed: 42, side: 'sinistra', leggi: prime('sinistra') });
  const b = simulaSessione({ seed: 42, side: 'sinistra', leggi: seconde('sinistra') });
  const c = simulaSessione({ seed: 43, side: 'sinistra', leggi: prime('sinistra') });
  assert.deepEqual(a.serie[0], b.serie[0]);
  assert.equal(a.serie[0].debito, STATO_INIZIALE.debito);
  assert.equal(a.serie.length, MESI_SESSIONE + 1);
  assert.deepEqual(a.eventi, b.eventi, 'stesso seme, stessi imprevisti anche con leggi diverse');
  assert.notDeepEqual(a.serie, b.serie, 'leggi diverse, partite che divergono');
  assert.notDeepEqual(a.eventi, c.eventi);
});

test('scala d\'impatto: ogni imprevisto ha un livello 1-5, ponte 1 e colpo di Stato 5', () => {
  for (const e of EVENTI) assert.ok(IMPATTO_LABEL[e.impatto], e.code);
  assert.equal(EVENTI.find((e) => e.code === 'crollo-ponte')!.impatto, 1);
  assert.equal(EVENTI.find((e) => e.code === 'colpo-di-stato')!.impatto, 5);
});

test('un colpo di Stato pesa sul traguardo molto più del crollo di un ponte', () => {
  const effetto = (code: string) => {
    const e = EVENTI.find((x) => x.code === code)!;
    let peggio = 0;
    for (const c of e.effetti) {
      const v = valoreContributo(c, 12);
      peggio += c.indicatore === 'occupazione' ? v : c.indicatore === 'gradimento' ? v * 0.2 : c.indicatore === 'debito' ? -v * 0.05 : -Math.abs(v) * 2;
    }
    return peggio;
  };
  assert.ok(effetto('colpo-di-stato') < effetto('crollo-ponte') * 10);
});

test('il nucleare non cambia i prezzi entro i 24 mesi della sessione', () => {
  const nucleare = CATALOG.filter((p) => p.code === 'dx-energia-nucleare');
  assert.equal(esposizioneGas(nucleare, 24), 1);
  const rinnovabili = CATALOG.filter((p) => p.code === 'sx-energia-rinnovabili');
  assert.ok(esposizioneGas(rinnovabili, 36) < 1);
});

test('una crisi energetica pesa meno sull\'inflazione con le rinnovabili attive', () => {
  // cerca un seme con una crisi energetica tra il mese 13 e il 18
  let seed = 1;
  for (; seed < 50_000; seed++) {
    const ev = estraiEventi(seed).flatMap((l, mese) => l.map((e) => ({ mese, code: e.code })));
    if (ev.some((e) => e.code === 'crisi-energetica' && e.mese >= 13 && e.mese <= 18)) break;
  }
  const conRinnovabili = TOPICS.map((t) => t === 'energia' ? 'sx-energia-rinnovabili' : proposalsFor('sinistra', t)[0].code);
  const conBonus = TOPICS.map((t) => t === 'energia' ? 'sx-energia-bonus-bollette' : proposalsFor('sinistra', t)[0].code);
  const a = simulaSessione({ seed, side: 'sinistra', leggi: conRinnovabili });
  const b = simulaSessione({ seed, side: 'sinistra', leggi: conBonus });
  const piccoA = Math.max(...a.serie.map((p) => p.inflazione));
  const piccoB = Math.max(...b.serie.map((p) => p.inflazione));
  assert.ok(piccoA < piccoB, `rinnovabili ${piccoA} vs bonus ${piccoB}`);
});

test('leggi della parte sbagliata rifiutate dal motore', () => {
  assert.throws(() => simulaSessione({ seed: 1, side: 'destra', leggi: prime('sinistra') }));
});

test('Monte Carlo: frequenze degli imprevisti coerenti con le probabilità annue', () => {
  const N = 4000;
  const conteggi: Record<string, number> = {};
  for (let seed = 1; seed <= N; seed++) {
    const primoAnno = estraiEventi(seed * 7919).slice(1, 13).flat();
    for (const e of new Set(primoAnno.map((x) => x.code))) {
      conteggi[e] = (conteggi[e] ?? 0) + 1;
    }
  }
  for (const e of EVENTI) {
    const freq = (conteggi[e.code] ?? 0) / N;
    assert.ok(Math.abs(freq - e.pAnno) < 0.04, `${e.code}: atteso ${e.pAnno}, osservato ${freq}`);
  }
});

test('indicatori nei limiti in 500 sessioni casuali', () => {
  for (let seed = 1; seed <= 500; seed++) {
    for (const side of ['sinistra', 'destra'] as const) {
      const r = simulaSessione({ seed, side, leggi: seconde(side) });
      for (const p of r.serie) {
        assert.ok(p.gradimento >= 0 && p.gradimento <= 100);
        assert.ok(p.occupazione > 50 && p.occupazione < 70, `occ ${p.occupazione}`);
        assert.ok(Number.isFinite(p.punteggio));
      }
    }
  }
});

test('mesi trascorsi: 1 ora = 1 mese, massimo 24', () => {
  const t0 = new Date('2026-11-15T10:00:00Z');
  assert.equal(mesiTrascorsi(t0, t0), 0);
  assert.equal(mesiTrascorsi(t0, new Date(t0.getTime() + MS_PER_MESE - 1)), 0);
  assert.equal(mesiTrascorsi(t0, new Date(t0.getTime() + 5 * MS_PER_MESE)), 5);
  assert.equal(mesiTrascorsi(t0, new Date(t0.getTime() + 100 * MS_PER_MESE)), 24);
});

test('R7: STRICT_SOURCES blocca finché le proposte non sono verificate', () => {
  assert.throws(() => assertCatalogVerified());
  assert.doesNotThrow(() => assertCatalogVerified(CATALOG.map((p) => ({ ...p, verificato: true }))));
});

test('stampa due partite di esempio (VERBOSE=1)', () => {
  const a = simulaSessione({ seed: 2026, side: 'sinistra', leggi: prime('sinistra') });
  const b = simulaSessione({ seed: 2026, side: 'sinistra', leggi: seconde('sinistra') });
  if (process.env.VERBOSE) {
    console.log('eventi', a.eventi);
    console.table([0, 6, 12, 18, 24].map((m) => ({
      mese: m, a_occ: a.serie[m].occupazione, b_occ: b.serie[m].occupazione,
      a_inf: a.serie[m].inflazione, b_inf: b.serie[m].inflazione,
      a_deb: a.serie[m].debito, b_deb: b.serie[m].debito,
      a_gr: a.serie[m].gradimento, b_gr: b.serie[m].gradimento,
      a_pt: a.serie[m].punteggio, b_pt: b.serie[m].punteggio,
    })));
  }
  assert.equal(a.mesi, 24);
});
