# Prompt per oh-my-claudecode

Apri Claude Code nella cartella del progetto e incolla il blocco qui sotto.

```
autopilot: porta "Due Italie" ad app funzionante in locale e in anteprima su Vercel.

Contesto: leggi CLAUDE.md, docs/linee-guida-reel.md (sezione v2) e docs/privacy.md.
Motore, intervista, codice fiscale, sessioni, ciclo dati e migrazione sono scritti e testati
(npm test: 39 verdi); le pagine in app/ sono scritte ma mai compilate.

Obiettivi, in ordine:
1. npm install, npm test, npm run typecheck, npm run build: correggi gli errori senza cambiare
   regole di gioco, invarianti o privacy. Committa package-lock.json.
2. Supabase locale (supabase start + supabase db reset) con Anonymous sign-ins attivo; advisor senza problemi.
3. Ciclo di verifica completo con Chrome DevTools MCP come in CLAUDE.md (mobile 390x844, console pulita,
   rete senza errori, nessuna richiesta che contenga il codice fiscale, screenshot di ogni pagina, casi negativi).
4. Simula 3 partite complete spostando iniziata_at nel database locale; controlla /sessione/fine e /storico
   (linee grigie, record arancione, cerchi degli imprevisti proporzionati all'impatto).
5. Deploy di anteprima su Vercel. NON fare deploy in produzione senza chiedermelo.

Non toccare i coefficienti in lib/sim/: aspettano la revisione umana.
Alla fine dammi: cosa hai cambiato, gli screenshot, l'URL di anteprima e i punti aperti.
```
