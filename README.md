# Due Italie

Gioco web ed esperimento sociale ispirato al reel di due.italie: due Italie identiche, una governata
solo dalla destra e l'altra solo dalla sinistra. Ti registri con un'intervista di 30 domande, scegli
la tua Italia per sempre e giochi partite quando vuoi: voti una legge per tema, poi **ogni ora passa
un mese** per due anni, con imprevisti di diversa gravità. Lo storico mostra come le tue partite divergono.

Stack: **Next.js su Vercel · Supabase · oh-my-claudecode · Chrome DevTools MCP**.

## Cosa c'è e cosa è stato verificato

| Parte | Dove | Stato |
|---|---|---|
| Regole del reel + modifiche v2 | `docs/linee-guida-reel.md` | ✔ |
| Parametri da ricerca documentata | `docs/ricerca-parametri.md`, `lib/sim/` | ✔ in attesa di revisione umana (`verificato: false`) |
| Motore mensile deterministico, 19 imprevisti con scala d'impatto 1-5 | `lib/sim/` | ✔ 19 test (Monte Carlo incluso) |
| Intervista di 30 domande, profilo, confronto con il gioco, codice fiscale → anno | `lib/intervista/` | ✔ 10 test |
| Ultime 30 partite + record, grafico ultime 5 + record, cerchi degli imprevisti | `lib/sessioni.ts` | ✔ 7 test |
| Ciclo dati: registrazione, 40 partite, pulizia, cancellazione | `lib/store.ts` | ✔ 3 test con DB finto |
| Schema Supabase (hash, RLS chiusa, scelta per sempre, cascata) | `supabase/migrations/` | ✔ applicato su Postgres 16, 9 scenari |
| Pagine Next.js | `app/` | ✏️ scritte, **non ancora compilate** (primo compito dell'autopilot) |

## Avvio rapido (Windows)

1. **Prerequisiti**: Node 22+, Git, Docker Desktop (per Supabase locale), Claude Code.
2. **Ambiente**: copia `.env.example` in `.env.local` e compila i valori. Genera la chiave dell'hash con
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
3. **Supabase**: Authentication → Providers → abilita **Anonymous sign-ins** (consigliato un CAPTCHA, es. Turnstile).
   Applica la migrazione (`supabase db push` sul progetto remoto, oppure `supabase start` + `supabase db reset` in locale).
4. **Claude Code**: apri la cartella del progetto ed esegui il prompt in `PROMPT-AUTOPILOT.md`.

## Test

```bash
npm test
# Scenari di sicurezza SQL su un Postgres qualsiasi:
psql -d test -f supabase/tests/00_stub_supabase_locale.sql
psql -d test -f supabase/migrations/20261115150000_due_italie_sessioni.sql
psql -d test -f supabase/tests/01_scenari_privacy.sql
```

## Prima di andare online

- [ ] Revisione umana dei parametri (`verificato: true`) e `STRICT_SOURCES=true`.
- [ ] Testi delle proposte riletti da persone di entrambi gli orientamenti.
- [ ] DPIA, informativa completa, DPA con Supabase e Vercel (vedi `docs/privacy.md`).
- [ ] CAPTCHA sulle registrazioni anonime.
