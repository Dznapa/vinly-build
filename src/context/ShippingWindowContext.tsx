'use client';

/* ShippingWindowContext — the 15-minute "free shipping window" that opens after a
   SESH or Ticker purchase.

   ⚠️ PROTOTYPE NOTE: this clone has no server or payment provider, so the window
   is mocked entirely client-side. The expiry timestamp (`endTs`) is persisted in
   localStorage so it survives refresh/navigation and is reconciled on load (if it
   already elapsed while away, it finalizes on next mount). In production this MUST
   be server-owned and the charge MUST run through the real payment provider — here
   "finalize" just calls the existing mock `ProfileContext.placeOrder()`. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useCart, assessShipping, FREE_SHIP_THRESHOLD } from '@/context/CartContext';
import { taxAmount } from '@/lib/cartTotals';
import { taxRateForState } from '@/lib/tax';
import { isShippableState } from '@/lib/shippableStates';
import { useProfile } from '@/context/ProfileContext';
import { useCartShipping } from '@/context/CartShippingContext';

const STORAGE_KEY = 'vinly:shipWindow';
const WINDOW_MS = 15 * 60 * 1000;

type Finalized = {
  orderId: string;
  total: number;
  shipping: number;
  freeShip: boolean;
  /** Shop wines left in the cart that still need checkout after SESH/Ticker settled. */
  remainingShop: number;
};

type Ctx = {
  active: boolean;
  minimized: boolean;
  finalized: Finalized | null;
  secondsLeft: number;
  bottles: number; // cart-wide bottle count (SESH + Ticker + Market)
  open: () => void; // start a window, or expand an existing one (no restart)
  minimize: () => void;
  expand: () => void;
  dismiss: () => void; // clear a finalized confirmation
  endWindow: () => void; // end the window early (skip → checkout)
};

const ShippingWindowContext = createContext<Ctx | null>(null);

export function ShippingWindowProvider({ children }: { children: ReactNode }) {
  const cart = useCart();
  const profile = useProfile();
  const cartShip = useCartShipping();

  const [endTs, setEndTs] = useState<number | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [finalized, setFinalized] = useState<Finalized | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Latest cart/profile/ship via refs so the timer effect doesn't churn on cart edits.
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const cartShipRef = useRef(cartShip);
  cartShipRef.current = cartShip;
  // Latest endTs for event handlers (open) to read without stale closures.
  const endTsRef = useRef<number | null>(null);
  endTsRef.current = endTs;
  // Guards a single settlement per window (the interval could tick again before the
  // endTs=null state flush clears it).
  const settlingRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<{ endTs: number; minimized: boolean; finalized: Finalized }>;
        if (typeof p.endTs === 'number') setEndTs(p.endTs);
        if (typeof p.minimized === 'boolean') setMinimized(p.minimized);
        if (p.finalized) setFinalized(p.finalized);
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ endTs, minimized, finalized }));
    } catch { /* ignore */ }
  }, [endTs, minimized, finalized, hydrated]);

  // Mock auto-charge at window close. Settles ONLY the already-purchased SESH/Ticker
  // (locked) items; any shop wines stay in the cart for explicit checkout.
  const finalize = useCallback(() => {
    if (settlingRef.current) return; // settle exactly once per window
    settlingRef.current = true;
    const c = cartRef.current;
    const pr = profileRef.current;
    const lockedItems = c.items.filter((i) => i.locked);
    const shopItems = c.items.filter((i) => !i.locked);
    const card = pr.cards.find((c2) => c2.isDefault) ?? pr.cards[0];
    const addr = cartShipRef.current.address ?? pr.addresses.find((a) => a.isDefault) ?? pr.addresses[0];
    // Nothing already-purchased to settle, or a disallowed destination → just close the
    // window (AUTHORITATIVE guard: never settle to a disallowed state).
    if (lockedItems.length === 0 || !isShippableState(addr?.state)) {
      setEndTs(null);
      setMinimized(false);
      return;
    }
    // Charge from the locked lines' own snapshots — every line is priced, none dropped.
    const lines = lockedItems.map((i) => ({
      wineId: i.wineId, qty: i.qty, unitPrice: i.unitPrice, name: i.name,
    }));
    // SINGLE-POINT shipping assessment: once, here at window close, against the FINAL
    // cart-wide bottle count across all instruments (shared free-ship rule — SESH,
    // Ticker & Market all count, even shop wines still awaiting checkout).
    const shipping = assessShipping(c.count);
    const freeShip = c.count >= FREE_SHIP_THRESHOLD;
    const subtotal = Number(lockedItems.reduce((s, i) => s + i.unitPrice * i.qty, 0).toFixed(2));
    // Settle tax against the cart's LOCKED shipping address (single source of truth)
    // using the shared resolver + calculation — matches the quick-buy panel preview.
    const tax = taxAmount(subtotal, taxRateForState(addr?.state));
    const total = Number((subtotal + shipping + tax).toFixed(2));
    const orderId = pr.placeOrder({
      lines,
      subtotal,
      shipping,
      tax,
      total,
      shippingAddressId: addr?.id,
      paymentCardId: card?.id,
    });
    // Remove ONLY the settled SESH/Ticker items; shop wines remain for checkout.
    lockedItems.forEach((i) => c.removeItem(i.lineId));
    setEndTs(null);
    setMinimized(false);
    setFinalized({ orderId, total, shipping, freeShip, remainingShop: shopItems.length });
  }, []);

  // Authoritative (mock) timer: drives the countdown and fires the charge at 0:00.
  useEffect(() => {
    if (!hydrated || endTs === null || finalized) return;
    const tick = () => {
      const left = Math.max(0, Math.round((endTs - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        if (!cartRef.current.hydrated) return; // wait for cart hydration before charging
        finalize();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endTs, finalized, hydrated, finalize]);

  const open = useCallback(() => {
    // A window already running is NEVER restarted, reset, or re-displayed — adding a
    // Ticker after a SESH (or any further item) leaves the running countdown and its
    // current display state (badge/full) exactly as-is, ticking to the same deadline.
    if (endTsRef.current !== null && endTsRef.current > Date.now()) return;
    // Otherwise start a fresh window (first SESH/Ticker add, or after a prior settle).
    settlingRef.current = false;
    setFinalized(null);
    setMinimized(false);
    setEndTs(Date.now() + WINDOW_MS);
  }, []);
  const minimize = useCallback(() => setMinimized(true), []);
  const expand = useCallback(() => setMinimized(false), []);
  const dismiss = useCallback(() => setFinalized(null), []);
  const endWindow = useCallback(() => {
    setEndTs(null);
    setMinimized(false);
  }, []);

  const active = endTs !== null && !finalized;

  const value = useMemo<Ctx>(
    () => ({ active, minimized, finalized, secondsLeft, bottles: cart.count, open, minimize, expand, dismiss, endWindow }),
    [active, minimized, finalized, secondsLeft, cart.count, open, minimize, expand, dismiss, endWindow],
  );

  return <ShippingWindowContext.Provider value={value}>{children}</ShippingWindowContext.Provider>;
}

export function useShippingWindow() {
  const ctx = useContext(ShippingWindowContext);
  if (!ctx) throw new Error('useShippingWindow must be used inside <ShippingWindowProvider>');
  return ctx;
}
