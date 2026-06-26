/* cartTotals — pure, framework-free money math for the cart/checkout.

   The cart holds two pools of line items:
   - STANDARD ("Shop" / "Winemaker Spotlight") — charged NOW via Place Order.
   - SESH / Ticker (locked: true) — one-click reservations that are ALREADY paid and
     settle automatically on the customer's default card when the SESH window closes.
     They are NEVER part of the Place Order charge.

   This file is intentionally dependency-free (no React) so it is unit-testable on its
   own and so it can be the single source of truth for the shipping rule. */

// Flat shipping under the free-shipping threshold (owner-confirmed $35).
export const SHIPPING_RATE = 35.0;
export const FREE_SHIP_THRESHOLD = 6;
// NEEDS REVIEW: 8.25% placeholder until owner confirms.
export const CHECKOUT_TAX_RATE = 0.0825;

/* SINGLE SOURCE OF TRUTH for shipping. 6+ bottles = free, under 6 = flat $35, empty
   = $0. Assessed once against a final bottle count — no per-charge shipping. */
export function assessShipping(bottleCount: number): number {
  if (bottleCount <= 0) return 0;
  return bottleCount >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_RATE;
}

const round2 = (n: number) => Number(n.toFixed(2));

export type TotalsLine = { qty: number; unitPrice: number; locked?: boolean };

export type PoolTotals = {
  bottles: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
};

export type OrderSplit = {
  /** STANDARD items — the amount Place Order charges right now. */
  dueNow: PoolTotals;
  /** SESH/Ticker reservations — already paid; shown for information only. */
  reserved: PoolTotals;
  hasStandard: boolean;
  hasReserved: boolean;
};

function poolTotals(lines: TotalsLine[], taxRate: number, applyShippingAndTax: boolean): PoolTotals {
  let bottles = 0;
  let rawSubtotal = 0;
  for (const l of lines) {
    bottles += l.qty;
    rawSubtotal += l.unitPrice * l.qty;
  }
  const subtotal = round2(rawSubtotal);
  // ASSUMPTION (confirm with owner): the free-shipping bottle threshold counts only
  // the bottles in THIS pool — i.e. standard shipping is decided by standard bottles
  // alone. SESH/Ticker bottles do not subsidize standard shipping (and vice-versa).
  const shipping = applyShippingAndTax ? assessShipping(bottles) : 0;
  const tax = applyShippingAndTax ? round2(subtotal * taxRate) : 0;
  const total = round2(subtotal + shipping + tax);
  return { bottles, subtotal, shipping, tax, total };
}

/* Split a flat list of cart lines into the "due now" (standard) pool and the
   "settles at window close" (SESH/Ticker) pool.

   - dueNow:   standard subtotal + standard shipping + standard tax  ← Place Order charges THIS.
   - reserved: SESH subtotal only. Tax & shipping for reservations settle at window
     close, so they are EXCLUDED here (reserved.shipping/tax = 0, total = subtotal). */
export function splitOrderTotals(lines: TotalsLine[], taxRate: number = CHECKOUT_TAX_RATE): OrderSplit {
  const standard = lines.filter((l) => !l.locked);
  const reserved = lines.filter((l) => l.locked);
  return {
    dueNow: poolTotals(standard, taxRate, true),
    reserved: poolTotals(reserved, taxRate, false),
    hasStandard: standard.length > 0,
    hasReserved: reserved.length > 0,
  };
}
