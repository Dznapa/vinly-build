import { describe, it, expect } from 'vitest';
import { liveTickerPrice } from './tickerPrice';

describe('liveTickerPrice', () => {
  it('is deterministic for the same (base, id, now)', () => {
    const a = liveTickerPrice(240, 'shafer-hillside-select', 1_000_000);
    const b = liveTickerPrice(240, 'shafer-hillside-select', 1_000_000);
    expect(a).toBe(b);
  });

  it('stays within the ±6% drift band around base', () => {
    const base = 240;
    for (let now = 0; now <= 90_000; now += 500) {
      const p = liveTickerPrice(base, 'shafer-hillside-select', now);
      expect(p).toBeGreaterThanOrEqual(base * 0.94 - 0.01);
      expect(p).toBeLessThanOrEqual(base * 1.06 + 0.01);
    }
  });

  it('drifts over time (re-lock at a later instant can differ)', () => {
    const base = 240;
    const id = 'shafer-hillside-select';
    const at0 = liveTickerPrice(base, id, 0);
    // Quarter period later the oscillation has clearly moved.
    const later = liveTickerPrice(base, id, 11_250);
    expect(later).not.toBe(at0);
  });

  it('rounds to cents', () => {
    const p = liveTickerPrice(42, 'edict-pinot-noir', 7_777);
    expect(Number.isInteger(Math.round(p * 100))).toBe(true);
    expect(p).toBe(Math.round(p * 100) / 100);
  });

  it('different wines move on different phases at the same instant', () => {
    const now = 5_000;
    const a = liveTickerPrice(100, 'edict-pinot-noir', now) / 100;
    const b = liveTickerPrice(100, 'daou-rose-paso-robles', now) / 100;
    expect(a).not.toBe(b);
  });
});
