'use client';

/* MarketDivider — state-aware section divider for the Shop and Winemaker Spotlight
   pages (NOT the SESH page).

   - Anonymous / signed-in-not-qualified → the punchy ↑/↓ banner (a random variant per
     load so repeat pre-qualified visits vary). UNCHANGED.
   - SESH-qualified → a single centered witty line that rotates through the page's bank
     in randomized order every ~4s, pausing on hover; prefers-reduced-motion shows one
     static line. Reuses the SESH-hero rotation pattern (timer + opacity fade + hover
     pause). Day/day-of-week-aware lines are mixed in when applicable.

   Presentation only. */

import { useEffect, useRef, useState } from 'react';
import { useUserState } from '@/context/UserStateContext';

export type DividerVariant = { l1: string; l2: string };

const ROTATE_MS = 4000; // dwell per line (3–5s band)
const FADE_MS = 450; // matches the CSS opacity transition

// Editable day/date-aware lines, mixed into the qualified rotation only when they
// apply (evaluated client-side on mount). Shared across both pages.
const DAY_AWARE: { line: string; when: (d: Date) => boolean }[] = [
  { line: "It's Friday. The cooler's stocked. You know what to do.", when: (d) => d.getDay() === 5 },
  { line: "The grill's hot, the cooler's stocked, the wine's right here.", when: (d) => d.getDay() === 0 || d.getDay() === 6 },
  { line: 'America turns 250 — pour something worthy.', when: (d) => d.getMonth() === 6 && d.getDate() === 4 },
];

function shuffle<T>(input: T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Effective, randomized bank = witty lines + any applicable day-aware lines.
function buildLines(bank: string[]): string[] {
  const now = new Date();
  const extra = DAY_AWARE.filter((x) => x.when(now)).map((x) => x.line);
  return shuffle([...bank, ...extra]);
}

// Reuses the app's per-load pick pattern (see WelcomeBackLine): random index, re-rolled
// if it matches the immediately-previous one (tracked in localStorage).
function pickRotatingIndex(len: number, key: string): number {
  if (len <= 1) return 0;
  let last = -1;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) last = Number(raw);
  } catch { /* ignore */ }
  let idx = Math.floor(Math.random() * len);
  if (idx === last) idx = (idx + 1) % len;
  try { window.localStorage.setItem(key, String(idx)); } catch { /* ignore */ }
  return idx;
}

/* Qualified rotator — only mounts client-side (after hydration), so Math.random /
   new Date() here can't cause a hydration mismatch. */
function QualifiedRotator({ bank }: { bank: string[] }) {
  // Randomized order fixed at mount (client-only initializer).
  const [lines] = useState<string[]>(() => buildLines(bank));
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(true);
  const [reduced, setReduced] = useState(false);
  const hoverRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Rotation: fade out, swap, fade in. Skips a tick while hovered. Static under
  // reduced-motion or a single line.
  useEffect(() => {
    if (reduced || lines.length <= 1) return;
    let swap: number | undefined;
    const cycle = window.setInterval(() => {
      if (hoverRef.current) return;
      setShown(false);
      swap = window.setTimeout(() => {
        setIdx((i) => (i + 1) % lines.length);
        setShown(true);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => {
      window.clearInterval(cycle);
      if (swap) window.clearTimeout(swap);
    };
  }, [reduced, lines.length]);

  return (
    <div
      className="market-rotator"
      onMouseEnter={() => { hoverRef.current = true; }}
      onMouseLeave={() => { hoverRef.current = false; }}
    >
      <p className={`market-rotator-line${shown ? ' is-shown' : ''}`}>{lines[idx]}</p>
    </div>
  );
}

export function MarketDivider({
  variants,
  qualifiedBank,
  storageKey,
}: {
  variants: DividerVariant[];
  qualifiedBank: string[];
  storageKey: string;
}) {
  const { userState, hydrated } = useUserState();
  const [idx, setIdx] = useState(0);

  // Rotate the punchy variant per load — only for the non-qualified audience, after
  // hydration (client-only, so SSR renders variant 0 and there's no hydration mismatch).
  useEffect(() => {
    if (!hydrated || userState === 'sesh_qualified') return;
    setIdx(pickRotatingIndex(variants.length, storageKey));
  }, [hydrated, userState, variants.length, storageKey]);

  // SESH-qualified → witty rotating banner. (Pre-hydration we render the punchy default
  // so a banner always shows and SSR/CSR agree.)
  if (hydrated && userState === 'sesh_qualified') {
    return <QualifiedRotator bank={qualifiedBank} />;
  }

  const v = variants[idx] ?? variants[0];
  return (
    <div className="shop-hero">
      <div className="l1">{v.l1}</div>
      <div className="l2">{v.l2}</div>
    </div>
  );
}

export default MarketDivider;
