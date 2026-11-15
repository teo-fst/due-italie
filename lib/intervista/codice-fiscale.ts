// Codice fiscale → anno di nascita, SOLO nel browser.
// Il codice fiscale non viene mai inviato al server né salvato: il componente lo legge,
// ricava anno e maggiore età, poi lo cancella dalla memoria della pagina.
// Nota onesta: è un controllo di plausibilità, non una verifica d'identità
// (chiunque può digitare un codice fiscale non suo).

const DISPARI: Record<string, number> = {
  '0': 1, '1': 0, '2': 5, '3': 7, '4': 9, '5': 13, '6': 15, '7': 17, '8': 19, '9': 21,
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18,
  N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
};
const MESI = 'ABCDEHLMPRST';
/** Omocodia: le cifre possono essere sostituite da queste lettere (0-9). */
const OMOCODIA = 'LMNPQRSTUV';
const FORMATO = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/;

const valorePari = (c: string) => (c >= '0' && c <= '9' ? c.charCodeAt(0) - 48 : c.charCodeAt(0) - 65);
const cifra = (c: string) => (c >= '0' && c <= '9' ? c : String(OMOCODIA.indexOf(c)));

export function carattereDiControllo(primi15: string): string {
  let somma = 0;
  for (let i = 0; i < 15; i++) {
    const c = primi15[i];
    somma += i % 2 === 0 ? DISPARI[c] : valorePari(c); // posizioni 1,3,5… (base 1) sono dispari
  }
  return String.fromCharCode(65 + (somma % 26));
}

export type EsitoCF =
  | { ok: true; annoNascita: number; maggiorenne: boolean }
  | { ok: false; errore: string };

export function leggiCodiceFiscale(input: string, oggi: Date = new Date()): EsitoCF {
  const cf = input.replace(/\s+/g, '').toUpperCase();
  if (!FORMATO.test(cf)) return { ok: false, errore: 'Il codice fiscale non ha il formato giusto (16 caratteri).' };
  if (carattereDiControllo(cf.slice(0, 15)) !== cf[15]) return { ok: false, errore: 'Il codice fiscale non è valido: controlla di averlo scritto bene.' };

  const aa = Number(cifra(cf[6]) + cifra(cf[7]));
  const mese = MESI.indexOf(cf[8]) + 1;
  let giorno = Number(cifra(cf[9]) + cifra(cf[10]));
  if (giorno > 40) giorno -= 40; // donne: giorno + 40
  if (giorno < 1 || giorno > 31) return { ok: false, errore: 'Il codice fiscale contiene una data non valida.' };

  const annoOggi = oggi.getUTCFullYear();
  const anno = 2000 + aa > annoOggi ? 1900 + aa : 2000 + aa;
  let eta = annoOggi - anno;
  const primaDelCompleanno = oggi.getUTCMonth() + 1 < mese || (oggi.getUTCMonth() + 1 === mese && oggi.getUTCDate() < giorno);
  if (primaDelCompleanno) eta -= 1;
  return { ok: true, annoNascita: anno, maggiorenne: eta >= 18 };
}
