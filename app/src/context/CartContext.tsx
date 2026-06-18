'use client';

/* CartContext — backs the Cart / Edit Cart page with a real list of items.
   Pattern mirrors UserStateContext: localStorage-persisted client state.
   Spec: "Free ground shipping at 6+ bottles; flat shipping under 6." */

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

export type CartItem = { wineId: string; qty: number };

// NEEDS REVIEW: spec only says "flat shipping under 6"; the exact dollar
// amount is not specified. Using a placeholder of $14.95 until owner confirms.
export const SHIPPING_RATE = 14.95;
export const FREE_SHIP_THRESHOLD = 6;

type Ctx = {
  items: CartItem[];
  addItem: (wineId: string, qty: number) => void;
  removeItem: (wineId: string) => void;
  setQty: (wineId: string, qty: number) => void;
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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

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
              entry &&
              typeof entry === 'object' &&
              typeof (entry as CartItem).wineId === 'string' &&
              typeof (entry as CartItem).qty === 'number'
            ) {
              const q = clampQty((entry as CartItem).qty);
              if (q > 0) valid.push({ wineId: (entry as CartItem).wineId, qty: q });
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

  const addItem = useCallback((wineId: string, qty: number) => {
    const add = clampQty(qty);
    if (add <= 0) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.wineId === wineId);
      if (existing) {
        return prev.map((i) =>
          i.wineId === wineId ? { ...i, qty: clampQty(i.qty + add) } : i,
        );
      }
      return [...prev, { wineId, qty: add }];
    });
  }, []);

  const removeItem = useCallback((wineId: string) => {
    setItems((prev) => prev.filter((i) => i.wineId !== wineId));
  }, []);

  const setQty = useCallback((wineId: string, qty: number) => {
    const next = clampQty(qty);
    setItems((prev) => {
      if (next <= 0) return prev.filter((i) => i.wineId !== wineId);
      const existing = prev.find((i) => i.wineId === wineId);
      if (existing) {
        return prev.map((i) => (i.wineId === wineId ? { ...i, qty: next } : i));
      }
      return [...prev, { wineId, qty: next }];
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const { count, subtotal, shipping, total } = useMemo(() => {
    let bottles = 0;
    let sub = 0;
    for (const item of items) {
      const wine = SHOP.find((w) => w.id === item.wineId);
      if (!wine) continue;
      bottles += item.qty;
      sub += wine.price * item.qty;
    }
    const ship = bottles >= FREE_SHIP_THRESHOLD ? 0 : bottles > 0 ? SHIPPING_RATE : 0;
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
