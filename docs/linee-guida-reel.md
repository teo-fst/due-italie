# Linee guida estratte dal reel

Fonte: reel Instagram dell'account **due.italie** (etichetta "Contenuti IA"), registrazione schermo del 14/11/2026.
Testo ricostruito via OCR dei sottotitoli (le parole mancanti sono tra parentesi quadre).

## Trascrizione

> Immagina: dividiamo l'Italia in due. Due copie identiche: stessa gente, stessi soldi, stessi problemi.
> In una governa solo la destra. Nell'altra, solo la sinistra. Quale arriva più lontano? Decidete voi.
> Funziona così. Primo: scegli la tua Italia. Una volta sola, e per sempre. Scrivilo nei commenti.
> Ogni mercoledì, nella tua Italia si votano le leggi: case, immigrazione, tasse, il prezzo della luce…
> E ogni settimana passa un anno intero.
> Le conseguenze? [Non] le inventiamo: vengono da dati veri.
> Come nella vita, ci sono imprevisti. E gli imprevisti li decide un dado, davanti a voi.
> Ogni sabato, i risultati: lavoro, prezzi, debito… e la gente, contenta o stufa.
> Si parte a mille follower. Seguici. In quale Italia vivresti?

## Elementi visivi

- Due sagome d'Italia identiche con "=" e badge "2 COPIE IDENTICHE": GENTE = GENTE, SOLDI = SOLDI.
- Colori: **Sinistra = rosso**, **Destra = blu**. Badge "TRAGUARDO" con due frecce (rossa e blu) che salgono.
- "COME FUNZIONA – 1 SCEGLI LA TUA ITALIA": due carte (SINISTRA rossa, DESTRA blu), lucchetto "PER SEMPRE",
  commento d'esempio "Io vivo nell'Italia di SINISTRA".
- Calendario L M **M** G V S D – "MERCOLEDÌ = SI VOTA". Icone leggi: CASA, IMMIGRAZIONE, TASSE (%), pulsante VOTO.
- "1 SETTIMANA = 1 ANNO": contatore 2026 → 2027.
- "OPINIONI" barrato (le conseguenze non sono opinioni).
- "IMPREVISTI": siccità, pandemie, fortuna. Icona dado.
- Tabella "SABATO · RISULTATI" Sinistra/Destra con frecce su/giù: LAVORO, PREZZI, DEBITO, GENTE.
- Barra "108 / 1.000 – A 1.000 SI PARTE".
- Stile: sfondo chiaro a puntini, omino stilizzato grigio con scarpe rossa/blu, testo in maiuscolo parola per parola.

## Regole di gioco (normalizzate)

| # | Regola | Traduzione nel gioco web |
|---|--------|--------------------------|
| R1 | Due Italie identiche all'avvio | Stesso stato iniziale per entrambi i mondi |
| R2 | Una governata solo da destra, l'altra solo da sinistra | Le proposte di legge di ciascun mondo provengono dal programma di quella parte |
| R3 | Scegli la tua Italia una volta sola, per sempre | Scelta irreversibile, bloccata nel database |
| R4 | Ogni mercoledì si votano le leggi | Finestra di voto il mercoledì (Europe/Rome), un voto per utente |
| R5 | Temi: case, immigrazione, tasse, prezzo della luce… | Un tema per turno, a rotazione |
| R6 | 1 settimana = 1 anno | Ogni turno avanza l'anno di 1, a partire dal 2026 |
| R7 | Conseguenze da dati veri, non opinioni | Effetti in una tabella parametri con fonte obbligatoria per ogni valore |
| R8 | Imprevisti decisi da un dado, davanti a voi | Tiro di dado pubblico e registrato, **uguale per entrambe le Italie** |
| R9 | Sabato i risultati: lavoro, prezzi, debito, gente | Indicatori: occupazione, inflazione, debito/PIL, gradimento |
| R10 | Si parte a 1.000 | Il primo turno si apre quando 1.000 utenti hanno scelto la loro Italia |
| R11 | Vince chi "arriva più lontano" | Punteggio composito confrontato ogni sabato |

## Versione 2 (15/11/2026) – modifiche richieste dal committente

Sostituiscono R4, R6, R8 (in parte), R9 (in parte) e R10. Restano valide R1, R2, R3, R5, R7, R11.

| # | Regola v2 | Implementazione |
|---|-----------|-----------------|
| V1 | **Niente partenza a 1.000 iscritti** | Rimossa: si gioca subito |
| V2 | **Mondo individuale, una sola Italia**: si gioca solo con l'Italia scelta e si vede come le partite passate divergono | Nessuna "altra Italia" simulata; confronto tra le proprie partite |
| V3 | **Partita su richiesta**; si vota all'avvio (il "lunedì" della partita) | Una legge per ciascuno dei 5 temi |
| V4 | **1 ora = 1 mese**; gli imprevisti accadono durante la giornata | 24 mesi = 24 ore; probabilità mensili dalla ricerca, eventi stagionali |
| V5 | **Intervista di 30 domande** solo alla registrazione: politica (sinistra/destra, liberismo, federalismo), economia/lavoro, età, genere, orientamento sessuale | `lib/intervista/domande.ts`; tutte le delicate con «Preferisco non rispondere»; minorenni esclusi |
| V5b | **Codice fiscale solo per l'anno di nascita**, poi dimenticato | Letto e verificato nel browser; al server arriva solo l'anno; il campo si svuota subito |
| V6 | A fine partita: quanto il profilo è **coerente o si discosta** dal gioco | `confrontaConGioco` in `lib/intervista/profilo.ts` |
| V7 | **Esperimento sociale con hash per giocatore**: si salvano scelta iniziale e "timing di vita" | HMAC-SHA256 con chiave segreta; tabelle senza id utente; vedi `docs/privacy.md` |
| V8 | **Grafico**: ultime 5 partite sovrapposte, destra grigio pieno, sinistra grigio tratteggiato, record arancione (sesta linea se disponibile) | `lib/sessioni.ts`, `app/storico/` |
| V9 | **Conservazione**: ultime 30 partite + record salvato a parte (es. 40 partite, record la 6 → restano 11…40 e la 6) | `sessioniDaCancellare`, tabella `record_sessioni` |
| V10 | Partenza **"calma" 2025** | Occupazione 62,6%, inflazione 1,6%, debito 136,7% |
| V11 | **Scala d'impatto degli imprevisti**: modificano il grafico della partita (il crollo di un ponte pesa meno di un colpo di Stato) | `impatto` 1-5 su ogni evento; cerchi sul grafico grandi quanto l'impatto |

Scelte di interpretazione da confermare: durata partita 24 mesi; record = miglior traguardo finale;
la priorità dichiarata nell'intervista si confronta con la partenza della partita; il federalismo non è
ancora misurabile nel gioco (nessuna legge sul tema).
