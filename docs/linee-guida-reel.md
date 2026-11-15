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
