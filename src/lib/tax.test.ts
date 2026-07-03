import { describe, it, expect } from 'vitest';
import { taxRateForState, DEFAULT_TAX_RATE, formatTaxRate } from './tax';
import { taxAmount, splitOrderTotals, type TotalsLine } from './cartTotals';

describe('taxRateForState', () => {
  it('resolves known states', () => {
    expect(taxRateForState('CA')).toBe(0.0825);
    expect(taxRateForState('NY')).toBe(0.08875);
    expect(taxRateForState('OR')).toBe(0); // no sales tax, but a real 0 (valid destination)
  });

  it('is case/whitespace tolerant', () => {
    expect(taxRateForState(' ca ')).toBe(0.0825);
    expect(taxRateForState('ny')).toBe(0.08875);
  });

  it('falls back to the default rate for unknown/missing (never undefined/0-by-omission)', () => {
    expect(taxRateForState(undefined)).toBe(DEFAULT_TAX_RATE);
    expect(taxRateForState('')).toBe(DEFAULT_TAX_RATE);
    expect(taxRateForState('ZZ')).toBe(DEFAULT_TAX_RATE);
  });
});

describe('formatTaxRate', () => {
  it('formats without trailing zeros', () => {
    expect(formatTaxRate(0.0825)).toBe('8.25%');
    expect(formatTaxRate(0.08875)).toBe('8.875%');
    expect(formatTaxRate(0.06)).toBe('6%');
    expect(formatTaxRate(0)).toBe('0%');
  });
});

describe('quick-buy tax agrees with standard checkout for the same destination', () => {
  // A quick-buy reservation is a single locked line; the checkout treats the same
  // wine as a standard line. For the same destination rate + qty, the tax must match.
  const cases: { state: string; unit: number; qty: number }[] = [
    { state: 'CA', unit: 240, qty: 1 },
    { state: 'CA', unit: 240, qty: 6 },
    { state: 'NY', unit: 42, qty: 1 },
    { state: 'NY', unit: 42, qty: 6 },
    { state: 'OR', unit: 110, qty: 6 },
  ];

  for (const { state, unit, qty } of cases) {
    it(`${state} · $${unit} × ${qty}`, () => {
      const rate = taxRateForState(state);
      const subtotal = Number((unit * qty).toFixed(2));

      // Quick-buy panel math.
      const quickBuyTax = taxAmount(subtotal, rate);

      // Standard checkout math (same wine as a standard line, same rate).
      const line: TotalsLine = { unitPrice: unit, qty };
      const split = splitOrderTotals([line], rate);

      expect(split.dueNow.subtotal).toBe(subtotal);
      expect(split.dueNow.tax).toBe(quickBuyTax);
      // Tax is non-zero wherever the rate is non-zero (no silent $0).
      if (rate > 0) expect(quickBuyTax).toBeGreaterThan(0);
    });
  }
});
