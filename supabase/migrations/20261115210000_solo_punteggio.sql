-- GDPR: l'intervista non si conserva.
--
-- Le 30 risposte servono solo a calcolare un punteggio (4 valori: sinistra-destra,
-- Stato-mercato, centralismo-federalismo, priorità). Il punteggio basta per il confronto
-- di fine partita, quindi il questionario non viene mai scritto nel database: una partita
-- può durare più di un giorno, chiudersi e riaprirsi, senza che le risposte persistano.
--
-- Le risposte arrivano al server, vengono convalidate (completezza e blocco minorenni)
-- e scartate nello stesso istante: non esiste una colonna dove finiscano.

alter table public.interviste rename to profili;
alter table public.profili rename column profilo to punteggio;
alter table public.profili drop column risposte;

comment on table public.profili is
  'Punteggio ricavato dall''intervista. Le 30 risposte non vengono mai salvate (GDPR, minimizzazione).';
comment on column public.profili.punteggio is
  'Quattro valori: sinistraDestra, liberismo, federalismo, priorita. Serve al confronto di fine partita.';

-- i privilegi seguono la tabella rinominata: li riaffermo perché l'invariante resti esplicito
revoke all on public.profili from anon, authenticated;
grant all on public.profili to service_role;
