'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Ricarica i dati della pagina ogni `secondi` (i mesi passano ogni ora). */
export function AutoAggiorna({ secondi }: { secondi: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), secondi * 1000);
    return () => clearInterval(id);
  }, [router, secondi]);
  return null;
}
