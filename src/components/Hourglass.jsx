// Sand drains from the top bulb into the bottom bulb as pct goes from 1 to 0.
const CX = 60;
const T1 = 16;
const T2 = 96;
const B1 = 108;
const B2 = 188;
const HW = 40;
const TH = T2 - T1;
const BH = B2 - B1;

export default function Hourglass({ pct, running, low, done, onClick, size = 1 }) {
  const p = Math.max(0, Math.min(1, pct));
  const tY = T1 + (1 - p) * TH;
  const tHW = ((T2 - tY) * HW) / TH;
  const bY = B2 - (1 - p) * BH;
  const bHW = ((bY - B1) * HW) / BH;
  const stroke = low && running ? 'var(--red)' : 'var(--gold)';

  return (
    <svg
      width={120 * size}
      height={204 * size}
      viewBox="0 0 120 204"
      onClick={onClick}
      className={done ? 'done' : running ? 'run' : ''}
      role="button"
      aria-label={running ? 'Pause timer' : 'Start timer'}
    >
      <rect x="6" y="4" width="108" height="10" rx="5" fill="var(--wood)" />
      <rect x="8" y="5" width="104" height="4" rx="2" fill="var(--wood-hi)" />
      <rect x="6" y="190" width="108" height="10" rx="5" fill="var(--wood)" />
      <rect x="8" y="191" width="104" height="4" rx="2" fill="var(--wood-hi)" />
      <rect x="6" y="10" width="8" height="184" rx="4" fill="var(--wood)" />
      <rect x="106" y="10" width="8" height="184" rx="4" fill="var(--wood)" />

      <polygon points={`${CX - HW},${T1} ${CX + HW},${T1} ${CX},${T2}`} fill="var(--glass)" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points={`${CX - HW},${B2} ${CX + HW},${B2} ${CX},${B1}`} fill="var(--glass)" stroke="var(--gold)" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x={CX - 2} y={T2} width="4" height={B1 - T2} fill="var(--glass)" stroke="var(--gold)" strokeWidth="0.5" />

      {p > 0.003 && (
        <polygon points={`${CX - tHW},${tY} ${CX + tHW},${tY} ${CX},${T2}`} fill={low && running ? '#c08048' : 'var(--sand)'} />
      )}
      {p < 0.998 && bHW > 0.5 && (
        <polygon points={`${CX - bHW},${bY} ${CX + bHW},${bY} ${CX + HW},${B2} ${CX - HW},${B2}`} fill="var(--sand-low)" />
      )}
      {running && (
        <>
          <rect x={CX - 0.8} y={T2} width="1.6" height={B1 - T2 + 3} fill="var(--sand)" />
          <circle cx={CX} cy={B1 + 2} r="1.6" fill="var(--sand)" style={{ animation: 'drip 0.45s linear infinite' }} />
        </>
      )}
    </svg>
  );
}
