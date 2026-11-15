import { estremi, tracciato, type Linea } from '@/lib/sessioni';

const W = 320;
const H = 180;
const PAD = { l: 34, r: 8, t: 8, b: 24 };
const COLORE = { grigio: '#8a8f98', arancione: '#e8590c' } as const;

/**
 * Ultime 5 partite sovrapposte: destra = grigio pieno, sinistra = grigio tratteggiato,
 * partita record = arancione (pieno/tratteggiato con la stessa regola).
 * L'identità non è affidata solo al colore: tratteggio + legenda + tabella sotto.
 */
export function GraficoSessioni({ linee }: { linee: Linea[] }) {
  const [min, max] = estremi(linee);
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const tick = [min, Math.round((min + max) / 2), max];

  return (
    <figure className="grafico">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="g-titolo g-desc" width="100%">
        <title id="g-titolo">Traguardo mese per mese nelle ultime partite</title>
        <desc id="g-desc">
          Linee grigie piene: Italia di destra. Linee grigie tratteggiate: Italia di sinistra. In arancione la partita record.
        </desc>
        <g transform={`translate(${PAD.l},${PAD.t})`}>
          {tick.map((v) => {
            const y = ih - ((v - min) / (max - min || 1)) * ih;
            return (
              <g key={v}>
                <line x1={0} x2={iw} y1={y} y2={y} stroke="#e6e6e3" strokeWidth={1} />
                <text x={-6} y={y + 4} textAnchor="end" fontSize={10} fill="#6b7078">{v}</text>
              </g>
            );
          })}
          {[0, 12, 24].map((m) => (
            <text key={m} x={(m / 24) * iw} y={ih + 16} textAnchor="middle" fontSize={10} fill="#6b7078">{m === 0 ? 'inizio' : `${m} mesi`}</text>
          ))}
          {linee.map((l) => (
            <path key={`${l.numero}-${l.side}`} d={tracciato(l.valori, iw, ih, min, max)} fill="none"
              stroke={COLORE[l.colore]} strokeWidth={l.record ? 2.5 : 1.5} strokeOpacity={l.record ? 1 : 0.7}
              strokeDasharray={l.tratteggio ? '5 4' : undefined} strokeLinejoin="round" strokeLinecap="round">
              <title>{`Partita ${l.numero}${l.record ? ' (record)' : ''}, Italia di ${l.side}: finale ${l.valori.at(-1)}`}</title>
            </path>
          ))}
        </g>
      </svg>
      <figcaption className="legenda">
        <span><svg width="26" height="8" aria-hidden><line x1="0" x2="26" y1="4" y2="4" stroke={COLORE.grigio} strokeWidth="2" /></svg> Destra</span>
        <span><svg width="26" height="8" aria-hidden><line x1="0" x2="26" y1="4" y2="4" stroke={COLORE.grigio} strokeWidth="2" strokeDasharray="5 4" /></svg> Sinistra</span>
        <span><svg width="26" height="8" aria-hidden><line x1="0" x2="26" y1="4" y2="4" stroke={COLORE.arancione} strokeWidth="2.5" /></svg> Partita record</span>
      </figcaption>
    </figure>
  );
}
