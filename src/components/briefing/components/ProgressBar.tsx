import type { CSSProperties } from 'react';

interface ProgressBarProps {
  percentage: number;
  label?: string;
  height?: number;
  showPercentageText?: boolean;
}

function getBarColor(pct: number): string {
  if (pct <= 33) return 'var(--red-9)';
  if (pct <= 66) return 'var(--orange-9)';
  return 'var(--green-9)';
}

export function ProgressBar({
  percentage,
  label = 'Avancement',
  height = 6,
  showPercentageText = true,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const color = getBarColor(clamped);

  return (
    <div
      style={{ position: 'relative', width: '100%', height, background: 'var(--gray-4)', overflow: 'hidden' }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      title={`${label} : ${clamped}%`}
    >
      {/* fill */}
      <div style={{ position: 'absolute', inset: 0, width: `${clamped}%`, background: color, transition: 'width 0.3s ease' }} />
      {/* texte par-dessus */}
      {(label || showPercentageText) && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px' }}>
          {label && <span style={{ fontSize: 10, color: '#fff', fontWeight: 600, lineHeight: 1, textShadow: '0 0 3px rgba(0,0,0,0.4)' }}>{label}</span>}
          {showPercentageText && <span style={{ fontSize: 10, color: '#fff', fontWeight: 700, fontFamily: 'monospace', lineHeight: 1, textShadow: '0 0 3px rgba(0,0,0,0.4)' }}>{clamped}%</span>}
        </div>
      )}
    </div>
  );
}
