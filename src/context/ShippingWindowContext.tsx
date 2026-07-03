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

type Finalized = { orderId: string; total: number; shipping: number; freeShip: boolean };

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

  // Mock auto-charge — mirrors /checkout/billing's placeOrder construction.
  const finalize = useCallback(() => {
    const c = cartRef.current;
    const pr = profileRef.current;
    // Charge from the cart's own snapshot — every line is priced, none dropped.
    const lines = c.items.map((i) => ({
      wineId: i.wineId, qty: i.qty, unitPrice: i.unitPrice, name: i.name,
    }));
    // SINGLE-POINT shipping assessment: once, here at window close, against the FINAL
    // cart-wide bottle count across all instruments (shared rule — never per-charge).
    const shipping = assessShipping(c.count);
    const freeShip = c.count >= FREE_SHIP_THRESHOLD;
    const subtotal = c.subtotal;
    // Settle tax against the cart's LOCKED shipping address (single source of truth)
    // using the shared resolver + calculation — so the window-close charge equals the
    // tax-inclusive total previewed in the quick-buy panel and the standard checkout.
    const card = pr.cards.find((c2) => c2.isDefault) ?? pr.cards[0];
    const addr = cartShipRef.current.address ?? pr.addresses.find((a) => a.isDefault) ?? pr.addresses[0];
    // AUTHORITATIVE settlement guard: never settle/charge to a disallowed destination,
    // even if a client bypass forced one into the cart. (Disallowed states can't be
    // selected/locked through the UI, so this is defense-in-depth.)
    if (!isShippableState(addr?.state)) {
      setEndTs(null);
      setMinimized(false);
      return;
    }
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
    c.clear();
    setEndTs(null);
    setMinimized(false);
    setFinalized({ orderId, total, shipping, freeShip });
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
    setFinalized(null);
    setMinimized(false);
    // Only the FIRST add starts the 15-min window. Later adds happen WITHIN that
    // same countdown — they never reset it — so there's real time pressure to add
    // more wines before the card auto-charges.
    setEndTs((cur) => (cur && cur > Date.now() ? cur : Date.now() + WINDOW_MS));
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
