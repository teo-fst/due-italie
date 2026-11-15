import { estremi, marcatori, tracciato } from '@/lib/sessioni';
import { IMPATTO_LABEL, type EventoAccaduto, type Side } from '@/lib/sim/types';
import { MESI_SESSIONE } from '@/lib/sim/engine';

const W = 320;
const H = 170;
const PAD = { l: 34, r: 10, t: 12, b: 24 };
const INK = '#16181d';

/**
 * Traguardo della partita mese per mese, con gli imprevisti segnati da cerchi
 * grandi quanto la loro scala d'impatto (1 locale … 5 estremo).
 */
export function GraficoPartita({ serie, eventi, side, record }: {
  serie: number[]; eventi: EventoAccaduto[]; side: Side; record?: number[] | null;
}) {
  const valori = record ? [...serie, ...record] : serie;
  const [min, max] = estremi([{ numero: 0, side, tratteggio: false, colore: 'grigio', record: false, valori }]);
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (m: number) => (m / MESI_SESSIONE) * iw;
  const y = (v: number) => ih - ((v - min) / (max - min || 1)) * ih;
  const segni = marcatori(eventi, serie);

  return (
    <figure className="grafico">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="gp-t gp-d" width="100%">
        <title id="gp-t">Traguardo della partita mese per mese</title>
        <desc id="gp-d">
          {segni.length ? `Imprevisti: ${segni.map((s) => `${s.etichetta} al mese ${s.mese}, impatto ${IMPATTO_LABEL[s.impatto]}`).join('; ')}.` : 'Nessun imprevisto finora.'}
        </desc>
        <g transform={`translate(${PAD.l},${PAD.t})`}>
          {[min, Math.round((min + max) / 2), max].map((v) => (
            <g key={v}>
              <line x1={0} x2={iw} y1={y(v)} y2={y(v)} stroke="#e6e6e3" />
              <text x={-6} y={y(v) + 4} textAnchor="end" fontSize={10} fill="#6b7078">{v}</text>
            </g>
          ))}
          {[0, 12, 24].map((m) => (
            <text key={m} x={x(m)} y={ih + 16} textAnchor="middle" fontSize={10} fill="#6b7078">{m === 0 ? 'inizio' : `${m} mesi`}</text>
          ))}
          {record && (
            <path d={tracciato(record, iw, ih, min, max)} fill="none" stroke="#e8590c" strokeWidth={1.5}
              strokeOpacity={0.8} strokeDasharray={side === 'sinistra' ? '5 4' : undefined}>
              <title>Partita record</title>
            </path>
          )}
          <path d={tracciato(serie, iw, ih, min, max)} fill="none" stroke={INK} strokeWidth={2.5}
            strokeDasharray={side === 'sinistra' ? '6 4' : undefined} strokeLinejoin="round" strokeLinecap="round" />
          {segni.map((s, i) => (
            <circle key={i} cx={x(s.mese)} cy={y(s.valore)} r={s.raggio}
              fill={s.positivo ? '#2b8a3e' : '#c92a2a'} fillOpacity={0.25}
              stroke={s.positivo ? '#2b8a3e' : '#c92a2a'} strokeWidth={1.5}>
              <title>{`${s.etichetta} – mese ${s.mese}, impatto ${IMPATTO_LABEL[s.impatto]}`}</title>
            </circle>
          ))}
        </g>
      </svg>
      <figcaption className="legenda">
        <span><svg width="26" height="8" aria-hidden><line x1="0" x2="26" y1="4" y2="4" stroke={INK} strokeWidth="2.5" strokeDasharray={side === 'sinistra' ? '6 4' : undefined} /></svg> Questa partita</span>
        {record && <span><svg width="26" height="8" aria-hidden><line x1="0" x2="26" y1="4" y2="4" stroke="#e8590c" strokeWidth="2" /></svg> Record</span>}
        <span><svg width="30" height="14" aria-hidden><circle cx="5" cy="7" r="3" fill="#c92a2a" fillOpacity=".25" stroke="#c92a2a" /><circle cx="20" cy="7" r="6" fill="#c92a2a" fillOpacity=".25" stroke="#c92a2a" /></svg> Imprevisto (più grande = più grave)</span>
      </figcaption>
    </figure>
  );
}
