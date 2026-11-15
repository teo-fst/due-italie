import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sessioniDaCancellare, nuovoRecord, lineeGrafico, tracciato, estremi, marcatori, type SessioneChiusa } from './sessioni';

const s = (numero: number, punteggioFinale: number, side: 'destra' | 'sinistra' = 'destra'): SessioneChiusa => ({
  numero, side, punteggioFinale, serie: [65, punteggioFinale],
});

test('40 sessioni: si cancellano la 1…10, restano la 11…40', () => {
  const numeri = Array.from({ length: 40 }, (_, i) => i + 1);
  assert.deepEqual(sessioniDaCancellare(numeri), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(sessioniDaCancellare(numeri.slice(0, 30)), []);
});

test('record: vince solo un punteggio strettamente migliore', () => {
  assert.equal(nuovoRecord(null, { punteggioFinale: 60 }), true);
  assert.equal(nuovoRecord({ punteggioFinale: 66 }, { punteggioFinale: 66 }), false);
  assert.equal(nuovoRecord({ punteggioFinale: 66 }, { punteggioFinale: 66.1 }), true);
});

test('grafico: ultime 5 sessioni in grigio + record n. 6 in arancione come sesta', () => {
  const sessioni = Array.from({ length: 30 }, (_, i) => s(i + 11, 60 + (i % 3)));
  const record = s(6, 70);
  const linee = lineeGrafico(sessioni, record);
  const numeri = [...new Set(linee.map((l) => l.numero))].sort((a, b) => a - b);
  assert.deepEqual(numeri, [6, 36, 37, 38, 39, 40]);
  assert.equal(linee.length, 6, 'una linea per partita: si gioca con una sola Italia');
  for (const l of linee) {
    assert.equal(l.colore, l.numero === 6 ? 'arancione' : 'grigio');
    assert.equal(l.tratteggio, false, 'Italia di destra: linea piena');
  }
  assert.equal(lineeGrafico([s(1, 60, 'sinistra')], null)[0].tratteggio, true, 'Italia di sinistra: tratteggiata');
  assert.equal(linee.at(-1)!.numero, 6, 'il record si disegna sopra');
});

test('grafico: se il record è tra le ultime 5 diventa arancione senza aggiungere una sesta', () => {
  const sessioni = [s(1, 60), s(2, 72), s(3, 61)];
  const linee = lineeGrafico(sessioni, sessioni[1]);
  assert.equal(new Set(linee.map((l) => l.numero)).size, 3);
  assert.deepEqual(linee.filter((l) => l.colore === 'arancione').map((l) => l.numero), [2]);
});

test('grafico: nessuna sessione, nessuna linea', () => {
  assert.deepEqual(lineeGrafico([], null), []);
  assert.deepEqual(estremi([]), [0, 1]);
});

test('tracciato SVG: primo punto a sinistra in basso, ultimo a destra in alto', () => {
  assert.equal(tracciato([0, 10], 100, 50, 0, 10, 1), 'M0.0,50.0 L100.0,0.0');
});

test('marcatori: il colpo di Stato ha un cerchio più grande del crollo di un ponte', () => {
  const serie = Array.from({ length: 25 }, (_, i) => 65 - i * 0.1);
  const m = marcatori([{ mese: 3, code: 'crollo-ponte' }, { mese: 10, code: 'colpo-di-stato' }], serie);
  const ponte = m.find((x) => x.mese === 3)!;
  const golpe = m.find((x) => x.mese === 10)!;
  assert.ok(golpe.raggio > ponte.raggio);
  assert.equal(golpe.valore, serie[10]);
  assert.equal(m[0].impatto, 5, 'i più grandi si disegnano prima');
});
