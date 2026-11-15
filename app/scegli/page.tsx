import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { SceltaItalia } from './scelta';

export const dynamic = 'force-dynamic';

export default async function Scegli() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/accedi');

  const { data: profilo } = await supabase.from('profiles').select('side').eq('id', user.id).single();
  if (profilo?.side) redirect('/vota');

  return (
    <div className="stack">
      <span className="badge">Come funziona · 1</span>
      <h1 className="titolo"><span className="grigio">Scegli la</span> tua Italia</h1>
      <p>Una volta sola, <b>e per sempre</b>. Poi ogni mercoledì voterai le leggi del tuo Paese.</p>
      <SceltaItalia userId={user.id} />
    </div>
  );
}
