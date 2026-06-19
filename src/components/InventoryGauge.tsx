'use client';

/* InventoryGauge — bottle-row inventory display.
   Replaces the half-circle dial. A row of 12 mini bottle icons: the leftmost
   `remaining` count are "full" (wine-colored), the rest are ghosted slots.
   Big numeric readout above, smooth fill animation, pulsing LIVE indicator.
   Color of the fill shifts red → orange → green based on remaining ratio,
   so urgency is communicated at a glance. */

import { useEffect, useState } from 'react';

type Props = {
  pct?: number; // 0..1 — initial fill ratio
  total?: number; // total bottles in the drop (default 12)
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

function fillColor(ratio: number): string {
  if (ratio < 0.25) return '#e23b3b'; // red
  if (ratio < 0.5) return '#f08a3b'; // orange
  if (ratio < 0.75) return '#f1c40f'; // amber
  return '#2ecc40'; // green
}

function statusLabel(ratio: number): { text: string; color: string } {
  if (ratio < 0.2) return { text: 'Almost gone', color: '#e23b3b' };
  if (ratio < 0.45) return { text: 'Going fast', color: '#f08a3b' };
  if (ratio < 0.75) return { text: 'Selling steady', color: '#f1c40f' };
  return { text: 'Load Up', color: '#2ecc40' };
}

function MiniBottle({ filled, color }: { filled: boolean; color: string }) {
  // Compact bottle silhouette tuned for an inline row.
  return (
    <svg viewBox="0 0 24 64" width="22" height="56" aria-hidden>
      {filled ? (
        <>
          <rect x="9" y="2" width="6" height="6" rx="1.5" fill={color} opacity="0.9" />
          <path
            d="M9 9 H15 V20 C15 22 14 23 13 24 H11 C10 23 9 22 9 20 Z"
            fill={color}
            opacity="0.95"
          />
          <path
            d="M6 28 C6 25 7 24 8 24 H16 C17 24 18 25 18 28 L18 60 C18 62 16.5 63 15 63 H9 C7.5 63 6 62 6 60 Z"
            fill={color}
          />
          <rect x="8.5" y="42" width="7" height="14" rx="1" fill="#fff" opacity="0.85" />
        </>
      ) : (
        <>
          <path
            d="M9 9 H15 V20 C15 22 14 23 13 24 H11 C10 23 9 22 9 20 Z"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1"
          />
          <path
            d="M6 28 C6 25 7 24 8 24 H16 C17 24 18 25 18 28 L18 60 C18 62 16.5 63 15 63 H9 C7.5 63 6 62 6 60 Z"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1"
          />
        </>
      )}
    </svg>
  );
}

export default function InventoryGauge({ pct = 0.5, total = 12 }: Props) {
  const initial = clamp01(pct);
  const [current, setCurrent] = useState(initial);

  // Re-sync on prop change.
  useEffect(() => {
    setCurrent(clamp01(pct));
  }, [pct]);

  // Tiny live wobble — bottles "getting reserved" feel.
  useEffect(() => {
    const id = window.setInterval(() => {
      setCurrent((p) => {
        const drift = (Math.random() - 0.55) * 0.04;
        return Math.max(0.08, Math.min(0.95, p + drift));
      });
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  const remaining = Math.max(0, Math.round(current * total));
  const filledColor = fillColor(current);
  const status = statusLabel(current);

  return (
    <div className="vinly-inv">
      <div className="vinly-inv-head">
        <div className="vinly-inv-count">
          <span className="vinly-inv-big">{remaining}</span>
          <span className="vinly-inv-sub">/ {total} bottles left</span>
        </div>
        <div className="vinly-inv-live">
          <span className="vinly-inv-live-dot" aria-hidden />
          LIVE
        </div>
      </div>

      <div
        className="vinly-inv-row"
        role="img"
        aria-label={`${remaining} of ${total} bottles remaining`}
      >
        {Array.from({ length: total }, (_, i) => {
          const filled = i < remaining;
          // The boundary bottle (next to be sold) gets a subtle pulse.
          const isEdge = filled && i === remaining - 1;
          return (
            <span
              key={i}
              className={`vinly-inv-slot${isEdge ? ' vinly-inv-slot--edge' : ''}`}
              style={isEdge ? { ['--edge-color' as string]: filledColor } : undefined}
            >
              <MiniBottle filled={filled} color={filledColor} />
            </span>
          );
        })}
      </div>

      <div
        className="vinly-inv-status"
        style={{ ['--status-color' as string]: status.color }}
      >
        <span className="vinly-inv-status-dot" aria-hidden />
        {status.text}
      </div>
    </div>
  );
}
