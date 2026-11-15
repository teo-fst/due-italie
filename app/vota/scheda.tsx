'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { Side } from '@/lib/sim/types';

interface Props {
  turnId: number;
  side: Side;
  userId: string;
  proposte: { id: number; code: string; titolo: string; descrizione: string }[];
  votoGiaDato: number | null;
  aperto: boolean;
}

export function SchedaVoto({ turnId, side, userId, proposte, votoGiaDato, aperto }: Props) {
  const router = useRouter();
  const [scelta, setScelta] = useState<number | null>(votoGiaDato);
  const [errore, setErrore] = useState('');
  const [invio, setInvio] = useState(false);
  const bloccato = votoGiaDato !== null || !aperto;

  async function vota() {
    if (scelta === null) return;
    setInvio(true);
    const { error } = await supabaseBrowser().from('votes')
      .insert({ user_id: userId, turn_id: turnId, proposal_id: scelta, side });
    setInvio(false);
    if (error) return setErrore(error.code === '23505' ? 'Hai già votato in questo turno.' : error.message);
    router.refresh();
  }

  return (
    <div className="stack" role="radiogroup" aria-label="Proposte di legge">
      {proposte.map((p) => (
        <button key={p.id} type="button" className="proposta" role="radio"
          aria-checked={scelta === p.id} aria-pressed={scelta === p.id}
          disabled={bloccato} onClick={() => setScelta(p.id)}>
          <strong>{p.titolo}</strong>
          <span className="piccolo">{p.descrizione}</span>
        </button>
      ))}
      {votoGiaDato !== null ? (
        <p className="card">✅ Hai votato. I risultati sabato.</p>
      ) : (
        <button className={`btn ${side === 'sinistra' ? 'sx' : 'dx'}`}
          disabled={!aperto || scelta === null || invio} onClick={vota}>
          🗳️ {invio ? 'Invio…' : 'Voto'}
        </button>
      )}
      {errore && <p className="errore" role="alert">{errore}</p>}
    </div>
  );
}
