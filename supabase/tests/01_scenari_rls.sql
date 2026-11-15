\set ON_ERROR_STOP 0
insert into auth.users values ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-00000000000b'),('00000000-0000-0000-0000-00000000000c');
insert into public.turns (anno, topic, vote_opens_at, vote_closes_at) values (2026,'casa', now()-interval '1 hour', now()+interval '1 hour');
insert into public.proposals (turn_id, side, code, titolo, descrizione) values
 (1,'sinistra','sx-casa-edilizia-pubblica','t','d'),(1,'sinistra','sx-casa-limite-affitti-brevi','t','d'),
 (1,'destra','dx-casa-sgravi-costruzione','t','d'),(1,'destra','dx-casa-tutela-proprietari','t','d');

\echo '== A sceglie sinistra (atteso OK)'
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000a';
update public.profiles set side='sinistra' where id = auth.uid() returning side, side_chosen_at is not null as data_ok;
\echo '== A prova a cambiare in destra (atteso ERRORE)'
update public.profiles set side='destra' where id = auth.uid();
\echo '== A prova a modificare created_at (atteso permesso negato)'
update public.profiles set created_at = now() where id = auth.uid();
\echo '== A vede solo il proprio profilo (atteso 1)'
select count(*) from public.profiles;
\echo '== A vota una proposta della sinistra (atteso OK)'
insert into public.votes (user_id, turn_id, proposal_id, side) values (auth.uid(), 1, 1, 'sinistra');
\echo '== A vota di nuovo (atteso ERRORE chiave duplicata)'
insert into public.votes (user_id, turn_id, proposal_id, side) values (auth.uid(), 1, 2, 'sinistra');
\echo '== A vota a nome di B (atteso ERRORE RLS)'
insert into public.votes (user_id, turn_id, proposal_id, side) values ('00000000-0000-0000-0000-00000000000b', 1, 3, 'destra');
\echo '== A vede i conteggi a urne aperte (atteso 0)'
select count(*) from public.vote_counts;
\echo '== A prova a gonfiare i contatori (atteso permesso negato)'
update public.counters set value = 999;
\echo '== A prova a chiamare la funzione privata (atteso permesso negato)'
select private.conta_voto();

reset role;
\echo '== B sceglie destra e prova a votare una proposta della sinistra (atteso ERRORE RLS)'
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000b';
update public.profiles set side='destra' where id = auth.uid();
insert into public.votes (user_id, turn_id, proposal_id, side) values (auth.uid(), 1, 1, 'sinistra');
insert into public.votes (user_id, turn_id, proposal_id, side) values (auth.uid(), 1, 1, 'destra');
\echo '== B vota la propria proposta (atteso OK)'
insert into public.votes (user_id, turn_id, proposal_id, side) values (auth.uid(), 1, 3, 'destra');
reset role;

\echo '== C senza Italia scelta prova a votare (atteso ERRORE RLS)'
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000c';
insert into public.votes (user_id, turn_id, proposal_id, side) values (auth.uid(), 1, 1, 'sinistra');
reset role;

\echo '== anon: legge turni e contatori, non voti né profili'
set role anon;
select key, value from public.counters order by key;
select count(*) as turni from public.turns;
select count(*) from public.votes;
select count(*) from public.profiles;
reset role;

\echo '== chiusura urne: ora i conteggi sono pubblici (atteso 2 righe)'
update public.turns set vote_closes_at = now() - interval '1 second', vote_opens_at = now() - interval '2 hours';
set role anon;
select side, voti from public.vote_counts order by side;
reset role;
\echo '== voto dopo la chiusura (atteso ERRORE RLS)'
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000c';
reset role;
update public.profiles set side='sinistra' where id='00000000-0000-0000-0000-00000000000c';
set role authenticated; set request.jwt.sub = '00000000-0000-0000-0000-00000000000c';
insert into public.votes (user_id, turn_id, proposal_id, side) values (auth.uid(), 1, 2, 'sinistra');
reset role;
\echo '== service_role scrive gli stati (atteso OK)'
set role service_role;
insert into public.world_states (side, anno, occupazione, inflazione, debito, gradimento, punteggio) values ('sinistra', 2026, 62.5, 1.7, 135, 50, 65.4);
reset role;
