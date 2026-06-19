'use client';

/* BillingGateContext — one global "add billing to participate" popover that any
   part of the app can trigger. It is opened ONLY when a non-billing-verified
   (not SESH-qualified) user tries to add a wine to their cart / buy. It is never
   shown during normal account creation or the billing/checkout flow itself. */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { BillingGatePopover } from '@/components/BillingGatePopover';

type Ctx = {
  openGate: () => void;
  closeGate: () => void;
  isOpen: boolean;
};

const BillingGateContext = createContext<Ctx | null>(null);

export function BillingGateProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openGate = useCallback(() => setIsOpen(true), []);
  const closeGate = useCallback(() => setIsOpen(false), []);

  const value = useMemo<Ctx>(
    () => ({ openGate, closeGate, isOpen }),
    [openGate, closeGate, isOpen],
  );

  return (
    <BillingGateContext.Provider value={value}>
      {children}
      <BillingGatePopover open={isOpen} onClose={closeGate} />
    </BillingGateContext.Provider>
  );
}

export function useBillingGate() {
  const ctx = useContext(BillingGateContext);
  if (!ctx) throw new Error('useBillingGate must be used inside <BillingGateProvider>');
  return ctx;
}
