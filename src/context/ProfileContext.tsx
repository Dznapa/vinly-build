'use client';

/* ProfileContext — backs all signed-in user flows for the click-through clone.
   Holds the mock account: profile, addresses, payment methods, orders, prefs.
   Persists everything to localStorage under `vinly:profile` (one blob so the
   shape evolves together). No real payments, no real PII validation. */

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
import { useUserState } from './UserStateContext';
import { isShippableState } from '@/lib/shippableStates';

export type ProfileBasics = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate?: string; // ISO yyyy-mm-dd or empty
  memberSince: string; // ISO date when first signed in
};

export type Address = {
  id: string;
  label: string; // "Home", "Office", etc.
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  isDefault: boolean;
};

export type PaymentCard = {
  id: string;
  brand: 'Visa' | 'Mastercard' | 'American Express' | 'Discover' | 'Other';
  last4: string;
  expMonth: string; // "MM"
  expYear: string; // "YY"
  nameOnCard: string;
  isDefault: boolean;
};

export type OrderLine = {
  wineId: string;
  qty: number;
  unitPrice: number;
  name: string;
};

export type Order = {
  id: string; // "VIN-NNNNNN"
  date: string; // ISO
  status: 'placed' | 'shipped' | 'delivered' | 'cancelled';
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddressId?: string;
  paymentCardId?: string;
};

export type Preferences = {
  tickerAlerts: boolean;
  newDropAlerts: boolean;
  marketingEmails: boolean;
};

type ProfileBlob = {
  basics: ProfileBasics;
  addresses: Address[];
  cards: PaymentCard[];
  orders: Order[];
  prefs: Preferences;
};

const DEFAULT_BLOB: ProfileBlob = {
  basics: {
    firstName: 'Demo',
    lastName: 'User',
    email: 'demo@vinly.local',
    phone: '',
    birthDate: '',
    memberSince: new Date().toISOString(),
  },
  addresses: [],
  cards: [],
  orders: [],
  prefs: {
    tickerAlerts: true,
    newDropAlerts: true,
    marketingEmails: false,
  },
};

type Ctx = ProfileBlob & {
  // session
  login: (email: string) => void;
  logout: () => void;
  signupAndLogin: (basics: Partial<ProfileBasics>) => void;
  // profile
  updateBasics: (patch: Partial<ProfileBasics>) => void;
  // addresses
  addAddress: (addr: Omit<Address, 'id' | 'isDefault'> & { isDefault?: boolean }) => string;
  updateAddress: (id: string, patch: Partial<Omit<Address, 'id'>>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  // cards
  addCard: (card: Omit<PaymentCard, 'id' | 'isDefault'> & { isDefault?: boolean }) => string;
  updateCard: (id: string, patch: Partial<Omit<PaymentCard, 'id'>>) => void;
  removeCard: (id: string) => void;
  setDefaultCard: (id: string) => void;
  // orders
  placeOrder: (input: {
    lines: OrderLine[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    shippingAddressId?: string;
    paymentCardId?: string;
  }) => string;
  getOrder: (id: string) => Order | undefined;
  // prefs
  updatePrefs: (patch: Partial<Preferences>) => void;
  hydrated: boolean;
};

const ProfileContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'vinly:profile';

function genId(prefix: string) {
  const s = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${s}`;
}

function genOrderId() {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `VIN-${n}`;
}

function detectCardBrand(num: string): PaymentCard['brand'] {
  const n = num.replace(/\s+/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'American Express';
  if (/^6(?:011|5)/.test(n)) return 'Discover';
  return 'Other';
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { setUserState } = useUserState();
  const [blob, setBlob] = useState<ProfileBlob>(DEFAULT_BLOB);
  const [hydrated, setHydrated] = useState(false);
  // Latest blob via ref so the placeOrder guard can resolve an address's state
  // synchronously without adding blob to its deps.
  const blobRef = useRef(blob);
  blobRef.current = blob;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ProfileBlob>;
        setBlob({
          basics: { ...DEFAULT_BLOB.basics, ...(parsed.basics ?? {}) },
          addresses: Array.isArray(parsed.addresses) ? parsed.addresses : [],
          cards: Array.isArray(parsed.cards) ? parsed.cards : [],
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          prefs: { ...DEFAULT_BLOB.prefs, ...(parsed.prefs ?? {}) },
        });
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(blob));
    } catch {
      /* ignore */
    }
  }, [blob, hydrated]);

  // ---------- session ----------
  const login = useCallback(
    (email: string) => {
      setBlob((b) => ({
        ...b,
        basics: {
          ...b.basics,
          email: email || b.basics.email,
          memberSince: b.basics.memberSince || new Date().toISOString(),
        },
      }));
      setUserState('signed_in');
    },
    [setUserState],
  );

  const logout = useCallback(() => {
    setUserState('anonymous');
  }, [setUserState]);

  const signupAndLogin = useCallback(
    (basics: Partial<ProfileBasics>) => {
      setBlob((b) => ({
        ...b,
        basics: {
          ...b.basics,
          ...basics,
          memberSince: b.basics.memberSince || new Date().toISOString(),
        },
      }));
      setUserState('signed_in');
    },
    [setUserState],
  );

  // Qualification is NEVER granted outright. It is set only at the end of the
  // shipping → payment gate flow (BillingGatePopover → setUserState), so a button
  // click alone can't make a user SESH-qualified.

  // ---------- profile ----------
  const updateBasics = useCallback((patch: Partial<ProfileBasics>) => {
    setBlob((b) => ({ ...b, basics: { ...b.basics, ...patch } }));
  }, []);

  // ---------- addresses ----------
  const addAddress = useCallback(
    (addr: Omit<Address, 'id' | 'isDefault'> & { isDefault?: boolean }) => {
      // Authoritative allowlist guard — refuse to save a disallowed destination even
      // if the form UI is bypassed. Returns '' (no id) so callers can detect it.
      if (!isShippableState(addr.state)) return '';
      const id = genId('addr');
      setBlob((b) => {
        const isFirst = b.addresses.length === 0;
        const makeDefault = addr.isDefault || isFirst;
        const next: Address = {
          id,
          isDefault: makeDefault,
          label: addr.label,
          fullName: addr.fullName,
          line1: addr.line1,
          line2: addr.line2,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          phone: addr.phone,
        };
        const cleared = makeDefault ? b.addresses.map((a) => ({ ...a, isDefault: false })) : b.addresses;
        return { ...b, addresses: [...cleared, next] };
      });
      return id;
    },
    [],
  );

  const updateAddress = useCallback((id: string, patch: Partial<Omit<Address, 'id'>>) => {
    // Refuse to move an address to a disallowed state.
    if (patch.state !== undefined && !isShippableState(patch.state)) return;
    setBlob((b) => ({
      ...b,
      addresses: b.addresses.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }, []);

  const removeAddress = useCallback((id: string) => {
    setBlob((b) => {
      const remaining = b.addresses.filter((a) => a.id !== id);
      // promote first to default if we removed the default
      const wasDefault = b.addresses.find((a) => a.id === id)?.isDefault;
      if (wasDefault && remaining.length > 0) {
        remaining[0] = { ...remaining[0], isDefault: true };
      }
      return { ...b, addresses: remaining };
    });
  }, []);

  const setDefaultAddress = useCallback((id: string) => {
    setBlob((b) => ({
      ...b,
      addresses: b.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
    }));
  }, []);

  // ---------- cards ----------
  const addCard = useCallback(
    (card: Omit<PaymentCard, 'id' | 'isDefault'> & { isDefault?: boolean }) => {
      const id = genId('card');
      setBlob((b) => {
        const isFirst = b.cards.length === 0;
        const makeDefault = card.isDefault || isFirst;
        const next: PaymentCard = {
          id,
          isDefault: makeDefault,
          brand: card.brand,
          last4: card.last4,
          expMonth: card.expMonth,
          expYear: card.expYear,
          nameOnCard: card.nameOnCard,
        };
        const cleared = makeDefault ? b.cards.map((c) => ({ ...c, isDefault: false })) : b.cards;
        return { ...b, cards: [...cleared, next] };
      });
      return id;
    },
    [],
  );

  const updateCard = useCallback((id: string, patch: Partial<Omit<PaymentCard, 'id'>>) => {
    setBlob((b) => ({
      ...b,
      cards: b.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const removeCard = useCallback((id: string) => {
    setBlob((b) => {
      const remaining = b.cards.filter((c) => c.id !== id);
      const wasDefault = b.cards.find((c) => c.id === id)?.isDefault;
      if (wasDefault && remaining.length > 0) {
        remaining[0] = { ...remaining[0], isDefault: true };
      }
      return { ...b, cards: remaining };
    });
  }, []);

  const setDefaultCard = useCallback((id: string) => {
    setBlob((b) => ({
      ...b,
      cards: b.cards.map((c) => ({ ...c, isDefault: c.id === id })),
    }));
  }, []);

  // ---------- orders ----------
  const placeOrder = useCallback<Ctx['placeOrder']>((input) => {
    // Authoritative data-layer guard: never record an order to a disallowed
    // destination, regardless of which path (checkout or settlement) calls in or
    // whether the client was bypassed. Returns '' (no order) on block.
    const shipTo = input.shippingAddressId
      ? blobRef.current.addresses.find((a) => a.id === input.shippingAddressId)
      : undefined;
    if (shipTo && !isShippableState(shipTo.state)) return '';
    const id = genOrderId();
    const order: Order = {
      id,
      date: new Date().toISOString(),
      status: 'placed',
      lines: input.lines,
      subtotal: input.subtotal,
      shipping: input.shipping,
      tax: input.tax,
      total: input.total,
      shippingAddressId: input.shippingAddressId,
      paymentCardId: input.paymentCardId,
    };
    setBlob((b) => ({ ...b, orders: [order, ...b.orders] }));
    return id;
  }, []);

  const getOrder = useCallback(
    (id: string) => blob.orders.find((o) => o.id === id),
    [blob.orders],
  );

  // ---------- prefs ----------
  const updatePrefs = useCallback((patch: Partial<Preferences>) => {
    setBlob((b) => ({ ...b, prefs: { ...b.prefs, ...patch } }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...blob,
      login,
      logout,
      signupAndLogin,
      updateBasics,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
      addCard,
      updateCard,
      removeCard,
      setDefaultCard,
      placeOrder,
      getOrder,
      updatePrefs,
      hydrated,
    }),
    [
      blob,
      login,
      logout,
      signupAndLogin,
      updateBasics,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
      addCard,
      updateCard,
      removeCard,
      setDefaultCard,
      placeOrder,
      getOrder,
      updatePrefs,
      hydrated,
    ],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>');
  return ctx;
}

/* Exposed helpers for forms that need to validate / display a card brand. */
export const cardBrand = detectCardBrand;
