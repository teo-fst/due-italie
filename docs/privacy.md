# Privacy e GDPR – note tecniche per il titolare del trattamento

Questo non è un parere legale: è la descrizione di come il codice tratta i dati, per chi deve
scrivere informativa, registro dei trattamenti e valutazione d'impatto.

## Perché l'hash non basta

Un hash del giocatore è **pseudonimizzazione** (art. 4.5 GDPR): i dati restano personali
(considerando 26), perché chi ha la chiave e l'account può ricollegarli alla persona. Quindi valgono
tutti gli obblighi del GDPR. L'hash riduce il rischio, non lo elimina.

## Dati trattati

| Dato | Categoria | Dove |
|---|---|---|
| Anno di nascita (ricavato dal codice fiscale nel browser) | Personale | `interviste.risposte.anno` |
| Opinioni politiche (autocollocazione, 16 affermazioni, fiducia nell'UE) | **Particolare, art. 9** | `interviste.risposte` |
| Orientamento sessuale | **Particolare, art. 9** | `interviste.risposte` |
| Genere, fascia d'età, zona, lavoro, studio, reddito, casa | Personali | `interviste.risposte` |
| Scelta dell'Italia (sinistra/destra) | Rivela opinioni politiche: trattarla come **art. 9** | `giocatori.side` |
| Timing di vita (inizio e fine partite), leggi votate, risultati | Personali (comportamento) | `sessioni`, `record_sessioni` |

## Misure già nel codice

- **Nessuna email, nome o IP** nelle tabelle di gioco; accesso con account anonimo di Supabase.
- **HMAC-SHA256(user_id, PLAYER_HASH_PEPPER)**: senza la chiave segreta, chi vede il database non risale all'account.
- **RLS senza policy**: dal browser non si legge nessuna tabella; solo il server con la chiave secret.
- **Consenso esplicito e separato** per i dati art. 9 (art. 9.2.a), registrato con data (`consenso_dati_delicati_at`).
- **Minimizzazione**: ogni domanda delicata ha «Preferisco non rispondere»; età in fasce.
- **Codice fiscale mai trasmesso**: il browser ne verifica il carattere di controllo, ricava data di nascita e
  maggiore età, invia solo l'anno e svuota il campo. Il CF non passa dal server, dai log né dal database.
  È un controllo di plausibilità, non una verifica d'identità.
- **Minorenni esclusi**: se il CF indica meno di 18 anni la registrazione si ferma (e il server rifiuta comunque
  anni di nascita successivi all'anno corrente meno 18).
- **Conservazione limitata**: ultime 30 partite + record.
- **Diritto alla cancellazione**: pulsante in `/privacy`, cancellazione a cascata + eliminazione dell'account anonimo.

## Cosa resta da fare (non è codice)

1. **DPIA obbligatoria** (art. 35): trattamento di categorie particolari a fini di profilazione/ricerca.
2. **Informativa** completa (artt. 13-14): titolare, finalità, base giuridica, conservazione, diritti, contatti DPO se presente.
3. **Base giuridica per la ricerca** (art. 9.2.a consenso, ed eventualmente art. 89 per fini di ricerca scientifica)
   e regole per pubblicare solo **dati aggregati** con soglie minime (es. nessun incrocio con meno di 10 persone).
4. **Fornitori**: Supabase e Vercel come responsabili del trattamento (DPA), regione dati UE.
5. **Revoca del consenso** = cancellazione (già implementata) e informativa su cosa succede ai dati già aggregati.
6. **Chiave PLAYER_HASH_PEPPER**: conservarla in un gestore di segreti; se si perde, i dati non sono più collegabili ai giocatori.
7. **Uso a scuola**: con studenti minorenni questa versione non va usata.
