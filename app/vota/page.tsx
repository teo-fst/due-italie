import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { TOPIC_LABEL } from '@/lib/sim/catalog';
import type { Side, Topic } from '@/lib/sim/types';
import { SchedaVoto } from './scheda';

export const dynamic = 'force-dynamic';

const GIORNI = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
const fmt = (d: string) => new Date(d).toLocaleString('it-IT', {
  timeZone: 'Europe/Rome', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
});

export default async function Vota() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/accedi');

  const { data: profilo } = await supabase.from('profiles').select('side').eq('id', user.id).single();
  if (!profilo?.side) redirect('/scegli');
  const side = profilo.side as Side;

  const { data: turno } = await supabase.from('turns')
    .select('id, anno, topic, vote_opens_at, vote_closes_at')
    .is('resolved_at', null).order('anno').limit(1).maybeSingle();

  const intestazione = (
    <>
      <div className="calendario" aria-label="Si vota il mercoledì">
        {GIORNI.map((g, i) => <span key={i} className={i === 2 ? 'oggi' : ''}>{g}</span>)}
      </div>
      <p style={{ textAlign: 'center' }}><span className="badge">Mercoledì = si vota</span></p>
      <p>Vivi nell&apos;<b className={side === 'sinistra' ? 'sx' : 'dx'}>Italia di {side.toUpperCase()}</b> 🔒</p>
    </>
  );

  if (!turno) {
    return (
      <div className="stack">
        {intestazione}
        <p className="card">Il gioco non è ancora partito: si parte quando arriviamo alla soglia di iscritti.</p>
        <Link className="btn" href="/">Torna alla home</Link>
      </div>
    );
  }

  const [{ data: proposte }, { data: mioVoto }] = await Promise.all([
    supabase.from('proposals').select('id, code, titolo, descrizione')
      .eq('turn_id', turno.id).eq('side', side).order('id'),
    supabase.from('votes').select('proposal_id').eq('turn_id', turno.id).eq('user_id', user.id).maybeSingle(),
  ]);

  const ora = Date.now();
  const aperto = ora >= Date.parse(turno.vote_opens_at) && ora < Date.parse(turno.vote_closes_at);
  const chiuso = ora >= Date.parse(turno.vote_closes_at);

  return (
    <div className="stack">
      {intestazione}
      <h1 className="titolo"><span className="grigio">Anno {turno.anno}:</span> {TOPIC_LABEL[turno.topic as Topic]}</h1>
      {!aperto && !chiuso && <p className="card">Le urne aprono {fmt(turno.vote_opens_at)}.</p>}
      {chiuso && <p className="card">Urne chiuse. I risultati arrivano sabato.</p>}
      <SchedaVoto
        turnId={turno.id}
        side={side}
        userId={user.id}
        proposte={proposte ?? []}
        votoGiaDato={mioVoto?.proposal_id ?? null}
        aperto={aperto}
      />
    </div>
  );
}
