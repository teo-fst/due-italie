-- Due Italie – schema iniziale
-- Note Supabase:
--  * dal 2026 le nuove tabelle in public NON sono esposte automaticamente alla Data API:
--    i GRANT espliciti in fondo sono necessari.
--  * RLS attiva su tutte le tabelle di public.
--  * Le funzioni SECURITY DEFINER stanno nello schema "private" (non esposto) e sono solo trigger.
--  * Le scritture di gioco (turni, risultati, dado) le fa solo la route cron con la chiave secret.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ───────────────────────── profili (R3: scelta una volta e per sempre) ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  side text check (side in ('sinistra', 'destra')),
  side_chosen_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profilo: leggo il mio" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profilo: aggiorno il mio" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Crea il profilo alla registrazione
create function private.crea_profilo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.crea_profilo();

-- Lucchetto "PER SEMPRE": la parte si sceglie una sola volta
create function private.blocca_scelta()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.side is not null and new.side is distinct from old.side then
    raise exception 'Hai già scelto la tua Italia: la scelta è per sempre.' using errcode = 'P0001';
  end if;
  if old.side is null and new.side is not null then
    new.side_chosen_at := now();
  end if;
  return new;
end;
$$;

create trigger profiles_blocca_scelta
  before update on public.profiles
  for each row execute function private.blocca_scelta();

-- ───────────────────────── contatori pubblici (R10: "a 1.000 si parte") ─────────────────────────
create table public.counters (
  key text primary key,
  value bigint not null default 0
);
alter table public.counters enable row level security;
create policy "contatori: lettura pubblica" on public.counters
  for select to anon, authenticated using (true);

insert into public.counters (key, value) values ('iscritti_sinistra', 0), ('iscritti_destra', 0);

create function private.conta_iscritti()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.side is null and new.side is not null then
    update public.counters set value = value + 1 where key = 'iscritti_' || new.side;
  end if;
  return new;
end;
$$;

create trigger profiles_conta_iscritti
  after update of side on public.profiles
  for each row execute function private.conta_iscritti();

-- ───────────────────────── turni (R4, R6: mercoledì si vota, 1 settimana = 1 anno) ─────────────────────────
create table public.turns (
  id bigint generated always as identity primary key,
  anno int not null unique,
  topic text not null check (topic in ('casa', 'immigrazione', 'tasse', 'energia')),
  vote_opens_at timestamptz not null,
  vote_closes_at timestamptz not null,
  -- R8: dado pubblico, uguale per entrambe le Italie
  dado smallint check (dado between 1 and 6),
  evento text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check (vote_closes_at > vote_opens_at)
);
alter table public.turns enable row level security;
create policy "turni: lettura pubblica" on public.turns
  for select to anon, authenticated using (true);

create index turns_non_risolti_idx on public.turns (vote_closes_at) where resolved_at is null;

-- ───────────────────────── proposte di legge (R2: ogni Italia vota solo le proprie) ─────────────────────────
create table public.proposals (
  id bigint generated always as identity primary key,
  turn_id bigint not null references public.turns (id) on delete cascade,
  side text not null check (side in ('sinistra', 'destra')),
  code text not null,
  titolo text not null,
  descrizione text not null,
  unique (turn_id, code)
);
alter table public.proposals enable row level security;
create policy "proposte: lettura pubblica" on public.proposals
  for select to anon, authenticated using (true);

create index proposals_turn_side_idx on public.proposals (turn_id, side);

-- ───────────────────────── voti (un voto per persona per turno) ─────────────────────────
create table public.votes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  turn_id bigint not null references public.turns (id) on delete cascade,
  proposal_id bigint not null references public.proposals (id) on delete cascade,
  side text not null check (side in ('sinistra', 'destra')),
  created_at timestamptz not null default now(),
  primary key (user_id, turn_id)
);
alter table public.votes enable row level security;

create index votes_turn_idx on public.votes (turn_id);
create index votes_proposal_idx on public.votes (proposal_id);

create policy "voti: vedo solo il mio" on public.votes
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "voti: voto nella mia Italia, solo a urne aperte" on public.votes
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.side = votes.side
    )
    and exists (
      select 1 from public.proposals pr
      where pr.id = votes.proposal_id and pr.turn_id = votes.turn_id and pr.side = votes.side
    )
    and exists (
      select 1 from public.turns t
      where t.id = votes.turn_id
        and t.resolved_at is null
        and now() >= t.vote_opens_at and now() < t.vote_closes_at
    )
  );
-- nessuna policy di update/delete: il voto non si cambia

-- ───────────────────────── conteggi (visibili solo a urne chiuse) ─────────────────────────
create table public.vote_counts (
  proposal_id bigint primary key references public.proposals (id) on delete cascade,
  turn_id bigint not null references public.turns (id) on delete cascade,
  side text not null check (side in ('sinistra', 'destra')),
  voti int not null default 0
);
alter table public.vote_counts enable row level security;

create index vote_counts_turn_idx on public.vote_counts (turn_id);

create policy "conteggi: pubblici dopo la chiusura" on public.vote_counts
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.turns t
      where t.id = vote_counts.turn_id and now() >= t.vote_closes_at
    )
  );

create function private.conta_voto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.vote_counts (proposal_id, turn_id, side, voti)
  values (new.proposal_id, new.turn_id, new.side, 1)
  on conflict (proposal_id) do update set voti = public.vote_counts.voti + 1;
  return new;
end;
$$;

create trigger votes_conta
  after insert on public.votes
  for each row execute function private.conta_voto();

-- ───────────────────────── stato delle due Italie, anno per anno (R9) ─────────────────────────
create table public.world_states (
  side text not null check (side in ('sinistra', 'destra')),
  anno int not null,
  occupazione numeric(6, 2) not null,
  inflazione numeric(6, 2) not null,
  debito numeric(6, 2) not null,
  gradimento numeric(6, 2) not null,
  punteggio numeric(8, 2) not null,
  legge_code text,
  evento text,
  -- effetti ritardati ancora da applicare (gestiti dal motore TS)
  pending jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  primary key (side, anno)
);
alter table public.world_states enable row level security;
create policy "stati: lettura pubblica" on public.world_states
  for select to anon, authenticated using (true);

-- ───────────────────────── privilegi Data API ─────────────────────────
grant usage on schema public to anon, authenticated;

grant select on public.turns, public.proposals, public.world_states, public.counters, public.vote_counts
  to anon, authenticated;

grant select on public.profiles, public.votes to authenticated;
grant update (side) on public.profiles to authenticated;
grant insert (user_id, turn_id, proposal_id, side) on public.votes to authenticated;

grant all on all tables in schema public to service_role;

-- Le funzioni trigger non devono essere chiamabili via RPC
revoke execute on all functions in schema private from public, anon, authenticated;

-- ───────────────────────── Realtime: aggiornamenti live ─────────────────────────
alter publication supabase_realtime add table public.world_states, public.counters, public.turns;
