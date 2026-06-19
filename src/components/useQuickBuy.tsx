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

  return { open, close, popover } as const;
}

export default useQuickBuy;
