'use client';

// NEEDS REVIEW: built from spec only — see QuickBuyPopover.tsx.

import { useCallback, useState } from 'react';
import { QuickBuyPopover, type QuickBuyWine } from './QuickBuyPopover';

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

  return { open, close, popover, isOpen } as const;
}

export default useQuickBuy;
