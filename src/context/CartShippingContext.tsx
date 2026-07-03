'use client';

/* CartShippingContext — the SINGLE source of truth for "where does this cart ship?".

   Foundational model: the entire cart ships to ONE address. Before any SESH/Ticker
   quick-buy is committed the destination is editable (defaults to the user's primary
   address); the FIRST committed quick-buy LOCKS it to whatever address is in effect
   at that moment. While locked, no surface may change it — every quick-buy pop-up,
   the cart, and Billing & Shipping read the locked address and the settlement charges
   its tax.

   Lifecycle: the lock persists for the life of the cart and CLEARS when the cart is
   emptied or an order completes (both empty the cart → count 0 → auto-reset), so a
   fresh cart again defaults to the primary address.

   Persisted to localStorage so the lock survives refresh/navigation. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useCart } from './CartContext';
import { useProfile, type Address } from './ProfileContext';

type Stored = { addressId: string | null; locked: boolean };

type Ctx = {
  hydrated: boolean;
  /** All saved addresses (passthrough for selectors). */
  addresses: Address[];
  /** The resolved effective destination: the selected one, or the primary default. */
  address: Address | undefined;
  /** True once the first SESH/Ticker quick-buy commits — destination is frozen. */
  locked: boolean;
  /** Choose a different destination. No-op while locked. */
  setAddress: (id: string) => void;
  /** Lock the cart to the in-effect address (idempotent — only the first call sticks). */
  lock: () => void;
  /** Clear selection + lock (fresh cart). */
  reset: () => void;
};

const CartShippingContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'vinly:cartShip';

export function CartShippingProvider({ children }: { children: ReactNode }) {
  const { addresses } = useProfile();
  const { count, hydrated: cartHydrated } = useCart();

  const [addressId, setAddressId] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<Stored>;
        if (typeof p.addressId === 'string' || p.addressId === null) setAddressId(p.addressId ?? null);
        if (typeof p.locked === 'boolean') setLocked(p.locked);
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // Persist after hydration.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ addressId, locked } satisfies Stored));
    } catch { /* ignore */ }
  }, [addressId, locked, hydrated]);

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) ?? addresses[0],
    [addresses],
  );
  // Resolved destination: the stored selection if it still exists, else the primary.
  const address = useMemo(() => {
    const stored = addressId ? addresses.find((a) => a.id === addressId) : undefined;
    return stored ?? defaultAddress;
  }, [addressId, addresses, defaultAddress]);

  const setAddress = useCallback((id: string) => {
    setLocked((isLocked) => {
      if (!isLocked) setAddressId(id); // ignore changes once locked
      return isLocked;
    });
  }, []);

  // Lock to the in-effect address. Captures the current effective id (the selected
  // one, or the primary default when the user just accepted the shown default).
  const lock = useCallback(() => {
    setLocked(true);
    setAddressId((prev) => prev ?? defaultAddress?.id ?? null);
  }, [defaultAddress]);

  const reset = useCallback(() => {
    setLocked(false);
    setAddressId(null);
  }, []);

  // Auto-reset when the cart empties (covers "order completes" — that clears the
  // cart too). A fresh cart then defaults back to the primary address.
  useEffect(() => {
    if (!hydrated || !cartHydrated) return;
    if (count === 0 && (locked || addressId !== null)) reset();
  }, [count, hydrated, cartHydrated, locked, addressId, reset]);

  const value = useMemo<Ctx>(
    () => ({ hydrated, addresses, address, locked, setAddress, lock, reset }),
    [hydrated, addresses, address, locked, setAddress, lock, reset],
  );

  return <CartShippingContext.Provider value={value}>{children}</CartShippingContext.Provider>;
}

export function useCartShipping() {
  const ctx = useContext(CartShippingContext);
  if (!ctx) throw new Error('useCartShipping must be used inside <CartShippingProvider>');
  return ctx;
}
