-- Due Italie – sessioni individuali, dati pseudonimizzati
--
-- Privacy by design:
--  * nessuna tabella di gioco contiene l'id utente di Supabase Auth né email:
--    ogni giocatore è identificato da `hash` = HMAC-SHA256(user_id, PLAYER_HASH_PEPPER),
--    calcolato solo lato server. ATTENZIONE: è pseudonimizzazione, non anonimizzazione:
--    per il GDPR restano dati personali (considerando 26).
--  * tutte le tabelle hanno RLS attiva e NESSUNA policy: anon e authenticated non vedono nulla;
--    legge e scrive solo il server (chiave secret) dopo aver verificato la sessione dell'utente.
--  * cancellazione a cascata partendo da `giocatori` (diritto all'oblio).

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ───────────── giocatori: scelta iniziale (per sempre) e consenso ─────────────
create table public.giocatori (
  hash text primary key check (hash ~ '^[0-9a-f]{64}$'),
  side text not null check (side in ('sinistra', 'destra')),
  consenso_dati_delicati_at timestamptz not null,
  versione_intervista smallint not null default 1,
  creato_at timestamptz not null default now()
);
alter table public.giocatori enable row level security;

create function private.blocca_scelta()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.side is distinct from old.side then
    raise exception 'La scelta dell''Italia è per sempre.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger giocatori_blocca_scelta
  before update on public.giocatori
  for each row execute function private.blocca_scelta();

-- ───────────── intervista (30 domande, una sola volta) ─────────────
create table public.interviste (
  hash text primary key references public.giocatori (hash) on delete cascade,
  risposte jsonb not null,
  profilo jsonb not null,
  creata_at timestamptz not null default now()
);
alter table public.interviste enable row level security;

-- ───────────── sessioni: "timing di vita" (inizio, fine) e risultati ─────────────
create table public.sessioni (
  hash text not null references public.giocatori (hash) on delete cascade,
  numero int not null check (numero > 0),
  side text not null check (side in ('sinistra', 'destra')),
  seed bigint not null check (seed between 0 and 4294967295),
  leggi jsonb not null,
  iniziata_at timestamptz not null default now(),
  chiusa_at timestamptz,
  punteggio_finale numeric(8, 2),
  serie jsonb,
  primary key (hash, numero),
  check ((chiusa_at is null) = (punteggio_finale is null))
);
alter table public.sessioni enable row level security;

-- una sola sessione aperta per giocatore
create unique index sessioni_una_aperta on public.sessioni (hash) where chiusa_at is null;

-- ───────────── record: copia della sessione migliore, conservata a parte ─────────────
create table public.record_sessioni (
  hash text primary key references public.giocatori (hash) on delete cascade,
  numero int not null,
  side text not null check (side in ('sinistra', 'destra')),
  punteggio_finale numeric(8, 2) not null,
  serie jsonb not null,
  iniziata_at timestamptz not null,
  chiusa_at timestamptz not null
);
alter table public.record_sessioni enable row level security;

-- ───────────── privilegi: solo il server ─────────────
revoke all on public.giocatori, public.interviste, public.sessioni, public.record_sessioni
  from anon, authenticated;
grant all on public.giocatori, public.interviste, public.sessioni, public.record_sessioni
  to service_role;
revoke execute on all functions in schema private from public, anon, authenticated;
