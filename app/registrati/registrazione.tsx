'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { DOMANDE, LIKERT, OPZIONE_PNR, PNR, SEZIONI, type Domanda, type Risposte, type Sezione } from '@/lib/intervista/domande';
import { leggiCodiceFiscale } from '@/lib/intervista/codice-fiscale';
import type { Side } from '@/lib/sim/types';

const PASSI: ('consenso' | 'italia' | Sezione)[] = ['consenso', 'italia', 'chi-sei', 'lavoro-economia', 'politica'];

export function Registrazione() {
  const router = useRouter();
  const [passo, setPasso] = useState(0);
  const [maggiorenne, setMaggiorenne] = useState(false);
  const [informativa, setInformativa] = useState(false);
  const [consenso, setConsenso] = useState(false);
  const [side, setSide] = useState<Side | null>(null);
  const [risposte, setRisposte] = useState<Risposte>({});
  const [errore, setErrore] = useState('');
  const [invio, setInvio] = useState(false);

  const corrente = PASSI[passo];
  const domande = DOMANDE.filter((d) => d.sezione === corrente);
  const completo = domande.every((d) => risposte[d.id] !== undefined);
  const risposteDate = Object.keys(risposte).length;

  const [minorenne, setMinorenne] = useState(false);
  function rispondi(id: string, v: string) {
    setRisposte((r) => ({ ...r, [id]: v }));
  }

  async function invia() {
    setInvio(true);
    setErrore('');
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) { setInvio(false); return setErrore(error.message); }
    }
    const res = await fetch('/api/registrazione', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ side, risposte, consensoDatiDelicati: consenso }),
    });
    const json = await res.json();
    setInvio(false);
    if (!res.ok) {
      if (json.minorenne) await supabase.auth.signOut();
      return setErrore(json.errore ?? 'Errore');
    }
    router.push('/sessione');
    router.refresh();
  }

  return (
    <div className="stack">
      <span className="badge">Registrazione · {passo + 1} di {PASSI.length}</span>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={PASSI.length} aria-valuenow={passo + 1}>
        <span style={{ width: `${((passo + 1) / PASSI.length) * 100}%` }} />
      </div>

      {corrente === 'consenso' && (
        <section className="card stack">
          <h1 className="titolo">Un esperimento sociale</h1>
          <p>
            Ti faremo 30 domande, anche su opinioni politiche, genere e orientamento sessuale.
            Il codice fiscale serve solo a ricavare l&apos;anno di nascita: resta nel tuo browser e viene dimenticato subito.
            Puoi sempre scegliere <b>«Preferisco non rispondere»</b>. Non chiediamo email né nome:
            ti riconosciamo con un codice anonimo sul tuo dispositivo e salviamo solo un hash.
            <b> Le risposte non le conserviamo:</b> da queste ricaviamo un punteggio di quattro valori, che serve
            a confrontare il tuo profilo con come giochi, e il questionario viene scartato.
          </p>
          <label className="spunta"><input type="checkbox" checked={maggiorenne} onChange={(e) => setMaggiorenne(e.target.checked)} /> Ho almeno 18 anni</label>
          <label className="spunta"><input type="checkbox" checked={informativa} onChange={(e) => setInformativa(e.target.checked)} /> Ho letto <Link href="/privacy" target="_blank">l&apos;informativa privacy</Link></label>
          <label className="spunta">
            <input type="checkbox" checked={consenso} onChange={(e) => setConsenso(e.target.checked)} />
            Acconsento esplicitamente al trattamento delle mie risposte su opinioni politiche e orientamento sessuale per questa ricerca (art. 9 GDPR): vengono usate per calcolare il punteggio e poi scartate, non restano salvate. Posso ritirare il consenso e cancellare tutto in ogni momento.
          </label>
        </section>
      )}

      {corrente === 'italia' && (
        <section className="stack">
          <h1 className="titolo"><span className="grigio">Scegli la</span> tua Italia</h1>
          <p>Una volta sola, <b>e per sempre</b>.</p>
          <div className="scelta" role="radiogroup" aria-label="Scegli la tua Italia">
            {(['sinistra', 'destra'] as const).map((s) => (
              <button key={s} type="button" role="radio" aria-checked={side === s}
                className={`carta ${s === 'sinistra' ? 'sx' : 'dx'} ${side && side !== s ? 'spenta' : ''}`}
                aria-pressed={side === s} onClick={() => setSide(s)}>
                <span className="mappa" aria-hidden>🇮🇹</span>{s}
              </button>
            ))}
          </div>
          {side && <p className="card">Vivrai nell&apos;<b className={side === 'sinistra' ? 'sx' : 'dx'}>Italia di {side.toUpperCase()}</b> 🔒 Non potrai più cambiare.</p>}
        </section>
      )}

      {corrente !== 'consenso' && corrente !== 'italia' && (
        <section className="stack">
          <h1 className="titolo">{SEZIONI[corrente]}</h1>
          <p className="piccolo">{risposteDate} risposte su {DOMANDE.length}</p>
          {domande.map((d) => d.tipo === 'anno-da-cf'
            ? <CampoCodiceFiscale key={d.id} testo={d.testo} anno={risposte[d.id]}
                onAnno={(anno) => { rispondi(d.id, String(anno)); setMinorenne(false); setErrore(''); }}
                onMinorenne={() => { setMinorenne(true); setErrore('Il gioco è riservato ai maggiorenni.'); }} />
            : <CampoDomanda key={d.id} d={d} valore={risposte[d.id]} onChange={(v) => rispondi(d.id, v)} />)}
        </section>
      )}

      {errore && <p className="errore" role="alert">{errore}</p>}

      <div style={{ display: 'flex', gap: 10 }}>
        {passo > 0 && <button className="btn chiaro" type="button" onClick={() => setPasso(passo - 1)}>Indietro</button>}
        {passo < PASSI.length - 1 ? (
          <button className="btn" type="button" style={{ flex: 1 }}
            disabled={
              (corrente === 'consenso' && !(maggiorenne && informativa && consenso))
              || (corrente === 'italia' && !side)
              || (corrente !== 'consenso' && corrente !== 'italia' && !completo)
              || minorenne
            }
            onClick={() => setPasso(passo + 1)}>
            Avanti
          </button>
        ) : (
          <button className={`btn ${side === 'sinistra' ? 'sx' : 'dx'}`} type="button" style={{ flex: 1 }}
            disabled={!completo || invio} onClick={invia}>
            {invio ? 'Salvataggio…' : 'Io vivo qui'}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Il codice fiscale resta in questo componente: si ricava l'anno di nascita e si svuota il campo.
 * Al server arriva solo l'anno.
 */
function CampoCodiceFiscale({ testo, anno, onAnno, onMinorenne }: {
  testo: string; anno?: string; onAnno: (anno: number) => void; onMinorenne: () => void;
}) {
  const [cf, setCf] = useState('');
  const [errore, setErrore] = useState('');
  function ricava() {
    const esito = leggiCodiceFiscale(cf);
    setCf(''); // dimentica subito il codice fiscale
    if (!esito.ok) return setErrore(esito.errore);
    setErrore('');
    if (!esito.maggiorenne) return onMinorenne();
    onAnno(esito.annoNascita);
  }
  return (
    <div className="card domanda stack">
      <label htmlFor="cf"><b>{testo}</b></label>
      {anno ? (
        <p role="status">✅ Anno di nascita: <b>{anno}</b>. Il codice fiscale è già stato dimenticato.</p>
      ) : (
        <>
          <input id="cf" className="campo" value={cf} maxLength={16} autoComplete="off" spellCheck={false}
            inputMode="text" onChange={(e) => setCf(e.target.value.toUpperCase())} placeholder="RSSMRA85T10A562S" />
          <button type="button" className="btn" disabled={cf.length !== 16} onClick={ricava}>Ricava l&apos;anno</button>
        </>
      )}
      {errore && <p className="errore" role="alert">{errore}</p>}
    </div>
  );
}

function CampoDomanda({ d, valore, onChange }: { d: Exclude<Domanda, { tipo: 'anno-da-cf' }>; valore?: string; onChange: (v: string) => void }) {
  const opzioni =
    d.tipo === 'scelta' ? d.opzioni
      : d.tipo === 'likert' ? [...LIKERT, OPZIONE_PNR]
        : [
          ...Array.from({ length: d.max - d.min + 1 }, (_, i) => {
            const n = d.min + i;
            const testo = n === d.min ? `${n} · ${d.etichette[0]}` : n === d.max ? `${n} · ${d.etichette[1]}` : String(n);
            return { valore: String(n), testo };
          }),
          OPZIONE_PNR,
        ];
  return (
    <fieldset className="card domanda">
      <legend>{d.testo}</legend>
      <div className={d.tipo === 'scala' && d.max - d.min > 4 ? 'opzioni griglia' : 'opzioni'}>
        {opzioni.map((o) => (
          <label key={o.valore} className={`opzione ${valore === o.valore ? 'scelta-attiva' : ''} ${o.valore === PNR ? 'pnr' : ''}`}>
            <input type="radio" name={d.id} value={o.valore} checked={valore === o.valore} onChange={() => onChange(o.valore)} />
            {o.testo}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
