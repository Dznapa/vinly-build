'use client';

/* MarketDivider — state-aware section divider for the Shop and Winemaker Spotlight
   pages (NOT the SESH page). Anonymous / signed-in-not-qualified users get the punchy
   ↑/↓ banner (a random variant per load so repeat pre-qualified visits vary); SESH-
   qualified users get a quiet, compact section label instead — a clear section label
   remains in every state. Presentation only. */

import { useEffect, useState } from 'react';
import { useUserState } from '@/context/UserStateContext';

export type DividerVariant = { l1: string; l2: string };

// Reuses the app's rotation pattern (see WelcomeBackLine): random index per load,
// re-rolled if it matches the immediately-previous one (tracked in localStorage).
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

export function MarketDivider({
  variants,
  compactLabel,
  storageKey,
}: {
  variants: DividerVariant[];
  compactLabel: string;
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

  // SESH-qualified → quiet compact section label. (Pre-hydration we render the punchy
  // default so a section label always shows and SSR/CSR agree.)
  if (hydrated && userState === 'sesh_qualified') {
    return (
      <div className="market-divider-compact">
        <h1>{compactLabel}</h1>
      </div>
    );
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
