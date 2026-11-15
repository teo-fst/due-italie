-- Scenari di sicurezza (eseguire dopo 00_stub_supabase_locale.sql e la migrazione)
\set ON_ERROR_STOP 0
\set H1 '''aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'''

\echo '== service_role registra un giocatore, punteggio e sessione (atteso OK)'
set role service_role;
insert into public.giocatori (hash, side, consenso_dati_delicati_at) values (:H1, 'sinistra', now());
insert into public.profili (hash, punteggio) values (:H1, '{"sinistraDestra":-0.4,"liberismo":0.1,"federalismo":null,"priorita":"debito"}');
\echo '== la tabella profili non ha una colonna per le risposte (atteso ERRORE: colonna inesistente)'
insert into public.profili (hash, risposte) values (repeat('c', 64), '{"orientamento":"x"}');
insert into public.sessioni (hash, numero, side, seed, leggi) values (:H1, 1, 'sinistra', 123, '{}');
\echo '== seconda sessione aperta per lo stesso giocatore (atteso ERRORE indice univoco)'
insert into public.sessioni (hash, numero, side, seed, leggi) values (:H1, 2, 'sinistra', 456, '{}');
\echo '== chiusura senza punteggio (atteso ERRORE check)'
update public.sessioni set chiusa_at = now() where hash = :H1 and numero = 1;
\echo '== chiusura corretta, poi nuova sessione (atteso OK)'
update public.sessioni set chiusa_at = now(), punteggio_finale = 65.2, serie = '{}' where hash = :H1 and numero = 1;
insert into public.sessioni (hash, numero, side, seed, leggi) values (:H1, 2, 'sinistra', 456, '{}');
\echo '== cambiare Italia (atteso ERRORE: per sempre)'
update public.giocatori set side = 'destra' where hash = :H1;
\echo '== hash non valido (atteso ERRORE check)'
insert into public.giocatori (hash, side, consenso_dati_delicati_at) values ('mario.rossi@example.com', 'destra', now());
reset role;

\echo '== anon e authenticated non vedono e non scrivono nulla (atteso permesso negato x4)'
set role anon;
select count(*) from public.giocatori;
select count(*) from public.profili;
reset role;
set role authenticated;
select count(*) from public.sessioni;
insert into public.giocatori (hash, side, consenso_dati_delicati_at) values (repeat('b', 64), 'destra', now());
reset role;

\echo '== cancellazione dei dati: a cascata (atteso 0 0 0)'
set role service_role;
delete from public.giocatori where hash = :H1;
select (select count(*) from public.profili) as profili,
       (select count(*) from public.sessioni) as sessioni,
       (select count(*) from public.record_sessioni) as record;
reset role;
