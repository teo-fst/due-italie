# Due Italie – istruzioni per Claude Code

Gioco web ed esperimento sociale: due Italie identiche, una governata solo dalla destra e l'altra
solo dalla sinistra. Ogni giocatore si registra con un'intervista di 30 domande, sceglie la sua
Italia per sempre e **gioca solo con quella**: avvia partite quando vuole, vota una legge per tema,
poi **1 ora = 1 mese** per 24 mesi, con imprevisti di diversa **scala d'impatto** (1 locale … 5 estremo)
durante la giornata. A fine partita: risultati, confronto con le partite precedenti e con il profilo.
Storico: ultime 5 partite sovrapposte per vedere come divergono + record.
Regole complete: `docs/linee-guida-reel.md` (sezione v2). Non cambiarle senza chiedere.

## Stack
- **Next.js (App Router) su Vercel** – pagine in `app/`, API in `app/api/` (registrazione, sessioni, dati).
- **Supabase** – Postgres + Auth **anonima** (nessuna email). Schema in `supabase/migrations/`.
- **Motore puro e deterministico in TypeScript** – `lib/sim/` (seme + leggi = stessa storia). Nessun cron:
  lo stato della partita si calcola a ogni visita dal tempo trascorso.
- **oh-my-claudecode** – orchestrazione. Prompt di partenza: `PROMPT-AUTOPILOT.md`.
- **Chrome DevTools MCP** – verifica nel browser vero (vedi sotto).

## Comandi
- `npm install` poi committa `package-lock.json`.
- `npm test` – motore, intervista e codice fiscale, sessioni/grafico, ciclo dati (39 test, devono restare verdi).
- `npm run typecheck`, `npm run build`, `npm run dev`.
- `supabase start` / `supabase db reset`. Abilitare **Anonymous sign-ins** (Auth → Providers) e un CAPTCHA (Turnstile).
- Script SQL: `supabase/tests/01_scenari_privacy.sql` (vedi README).

## Invarianti da NON rompere
1. **Partenza identica**: ogni partita parte dallo stesso stato (2025). Gli imprevisti dipendono solo dal seme,
   gli effetti dalle leggi (interazioni). Una sola Italia per partita: niente "altra Italia" simulata.
2. **Neutralità**: per ogni tema 2 proposte per parte, tutte con pro, contro, confidenza e fonti; testi descrittivi.
   Le ampiezze seguono le evidenze, non vanno "pareggiate" a mano.
3. **Dati veri (R7)**: parametri da `docs/ricerca-parametri.md`; `verificato: true` solo dopo revisione umana;
   in produzione `STRICT_SOURCES=true`. Tutto è pubblico in `/metodo`.
4. **Scelta per sempre**: trigger `private.blocca_scelta`.
5. **Privacy**: le tabelle di gioco non contengono MAI l'id utente, email o IP: solo `hash` =
   HMAC-SHA256(user_id, `PLAYER_HASH_PEPPER`), calcolato in `lib/privacy.ts`. Nessun log con risposte o hash.
   Tutte le domande delicate hanno «Preferisco non rispondere». Minorenni bloccati. Cancellazione a cascata.
   Il **codice fiscale** si legge solo nel browser (`lib/intervista/codice-fiscale.ts`): al server arriva solo l'anno.
   Non aggiungere mai un campo, un log o una chiamata che invii il codice fiscale.
6. **Conservazione**: ultime 30 partite chiuse + record salvato a parte (`lib/sessioni.ts`, testato).
7. **Grafico storico**: ultime 5 partite, Italia di destra grigio pieno, di sinistra grigio tratteggiato, record
   arancione (sesta linea se non è tra le 5). Legenda e tabella sempre presenti.
8. **Scala d'impatto**: ogni imprevisto ha `impatto` 1-5; sul grafico della partita il cerchio cresce con l'impatto.
   Un nuovo imprevisto va aggiunto con fonte, probabilità annua e impatto coerente (es. ponte 1, colpo di Stato 5).

## Sicurezza Supabase
- RLS attiva su tutte le tabelle e **nessuna policy**: anon/authenticated non leggono nulla. Accesso solo dal
  server con `SUPABASE_SECRET_KEY` (`lib/supabase/admin.ts`), dopo `auth.getUser()`.
- Nuove tabelle: `GRANT` espliciti solo a `service_role`.
- Dopo ogni modifica allo schema: advisor (`supabase db advisors` o MCP `get_advisors`).

## Ciclo di verifica con Chrome DevTools MCP (obbligatorio prima di dire "fatto")
Con `npm run dev` attivo:
1. `new_page` su http://localhost:3000, emula un telefono 390×844 (mobile first).
2. Percorri: `/` → `/registrati` (consensi, scelta, 30 domande; codice fiscale di prova `RSSMRA85T10A562S`) → `/sessione` (vota 5 leggi) → `/storico` → `/metodo` → `/privacy`.
   Con `list_network_requests` verifica che il codice fiscale **non** compaia in nessuna richiesta.
3. Su ogni pagina: `list_console_messages` (zero errori), `list_network_requests` (nessun 4xx/5xx inatteso), `take_screenshot`.
4. Casi negativi: codice fiscale di un minorenne o sbagliato, registrarsi due volte, due partite aperte, leggi dell'altra parte via API.
5. Per vedere una partita finita senza aspettare 24 ore: in locale sposta `iniziata_at` indietro di 25 ore
   (`update sessioni set iniziata_at = now() - interval '25 hours'`), ricarica `/sessione` → `/sessione/fine` e `/storico`.
6. `performance_start_trace` sulla home: LCP < 2,5 s.

## Stile
- Grafica come il reel: sfondo a puntini, **Sinistra `#e5484d`**, **Destra `#2f55d4`**, badge neri, maiuscoletto.
- Grafico storico: grigio `#8a8f98`, arancione record `#e8590c`.
- Accessibilità: contrasto AA, controlli ≥ 48 px, `prefers-reduced-motion`.
