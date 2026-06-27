import { describe, it, expect } from 'vitest';
import { splitOrderTotals, SHIPPING_RATE, CHECKOUT_TAX_RATE, type TotalsLine } from './cartTotals';

// Helpers
const standard = (unitPrice: number, qty = 1): TotalsLine => ({ unitPrice, qty });
const sesh = (unitPrice: number, qty = 1): TotalsLine => ({ unitPrice, qty, locked: true });
const round2 = (n: number) => Number(n.toFixed(2));

describe('splitOrderTotals', () => {
  it('mixed cart: Place Order (dueNow) excludes SESH; SESH shown as reserved subtotal only', () => {
    // 1 standard ($14) + 1 SESH ($43.94). Under 6 standard bottles → $35 shipping.
    const s = splitOrderTotals([standard(14), sesh(43.94)]);

    expect(s.hasStandard).toBe(true);
    expect(s.hasReserved).toBe(true);

    // Due now = standard only.
    expect(s.dueNow.bottles).toBe(1);
    expect(s.dueNow.subtotal).toBe(14);
    expect(s.dueNow.shipping).toBe(SHIPPING_RATE); // 35, under threshold
    expect(s.dueNow.tax).toBe(round2(14 * CHECKOUT_TAX_RATE)); // 1.16
    expect(s.dueNow.total).toBe(round2(14 + 35 + 14 * CHECKOUT_TAX_RATE)); // 50.16

    // Reserved = SESH wine subtotal only; tax + shipping settle at close → 0 here.
    expect(s.reserved.bottles).toBe(1);
    expect(s.reserved.subtotal).toBe(43.94);
    expect(s.reserved.shipping).toBe(0);
    expect(s.reserved.tax).toBe(0);
    expect(s.reserved.total).toBe(43.94);

    // The SESH amount is NOT part of the charged (due-now) total.
    expect(s.dueNow.total).not.toBe(round2(14 + 43.94 + 35 + (14 + 43.94) * CHECKOUT_TAX_RATE));
  });

  it('all-standard cart: free shipping at 6+ bottles, nothing reserved', () => {
    const s = splitOrderTotals([standard(20, 6)]);

    expect(s.hasStandard).toBe(true);
    expect(s.hasReserved).toBe(false);
    expect(s.dueNow.bottles).toBe(6);
    expect(s.dueNow.subtotal).toBe(120);
    expect(s.dueNow.shipping).toBe(0); // 6+ bottles → free
    expect(s.dueNow.tax).toBe(round2(120 * CHECKOUT_TAX_RATE));
    expect(s.dueNow.total).toBe(round2(120 + 120 * CHECKOUT_TAX_RATE));

    expect(s.reserved.subtotal).toBe(0);
    expect(s.reserved.total).toBe(0);
  });

  it('all-SESH cart: nothing due now (hasStandard false); reserved subtotal only', () => {
    const s = splitOrderTotals([sesh(43.94), sesh(50)]);

    expect(s.hasStandard).toBe(false);
    expect(s.hasReserved).toBe(true);

    // Nothing to charge.
    expect(s.dueNow.bottles).toBe(0);
    expect(s.dueNow.subtotal).toBe(0);
    expect(s.dueNow.shipping).toBe(0);
    expect(s.dueNow.tax).toBe(0);
    expect(s.dueNow.total).toBe(0);

    // Reserved info.
    expect(s.reserved.bottles).toBe(2);
    expect(s.reserved.subtotal).toBe(93.94);
    expect(s.reserved.total).toBe(93.94);
  });

  it('free shipping counts the WHOLE cart: 4 due-now + 2 SESH = 6 total → due-now shipping is FREE', () => {
    // The reported bug: 4 standard bottles + 2 already-purchased SESH bottles = 6 total.
    // Due-now shipping must be free (>=6 total), even though the standard pool alone is under 6.
    const s = splitOrderTotals([standard(20, 4), sesh(40, 2)]);
    expect(s.dueNow.bottles).toBe(4);
    expect(s.dueNow.shipping).toBe(0); // free — 6 bottles across the whole cart
    expect(s.dueNow.subtotal).toBe(80);
    expect(s.dueNow.tax).toBe(round2(80 * CHECKOUT_TAX_RATE));
    expect(s.dueNow.total).toBe(round2(80 + 80 * CHECKOUT_TAX_RATE)); // no shipping line
    // SESH stays out of the charged total.
    expect(s.reserved.bottles).toBe(2);
    expect(s.reserved.subtotal).toBe(80);
    expect(s.reserved.shipping).toBe(0);
  });

  it('under threshold across the whole cart still charges flat shipping', () => {
    // 1 standard + 3 SESH = 4 total, under 6 → due-now shipping is the flat rate.
    const s = splitOrderTotals([standard(20), sesh(40, 3)]);
    expect(s.dueNow.bottles).toBe(1);
    expect(s.dueNow.shipping).toBe(SHIPPING_RATE);
  });
});
