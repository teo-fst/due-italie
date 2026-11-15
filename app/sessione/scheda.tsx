'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Side } from '@/lib/sim/types';

interface Tema {
  topic: string;
  label: string;
  proposte: { code: string; titolo: string; descrizione: string; pro: string; contro: string; confidenza: string }[];
}

export function SchedaLeggi({ side, temi }: { side: Side; temi: Tema[] }) {
  const router = useRouter();
  const [scelte, setScelte] = useState<Record<string, string>>({});
  const [errore, setErrore] = useState('');
  const [invio, setInvio] = useState(false);
  const complete = temi.every((t) => scelte[t.topic]);

  async function avvia() {
    setInvio(true);
    setErrore('');
    const res = await fetch('/api/sessioni', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ leggi: temi.map((t) => scelte[t.topic]) }),
    });
    const json = await res.json();
    setInvio(false);
    if (!res.ok) return setErrore(json.errore ?? 'Errore');
    router.refresh();
  }

  return (
    <div className="stack">
      {temi.map((t) => (
        <fieldset key={t.topic} className="card stack">
          <legend className="badge">{t.label}</legend>
          {t.proposte.map((p) => (
            <label key={p.code} className={`proposta ${scelte[t.topic] === p.code ? 'scelta-attiva' : ''}`}>
              <input type="radio" name={t.topic} value={p.code} checked={scelte[t.topic] === p.code}
                onChange={() => setScelte((s) => ({ ...s, [t.topic]: p.code }))} />
              <strong>{p.titolo}</strong>
              <span className="piccolo">{p.descrizione}</span>
              <span className="pro">＋ {p.pro}</span>
              <span className="contro">－ {p.contro}</span>
              <span className="piccolo">Affidabilità delle stime: {p.confidenza}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <button className={`btn ${side === 'sinistra' ? 'sx' : 'dx'}`} disabled={!complete || invio} onClick={avvia}>
        🗳️ {invio ? 'Avvio…' : 'Voto e avvio la partita'}
      </button>
      {errore && <p className="errore" role="alert">{errore}</p>}
    </div>
  );
}
