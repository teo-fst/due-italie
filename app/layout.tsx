import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Due Italie',
  description: 'Due Italie identiche: una la governa solo la destra, l\'altra solo la sinistra. Quale arriva più lontano?',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f3f3f1' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <nav className="top" aria-label="Navigazione principale">
          <Link href="/">Home</Link>
          <Link href="/sessione">Gioca</Link>
          <Link href="/storico">Storico</Link>
          <Link href="/metodo">Metodo</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
