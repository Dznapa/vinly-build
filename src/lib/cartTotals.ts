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

/* Total bottles across a set of cart lines — the input to the free-shipping rule.
   Used everywhere shipping is decided so the threshold counts the WHOLE cart
   (standard "due now" + already-purchased SESH/Ticker), never one pool in isolation. */
export function bottleCount(lines: TotalsLine[]): number {
  return lines.reduce((n, l) => n + l.qty, 0);
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

function poolTotals(
  lines: TotalsLine[],
  taxRate: number,
  applyShippingAndTax: boolean,
  shippingBottleCount: number,
): PoolTotals {
  let bottles = 0;
  let rawSubtotal = 0;
  for (const l of lines) {
    bottles += l.qty;
    rawSubtotal += l.unitPrice * l.qty;
  }
  const subtotal = round2(rawSubtotal);
  // Free-shipping eligibility is decided by the WHOLE cart's bottle count
  // (`shippingBottleCount`), not this pool alone — already-purchased SESH/Ticker
  // bottles count toward the standard "due now" free-shipping threshold, matching
  // the cart page and order confirmation. Shipping only applies when this pool
  // actually has bottles to charge (an empty pool is never billed shipping).
  const shipping = applyShippingAndTax && bottles > 0 ? assessShipping(shippingBottleCount) : 0;
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
  // Free shipping is decided against the FULL cart count (standard + reserved), so
  // SESH/Ticker bottles help unlock free "due now" shipping just like on the cart page.
  const totalBottles = bottleCount(lines);
  return {
    dueNow: poolTotals(standard, taxRate, true, totalBottles),
    reserved: poolTotals(reserved, taxRate, false, 0),
    hasStandard: standard.length > 0,
    hasReserved: reserved.length > 0,
  };
}
