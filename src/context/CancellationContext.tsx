'use client';

/* CancellationContext — the SESH price-lock cancellation cap.

   RULE (per owner): 2 cancellations allowed per SESH. A "cancel" = backing out of a
   locked price before it's a committed charge (the "Cancel this lock" action on a
   locked cart item). ONLY that decrements the counter. Committed purchases are
   unlimited and never consume a cancellation. Buying is NEVER gated by this count.

   Persisted in sessionStorage (≈ "this SESH" — resets when the browser session ends). */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export const CANCEL_CAP = 2;
const STORAGE_KEY = 'vinly:seshCancelCount';

type Ctx = {
  used: number; // cancellations used this SESH (0..CANCEL_CAP)
  remaining: number; // CANCEL_CAP - used, floored at 0
  capReached: boolean; // remaining === 0 → locks are final
  /** Record a cancellation; returns the remaining count AFTER it. */
  cancel: () => number;
  hydrated: boolean;
};

const CancellationContext = createContext<Ctx | null>(null);

export function CancellationProvider({ children }: { children: ReactNode }) {
  const [used, setUsed] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw != null) setUsed(Math.min(CANCEL_CAP, Math.max(0, Math.floor(Number(raw)) || 0)));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const cancel = useCallback(() => {
    const next = Math.min(CANCEL_CAP, used + 1);
    setUsed(next);
    try { window.sessionStorage.setItem(STORAGE_KEY, String(next)); } catch { /* ignore */ }
    return Math.max(0, CANCEL_CAP - next);
  }, [used]);

  const remaining = Math.max(0, CANCEL_CAP - used);
  const value: Ctx = { used, remaining, capReached: remaining === 0, cancel, hydrated };

  return <CancellationContext.Provider value={value}>{children}</CancellationContext.Provider>;
}

export function useCancellations() {
  const ctx = useContext(CancellationContext);
  if (!ctx) throw new Error('useCancellations must be used inside <CancellationProvider>');
  return ctx;
}
