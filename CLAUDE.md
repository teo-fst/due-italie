# Due Italie – istruzioni per Claude Code

Gioco web: due Italie identiche, una governata solo dalla destra e l'altra solo dalla sinistra.
I giocatori scelgono la loro Italia per sempre, votano le leggi il mercoledì, il sabato
un dado decide gli imprevisti e si pubblicano i risultati. 1 settimana = 1 anno.
Regole complete: `docs/linee-guida-reel.md` (R1–R11). Non cambiarle senza chiedere.

## Stack
- **Next.js (App Router) su Vercel** – pagine in `app/`, cron settimanale in `vercel.json` → `app/api/cron/settimana`.
- **Supabase** – Postgres + Auth (link magico via email) + Realtime. Schema in `supabase/migrations/`.
- **Motore di simulazione puro in TypeScript** – `lib/sim/` (nessun I/O, testato). Il ciclo settimanale è in `lib/gioco.ts`.
- **oh-my-claudecode** – orchestrazione (autopilot, piani, agenti). Prompt di partenza: `PROMPT-AUTOPILOT.md`.
- **Chrome DevTools MCP** – verifica nel browser vero (vedi "Ciclo di verifica").

## Comandi
- `npm install` poi committa `package-lock.json` (versioni bloccate).
- `npm test` – test di motore, calendario e ciclo settimanale (devono restare verdi).
- `npm run typecheck`, `npm run build`, `npm run dev`.
- `supabase start` / `supabase db reset` – database locale con la migrazione.
- Script SQL di sicurezza: `supabase/tests/01_scenari_rls.sql` (vedi README).

## Invarianti da NON rompere
1. **R1/R8 – Parità**: stesso stato iniziale e **stesso tiro di dado** per entrambe le Italie.
   Le uniche differenze ammesse sono le leggi votate e i loro effetti.
2. **Neutralità politica**: per ogni tema stesso numero di proposte per parte; ogni proposta ha
   almeno un vantaggio e un costo; ampiezza degli effetti comparabile (test in `lib/sim/engine.test.ts`).
   Testi delle proposte descrittivi, senza aggettivi di giudizio. Niente contenuti che deridono una parte.
3. **R7 – Dati veri**: nessun coefficiente in `lib/sim/catalog.ts` va in produzione senza fonte
   (`fonti` + `verificato: true`). In produzione impostare `STRICT_SOURCES=true`.
   Il modello completo è pubblico nella pagina `/metodo`.
4. **R3 – Scelta per sempre**: garantita dal trigger `private.blocca_scelta`, non solo dalla UI.
5. **Un voto per persona per turno**, solo nella propria Italia e solo a urne aperte (RLS su `votes`).
   I conteggi restano nascosti finché le urne non chiudono.

## Sicurezza Supabase
- RLS attiva su ogni tabella di `public`; le nuove tabelle richiedono `GRANT` espliciti (non sono più esposte in automatico).
- La chiave `SUPABASE_SECRET_KEY` si usa solo in `lib/supabase/admin.ts` (route cron). Mai `NEXT_PUBLIC_`.
- Funzioni `SECURITY DEFINER` solo nello schema `private` e solo come trigger.
- Policy con `(select auth.uid())`, `TO authenticated`/`TO anon`, mai `auth.role()` né `user_metadata`.
- Dopo ogni modifica allo schema: advisor di Supabase (`supabase db advisors` o MCP `get_advisors`).

## Ciclo di verifica con Chrome DevTools MCP (obbligatorio prima di dire "fatto")
Con `npm run dev` attivo:
1. `new_page` su http://localhost:3000, emula un telefono (390×844): il pubblico arriva da Instagram, quindi **mobile first**.
2. Percorri: `/` → `/accedi` → (link magico dalla casella email locale di `supabase start`, Mailpit/Inbucket: vedi `supabase status`) → `/scegli` → `/vota` → `/risultati` → `/metodo`.
3. Su ogni pagina: `list_console_messages` (zero errori), `list_network_requests` (nessun 4xx/5xx inatteso),
   `take_screenshot`. Allega gli screenshot al riepilogo.
4. Prova i casi negativi: cambiare Italia dopo la scelta, votare due volte, votare fuori dal mercoledì.
5. Chiama la route cron con `Authorization: Bearer $CRON_SECRET` e verifica `/risultati` (dado, frecce, leggi).
6. Una traccia di performance (`performance_start_trace`) sulla home: LCP sotto 2,5 s.

## Stile
- Grafica come il reel: sfondo chiaro a puntini, **Sinistra rosso `#e5484d`**, **Destra blu `#2f55d4`**,
  titoli in maiuscolo, badge neri arrotondati. Testi in italiano.
- Accessibilità: contrasto AA, pulsanti ≥ 48 px, `prefers-reduced-motion` rispettato.
