'use client';

/* CancellationContext — the SESH price-lock cancellation cap.

   RULE (per owner): 2 cancellations allowed per SESH. A "cancel" = backing out of a
   locked price before it's a committed charge (the "Cancel this lock" action on a
   locked cart item). ONLY that decrements the counter. Committed purchases are
   unlimited and never consume a cancellation. Buying is NEVER gated by this count.

   Persisted in sessionStorage (≈ "this SESH" — resets when the browser session ends).

   AUTO-RESET: once a user hits the cap (locked out of buying this SESH), the lock-out
   and counter automatically clear 5 minutes later (live timer while the page is open,
   and re-checked on load). A locked session with no recorded timestamp resets on load. */

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
const LOCKOUT_KEY = 'vinly:seshLockoutAt'; // epoch ms when the cap was reached
export const LOCKOUT_RESET_MS = 5 * 60 * 1000; // locked-out users auto-reset after 5 min

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
    try {
      window.sessionStorage.setItem(STORAGE_KEY, String(next));
      // Stamp the lock-out moment so the 5-min auto-reset can be timed.
      if (next >= CANCEL_CAP) window.sessionStorage.setItem(LOCKOUT_KEY, String(Date.now()));
    } catch { /* ignore */ }
    return Math.max(0, CANCEL_CAP - next);
  }, [used]);

  // Clear the lock-out + counter (restores buying with a fresh cap).
  const doReset = useCallback(() => {
    setUsed(0);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, '0');
      window.sessionStorage.removeItem(LOCKOUT_KEY);
    } catch { /* ignore */ }
  }, []);

  // 5-minute auto-reset for locked-out users. Runs while the page is open and is
  // re-evaluated on load; a locked session with no timestamp resets immediately.
  useEffect(() => {
    if (!hydrated || used < CANCEL_CAP) return;
    let lockoutAt: number | null = null;
    try {
      const raw = window.sessionStorage.getItem(LOCKOUT_KEY);
      if (raw != null) lockoutAt = Number(raw) || null;
    } catch { /* ignore */ }
    if (lockoutAt == null) { doReset(); return; } // pre-existing lock-out → unlock now
    const left = LOCKOUT_RESET_MS - (Date.now() - lockoutAt);
    if (left <= 0) { doReset(); return; }
    const id = window.setTimeout(doReset, left);
    return () => window.clearTimeout(id);
  }, [hydrated, used, doReset]);

  const remaining = Math.max(0, CANCEL_CAP - used);
  const value: Ctx = { used, remaining, capReached: remaining === 0, cancel, hydrated };

  return <CancellationContext.Provider value={value}>{children}</CancellationContext.Provider>;
}

export function useCancellations() {
  const ctx = useContext(CancellationContext);
  if (!ctx) throw new Error('useCancellations must be used inside <CancellationProvider>');
  return ctx;
}
