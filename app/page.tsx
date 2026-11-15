import Link from 'next/link';
import { contesto } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const ctx = await contesto();
  const registrato = Boolean(ctx?.giocatore);

  return (
    <div className="stack">
      <span className="badge">2 copie identiche</span>
      <h1 className="titolo">
        <span className="grigio">Immagina:</span> dividiamo l&apos;Italia in due.
      </h1>
      <p>
        Stessa gente, stessi soldi, stessi problemi. In una governa solo la{' '}
        <b className="dx">destra</b>, nell&apos;altra solo la <b className="sx">sinistra</b>.
        Quale arriva più lontano? <b>Decidi tu.</b>
      </p>

      <section className="card stack" aria-labelledby="come">
        <h2 id="come" className="badge">Come funziona</h2>
        <ol>
          <li><b>Registrati</b> con un&apos;intervista di 30 domande (una volta sola). Il codice fiscale serve solo per l&apos;anno di nascita e non viene salvato.</li>
          <li><b>Scegli la tua Italia.</b> Una volta sola, e per sempre.</li>
          <li><b>Avvia una partita quando vuoi</b> e vota una legge per tema: case, immigrazione, tasse, luce, lavoro.</li>
          <li><b>Ogni ora passa un mese.</b> In 24 ore vivi due anni, con gli imprevisti che arrivano durante la giornata.</li>
          <li>Gli imprevisti hanno una <b>scala d&apos;impatto</b>: il crollo di un ponte pesa meno di un colpo di Stato.</li>
          <li>Alla fine vedi i risultati, come <b>diverge dalle tue partite precedenti</b> e quanto il gioco somiglia al tuo profilo.</li>
        </ol>
        <p className="piccolo">
          Le conseguenze seguono un modello pubblico con le fonti di ogni numero: <Link href="/metodo">leggi il metodo</Link>.
          È un esperimento sociale: <Link href="/privacy">come trattiamo i dati</Link>.
        </p>
      </section>

      <Link className="btn" href={registrato ? '/sessione' : '/registrati'}>
        {registrato ? 'Vai alla partita' : 'In quale Italia vivresti?'}
      </Link>
    </div>
  );
}
