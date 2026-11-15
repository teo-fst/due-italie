# Ricerca sui parametri (novembre 2026) – sintesi per il modello

Fonte: ricerca approfondita "Due Italie: parametri basati su evidenze per calibrare leggi e imprevisti"
(15/11/2026). Qui c'è solo ciò che serve al codice: come le evidenze sono diventate parametri,
e dove le evidenze mancano. I valori esatti sono in `lib/sim/catalog.ts` e `lib/sim/events.ts`.

## Stato iniziale

| Indicatore | "Calma" 2025 (scelto) | Novembre 2026 (alternativa) | Fonte |
|---|---|---|---|
| Occupazione 15-64 | 62,6% | 63,0% | ISTAT |
| Inflazione | 1,6% (IPCA media 2025) | 5,4% NIC (shock del gas) | ISTAT |
| Debito/PIL | 136,7% | 136,7% | ISTAT, notifica PDE ottobre 2026 |

Conversioni: 1 punto di PIL ≈ 22,6 miliardi; 1 punto di occupazione ≈ 370 mila occupati.

## Come le evidenze diventano parametri

- **Dose di riferimento**: circa 0,5% del PIL l'anno per ogni misura, per renderle confrontabili.
- **Valori**: il centro dell'intervallo basso-alto della ricerca.
- **Tempi**: ritardo (mesi prima dell'effetto), rampa, durata, rientro → `profilo()` in `lib/sim/engine.ts`.
- **Debito**: le misure di spesa sono "flussi" (punti di debito all'anno che si accumulano).
- **Consenso**: frecce della ricerca convertite in punti (↑↑ +4, ↑ +2, ↔ 0, ↓ −2, ↓↓ −4), con memoria che svanisce.
  Confidenza **bassa** per quasi tutte le misure: non esistono studi italiani robusti sul consenso.
- **Imprevisti**: p_mese = 1 − (1 − p_anno)^(1/n); stagionali solo nei loro mesi (siccità mag-set,
  ondate di calore giu-ago, alluvioni ott-mag, record del turismo giu-set).
- **Interazioni**: shock del gas × esposizione al gas (rinnovabili −30% dopo 12-36 mesi; nucleare solo dopo 120 mesi);
  spread, crisi bancarie e calo dei tassi × debito/136,7.
- **Andamento di base del debito**: identità Δd = (i − g)/(1 + g)·d − avanzo primario ≈ −0,56 punti l'anno,
  più 1,8 nel primo anno per i crediti dei bonus edilizi (UPB).

## Cosa dicono le evidenze, in breve

- **Misure con evidenze solide**: tracciabilità dei pagamenti (MEF), costi del Superbonus (UPB), dati amministrativi
  su sanatoria 2020, decreto flussi e rimpatri.
- **Energia**: il prezzo del gas lo fa il mercato europeo (TTF). Gas nazionale: effetto sul prezzo quasi nullo.
  Nucleare: nessun effetto su prezzi e occupazione entro 10 anni (Flamanville: 157 mesi di cantiere contro 54 previsti).
  Rinnovabili: abbassano il prezzo all'ingrosso, soprattutto durante gli shock del gas.
- **Letteratura divisa**: gettito netto della patrimoniale; moltiplicatori dei tagli di spesa; effetti occupazionali
  del reddito minimo.
- **Nessuna stima affidabile**: consenso di quasi tutte le misure; effetti occupazionali del SAI; elasticità degli
  sfitti ai tempi di sfratto; costi degli SMR; effetti macro dell'autonomia differenziata (esclusa dal gioco);
  danni della siccità 2022 (solo stime di associazioni, da 2 a 6 miliardi).

## Fonti di parte o secondarie da ricontrollare

Monitoraggi della società civile (Ero Straniero, ActionAid) basati su dati amministrativi; stime ex ante commissionate
per Giubileo e Olimpiadi (non usate); dato IEA sulle rinnovabili riportato da fonti secondarie; sensitività degli
interessi allo spread (0,15/0,3/0,5 punti di PIL per 100 punti base dopo 1/2/3 anni), coerente con la stima UPB 2022.

## Da fare prima della pubblicazione

1. Una persona ricontrolla ogni proposta e ogni evento contro le fonti e mette `verificato: true`.
2. Far rileggere testi, pro e contro a persone di entrambi gli orientamenti.
3. Valutare un parametro di "capacità amministrativa" (la ricerca lo indica come il fattore che spiega più varianza
   per sanatorie, flussi, rimpatri e PNRR).
4. Valutare la crescita del PIL come variabile intermedia (raccomandazione della ricerca, non ancora implementata).
