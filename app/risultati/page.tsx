import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { CATALOG } from '@/lib/sim/catalog';
import { EVENTI } from '@/lib/sim/events';
import type { DiceFace, Side } from '@/lib/sim/types';
import { LiveRefresh } from '../live-refresh';

export const dynamic = 'force-dynamic';

const RIGHE = [
  { key: 'occupazione', label: 'Lavoro', unita: '%', bene: 'su' },
  { key: 'inflazione', label: 'Prezzi', unita: '%', bene: 'giu' },
  { key: 'debito', label: 'Debito', unita: '% PIL', bene: 'giu' },
  { key: 'gradimento', label: 'Gente', unita: '/100', bene: 'su' },
] as const;
const FACCE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

type Stato = {
  side: Side; anno: number; occupazione: number; inflazione: number; debito: number;
  gradimento: number; punteggio: number; legge_code: string | null; evento: string | null;
};

function freccia(prima: number | undefined, dopo: number) {
  if (prima === undefined) return '·';
  const d = dopo - prima;
  if (Math.abs(d) < 0.05) return '=';
  return d > 0 ? '▲' : '▼';
}

export default async function Risultati() {
  const supabase = await supabaseServer();
  const [{ data: stati }, { data: ultimoTurno }] = await Promise.all([
    supabase.from('world_states').select('side, anno, occupazione, inflazione, debito, gradimento, punteggio, legge_code, evento')
      .order('anno', { ascending: false }).limit(40),
    supabase.from('turns').select('anno, dado, evento').not('resolved_at', 'is', null)
      .order('anno', { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (!stati?.length) {
    return (
      <div className="stack">
        <span className="badge">Sabato · Risultati</span>
        <p className="card">Ancora nessun risultato: il gioco non è partito.</p>
        <Link className="btn" href="/">Torna alla home</Link>
      </div>
    );
  }

  const righe = stati as Stato[];
  const annoCorrente = Math.max(...righe.map((r) => Number(r.anno)));
  const get = (side: Side, anno: number) => righe.find((r) => r.side === side && Number(r.anno) === anno);
  const ora = { sinistra: get('sinistra', annoCorrente)!, destra: get('destra', annoCorrente)! };
  const prima = { sinistra: get('sinistra', annoCorrente - 1), destra: get('destra', annoCorrente - 1) };
  const titoloLegge = (code: string | null) => (code ? CATALOG.find((p) => p.code === code)?.titolo ?? code : 'Nessuna legge (zero voti)');
  const avanti: Side | null = Number(ora.sinistra.punteggio) === Number(ora.destra.punteggio)
    ? null : Number(ora.sinistra.punteggio) > Number(ora.destra.punteggio) ? 'sinistra' : 'destra';

  return (
    <div className="stack">
      <LiveRefresh tables={['world_states', 'turns']} />
      <span className="badge">Sabato · Risultati · {annoCorrente}</span>

      {ultimoTurno?.dado && (
        <section className="card" style={{ textAlign: 'center' }} aria-label="Imprevisto dell'anno">
          <div className="dado" aria-hidden>{FACCE[ultimoTurno.dado]}</div>
          <p><b>Dado: {ultimoTurno.dado}</b> → {EVENTI[ultimoTurno.dado as DiceFace].titolo}</p>
          <p className="piccolo">Stesso imprevisto per entrambe le Italie.</p>
        </section>
      )}

      <section className="card">
        <table className="tabella">
          <thead>
            <tr><th scope="col"></th><th scope="col" className="sx">Sinistra</th><th scope="col" className="dx">Destra</th></tr>
          </thead>
          <tbody>
            {RIGHE.map((r) => (
              <tr key={r.key}>
                <th scope="row" style={{ textAlign: 'left', color: 'inherit', fontSize: 14 }}>
                  {r.label} <span className="piccolo">{r.unita}</span>
                </th>
                {(['sinistra', 'destra'] as const).map((s) => (
                  <td key={s}>
                    <span className={`freccia ${s === 'sinistra' ? 'sx' : 'dx'}`}>
                      {freccia(prima[s] ? Number(prima[s]![r.key]) : undefined, Number(ora[s][r.key]))}
                    </span>{' '}
                    {Number(ora[s][r.key]).toLocaleString('it-IT', { maximumFractionDigits: 2 })}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <th scope="row" style={{ textAlign: 'left', color: 'inherit' }}>Traguardo 🏁</th>
              <td><b>{Number(ora.sinistra.punteggio).toFixed(1)}</b></td>
              <td><b>{Number(ora.destra.punteggio).toFixed(1)}</b></td>
            </tr>
          </tbody>
        </table>
        <p className="piccolo">
          {avanti ? <>Più lontano, per ora: <b className={avanti === 'sinistra' ? 'sx' : 'dx'}>Italia di {avanti}</b>.</> : 'Parità.'}
          {' '}<Link href="/metodo">Come si calcola</Link>
        </p>
      </section>

      {annoCorrente > 2026 && (
        <section className="card stack">
          <h2 className="badge">Leggi approvate nel {annoCorrente - 1}</h2>
          <p><b className="sx">Sinistra:</b> {titoloLegge(ora.sinistra.legge_code)}</p>
          <p><b className="dx">Destra:</b> {titoloLegge(ora.destra.legge_code)}</p>
        </section>
      )}
    </div>
  );
}
