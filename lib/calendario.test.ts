import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prossimaFinestraVoto, mezzanotteRoma } from './calendario';

test('mezzanotte di Roma in inverno (UTC+1) e in estate (UTC+2)', () => {
  assert.equal(mezzanotteRoma(2026, 11, 18).toISOString(), '2026-11-17T23:00:00.000Z');
  assert.equal(mezzanotteRoma(2027, 7, 14).toISOString(), '2027-07-13T22:00:00.000Z');
});

test('da sabato 14/11/2026 sera → mercoledì 18/11', () => {
  const { apre, chiude } = prossimaFinestraVoto(new Date('2026-11-14T18:00:00Z'));
  assert.equal(apre.toISOString(), '2026-11-17T23:00:00.000Z');
  assert.equal(chiude.toISOString(), '2026-11-18T23:00:00.000Z');
});

test('se è già mercoledì, la finestra è quella della settimana dopo', () => {
  const { apre } = prossimaFinestraVoto(new Date('2026-11-18T10:00:00Z'));
  assert.equal(apre.toISOString(), '2026-11-24T23:00:00.000Z');
});

test('cambio ora di fine marzo e fine mese', () => {
  // sabato 27/03/2027; domenica 28/03 si passa all'ora legale
  const { apre, chiude } = prossimaFinestraVoto(new Date('2027-03-27T17:00:00Z'));
  assert.equal(apre.toISOString(), '2027-03-30T22:00:00.000Z');
  assert.equal(chiude.toISOString(), '2027-03-31T22:00:00.000Z');
});
