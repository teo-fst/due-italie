import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// Ritorno dal link magico ricevuto via email.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL('/scegli', url.origin));
  }
  return NextResponse.redirect(new URL('/accedi?errore=link', url.origin));
}
