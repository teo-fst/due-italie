// R4: "ogni mercoledì si vota" (fuso Europe/Rome, ora legale inclusa).
const TZ = 'Europe/Rome';

/** Offset di Roma rispetto a UTC (ms) nell'istante dato. */
function offsetRoma(utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const comeUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'));
  return comeUtc - Math.floor(utcMs / 1000) * 1000;
}

/** Mezzanotte a Roma del giorno (y, m 1-12, d), espressa come Date UTC. */
export function mezzanotteRoma(y: number, m: number, d: number): Date {
  const stima = Date.UTC(y, m - 1, d);
  let t = stima - offsetRoma(stima);
  t = stima - offsetRoma(t); // seconda passata per i giorni di cambio ora
  return new Date(t);
}

/** Data di calendario a Roma per un istante. */
function giornoRoma(d: Date): { y: number; m: number; d: number; dow: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
  }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)!.value;
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday'));
  return { y: Number(g('year')), m: Number(g('month')), d: Number(g('day')), dow };
}

/**
 * Prossima finestra di voto che INIZIA dopo `dopo`: mercoledì 00:00 → giovedì 00:00, ora di Roma.
 */
export function prossimaFinestraVoto(dopo: Date): { apre: Date; chiude: Date } {
  const oggi = giornoRoma(dopo);
  let giorni = (3 - oggi.dow + 7) % 7; // 3 = mercoledì
  let apre = mezzanotteRoma(oggi.y, oggi.m, oggi.d + giorni);
  if (apre.getTime() <= dopo.getTime()) {
    giorni += 7;
    apre = mezzanotteRoma(oggi.y, oggi.m, oggi.d + giorni);
  }
  const chiude = mezzanotteRoma(oggi.y, oggi.m, oggi.d + giorni + 1);
  return { apre, chiude };
}
