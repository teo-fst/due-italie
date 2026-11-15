'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export function CancellaDati() {
  const router = useRouter();
  const [conferma, setConferma] = useState(false);
  const [stato, setStato] = useState<'idle' | 'invio' | 'fatto' | 'errore'>('idle');
  const [msg, setMsg] = useState('');

  async function cancella() {
    setStato('invio');
    const res = await fetch('/api/dati', { method: 'DELETE' });
    if (res.status === 401) { setStato('fatto'); setMsg('Non ci sono dati collegati a questo dispositivo.'); return; }
    const json = await res.json();
    if (!res.ok) { setStato('errore'); setMsg(json.errore ?? 'Errore'); return; }
    await supabaseBrowser().auth.signOut();
    setStato('fatto');
    setMsg('Fatto: tutti i tuoi dati sono stati cancellati.');
    router.refresh();
  }

  if (stato === 'fatto') return <p role="status">{msg}</p>;
  return (
    <div className="stack">
      <label className="spunta">
        <input type="checkbox" checked={conferma} onChange={(e) => setConferma(e.target.checked)} />
        Ho capito che la cancellazione è definitiva
      </label>
      <button className="btn sx" disabled={!conferma || stato === 'invio'} onClick={cancella}>
        {stato === 'invio' ? 'Cancellazione…' : 'Cancella i miei dati'}
      </button>
      {stato === 'errore' && <p className="errore" role="alert">{msg}</p>}
    </div>
  );
}
