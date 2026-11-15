# Prompt per oh-my-claudecode

Apri Claude Code nella cartella del progetto e incolla il blocco qui sotto.

```
autopilot: porta "Due Italie" da kit di partenza ad app funzionante in locale e su Vercel.

Contesto: leggi CLAUDE.md e docs/linee-guida-reel.md. Il motore (lib/sim), il calendario,
il ciclo settimanale (lib/gioco.ts) e la migrazione Supabase sono già scritti e testati;
le pagine in app/ sono scritte ma mai compilate.

Obiettivi, in ordine:
1. npm install, poi npm test (deve restare verde), npm run typecheck e npm run build:
   correggi gli errori senza cambiare le regole di gioco né gli invarianti di CLAUDE.md.
2. supabase start + supabase db reset. Esegui gli advisor e correggi i problemi.
   Verifica che i conteggi voti restino invisibili a urne aperte.
3. Ciclo di verifica completo con Chrome DevTools MCP come descritto in CLAUDE.md
   (mobile 390x844, console pulita, rete senza errori, screenshot di ogni pagina, casi negativi).
4. Simula 3 settimane di gioco: abbassa SOGLIA_AVVIO a 2 in .env.local, crea 2 utenti
   (uno per Italia), sposta le finestre di voto nel DB per votare subito, chiama la route cron
   e controlla /risultati dopo ogni "sabato".
5. Prepara il deploy: collega il progetto Supabase remoto (supabase link, db push),
   imposta le variabili d'ambiente su Vercel (vedi .env.example), deploy di anteprima.
   NON fare deploy in produzione e NON impostare STRICT_SOURCES=false in produzione senza chiedermelo.

Non toccare i coefficienti in lib/sim/catalog.ts: sono segnaposto in attesa di fonti verificate.
Alla fine dammi: cosa hai cambiato, gli screenshot, l'URL di anteprima, e i punti aperti.
```

## Prompt successivi utili

- `ralplan: piano per sostituire i coefficienti segnaposto di lib/sim/catalog.ts con stime documentate (UPB, Banca d'Italia, ISTAT, OCSE), una proposta alla volta, con fonte e link; mostrami ogni proposta prima di marcarla verificata.`
- `autopilot: aggiungi una pagina /storia con il grafico anno per anno dei quattro indicatori delle due Italie, verificata con Chrome DevTools MCP su mobile.`
- `autopilot: aggiungi un'immagine Open Graph dinamica con i risultati del sabato, da condividere su Instagram.`
