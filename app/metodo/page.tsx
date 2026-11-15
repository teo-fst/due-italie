import { CATALOG, TOPICS, TOPIC_LABEL } from '@/lib/sim/catalog';
import { EVENTI } from '@/lib/sim/events';
import { MODELLO, STATO_INIZIALE, MESI_SESSIONE } from '@/lib/sim/engine';
import { IMPATTO_LABEL, type Contributo, type Fonte } from '@/lib/sim/types';

// R7 "dati veri": tutto il modello è pubblico, con fonti e livello di confidenza di ogni numero.

const NOMI = { occupazione: 'lavoro', inflazione: 'prezzi', debito: 'debito', gradimento: 'gente' } as const;
const fmt = (c: Contributo) => {
  const segno = c.valore > 0 ? '+' : '';
  const quando = c.ritardo ? ` dopo ${c.ritardo} mesi` : ' subito';
  return `${NOMI[c.indicatore]} ${segno}${c.valore.toLocaleString('it-IT')}${c.tipo === 'flusso' ? ' l\'anno' : ''}${quando}`;
};
const Fonti = ({ fonti }: { fonti: Fonte[] }) => (
  <>{fonti.map((f) => <span key={f.etichetta}>{f.url ? <a href={f.url} rel="noopener noreferrer">{f.etichetta}</a> : f.etichetta}. </span>)}</>
);

export default function Metodo() {
  const nonVerificate = CATALOG.filter((p) => !p.verificato).length;
  return (
    <div className="stack">
      <span className="badge">Metodo</span>
      <h1 className="titolo">Come calcoliamo le conseguenze</h1>
      {nonVerificate > 0 && (
        <p className="card errore">
          Versione di prova: i parametri vengono da una ricerca documentata ma {nonVerificate} proposte attendono ancora una revisione umana.
        </p>
      )}
      <section className="card stack">
        <h2 className="badge">Regole</h2>
        <p>
          Una partita dura {MESI_SESSIONE} mesi: <b>1 ora = 1 mese</b>. Le due Italie partono uguali (dati 2025):
          lavoro {STATO_INIZIALE.occupazione}%, prezzi {STATO_INIZIALE.inflazione}%, debito {STATO_INIZIALE.debito}% del PIL,
          gente {STATO_INIZIALE.gradimento}/100. Ogni partita parte da qui, nella tua Italia: cambiano le leggi che scegli e
          gli imprevisti estratti a sorte. Le leggi attenuano o amplificano gli shock (debito alto = crisi dello spread più dolorosa;
          più rinnovabili = shock del gas più leggero). Ogni imprevisto ha una scala d&apos;impatto da 1 (locale) a 5 (estremo).
        </p>
        <p className="piccolo">
          Traguardo = lavoro × {MODELLO.punteggio.occupazione} − |prezzi − {MODELLO.inflazioneTarget}| × {MODELLO.punteggio.inflazione}
          {' '}− debito × {MODELLO.punteggio.debito} + gente × {MODELLO.punteggio.gradimento}.
          Debito senza nuove leggi: {MODELLO.debitoBaseAnnuo} punti l&apos;anno, più {MODELLO.ereditaCreditiAnno1} nel primo anno per i crediti dei bonus edilizi.
        </p>
      </section>

      {TOPICS.map((t) => (
        <section key={t} className="card stack">
          <h2 className="badge">{TOPIC_LABEL[t]}</h2>
          {CATALOG.filter((p) => p.topic === t).map((p) => (
            <div key={p.code}>
              <b className={p.side === 'sinistra' ? 'sx' : 'dx'}>{p.titolo}</b>{' '}
              <span className="piccolo">· confidenza {p.confidenza}</span>
              <div className="piccolo">{p.effetti.map(fmt).join('; ')}{p.consenso ? `; consenso ${p.consenso > 0 ? '+' : ''}${p.consenso}` : ''}</div>
              <div className="piccolo">Fonti: <Fonti fonti={p.fonti} /></div>
            </div>
          ))}
        </section>
      ))}

      <section className="card stack">
        <h2 className="badge">Imprevisti 🎲</h2>
        {[...EVENTI].sort((a, b) => a.impatto - b.impatto).map((e) => (
          <div key={e.code}>
            <b>{e.emoji} {e.titolo}</b>{' '}
            <span className="piccolo">· impatto {e.impatto} ({IMPATTO_LABEL[e.impatto]}) · {e.pAnno < 0.01 ? (e.pAnno * 100).toLocaleString('it-IT') : Math.round(e.pAnno * 100)}% l&apos;anno{e.mesi ? ' (stagionale)' : ''} · confidenza {e.confidenza}</span>
            <div className="piccolo">{e.esempio}. Fonti: <Fonti fonti={e.fonti} /></div>
          </div>
        ))}
      </section>
    </div>
  );
}
