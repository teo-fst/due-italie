// Esecuzione: npm run test:sim   (node --import tsx --test lib/sim/*.test.ts)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, TOPICS, proposalsFor, topicForYear, getProposal, assertCatalogVerified } from './catalog';
import { EVENTI, tiraDado } from './events';
import { risolviAnno, statoIniziale, leggeVincente, punteggio, STATO_INIZIALE } from './engine';
import { SIDES, type Effect, type Side } from './types';

const tranquillo = EVENTI[4];

test('R1: le due Italie partono identiche', () => {
  const a = statoIniziale('sinistra');
  const b = statoIniziale('destra');
  assert.deepEqual({ ...a, side: null }, { ...b, side: null });
});

test('neutralità: stesso numero di proposte per tema e per parte', () => {
  for (const t of TOPICS) {
    assert.equal(proposalsFor('sinistra', t).length, proposalsFor('destra', t).length, t);
    assert.ok(proposalsFor('sinistra', t).length >= 2, `almeno 2 opzioni per ${t}`);
  }
});

test('neutralità: nessuna proposta è "gratis" (almeno un pro e un contro)', () => {
  // occupazione e gradimento: su = bene; inflazione e debito: su = male
  const segno = (k: keyof Effect, v: number) =>
    (k === 'inflazione' || k === 'debito' ? -v : v);
  for (const p of CATALOG) {
    const tot: Effect = { ...p.immediato };
    for (const [k, v] of Object.entries(p.ritardato?.effetto ?? {})) {
      tot[k as keyof Effect] = (tot[k as keyof Effect] ?? 0) + (v as number);
    }
    const valori = Object.entries(tot).map(([k, v]) => segno(k as keyof Effect, v as number));
    assert.ok(valori.some((v) => v > 0), `${p.code} non ha vantaggi`);
    assert.ok(valori.some((v) => v < 0), `${p.code} non ha costi`);
  }
});

test('neutralità: ampiezza totale degli effetti comparabile (±25%)', () => {
  const ampiezza = (side: Side) =>
    CATALOG.filter((p) => p.side === side).reduce((acc, p) => {
      const tutti = [...Object.values(p.immediato), ...Object.values(p.ritardato?.effetto ?? {})];
      return acc + tutti.reduce((a, v) => a + Math.abs(v as number), 0);
    }, 0);
  const sx = ampiezza('sinistra');
  const dx = ampiezza('destra');
  assert.ok(Math.abs(sx - dx) / Math.max(sx, dx) <= 0.25, `sinistra=${sx.toFixed(2)} destra=${dx.toFixed(2)}`);
});

test('codici proposta univoci e prefisso coerente con la parte', () => {
  const codes = CATALOG.map((p) => p.code);
  assert.equal(new Set(codes).size, codes.length);
  for (const p of CATALOG) assert.ok(p.code.startsWith(p.side === 'sinistra' ? 'sx-' : 'dx-'), p.code);
});

test('R5/R6: un tema per anno a rotazione da 2026', () => {
  assert.equal(topicForYear(2026), 'casa');
  assert.equal(topicForYear(2027), 'immigrazione');
  assert.equal(topicForYear(2030), 'casa');
});

test('R6: ogni turno avanza di un anno', () => {
  const { stato } = risolviAnno(statoIniziale('destra'), null, tranquillo);
  assert.equal(stato.anno, 2027);
});

test('una legge della parte sbagliata viene rifiutata', () => {
  assert.throws(() =>
    risolviAnno(statoIniziale('destra'), getProposal('sx-tasse-evasione'), tranquillo));
});

test('effetti ritardati maturano dopo N anni', () => {
  const legge = getProposal('dx-energia-nucleare'); // ritardo 5 anni
  let { stato } = risolviAnno(statoIniziale('destra'), legge, tranquillo);
  assert.equal(stato.pending.length, 1);
  assert.equal(stato.pending[0].anno, 2032);
  for (let i = 0; i < 4; i++) ({ stato } = risolviAnno(stato, null, tranquillo));
  assert.equal(stato.anno, 2031);
  assert.equal(stato.pending.length, 1, 'non ancora maturato');
  ({ stato } = risolviAnno(stato, null, tranquillo));
  assert.equal(stato.anno, 2032);
  assert.equal(stato.pending.length, 0, 'maturato nel 2032');
});

test('R8: stesso dado, stesse leggi nulle → stessi risultati nelle due Italie', () => {
  for (const f of [1, 2, 3, 4, 5, 6] as const) {
    const a = risolviAnno(statoIniziale('sinistra'), null, EVENTI[f]).report.dopo;
    const b = risolviAnno(statoIniziale('destra'), null, EVENTI[f]).report.dopo;
    assert.deepEqual(a, b, `faccia ${f}`);
  }
});

test('la pandemia pesa di più sul debito se il debito è più alto', () => {
  const basso = { ...statoIniziale('sinistra'), debito: 90 };
  const alto = { ...statoIniziale('sinistra'), debito: 160 };
  const dBasso = risolviAnno(basso, null, EVENTI[2]).report.dopo.debito - 90;
  const dAlto = risolviAnno(alto, null, EVENTI[2]).report.dopo.debito - 160;
  assert.ok(dAlto > dBasso);
});

test('gli indicatori restano nei limiti anche dopo 50 anni di sfortuna', () => {
  let s = statoIniziale('sinistra');
  for (let i = 0; i < 50; i++) s = risolviAnno(s, null, EVENTI[2]).stato;
  assert.ok(s.gradimento >= 0 && s.gradimento <= 100);
  assert.ok(s.occupazione >= 30);
});

test('legge vincente: maggioranza, pareggio deterministico, nessun voto', () => {
  assert.equal(leggeVincente({ 'sx-a': 3, 'sx-b': 5 }), 'sx-b');
  assert.equal(leggeVincente({ 'sx-b': 4, 'sx-a': 4 }), 'sx-a');
  assert.equal(leggeVincente({}), null);
  assert.equal(leggeVincente({ 'sx-a': 0 }), null);
});

test('dado: solo facce 1-6', () => {
  for (let i = 0; i < 6; i++) assert.equal(tiraDado(() => i), i + 1);
  assert.throws(() => tiraDado(() => 6));
});

test('R7: il controllo fonti blocca proposte non verificate', () => {
  assert.throws(() => assertCatalogVerified());
  assert.doesNotThrow(() => assertCatalogVerified(CATALOG.map((p) => ({ ...p, verificato: true }))));
});

test('simulazione di 8 anni: deterministica e stampabile', () => {
  const dadi = [1, 4, 6, 2, 3, 5, 4, 4] as const;
  const stati = Object.fromEntries(SIDES.map((s) => [s, statoIniziale(s)]));
  for (let i = 0; i < dadi.length; i++) {
    const anno = stati.sinistra.anno;
    const tema = topicForYear(anno);
    for (const side of SIDES) {
      const legge = proposalsFor(side, tema)[i % 2];
      stati[side] = risolviAnno(stati[side], legge, EVENTI[dadi[i]]).stato;
    }
  }
  assert.equal(stati.sinistra.anno, 2034);
  assert.equal(stati.destra.anno, 2034);
  if (process.env.VERBOSE) {
    console.table(SIDES.map((s) => ({ side: s, ...stati[s], pending: stati[s].pending.length, punteggio: punteggio(stati[s]) })));
  }
  assert.ok(Number.isFinite(punteggio(STATO_INIZIALE)));
});
