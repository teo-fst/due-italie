import Link from 'next/link';
import { redirect } from 'next/navigation';
import { contesto } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getProfilo, storico, ultimaChiusa } from '@/lib/store';
import { confrontaConGioco } from '@/lib/intervista/profilo';
import { getEvento } from '@/lib/sim/events';
import { MESI_SESSIONE } from '@/lib/sim/engine';
import { IMPATTO_LABEL } from '@/lib/sim/types';
import { GraficoPartita } from '../grafico-partita';

export const dynamic = 'force-dynamic';

const ICONA = { coerente: '✅', 'si discosta': '↔️', 'non misurabile': '—' } as const;

export default async function Fine() {
  const ctx = await contesto();
  if (!ctx?.giocatore) redirect('/registrati');
  const db = supabaseAdmin();
  const [s, profilo, st] = await Promise.all([ultimaChiusa(db, ctx.hash), getProfilo(db, ctx.hash), storico(db, ctx.hash)]);
  if (!s?.serie) redirect('/sessione');

  const side = s.side;
  const inizio = s.serie.serie[0];
  const fine = s.serie.serie[MESI_SESSIONE];
  const eRecord = st.record?.numero === s.numero;
  const precedenti = st.sessioni.filter((x) => x.numero !== s.numero).slice(0, 5);
  const media = precedenti.length ? precedenti.reduce((a, x) => a + x.punteggioFinale, 0) / precedenti.length : null;
  const confronto = profilo ? confrontaConGioco(profilo, side, s.leggi, inizio, fine) : [];

  return (
    <div className="stack">
      <span className="badge">Fine partita n. {s.numero} · 24 mesi</span>
      <h1 className="titolo">
        {eRecord ? '🏆 Nuovo record!' : media !== null && fine.punteggio > media ? 'Meglio delle tue ultime partite' : 'Partita conclusa'}
      </h1>

      <section className="card">
        <GraficoPartita serie={s.serie.serie.map((p) => p.punteggio)} eventi={s.serie.eventi} side={side}
          record={!eRecord && st.record ? st.record.serie : null} />
      </section>

      <section className="card">
        <table className="tabella">
          <thead><tr><th scope="col"></th><th scope="col">Partenza</th><th scope="col">Dopo 2 anni</th></tr></thead>
          <tbody>
            {([['occupazione', 'Lavoro %'], ['inflazione', 'Prezzi %'], ['debito', 'Debito % PIL'], ['gradimento', 'Gente /100'], ['punteggio', 'Traguardo 🏁']] as const).map(([k, l]) => (
              <tr key={k}>
                <th scope="row" style={{ textAlign: 'left', color: 'inherit', fontSize: 14 }}>{l}</th>
                <td>{inizio[k].toLocaleString('it-IT')}</td>
                <td><b>{fine[k].toLocaleString('it-IT')}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
        {media !== null && (
          <p className="piccolo">Media delle tue {precedenti.length} partite precedenti: {media.toFixed(1)}. Record: {st.record?.punteggioFinale.toLocaleString('it-IT')}.</p>
        )}
      </section>

      <section className="card stack">
        <h2 className="badge">Il tuo profilo e come hai giocato</h2>
        {confronto.length === 0 ? <p className="piccolo">Profilo non disponibile.</p> : (
          <table className="tabella">
            <thead><tr><th scope="col">Asse</th><th scope="col">Intervista</th><th scope="col">Partita</th><th scope="col">Esito</th></tr></thead>
            <tbody>
              {confronto.map((r) => (
                <tr key={r.asse}>
                  <th scope="row" style={{ textAlign: 'left', color: 'inherit', fontSize: 13 }}>{r.asse}</th>
                  <td>{r.intervista}</td>
                  <td>{r.gioco}</td>
                  <td><span aria-hidden>{ICONA[r.esito]}</span> {r.esito}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="piccolo">Il confronto è indicativo: nella tua Italia puoi scegliere solo tra proposte della stessa parte.</p>
      </section>

      <section className="card stack">
        <h2 className="badge">Imprevisti della partita</h2>
        {s.serie.eventi.length === 0 ? <p className="piccolo">Due anni tranquilli.</p> : (
          <ul className="eventi">
            {s.serie.eventi.map((e, i) => {
              const ev = getEvento(e.code);
              return <li key={i}><span aria-hidden>{ev.emoji}</span> mese {e.mese}: {ev.titolo} <span className={`impatto i${ev.impatto}`}>{IMPATTO_LABEL[ev.impatto]}</span></li>;
            })}
          </ul>
        )}
      </section>

      <Link className="btn" href="/storico">Confronta con le partite precedenti</Link>
      <Link className="btn chiaro" href="/sessione">Nuova partita</Link>
    </div>
  );
}
