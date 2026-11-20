'use client';

/* GuestCheckoutContext — TRANSIENT holder for a guest's checkout.

   A guest places a mock order WITHOUT an account. The data they typed (user info,
   shipping, billing card) and the placed-order snapshot live here only — NOT in the
   persisted profile. It's session-scoped (sessionStorage) so a refresh on the order-
   confirmation step survives, but it never becomes a real account until the user opts
   in on the confirmation screen ("Create Account"), at which point the confirmation
   page copies this draft into ProfileContext and flips the user to sesh_qualified.
   If they skip account creation (or the tab closes), it's discarded — they stay a
   plain guest with no lingering profile. No real payment/account processing. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { OrderLine, PaymentCard } from '@/context/ProfileContext';

export type GuestDraft = {
  user: { firstName: string; lastName: string; email: string; phone: string };
  shipping: {
    fullName: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
  };
  card: {
    brand: PaymentCard['brand'];
    last4: string;
    expMonth: string;
    expYear: string;
    nameOnCard: string;
  };
  marketing: boolean;
};

/** Self-contained snapshot of the placed guest order — the confirmation screen renders
    from this without touching the profile. */
export type GuestOrderSnapshot = {
  id: string;
  date: string;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shipCity: string;
  shipState: string;
  cardBrand: string;
  cardLast4: string;
};

type Ctx = {
  draft: GuestDraft | null;
  order: GuestOrderSnapshot | null;
  /** Record a placed guest order + the draft behind it (transient). */
  place: (draft: GuestDraft, order: GuestOrderSnapshot) => void;
  /** Discard everything (account created, or user skipped). */
  clear: () => void;
  hydrated: boolean;
};

const GuestCheckoutContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'vinly:guestCheckout';

export function GuestCheckoutProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<GuestDraft | null>(null);
  const [order, setOrder] = useState<GuestOrderSnapshot | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { draft?: GuestDraft; order?: GuestOrderSnapshot };
        if (p.draft) setDraft(p.draft);
        if (p.order) setOrder(p.order);
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  const place = useCallback((d: GuestDraft, o: GuestOrderSnapshot) => {
    setDraft(d);
    setOrder(o);
    try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ draft: d, order: o })); } catch { /* ignore */ }
  }, []);

  const clear = useCallback(() => {
    setDraft(null);
    setOrder(null);
    try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const value = useMemo<Ctx>(() => ({ draft, order, place, clear, hydrated }), [draft, order, place, clear, hydrated]);

  return <GuestCheckoutContext.Provider value={value}>{children}</GuestCheckoutContext.Provider>;
}

export function useGuestCheckout() {
  const ctx = useContext(GuestCheckoutContext);
  if (!ctx) throw new Error('useGuestCheckout must be used inside <GuestCheckoutProvider>');
  return ctx;
}
