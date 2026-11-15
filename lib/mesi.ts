const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

/** Mese simulato (1…24, partenza gennaio 2026) → "mar 2027". */
export const etichettaMese = (m: number) => `${MESI[(m - 1) % 12]} ${2026 + Math.floor((m - 1) / 12)}`;
