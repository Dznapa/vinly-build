'use client';

/* SeshLiveCard — stage-aware "live SESH" promo card shown below the inventory bar
   while a drop is live. Reads the SAME inventory percent the gauge uses (passed in
   from the SESH page), and escalates across 4 stages as inventory drops. At close
   (pct <= 0) it renders nothing and the existing closing-bell card takes over.

   Additive + read-only: does not touch the gauge, badge, closing-bell card, pop-ups,
   or buying flow. Matches the closing-bell card's visual style.

   `**phrase**` in a body string renders as an accent-colored highlight. All copy is
   editable below. Reduced-motion disables the LIVE dot pulse; nothing else animates. */

import { useEffect, useState } from 'react';

// Stage 1 (EARLY) rotates — editable pool of {headline, body}. Use **…** to highlight.
const EARLY_POOL: { headline: string; body: string }[] = [
  {
    headline: 'The floor is open.',
    body: `One bottle. One day. A price that **moves**. Watch the tape, read the room, and lock in when the number's right. No rush — that comes later.`,
  },
  {
    headline: 'Markets open.',
    body: `The number's **live** and it won't sit still. Watch it move, lock it when it's right.`,
  },
  {
    headline: 'Welcome to the floor.',
    body: `One bottle, one day, a price with a **pulse**. No clock-watching required — yet.`,
  },
];

// Stages 2–4 are fixed (editable).
const STAGE_MOVING = {
  headline: `The tape's heating up.`,
  body: `Bottles are moving and the price is alive. The buyers are already in. The rest are still **"thinking about it."**`,
};
const STAGE_THINNING = {
  headline: 'This is the part where people hesitate.',
  body: `Inventory's thinning and the window won't reopen. Lock it now — or read about it in **tomorrow's recap**.`,
};
const STAGE_LAST = {
  headline: 'Last bottles on the floor.',
  body: `When these are gone, the bell rings and the price is history. Decide **faster** than your instincts are telling you to.`,
};

function renderBody(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1
      ? <b key={i} className="sesh-live-hl">{part}</b>
      : <span key={i}>{part}</span>,
  );
}

export function SeshLiveCard({ pct }: { pct: number }) {
  // Stage 1 copy is picked once per load (avoids the immediately-previous).
  const [s1, setS1] = useState(0);
  useEffect(() => {
    let last = -1;
    try {
      const s = window.sessionStorage.getItem('vinly:seshLiveS1');
      if (s != null) last = Number(s);
    } catch { /* ignore */ }
    let idx = Math.floor(Math.random() * EARLY_POOL.length);
    if (EARLY_POOL.length > 1) {
      while (idx === last) idx = Math.floor(Math.random() * EARLY_POOL.length);
    }
    try { window.sessionStorage.setItem('vinly:seshLiveS1', String(idx)); } catch { /* ignore */ }
    setS1(idx);
  }, []);

  if (pct <= 0) return null; // closed → hand off to the existing closing-bell card

  let accent: string;
  let icon: string;
  let liveLabel: string;
  let copy: { headline: string; body: string };
  if (pct >= 60) { accent = 'open'; icon = 'fa-bolt'; liveLabel = 'LIVE'; copy = EARLY_POOL[s1]; }
  else if (pct >= 30) { accent = 'mid'; icon = 'fa-arrow-trend-up'; liveLabel = 'LIVE'; copy = STAGE_MOVING; }
  else if (pct >= 10) { accent = 'low'; icon = 'fa-fire'; liveLabel = 'LIVE'; copy = STAGE_THINNING; }
  else { accent = 'last'; icon = 'fa-bell'; liveLabel = 'LAST CALL'; copy = STAGE_LAST; }

  return (
    <div className={`sesh-live-card sesh-live-card--${accent}`} role="status">
      <div className="sesh-live-head">
        <i className={`fa-solid ${icon} sesh-live-ic`} aria-hidden />
        <span className="sesh-live-title">{copy.headline}</span>
        <span className="sesh-live-live"><span className="sesh-live-dot" aria-hidden />{liveLabel}</span>
      </div>
      <p className="sesh-live-body">{renderBody(copy.body)}</p>
    </div>
  );
}

export default SeshLiveCard;
