// Test del ciclo settimanale con un finto client Supabase in memoria.
// Esecuzione: npm run test:gioco  (serve --conditions=react-server per "server-only")
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eseguiSettimana } from './gioco';

type Row = Record<string, any>;

/** Mock minimale del query builder usato in lib/gioco.ts. */
function fakeDb(seed: Record<string, Row[]>) {
  const tables: Record<string, Row[]> = structuredClone(seed);
  const ids: Record<string, number> = {};
  const pk: Record<string, (r: Row) => string> = {
    world_states: (r) => `${r.side}-${r.anno}`,
  };

  function builder(table: string) {
    let rows = () => tables[table] ?? (tables[table] = []);
    let filters: ((r: Row) => boolean)[] = [];
    let op: 'select' | 'insert' | 'update' = 'select';
    let payload: Row[] = [];
    let patch: Row = {};
    let head = false;
    let limitN: number | null = null;
    let orderKey: string | null = null;
    let inserted: Row[] = [];

    const run = (mode: 'many' | 'single' | 'maybe') => {
      if (op === 'insert') {
        for (const r of payload) {
          if (pk[table] && rows().some((x) => pk[table](x) === pk[table](r))) {
            return { data: null, error: { message: 'duplicate key' } };
          }
        }
        inserted = payload.map((r) => {
          const row = { ...r };
          if (['turns', 'proposals'].includes(table)) row.id = ids[table] = (ids[table] ?? 0) + 1;
          if (table === 'turns') { row.resolved_at ??= null; row.dado ??= null; }
          rows().push(row);
          return row;
        });
        if (mode === 'many') return { data: inserted, error: null };
        return { data: inserted[0] ?? null, error: null };
      }
      let res = rows().filter((r) => filters.every((f) => f(r)));
      if (op === 'update') { res.forEach((r) => Object.assign(r, patch)); return { data: null, error: null }; }
      if (orderKey) res = [...res].sort((a, b) => a[orderKey!] - b[orderKey!]);
      if (limitN !== null) res = res.slice(0, limitN);
      if (head) return { data: null, error: null, count: res.length };
      if (mode === 'many') return { data: res, error: null };
      if (mode === 'single' && res.length !== 1) return { data: null, error: { message: `single: ${res.length} righe` } };
      return { data: res[0] ?? null, error: null };
    };

    const b: any = {
      select: (_cols?: string, opts?: { head?: boolean }) => { if (opts?.head) head = true; return b; },
      insert: (r: Row | Row[]) => { op = 'insert'; payload = Array.isArray(r) ? r : [r]; return b; },
      update: (p: Row) => { op = 'update'; patch = p; return b; },
      eq: (k: string, v: unknown) => { filters.push((r) => r[k] === v); return b; },
      is: (k: string, v: unknown) => { filters.push((r) => (r[k] ?? null) === v); return b; },
      lte: (k: string, v: string) => { filters.push((r) => r[k] <= v); return b; },
      order: (k: string) => { orderKey = k; return b; },
      limit: (n: number) => { limitN = n; return b; },
      single: () => Promise.resolve(run('single')),
      maybeSingle: () => Promise.resolve(run('maybe')),
      then: (ok: any, ko: any) => Promise.resolve(run('many')).then(ok, ko),
    };
    return b;
  }

  return { db: { from: builder } as any, tables };
}

const contatori = (sx: number, dx: number) => [
  { key: 'iscritti_sinistra', value: sx }, { key: 'iscritti_destra', value: dx },
];

test('sotto soglia: resta in attesa', async () => {
  const { db, tables } = fakeDb({ counters: contatori(60, 48), turns: [] });
  const r = await eseguiSettimana(db, new Date('2026-11-14T17:00:00Z'), 1000);
  assert.equal(r.stato, 'in-attesa');
  assert.equal(tables.turns.length, 0);
});

test('ciclo completo: avvio → voto → sabato → anno successivo', async () => {
  const { db, tables } = fakeDb({ counters: contatori(520, 480), turns: [] });

  // Sabato 14/11: soglia raggiunta → avvio
  const avvio = await eseguiSettimana(db, new Date('2026-11-14T17:00:00Z'), 1000);
  assert.equal(avvio.stato, 'avviato');
  assert.equal(tables.world_states.length, 2);
  assert.equal(tables.turns[0].anno, 2026);
  assert.equal(tables.turns[0].topic, 'casa');
  assert.equal(tables.turns[0].vote_opens_at, '2026-11-17T23:00:00.000Z');
  assert.equal(tables.proposals.length, 4); // 2 per parte

  // Il cron non fa nulla prima che chiudano le urne
  const prima = await eseguiSettimana(db, new Date('2026-11-18T12:00:00Z'), 1000);
  assert.equal(prima.stato, 'niente-da-fare');

  // Voti del mercoledì (solo la sinistra vota; la destra zero voti → nessuna legge)
  const sx = tables.proposals.filter((p) => p.side === 'sinistra');
  tables.vote_counts = [
    { proposal_id: sx[0].id, turn_id: 1, side: 'sinistra', voti: 3 },
    { proposal_id: sx[1].id, turn_id: 1, side: 'sinistra', voti: 7 },
  ];

  // Sabato 21/11: risoluzione
  const r = await eseguiSettimana(db, new Date('2026-11-21T17:00:00Z'), 1000) as any;
  assert.equal(r.stato, 'risolto');
  assert.ok(r.dado >= 1 && r.dado <= 6);
  assert.equal(r.esiti.sinistra.legge, sx[1].code);
  assert.equal(r.esiti.destra.legge, null);

  const s2027 = tables.world_states.filter((w) => w.anno === 2027);
  assert.equal(s2027.length, 2);
  assert.ok(s2027.every((w) => w.evento === s2027[0].evento), 'stesso imprevisto per entrambe');
  assert.ok(tables.turns[0].resolved_at);
  assert.equal(tables.turns[0].dado, r.dado);

  // Turno successivo creato per mercoledì 25/11, tema immigrazione
  const t2 = tables.turns.find((t) => t.anno === 2027)!;
  assert.equal(t2.topic, 'immigrazione');
  assert.equal(t2.vote_opens_at, '2026-11-24T23:00:00.000Z');

  // Una seconda chiamata lo stesso sabato non rifà nulla
  const bis = await eseguiSettimana(db, new Date('2026-11-21T17:05:00Z'), 1000);
  assert.equal(bis.stato, 'niente-da-fare');
});
