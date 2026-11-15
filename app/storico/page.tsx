import Link from 'next/link';
import { redirect } from 'next/navigation';
import { contesto } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { storico } from '@/lib/store';
import { lineeGrafico, MAX_SESSIONI } from '@/lib/sessioni';
import { GraficoSessioni } from './grafico';

export const dynamic = 'force-dynamic';

export default async function Storico() {
  const ctx = await contesto();
  if (!ctx?.giocatore) redirect('/registrati');
  const { sessioni, record } = await storico(supabaseAdmin(), ctx.hash);
  const linee = lineeGrafico(sessioni, record);
  const numeriMostrati = [...new Set(linee.map((l) => l.numero))].sort((a, b) => b - a);

  return (
    <div className="stack">
      <span className="badge">Le tue partite</span>
      <h1 className="titolo">Storico</h1>
      {linee.length === 0 ? (
        <p className="card">Ancora nessuna partita conclusa. Una partita dura 24 ore.</p>
      ) : (
        <>
          <section className="card stack">
            <GraficoSessioni linee={linee} />
          </section>
          <section className="card">
            <table className="tabella">
              <caption className="piccolo" style={{ captionSide: 'bottom', paddingTop: 8 }}>
                Teniamo le ultime {MAX_SESSIONI} partite; il record è conservato a parte anche quando è più vecchio.
              </caption>
              <thead><tr><th scope="col">Partita</th><th scope="col">Traguardo finale</th><th scope="col"></th></tr></thead>
              <tbody>
                {numeriMostrati.map((n) => {
                  const s = sessioni.find((x) => x.numero === n) ?? (record?.numero === n ? record : null);
                  if (!s) return null;
                  return (
                    <tr key={n}>
                      <th scope="row" style={{ textAlign: 'left', color: 'inherit' }}>n. {n}</th>
                      <td>{s.punteggioFinale.toLocaleString('it-IT')}</td>
                      <td>{record?.numero === n ? <b style={{ color: '#c2410c' }}>🏆 record</b> : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      )}
      <Link className="btn" href="/sessione">Gioca</Link>
    </div>
  );
}
