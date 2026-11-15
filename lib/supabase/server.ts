import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Client per Server Components / Route Handlers, con la sessione dell'utente (RLS attiva). */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // chiamato da un Server Component: il refresh lo fa il middleware
          }
        },
      },
    },
  );
}
