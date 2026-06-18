'use client';

/* Inventory gauge — stage-based readout (no bottle count).
   Stage label + a horizontal gradient track (red → orange → yellow → green)
   with a marker showing how full the drop is. Live drift gradually moves the
   marker leftward (toward empty) so it feels like a real SESH. */

import { useEffect, useState } from 'react';

type Props = {
  initial?: number; // bottles currently available
  total?: number; // total in the drop
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
};

function stageFor(ratio: number) {
  if (ratio <= 0)        return { label: 'SOLD OUT',     color: '#e23b3b' };
  if (ratio < 0.18)      return { label: 'ALMOST EMPTY', color: '#e23b3b' };
  if (ratio < 0.35)      return { label: 'EMPTYING',     color: '#f08a3b' };
  if (ratio < 0.55)      return { label: 'GOING FAST',   color: '#f1c40f' };
  if (ratio < 0.78)      return { label: 'SELLING STEADY', color: '#2ecc40' };
  return                        { label: 'LOAD UP',     color: '#2ecc40' };
}

export default function InventoryBar({
  initial = 6,
  total = 12,
  size = 'md',
  variant = 'dark',
}: Props) {
  const [left, setLeft] = useState<number>(Math.max(0, Math.min(total, initial)));

  // Live drift — slow, occasional sale.
  useEffect(() => {
    const id = window.setInterval(() => {
      setLeft((n) => (n > 0 && Math.random() < 0.16 ? n - 1 : n));
    }, 7000);
    return () => window.clearInterval(id);
  }, []);

  const ratio = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0;
  const pct = ratio * 100;
  const stage = stageFor(ratio);

  return (
    <div className={`vinly-gauge vinly-gauge--${size} vinly-gauge--${variant}`}>
      <div className="vinly-gauge-head">
        <span className="vinly-gauge-eyebrow">Inventory</span>
        <span className="vinly-gauge-stage" style={{ color: stage.color, background: `${stage.color}1f` }}>
          <span className="vinly-gauge-stage-dot" style={{ background: stage.color }} />
          {stage.label}
        </span>
      </div>
      <div className="vinly-gauge-track-wrap">
        <div className="vinly-gauge-track" />
        <div
          className="vinly-gauge-marker"
          style={{ left: `${pct}%` }}
          aria-hidden
        />
      </div>
      <div className="vinly-gauge-axis">
        <span>EMPTY</span>
        <span>FULL</span>
      </div>
    </div>
  );
}
