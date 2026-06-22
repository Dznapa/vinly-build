'use client';

/* QuickBuyContext — a tiny shared registry that tracks how many quick-buy
   popups are currently open across the app (SESH page popup, Ticker popup, and
   any future one). Each useQuickBuy instance reports its open state here; UI that
   must step aside while a popup owns the screen (the mobile floating Buy Now
   button) reads `anyOpen`. Single source — no per-popup or z-index hacks. */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type QuickBuyRegistry = {
  openCount: number;
  anyOpen: boolean;
  addOpen: () => void;
  removeOpen: () => void;
};

// No-op default so the hook is safe even if rendered outside the provider
// (anyOpen stays false — nothing gets hidden).
const QuickBuyContext = createContext<QuickBuyRegistry>({
  openCount: 0,
  anyOpen: false,
  addOpen: () => {},
  removeOpen: () => {},
});

export function QuickBuyProvider({ children }: { children: ReactNode }) {
  const [openCount, setOpenCount] = useState(0);

  const addOpen = useCallback(() => setOpenCount((n) => n + 1), []);
  const removeOpen = useCallback(() => setOpenCount((n) => Math.max(0, n - 1)), []);

  const value = useMemo<QuickBuyRegistry>(
    () => ({ openCount, anyOpen: openCount > 0, addOpen, removeOpen }),
    [openCount, addOpen, removeOpen],
  );

  return <QuickBuyContext.Provider value={value}>{children}</QuickBuyContext.Provider>;
}

export function useQuickBuyRegistry() {
  return useContext(QuickBuyContext);
}
