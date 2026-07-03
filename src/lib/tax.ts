/* Destination-based sales-tax RATE resolution — the single source of truth for
   "what rate applies to this shipping address".

   The actual tax CALCULATION (subtotal × rate, rounded to cents) lives in
   cartTotals (`taxAmount`), which every surface already reuses. This module only
   answers "which rate for this destination", so the standard checkout, the
   window-close settlement, and the SESH/Ticker quick-buy panels all agree for the
   same address.

   Rates are destination (US state) based. Unknown / missing destination falls back
   to DEFAULT_TAX_RATE (the app's long-standing flat rate) — never $0, so a missing
   address is flagged and estimated, not silently under-charged. CA is kept at the
   existing 8.25% so the default mock address is unchanged. */

import { CHECKOUT_TAX_RATE } from './cartTotals';

/** Fallback when the destination state is unknown/missing (existing flat behavior). */
export const DEFAULT_TAX_RATE = CHECKOUT_TAX_RATE;

/* Combined state+local sales-tax rates by 2-letter state code (approximate; a
   prototype table, not a compliance source). Oregon has no sales tax (0). Any state
   not listed falls back to DEFAULT_TAX_RATE. */
export const STATE_TAX_RATES: Record<string, number> = {
  CA: 0.0825, // keep = existing default so Napa CA checkout is unchanged
  NY: 0.08875,
  TX: 0.0625,
  WA: 0.101,
  OR: 0.0, // no state sales tax
  FL: 0.06,
  IL: 0.0625,
  CO: 0.029,
  NV: 0.0685,
  AZ: 0.056,
  MA: 0.0625,
  NJ: 0.06625,
  PA: 0.06,
  MI: 0.06,
  GA: 0.04,
  NC: 0.0475,
  OH: 0.0575,
  VA: 0.053,
  MN: 0.06875,
  TN: 0.07,
};

/* Shippability lives in the authoritative allowlist (lib/shippableStates) — the ONE
   source of truth. Tax is only ever computed for a shippable destination (callers
   block disallowed states before tax). */

/** Resolve the sales-tax rate for a destination state code. Missing/unknown → default. */
export function taxRateForState(state?: string | null): number {
  if (!state) return DEFAULT_TAX_RATE;
  const rate = STATE_TAX_RATES[state.trim().toUpperCase()];
  return rate === undefined ? DEFAULT_TAX_RATE : rate;
}

/** Format a rate as a percent string for labels, e.g. 0.0825 → "8.25%". */
export function formatTaxRate(rate: number): string {
  // Trim trailing zeros but keep up to 3 decimals (e.g. 8.875%, 6%, 10.1%).
  const pct = rate * 100;
  return `${Number(pct.toFixed(3))}%`;
}
