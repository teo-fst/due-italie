'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function Accedi() {
  const [email, setEmail] = useState('');
  const [stato, setStato] = useState<'idle' | 'invio' | 'inviato' | 'errore'>('idle');
  const [messaggio, setMessaggio] = useState('');

  async function invia(e: React.FormEvent) {
    e.preventDefault();
    setStato('invio');
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${site}/auth/callback` },
    });
    if (error) {
      setStato('errore');
      setMessaggio(error.message);
    } else {
      setStato('inviato');
    }
  }

  return (
    <div className="stack">
      <span className="badge">Entra</span>
      <h1 className="titolo">Ti mandiamo un link via email</h1>
      {stato === 'inviato' ? (
        <p className="card">Controlla la posta: apri il link da questo dispositivo per entrare.</p>
      ) : (
        <form className="card stack" onSubmit={invia}>
          <label htmlFor="email">La tua email</label>
          <input id="email" type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} />
          <button className="btn" type="submit" disabled={stato === 'invio'}>
            {stato === 'invio' ? 'Invio…' : 'Mandami il link'}
          </button>
          {stato === 'errore' && <p className="errore" role="alert">{messaggio}</p>}
        </form>
      )}
    </div>
  );
}
