'use client';

/* PostPurchaseContext — the short "Undo / cancel this fill" window shown right after a
   committed SESH/Ticker buy. This is its OWN timer (default 30s), DISTINCT from the
   15-second price lock and the 15-minute free-shipping window.

   A fill is added to the cart on purchase; during the undo window it can be reversed
   (removed, no charge). When the window elapses or the user continues, the fill is
   FINAL and stays in the cart as a Confirmed Purchase. Cancellation lives here, not in
   the cart, and consumes the SAME single cancellation counter (CancellationContext). */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';

export const UNDO_SECONDS = 30;

export type PendingFill = {
  wineId: string;
  name: string;
  qty: number;
  source: 'sesh' | 'ticker';
};

type Ctx = {
  pending: PendingFill | null;
  expiresAt: number;
  /** Open the undo window for a just-committed fill (replaces any prior pending one). */
  commit: (fill: PendingFill) => void;
  /** Close the window — fill is final (or already reversed). */
  clear: () => void;
};

const PostPurchaseContext = createContext<Ctx | null>(null);

export function PostPurchaseProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingFill | null>(null);
  const [expiresAt, setExpiresAt] = useState(0);

  const commit = useCallback((fill: PendingFill) => {
    setPending(fill);
    setExpiresAt(Date.now() + UNDO_SECONDS * 1000);
  }, []);
  const clear = useCallback(() => setPending(null), []);

  return (
    <PostPurchaseContext.Provider value={{ pending, expiresAt, commit, clear }}>
      {children}
    </PostPurchaseContext.Provider>
  );
}

export function usePostPurchase() {
  const ctx = useContext(PostPurchaseContext);
  if (!ctx) throw new Error('usePostPurchase must be used inside <PostPurchaseProvider>');
  return ctx;
}
