'use client';

// NEEDS REVIEW: built from spec only — see QuickBuyPopover.tsx.

import { useCallback, useEffect, useState } from 'react';
import { QuickBuyPopover, type QuickBuyWine } from './QuickBuyPopover';
import { useQuickBuyRegistry } from '@/context/QuickBuyContext';

type Source = 'ticker' | 'sesh';

export function useQuickBuy(source: Source) {
  const [wine, setWine] = useState<QuickBuyWine | null>(null);

  const open = useCallback((w: QuickBuyWine) => setWine(w), []);
  const close = useCallback(() => setWine(null), []);

  const popover = (
    <QuickBuyPopover wine={wine} onClose={close} source={source} />
  );

  // True while the quick-buy popup is open — single source for any UI that must
  // step aside while it owns the screen (e.g. the mobile floating Buy Now button).
  const isOpen = wine !== null;

  // Report this popup's open state into the shared registry so app-wide UI
  // (the mobile floating Buy Now button) can react to ANY quick-buy being open,
  // regardless of which one (SESH, Ticker, …). Decrements on close/unmount.
  const { addOpen, removeOpen } = useQuickBuyRegistry();
  useEffect(() => {
    if (!isOpen) return;
    addOpen();
    return () => removeOpen();
  }, [isOpen, addOpen, removeOpen]);

  return { open, close, popover, isOpen } as const;
}

export default useQuickBuy;
