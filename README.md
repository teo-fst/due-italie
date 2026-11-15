# Due Italie

Gioco web ispirato al reel di due.italie: due Italie identiche, una governata solo dalla destra
e l'altra solo dalla sinistra. Ogni settimana è un anno: mercoledì si vota, sabato tiro di dado e risultati.

Stack: **Next.js su Vercel · Supabase · oh-my-claudecode · Chrome DevTools MCP**.

## Cosa c'è già (e cosa è stato verificato)

| Parte | Dove | Stato |
|---|---|---|
| Regole estratte dal reel | `docs/linee-guida-reel.md` | ✔ |
| Motore di simulazione | `lib/sim/` | ✔ 16 test (parità, neutralità, effetti ritardati, dado) |
| Calendario "mercoledì si vota" (Europe/Rome, ora legale) | `lib/calendario.ts` | ✔ 4 test |
| Ciclo settimanale (avvio a soglia, risoluzione, turno successivo) | `lib/gioco.ts` | ✔ 2 test con DB finto |
| Schema Supabase + RLS + trigger | `supabase/migrations/` | ✔ applicato su Postgres 16, 15 scenari di sicurezza |
| Pagine Next.js | `app/` | ✏️ scritte, **non ancora compilate** (primo compito dell'autopilot) |
| Configurazione Claude Code | `CLAUDE.md`, `.mcp.json`, `PROMPT-AUTOPILOT.md` | ✔ |

## Avvio rapido (sul tuo computer)

1. **Prerequisiti**: Node 22+, Docker (per Supabase locale), Supabase CLI, Vercel CLI, Claude Code.
2. **oh-my-claudecode** (dentro Claude Code):
   ```
   /plugin marketplace add https://github.com/Yeachan-Heo/oh-my-claudecode
   /plugin install oh-my-claudecode
   /oh-my-claudecode:omc-setup --local
   ```
3. **MCP**: in `.mcp.json` sostituisci `SOSTITUISCI_PROJECT_REF` con il ref del tuo progetto Supabase.
   Al primo uso Supabase e Vercel chiedono l'accesso nel browser (OAuth). Chrome DevTools MCP parte con `npx`.
   Per CI o script usa un token Supabase **con permessi limitati** al solo progetto.
4. **Ambiente**: `cp .env.example .env.local` e compila i valori.
5. **Database locale**: `supabase init` (se manca `supabase/config.toml`), poi `supabase start` e `supabase db reset`.
6. Apri Claude Code e incolla il prompt di `PROMPT-AUTOPILOT.md`.

## Test

```bash
npm test                       # motore + calendario + ciclo settimanale
# Scenari RLS su un Postgres qualsiasi (senza Supabase):
psql -d test -f supabase/tests/00_stub_supabase_locale.sql
psql -d test -f supabase/migrations/20261114190000_due_italie_init.sql
psql -d test -f supabase/tests/01_scenari_rls.sql
```

## Prima di andare online

- [ ] Sostituire i coefficienti segnaposto in `lib/sim/catalog.ts` e `lib/sim/events.ts` con stime documentate
      e impostare `STRICT_SOURCES=true` (il reel promette "dati veri").
- [ ] Far rileggere i testi delle proposte a persone di entrambi gli orientamenti.
- [ ] Rendere verificabile il dado (es. pubblicare l'hash del seme prima del sabato).
- [ ] Informativa privacy (email degli utenti, scelta politica dichiarata: dato personale delicato secondo il GDPR).
