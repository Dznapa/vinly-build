'use client';

/* CartContext — backs the Cart / Edit Cart page with a real list of items.
   Pattern mirrors UserStateContext: localStorage-persisted client state.
   Spec: "Free ground shipping at 6+ bottles; flat shipping under 6."

   SINGLE SOURCE OF TRUTH: every cart line carries its own price/name snapshot
   (taken at add time), so the cart never depends on whether an id lives in SHOP.
   That keeps count, subtotal, the cart table, the order summary, the shipping
   window, the badge, and the auto-charge all derived from this one `items` array —
   no instrument (SESH / Ticker / Market) can add a bottle that counts toward free
   shipping without also being visible and charged. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { SHOP } from '@/data/mock';
import { useUserState } from '@/context/UserStateContext';
import { useBillingGate } from '@/context/BillingGateContext';

export type CartItem = {
  lineId: string; // unique per cart line — keeps repeat SESH/Ticker fills discrete
  wineId: string;
  qty: number;
  name: string;
  unitPrice: number;
  image?: string;
  msrp?: number;
  meta?: string; // secondary descriptor line (maker / region) for the cart table
  locked?: boolean; // true for SESH/Ticker quick-buy reservations — qty can't be changed
  source?: 'sesh' | 'ticker' | 'shop' | 'spotlight'; // which site section it was added from
};

/** Everything needed to add a line — the per-instrument caller supplies the snapshot. */
export type CartAdd = Omit<CartItem, 'qty' | 'lineId'>;

// Flat shipping under the free-shipping threshold (owner-confirmed $35).
export const SHIPPING_RATE = 35.0;
export const FREE_SHIP_THRESHOLD = 6;

/* SINGLE SOURCE OF TRUTH for shipping. Shipping is assessed exactly ONCE per order,
   at window close (or manual checkout), against the FINAL cart-wide bottle count across
   ALL instruments (SESH + Ticker + Shop + Winemaker Spotlight): 6+ = free, under 6 =
   flat $35, empty = $0. There is no per-charge / per-instrument shipping and no refund —
   every assessment path must call this so the rule can never drift. */
export function assessShipping(bottleCount: number): number {
  if (bottleCount <= 0) return 0;
  return bottleCount >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_RATE;
}

type Ctx = {
  items: CartItem[];
  /** Returns true if added, false if blocked by the billing gate. */
  addItem: (add: CartAdd, qty: number) => boolean;
  removeItem: (lineId: string) => void;
  setQty: (lineId: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  hydrated: boolean;
};

const CartContext = createContext<Ctx | null>(null);

const STORAGE_KEY = 'vinly:cart';

function clampQty(n: number) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 99) return 99;
  return Math.floor(n);
}

// Migration helper: resolve a legacy (pre-snapshot) cart entry against the SHOP
// catalog. Anything that doesn't resolve was an un-renderable ghost line and is
// dropped — which clears the phantom free-shipping bottles from older carts.
function snapshotFromShop(wineId: string): Omit<CartItem, 'wineId' | 'qty' | 'lineId'> | null {
  const w = SHOP.find((s) => s.id === wineId);
  if (!w) return null;
  return { name: w.name, unitPrice: w.price, image: w.image, msrp: w.msrp, meta: w.maker };
}

// Unique cart-line id. Generated at add/hydrate time (client only), so repeat
// SESH/Ticker fills of the same wine never collapse into one line.
function makeLineId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const { userState } = useUserState();
  const { openGate } = useBillingGate();

  // Hydrate from localStorage on mount (mirror UserStateContext pattern).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const valid: CartItem[] = [];
          for (const entry of parsed) {
            if (
              !entry ||
              typeof entry !== 'object' ||
              typeof (entry as CartItem).wineId !== 'string' ||
              typeof (entry as CartItem).qty !== 'number'
            ) {
              continue;
            }
            const e = entry as Partial<CartItem> & { wineId: string; qty: number };
            const q = clampQty(e.qty);
            if (q <= 0) continue;
            if (typeof e.name === 'string' && typeof e.unitPrice === 'number') {
              // New, self-contained shape — keep the snapshot as-is (preserve the
              // line id so persisted discrete fills stay discrete).
              valid.push({
                lineId: typeof e.lineId === 'string' ? e.lineId : makeLineId(),
                wineId: e.wineId,
                qty: q,
                name: e.name,
                unitPrice: e.unitPrice,
                image: e.image,
                msrp: e.msrp,
                meta: e.meta,
                locked: e.locked === true,
                source: e.source,
              });
            } else {
              // Legacy shape ({wineId, qty}) — resolve via SHOP or drop the ghost.
              const snap = snapshotFromShop(e.wineId);
              if (snap) valid.push({ lineId: makeLineId(), wineId: e.wineId, qty: q, ...snap });
            }
          }
          setItems(valid);
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // Persist on every change (only after first hydration so we don't clobber).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  const addItem = useCallback((add: CartAdd, qty: number): boolean => {
    // Billing gate applies ONLY to live-price reservations (SESH / Ticker, flagged
    // locked). Shop and Winemaker Spotlight are open commerce — anonymous and
    // signed-in users can buy there freely. Non-qualified users attempting a
    // SESH/Ticker lock get the billing wizard instead, and nothing is added.
    if (add.locked && userState !== 'sesh_qualified') {
      openGate();
      return false;
    }
    const qadd = clampQty(qty);
    if (qadd <= 0 || !add.wineId) return false;
    setItems((prev) => {
      // Committed SESH/Ticker fills are IMMUTABLE per fill — never merge or average.
      // Each Place Order is its own line at its own captured price (a single fill may
      // still be qty>1 at one price). This keeps order history per-fill accurate.
      if (add.locked) {
        return [...prev, { ...add, qty: qadd, locked: true, lineId: makeLineId() }];
      }
      // Adjustable (Shop / Winemaker Spotlight): true quantities of one SKU stack on a
      // single line. Match the existing NON-locked line for this wine.
      const existing = prev.find((i) => i.wineId === add.wineId && !i.locked);
      if (existing) {
        // Refresh the snapshot too (price may have moved since the first add).
        return prev.map((i) =>
          i === existing
            ? { ...i, ...add, qty: clampQty(i.qty + qadd), locked: false, lineId: i.lineId }
            : i,
        );
      }
      return [...prev, { ...add, qty: qadd, lineId: makeLineId() }];
    });
    return true;
  }, [userState, openGate]);

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((i) => i.lineId !== lineId));
  }, []);

  // Adjusts an EXISTING line only (cart steppers, adjustable lines). Never creates a
  // line — adds must go through addItem so they always carry a snapshot.
  const setQty = useCallback((lineId: string, qty: number) => {
    const next = clampQty(qty);
    setItems((prev) => {
      if (next <= 0) return prev.filter((i) => i.lineId !== lineId);
      return prev.map((i) => (i.lineId === lineId ? { ...i, qty: next } : i));
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const { count, subtotal, shipping, total } = useMemo(() => {
    let bottles = 0;
    let sub = 0;
    for (const item of items) {
      // Every line is a real bottle with its own price snapshot — count and
      // subtotal are always in lockstep across all instruments.
      bottles += item.qty;
      sub += item.unitPrice * item.qty;
    }
    const ship = assessShipping(bottles);
    return {
      count: bottles,
      subtotal: sub,
      shipping: ship,
      total: sub + ship,
    };
  }, [items]);

  const value = useMemo<Ctx>(
    () => ({
      items,
      addItem,
      removeItem,
      setQty,
      clear,
      count,
      subtotal,
      shipping,
      total,
      hydrated,
    }),
    [items, addItem, removeItem, setQty, clear, count, subtotal, shipping, total, hydrated],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
