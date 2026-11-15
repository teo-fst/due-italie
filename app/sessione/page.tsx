import Link from 'next/link';
import { redirect } from 'next/navigation';
import { contesto } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { aggiornaSessione, storico } from '@/lib/store';
import { CATALOG, TOPICS, TOPIC_LABEL, proposalsFor } from '@/lib/sim/catalog';
import { getEvento } from '@/lib/sim/events';
import { MESI_SESSIONE, MS_PER_MESE } from '@/lib/sim/engine';
import { IMPATTO_LABEL } from '@/lib/sim/types';
import { etichettaMese } from '@/lib/mesi';
import { SchedaLeggi } from './scheda';
import { AutoAggiorna } from './auto-aggiorna';
import { GraficoPartita } from './grafico-partita';

export const dynamic = 'force-dynamic';

const RIGHE = [
  { k: 'occupazione', label: 'Lavoro', unita: '%' },
  { k: 'inflazione', label: 'Prezzi', unita: '%' },
  { k: 'debito', label: 'Debito', unita: '% PIL' },
  { k: 'gradimento', label: 'Gente', unita: '/100' },
  { k: 'punteggio', label: 'Traguardo 🏁', unita: '' },
] as const;

export default async function Sessione() {
  const ctx = await contesto();
  if (!ctx?.giocatore) redirect('/registrati');
  const side = ctx.giocatore.side;
  const db = supabaseAdmin();
  const vista = await aggiornaSessione(db, ctx.hash, new Date());
  if (vista?.chiusa) redirect('/sessione/fine');
  const classe = side === 'sinistra' ? 'sx' : 'dx';

  if (!vista) {
    const temi = TOPICS.map((t) => ({
      topic: t,
      label: TOPIC_LABEL[t],
      proposte: proposalsFor(side, t).map((p) => ({
        code: p.code, titolo: p.titolo, descrizione: p.descrizione, pro: p.pro, contro: p.contro, confidenza: p.confidenza,
      })),
    }));
    return (
      <div className="stack">
        <span className="badge">Nuova partita</span>
        <h1 className="titolo"><span className="grigio">Italia di</span> <span className={classe}>{side}</span></h1>
        <p>Scegli una legge per tema. Poi ogni ora passa un mese: tra 24 ore saranno passati due anni.</p>
        <SchedaLeggi side={side} temi={temi} />
      </div>
    );
  }

  const { sessione, risultato } = vista;
  const mese = risultato.mesi;
  const inizio = risultato.serie[0];
  const ora = risultato.serie[mese];
  const { record } = await storico(db, ctx.hash);
  const prossimo = new Date(new Date(sessione.iniziata_at).getTime() + (mese + 1) * MS_PER_MESE);
  const titolo = (code: string) => CATALOG.find((p) => p.code === code)?.titolo ?? code;

  return (
    <div className="stack">
      <AutoAggiorna secondi={60} />
      <span className="badge">Partita n. {sessione.numero} · mese {mese} di {MESI_SESSIONE}</span>
      <h1 className="titolo"><span className={classe}>Italia di {side}</span> · {mese === 0 ? 'si parte' : etichettaMese(mese)}</h1>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={MESI_SESSIONE} aria-valuenow={mese}>
        <span style={{ width: `${(mese / MESI_SESSIONE) * 100}%` }} />
      </div>
      {mese < MESI_SESSIONE && (
        <p className="piccolo">
          Prossimo mese alle {prossimo.toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })}.
        </p>
      )}

      <section className="card">
        <GraficoPartita serie={risultato.serie.map((p) => p.punteggio)} eventi={risultato.eventi} side={side}
          record={record ? record.serie.slice(0, mese + 1) : null} />
      </section>

      <section className="card">
        <table className="tabella">
          <thead><tr><th scope="col"></th><th scope="col">Partenza</th><th scope="col">Ora</th></tr></thead>
          <tbody>
            {RIGHE.map((r) => (
              <tr key={r.k}>
                <th scope="row" style={{ textAlign: 'left', color: 'inherit', fontSize: 14 }}>{r.label} <span className="piccolo">{r.unita}</span></th>
                <td>{inizio[r.k].toLocaleString('it-IT', { maximumFractionDigits: 2 })}</td>
                <td><b>{ora[r.k].toLocaleString('it-IT', { maximumFractionDigits: 2 })}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card stack" aria-labelledby="imprevisti">
        <h2 id="imprevisti" className="badge">Imprevisti 🎲</h2>
        {risultato.eventi.length === 0 ? (
          <p className="piccolo">Per ora nessun imprevisto.</p>
        ) : (
          <ul className="eventi">
            {[...risultato.eventi].reverse().map((e, i) => {
              const ev = getEvento(e.code);
              return (
                <li key={`${e.code}-${e.mese}-${i}`}>
                  <span aria-hidden>{ev.emoji}</span> <b>{etichettaMese(e.mese)}</b>: {ev.titolo}{' '}
                  <span className={`impatto i${ev.impatto}`}>impatto {IMPATTO_LABEL[ev.impatto]}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="card stack">
        <h2 className="badge">Le tue leggi</h2>
        <p>{sessione.leggi.map(titolo).join(' · ')}</p>
      </section>
      <Link className="btn chiaro" href="/storico">Le tue partite precedenti</Link>
    </div>
  );
}
