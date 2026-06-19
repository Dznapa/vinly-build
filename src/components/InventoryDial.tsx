'use client';

/* InventoryDial — compact donut showing N of TOTAL bottles remaining.
   Stroke gradient shifts red → orange → green based on how many are left.
   Center shows the big N over the total. Live wobble — every few seconds
   one bottle has a chance to disappear, so the dial feels real. */

import { useEffect, useState } from 'react';

type Props = {
  pct?: number; // 0..1 starting fill
  total?: number; // default 12
  size?: number; // px, default 120
  live?: boolean; // animate downward drift (default true)
  label?: string; // override center subtitle
};

function fillColor(ratio: number): string {
  if (ratio < 0.25) return '#e23b3b';
  if (ratio < 0.5) return '#f08a3b';
  if (ratio < 0.75) return '#f1c40f';
  return '#2ecc40';
}

export default function InventoryDial({
  pct = 0.5,
  total = 12,
  size = 120,
  live = true,
  label,
}: Props) {
  const [remaining, setRemaining] = useState<number>(
    Math.max(1, Math.round(pct * total)),
  );

  // re-sync if initial pct changes (rare but supported)
  useEffect(() => {
    setRemaining(Math.max(1, Math.round(pct * total)));
  }, [pct, total]);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      setRemaining((n) => (n > 1 && Math.random() < 0.18 ? n - 1 : n));
    }, 6000);
    return () => window.clearInterval(id);
  }, [live]);

  const ratio = total > 0 ? remaining / total : 0;
  const color = fillColor(ratio);

  // donut geometry
  const stroke = Math.max(8, Math.round(size * 0.08));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * ratio;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="vinly-dial" style={{ width: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label={`${remaining} of ${total} bottles remaining`}
      >
        {/* track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        {/* fill — start at 12 o'clock */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 600ms ease, stroke 300ms ease' }}
        />
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fontFamily="League Spartan"
          fontWeight="800"
          fontSize={size * 0.32}
          fill="#fff"
        >
          {remaining}
        </text>
        <text
          x={cx}
          y={cy + size * 0.18}
          textAnchor="middle"
          fontFamily="League Spartan"
          fontWeight="700"
          fontSize={size * 0.11}
          letterSpacing="1.5"
          fill="#8aa2bb"
        >
          / {total}
        </text>
      </svg>
      <div className="vinly-dial-sub">{label ?? 'BOTTLES LEFT'}</div>
    </div>
  );
}
