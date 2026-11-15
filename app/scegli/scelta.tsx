'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { Side } from '@/lib/sim/types';

export function SceltaItalia({ userId }: { userId: string }) {
  const router = useRouter();
  const [scelta, setScelta] = useState<Side | null>(null);
  const [conferma, setConferma] = useState(false);
  const [errore, setErrore] = useState('');
  const [invio, setInvio] = useState(false);

  async function blocca() {
    if (!scelta) return;
    setInvio(true);
    const { error } = await supabaseBrowser().from('profiles').update({ side: scelta }).eq('id', userId);
    setInvio(false);
    if (error) return setErrore(error.message);
    router.push('/vota');
    router.refresh();
  }

  return (
    <div className="stack">
      <div className="scelta" role="group" aria-label="Scegli la tua Italia">
        {(['sinistra', 'destra'] as const).map((s) => (
          <button key={s} type="button"
            className={`carta ${s === 'sinistra' ? 'sx' : 'dx'} ${scelta && scelta !== s ? 'spenta' : ''}`}
            aria-pressed={scelta === s}
            onClick={() => { setScelta(s); setConferma(false); }}>
            <span className="mappa" aria-hidden>🇮🇹</span>
            {s}
          </button>
        ))}
      </div>

      {scelta && (
        <div className="card stack">
          <p>
            Stai per vivere nell&apos;<b className={scelta === 'sinistra' ? 'sx' : 'dx'}>Italia di {scelta.toUpperCase()}</b>.
            {' '}Non potrai più cambiare.
          </p>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input type="checkbox" checked={conferma} onChange={(e) => setConferma(e.target.checked)} />
            Ho capito: è per sempre 🔒
          </label>
          <button className={`btn ${scelta === 'sinistra' ? 'sx' : 'dx'}`} disabled={!conferma || invio} onClick={blocca}>
            {invio ? 'Salvataggio…' : 'Io vivo qui'}
          </button>
          {errore && <p className="errore" role="alert">{errore}</p>}
        </div>
      )}
    </div>
  );
}
