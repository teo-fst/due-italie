import { CATALOG, TOPICS, TOPIC_LABEL } from '@/lib/sim/catalog';
import { EVENTI } from '@/lib/sim/events';
import { MODELLO, STATO_INIZIALE } from '@/lib/sim/engine';

// R7 "dati veri": tutto il modello è pubblico, comprese le fonti di ogni numero.
export default function Metodo() {
  const nonVerificate = CATALOG.filter((p) => !p.verificato).length;
  return (
    <div className="stack">
      <span className="badge">Metodo</span>
      <h1 className="titolo">Come calcoliamo le conseguenze</h1>
      {nonVerificate > 0 && (
        <p className="card errore">
          Versione di prova: {nonVerificate} proposte usano ancora valori dimostrativi senza fonte verificata.
        </p>
      )}
      <section className="card stack">
        <h2 className="badge">Partenza identica</h2>
        <p>
          Lavoro {STATO_INIZIALE.occupazione}% · Prezzi {STATO_INIZIALE.inflazione}% ·
          Debito {STATO_INIZIALE.debito}% del PIL · Gente {STATO_INIZIALE.gradimento}/100
        </p>
        <h2 className="badge">Traguardo</h2>
        <p className="piccolo">
          Punteggio = lavoro × {MODELLO.punteggio.occupazione} − |prezzi − {MODELLO.inflazioneTarget}| × {MODELLO.punteggio.inflazione}
          {' '}− debito × {MODELLO.punteggio.debito} + gente × {MODELLO.punteggio.gradimento}
        </p>
      </section>
      <section className="card stack">
        <h2 className="badge">Imprevisti (dado)</h2>
        <ul>{Object.values(EVENTI).map((e) => <li key={e.code}><b>{e.faccia}</b> – {e.titolo}</li>)}</ul>
      </section>
      {TOPICS.map((t) => (
        <section key={t} className="card stack">
          <h2 className="badge">{TOPIC_LABEL[t]}</h2>
          {CATALOG.filter((p) => p.topic === t).map((p) => (
            <div key={p.code}>
              <b className={p.side === 'sinistra' ? 'sx' : 'dx'}>{p.titolo}</b>
              <div className="piccolo">
                Subito: {JSON.stringify(p.immediato)}
                {p.ritardato && <> · Dopo {p.ritardato.dopoAnni} anni: {JSON.stringify(p.ritardato.effetto)}</>}
              </div>
              <div className="piccolo">
                Fonti:{' '}
                {p.fonti.map((f) => (
                  <span key={f.etichetta}>{f.url ? <a href={f.url}>{f.etichetta}</a> : f.etichetta} </span>
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
