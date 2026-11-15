// Ciclo completo dei dati con un finto client Supabase in memoria.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registra, avviaSessione, aggiornaSessione, storico, cancellaDati, getGiocatore, ultimaChiusa, getProfilo } from './store';
import { hashGiocatore } from './privacy';
import { DOMANDE, PNR, type Risposte } from './intervista/domande';
import { TOPICS, proposalsFor } from './sim/catalog';
import { MS_PER_MESE } from './sim/engine';
import { lineeGrafico } from './sessioni';

type Row = Record<string, any>;
const PK: Record<string, string[]> = {
  giocatori: ['hash'], profili: ['hash'], sessioni: ['hash', 'numero'], record_sessioni: ['hash'],
};
const FK_CASCATA = ['profili', 'sessioni', 'record_sessioni'];

function fakeDb() {
  const t: Record<string, Row[]> = { giocatori: [], profili: [], sessioni: [], record_sessioni: [] };
  const key = (table: string, r: Row) => PK[table].map((k) => r[k]).join('|');

  function from(table: string) {
    let op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
    let payload: Row[] = [];
    let patch: Row = {};
    const filtri: ((r: Row) => boolean)[] = [];
    let ord: { k: string; asc: boolean } | null = null;
    let lim: number | null = null;

    const run = (mode: 'many' | 'single' | 'maybe') => {
      const rows = t[table];
      if (op === 'insert' || op === 'upsert') {
        const out: Row[] = [];
        for (const p of payload) {
          const row = structuredClone({ chiusa_at: null, punteggio_finale: null, serie: null, ...p });
          if (table !== 'sessioni') { delete row.chiusa_at; delete row.punteggio_finale; delete row.serie; }
          if (table === 'record_sessioni') Object.assign(row, structuredClone(p));
          const i = rows.findIndex((x) => key(table, x) === key(table, row));
          if (i >= 0 && op === 'insert') return { data: null, error: { message: 'duplicate key' } };
          if (table === 'sessioni' && row.chiusa_at === null && rows.some((x) => x.hash === row.hash && x.chiusa_at === null)) {
            return { data: null, error: { message: 'sessioni_una_aperta' } };
          }
          if (i >= 0) rows[i] = row; else rows.push(row);
          out.push(row);
        }
        return { data: mode === 'many' ? out : out[0] ?? null, error: null };
      }
      let sel = rows.filter((r) => filtri.every((f) => f(r)));
      if (op === 'update') { sel.forEach((r) => Object.assign(r, structuredClone(patch))); return { data: null, error: null }; }
      if (op === 'delete') {
        t[table] = rows.filter((r) => !sel.includes(r));
        if (table === 'giocatori') for (const c of FK_CASCATA) t[c] = t[c].filter((r) => !sel.some((g) => g.hash === r.hash));
        return { data: null, error: null };
      }
      if (ord) sel = [...sel].sort((a, b) => (ord!.asc ? a[ord!.k] - b[ord!.k] : b[ord!.k] - a[ord!.k]));
      if (lim !== null) sel = sel.slice(0, lim);
      sel = structuredClone(sel);
      if (mode === 'many') return { data: sel, error: null };
      if (mode === 'single' && sel.length !== 1) return { data: null, error: { message: 'single' } };
      return { data: sel[0] ?? null, error: null };
    };

    const b: any = {
      select: () => b,
      insert: (r: Row | Row[]) => { op = 'insert'; payload = [r].flat(); return b; },
      upsert: (r: Row | Row[]) => { op = 'upsert'; payload = [r].flat(); return b; },
      update: (p: Row) => { op = 'update'; patch = p; return b; },
      delete: () => { op = 'delete'; return b; },
      eq: (k: string, v: unknown) => { filtri.push((r) => r[k] === v); return b; },
      in: (k: string, vs: unknown[]) => { filtri.push((r) => vs.includes(r[k])); return b; },
      is: (k: string, v: unknown) => { filtri.push((r) => (r[k] ?? null) === v); return b; },
      not: (k: string, _op: string, v: unknown) => { filtri.push((r) => (r[k] ?? null) !== v); return b; },
      order: (k: string, o?: { ascending?: boolean }) => { ord = { k, asc: o?.ascending !== false }; return b; },
      limit: (n: number) => { lim = n; return b; },
      single: () => Promise.resolve(run('single')),
      maybeSingle: () => Promise.resolve(run('maybe')),
      then: (a: any, c: any) => Promise.resolve(run('many')).then(a, c),
    };
    return b;
  }
  return { db: { from } as any, t };
}

const PEPPER = 'x'.repeat(40);
function risposteValide(): Risposte {
  const r: Risposte = {};
  for (const d of DOMANDE) {
    r[d.id] = d.tipo === 'anno-da-cf' ? '1985' : d.tipo === 'scelta' ? (d.opzioni.some((o) => o.valore === PNR) ? PNR : d.opzioni[1].valore) : PNR;
  }
  return r;
}
const leggiSx = (i: number) => TOPICS.map((t) => proposalsFor('sinistra', t)[i % 2].code);

test('hash: deterministico, 64 caratteri esadecimali, cambia con la chiave', () => {
  const h = hashGiocatore('user-1', PEPPER);
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.equal(h, hashGiocatore('user-1', PEPPER));
  assert.notEqual(h, hashGiocatore('user-1', 'y'.repeat(40)));
  assert.throws(() => hashGiocatore('user-1', 'corta'));
});

test('registrazione: serve il consenso, una sola volta, niente minorenni', async () => {
  const { db, t } = fakeDb();
  const h = hashGiocatore('u', PEPPER);
  const ora = new Date('2026-11-15T10:00:00Z');
  await assert.rejects(registra(db, h, { side: 'sinistra', risposte: risposteValide(), consensoDatiDelicati: false }, ora));
  await assert.rejects(registra(db, h, { side: 'sinistra', risposte: { ...risposteValide(), anno: '2012' }, consensoDatiDelicati: true }, ora));
  assert.equal(t.giocatori.length, 0);
  await registra(db, h, { side: 'sinistra', risposte: risposteValide(), consensoDatiDelicati: true }, ora);
  await assert.rejects(registra(db, h, { side: 'destra', risposte: risposteValide(), consensoDatiDelicati: true }, ora));
  assert.equal((await getGiocatore(db, h))!.side, 'sinistra');
  assert.ok(!JSON.stringify(t).includes('"u"'), 'l\'id utente non finisce nel database');
});

test('GDPR: nel database finisce il punteggio, mai le risposte dell\'intervista', async () => {
  const { db, t } = fakeDb();
  const h = hashGiocatore('u3', PEPPER);
  const ora = new Date('2026-11-15T10:00:00Z');
  const risposte = { ...risposteValide(), orientamento: 'eterosessuale', autocollocazione: '9', priorita: 'debito' };

  await registra(db, h, { side: 'destra', risposte, consensoDatiDelicati: true }, ora);

  const dump = JSON.stringify(t);
  // 'priorita' è l'unica risposta che sopravvive, perché è uno dei quattro valori del punteggio
  for (const id of Object.keys(risposte).filter((k) => k !== 'priorita')) {
    assert.ok(!dump.includes(`"${id}"`), `la risposta "${id}" non deve finire nel database`);
  }
  assert.ok(!dump.includes('eterosessuale'), 'nessun dato dell\'art. 9 GDPR nel database');

  // resta solo il punteggio, e basta a sé stesso per il confronto di fine partita
  assert.equal(t.profili.length, 1);
  assert.deepEqual(Object.keys(t.profili[0]).sort(), ['hash', 'punteggio']);
  const punteggio = await getProfilo(db, h);
  assert.deepEqual(Object.keys(punteggio!).sort(), ['federalismo', 'liberismo', 'priorita', 'sinistraDestra']);
  assert.equal(punteggio!.priorita, 'debito');
});

test('ciclo di 40 partite: 24 ore ciascuna, ultime 30 + record conservati', async () => {
  const { db, t } = fakeDb();
  const h = hashGiocatore('u2', PEPPER);
  let ora = new Date('2026-11-15T10:00:00Z');
  await registra(db, h, { side: 'sinistra', risposte: risposteValide(), consensoDatiDelicati: true }, ora);

  await assert.rejects(avviaSessione(db, h, TOPICS.map((tp) => proposalsFor('destra', tp)[0].code), 1, ora), 'leggi dell\'altra Italia');

  let migliore = { numero: 0, punteggio: -Infinity };
  for (let i = 1; i <= 40; i++) {
    const s = await avviaSessione(db, h, leggiSx(i), i * 104729, ora);
    assert.equal(s.numero, i);
    await assert.rejects(avviaSessione(db, h, leggiSx(i), 5, ora), 'una partita alla volta');

    const meta = await aggiornaSessione(db, h, new Date(ora.getTime() + 12.5 * MS_PER_MESE));
    assert.equal(meta!.chiusa, false);
    assert.equal(meta!.risultato.mesi, 12);

    ora = new Date(ora.getTime() + 24 * MS_PER_MESE);
    const fine = await aggiornaSessione(db, h, ora);
    assert.equal(fine!.chiusa, true);
    const p = fine!.risultato.serie[24].punteggio;
    if (p > migliore.punteggio) migliore = { numero: i, punteggio: p };
    assert.equal(await aggiornaSessione(db, h, ora), null, 'nessuna partita aperta dopo la chiusura');
  }

  const numeri = t.sessioni.map((s) => s.numero).sort((a, b) => a - b);
  assert.equal(numeri.length, 30);
  assert.deepEqual(numeri, Array.from({ length: 30 }, (_, i) => i + 11));
  assert.equal(t.record_sessioni[0].numero, migliore.numero, 'record = sessione migliore di sempre');

  const st = await storico(db, h);
  const linee = lineeGrafico(st.sessioni, st.record);
  const mostrate = new Set(linee.map((l) => l.numero));
  for (const n of [36, 37, 38, 39, 40]) assert.ok(mostrate.has(n));
  assert.ok(mostrate.has(migliore.numero));
  assert.equal((await ultimaChiusa(db, h))!.numero, 40);

  // la prossima partita prende il numero 41 anche se le prime 10 sono state cancellate
  assert.equal((await avviaSessione(db, h, leggiSx(0), 7, ora)).numero, 41);

  await cancellaDati(db, h);
  assert.equal(t.giocatori.length + t.profili.length + t.sessioni.length + t.record_sessioni.length, 0);
});
