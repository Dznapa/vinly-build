'use client';

/* Inventory gauge — Bloomberg-deadpan SESH/Ticker readout.
   Horizontal red→yellow→green gradient track with a wine-bottle marker at the
   current percent. A status badge (label + colored dot) and a muted microline
   update in lockstep with the depletion band. The bottle marker jitters subtly,
   and slow live drift nudges it leftward so it feels like a real, depleting SESH.

   Accepts `percentRemaining` (0–100, controlled) OR `initial`/`total` (drifts). */

import { useEffect, useState } from 'react';

type Props = {
  percentRemaining?: number; // 0–100, controlled (no drift when provided)
  initial?: number; // bottles currently available
  total?: number; // total in the drop
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
};

type Stage = { label: string; color: string; micro: string };

// Threshold map — band by percent remaining. "CLOSED" at zero, never "SOLD OUT".
function stageFor(pct: number): Stage {
  if (pct <= 0)  return { label: 'CLOSED',       color: '#6B7A8D', micro: "Floor's closed. Next drop soon." };
  if (pct < 8)   return { label: 'ALMOST GONE',  color: '#E23D3D', micro: 'Last of the tape.' };
  if (pct < 18)  return { label: 'LAST CALL',    color: '#F2603D', micro: "Bottles don't reprint." };
  if (pct < 30)  return { label: 'THINNING OUT', color: '#F2913D', micro: "Supply's getting honest." };
  if (pct < 45)  return { label: 'MOVING FAST',  color: '#F2C53D', micro: 'Bottles are leaving.' };
  if (pct < 65)  return { label: 'VOLUME UP',    color: '#A8C93A', micro: 'The room noticed.' };
  if (pct < 90)  return { label: 'TRADING',      color: '#3DD56D', micro: 'Prices move. Watch the tape.' };
  return            { label: 'OPEN',          color: '#3DD56D', micro: 'Prices move. Watch the tape.' };
}

export default function InventoryBar({
  percentRemaining,
  initial = 6,
  total = 12,
  size = 'md',
  variant = 'dark',
}: Props) {
  const controlled = typeof percentRemaining === 'number';
  const [left, setLeft] = useState<number>(Math.max(0, Math.min(total, initial)));

  // Live drift — slow, occasional sale (only when uncontrolled).
  useEffect(() => {
    if (controlled) return;
    const id = window.setInterval(() => {
      setLeft((n) => (n > 0 && Math.random() < 0.18 ? n - 1 : n));
    }, 6000);
    return () => window.clearInterval(id);
  }, [controlled]);

  const pct = controlled
    ? Math.max(0, Math.min(100, percentRemaining as number))
    : total > 0
      ? Math.max(0, Math.min(1, left / total)) * 100
      : 0;
  const stage = stageFor(pct);

  return (
    <div
      className={`vinly-gauge vinly-gauge--${size} vinly-gauge--${variant}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={`Inventory: ${stage.label}`}
    >
      <div className="vinly-gauge-head">
        <span className="vinly-gauge-eyebrow">Inventory</span>
        <span className="vinly-gauge-stage" style={{ color: stage.color, background: `${stage.color}1f` }}>
          <span className="vinly-gauge-stage-dot" style={{ background: stage.color }} />
          {stage.label}
        </span>
      </div>
      <div className="vinly-gauge-track-wrap">
        <div className="vinly-gauge-track" />
        <div className="vinly-gauge-marker" style={{ left: `${pct}%` }} aria-hidden>
          <i className="fa-solid fa-wine-bottle vinly-gauge-bottle" aria-hidden />
        </div>
      </div>
      <div className="vinly-gauge-axis">
        <span>EMPTY</span>
        <span>FULL</span>
      </div>
      <div className="vinly-gauge-micro">{stage.micro}</div>
    </div>
  );
}
