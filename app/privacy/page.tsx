import { CancellaDati } from './cancella';

export default function Privacy() {
  return (
    <div className="stack">
      <span className="badge">Privacy</span>
      <h1 className="titolo">Come trattiamo i tuoi dati</h1>
      <section className="card stack">
        <p className="errore">
          Bozza tecnica: il titolare del trattamento deve completare questa informativa
          (titolare, finalità di ricerca, base giuridica, conservazione, diritti) e la valutazione d&apos;impatto (DPIA)
          prima della pubblicazione.
        </p>
        <h2 className="badge">Cosa salviamo</h2>
        <ul>
          <li>La tua <b>scelta iniziale</b> (Italia di sinistra o di destra) e la data del consenso.</li>
          <li>Le <b>30 risposte dell&apos;intervista</b> e il profilo calcolato.</li>
          <li>Il <b>timing di vita</b> delle partite (inizio e fine), le leggi votate e i risultati.</li>
          <li>Solo le ultime 30 partite, più la partita record.</li>
        </ul>
        <h2 className="badge">Come ti identifichiamo</h2>
        <p>
          Nessuna email, nessun nome. Il tuo dispositivo riceve un account anonimo; nel database di gioco
          c&apos;è solo un codice (hash HMAC-SHA256) calcolato con una chiave segreta che resta sul server.
          È una <b>pseudonimizzazione</b>: per la legge i dati restano personali, quindi hai tutti i diritti del GDPR.
        </p>
        <h2 className="badge">Dati delicati</h2>
        <p>
          Opinioni politiche e orientamento sessuale sono categorie particolari (art. 9 GDPR): li raccogliamo solo con il tuo
          consenso esplicito e puoi sempre rispondere «Preferisco non rispondere». Il gioco è riservato ai maggiorenni.
        </p>
      </section>
      <section className="card stack">
        <h2 className="badge">Cancella tutto</h2>
        <p>Elimina scelta, intervista, partite, record e l&apos;account anonimo. Non si può annullare.</p>
        <CancellaDati />
      </section>
    </div>
  );
}
