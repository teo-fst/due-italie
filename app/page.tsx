import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import { LiveRefresh } from './live-refresh';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await supabaseServer();
  const [{ data: counters }, { data: turno }] = await Promise.all([
    supabase.from('counters').select('key, value'),
    supabase.from('turns').select('anno').order('anno', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const sx = Number(counters?.find((c) => c.key === 'iscritti_sinistra')?.value ?? 0);
  const dx = Number(counters?.find((c) => c.key === 'iscritti_destra')?.value ?? 0);
  const soglia = Number(process.env.SOGLIA_AVVIO ?? 1000);
  const totale = sx + dx;
  const partito = Boolean(turno);

  return (
    <div className="stack">
      <LiveRefresh tables={['counters', 'turns']} />
      <span className="badge">2 copie identiche</span>
      <h1 className="titolo">
        <span className="grigio">Immagina:</span> dividiamo l&apos;Italia in due.
      </h1>
      <p>
        Stessa gente, stessi soldi, stessi problemi. In una governa solo la{' '}
        <b className="dx">destra</b>, nell&apos;altra solo la <b className="sx">sinistra</b>.
        Quale arriva più lontano? <b>Decidete voi.</b>
      </p>

      <section className="card stack" aria-labelledby="come">
        <h2 id="come" className="badge">Come funziona</h2>
        <ol>
          <li><b>Scegli la tua Italia.</b> Una volta sola, e per sempre.</li>
          <li><b>Ogni mercoledì</b> nella tua Italia si votano le leggi: case, immigrazione, tasse, prezzo della luce.</li>
          <li><b>Ogni settimana passa un anno intero</b>, dal 2026.</li>
          <li>Gli <b>imprevisti</b> li decide un dado, uguale per tutte e due.</li>
          <li><b>Ogni sabato i risultati</b>: lavoro, prezzi, debito e la gente, contenta o stufa.</li>
        </ol>
        <p className="piccolo">
          Le conseguenze delle leggi seguono un modello pubblico con le fonti di ogni numero:{' '}
          <Link href="/metodo">leggi il metodo</Link>.
        </p>
      </section>

      {partito ? (
        <section className="card stack">
          <p>Si gioca! Siamo nell&apos;anno <b>{turno!.anno}</b>.</p>
          <Link className="btn" href="/risultati">Vedi i risultati</Link>
        </section>
      ) : (
        <section className="card stack" aria-label="Avvio del gioco">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 22 }}>
            <span>{totale.toLocaleString('it-IT')} / {soglia.toLocaleString('it-IT')}</span>
            <span className="piccolo"><span className="sx">{sx}</span> · <span className="dx">{dx}</span></span>
          </div>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={soglia} aria-valuenow={totale}>
            <span style={{ width: `${Math.min(100, (totale / soglia) * 100)}%` }} />
          </div>
          <p className="badge">A {soglia.toLocaleString('it-IT')} si parte</p>
        </section>
      )}

      <Link className="btn" href="/scegli">In quale Italia vivresti?</Link>
    </div>
  );
}
