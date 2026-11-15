import { redirect } from 'next/navigation';
import { contesto } from '@/lib/auth-server';
import { Registrazione } from './registrazione';

export const dynamic = 'force-dynamic';

export default async function Registrati() {
  const ctx = await contesto();
  if (ctx?.giocatore) redirect('/sessione');
  return <Registrazione />;
}
