import type { DiceFace, Evento } from './types';

// R8: gli imprevisti li decide un dado (d6), tirato in pubblico.
// Lo STESSO tiro vale per entrambe le Italie ("stessi problemi"):
// la differenza la fanno solo le leggi votate e lo stato di partenza.
// Valori segnaposto: vanno calibrati su episodi storici (siccità 2022, Covid 2020, crisi gas 2022...).

export const EVENTI: Record<DiceFace, Evento> = {
  1: {
    faccia: 1,
    code: 'siccita',
    titolo: 'Siccità',
    effetto: { inflazione: 0.4, occupazione: -0.1, gradimento: -2 },
  },
  2: {
    faccia: 2,
    code: 'pandemia',
    titolo: 'Pandemia',
    effetto: { occupazione: -0.8, debito: 3, gradimento: -3 },
    scalaConDebito: true,
  },
  3: {
    faccia: 3,
    code: 'crisi-energetica',
    titolo: 'Crisi energetica',
    effetto: { inflazione: 0.8, gradimento: -2 },
  },
  4: {
    faccia: 4,
    code: 'anno-tranquillo',
    titolo: 'Anno tranquillo',
    effetto: {},
  },
  5: {
    faccia: 5,
    code: 'boom-export',
    titolo: 'Boom dell\'export',
    effetto: { occupazione: 0.3, debito: -0.5, gradimento: 1 },
  },
  6: {
    faccia: 6,
    code: 'fortuna',
    titolo: 'Fortuna: anno record per il turismo',
    effetto: { occupazione: 0.2, debito: -1, gradimento: 1.5 },
  },
};

/**
 * Tiro del dado. In produzione `rand` è crypto.randomInt (vedi app/api/cron),
 * nei test si passa un generatore deterministico.
 */
export function tiraDado(rand: (maxExclusive: number) => number): DiceFace {
  const n = rand(6) + 1;
  if (n < 1 || n > 6 || !Number.isInteger(n)) throw new Error(`Tiro non valido: ${n}`);
  return n as DiceFace;
}
