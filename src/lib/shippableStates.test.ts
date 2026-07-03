import { describe, it, expect } from 'vitest';
import { isShippableState, shipBlockMessage, SHIPPABLE_STATES } from './shippableStates';

const ALLOWED = [
  'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'FL', 'GA', 'HI', 'ID',
  'IL', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MN', 'MS',
  'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'ND', 'OH',
  'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'VT', 'VA', 'WA',
  'DC', 'WV', 'WI', 'WY',
];

describe('shippable-states allowlist', () => {
  it('has exactly the 44 allowed codes (43 states + DC)', () => {
    expect(SHIPPABLE_STATES.size).toBe(44);
    for (const code of ALLOWED) expect(isShippableState(code)).toBe(true);
  });

  it('blocks the notable disallowed states', () => {
    for (const code of ['DE', 'UT', 'AL', 'IN', 'MI', 'NC', 'OK']) {
      expect(isShippableState(code)).toBe(false);
    }
  });

  it('blocks US territories and military APO/FPO', () => {
    for (const code of ['PR', 'GU', 'VI', 'AS', 'MP', 'AA', 'AE', 'AP']) {
      expect(isShippableState(code)).toBe(false);
    }
  });

  it('handles missing / unknown / mixed-case input', () => {
    expect(isShippableState(undefined)).toBe(false);
    expect(isShippableState('')).toBe(false);
    expect(isShippableState('ZZ')).toBe(false);
    expect(isShippableState(' ca ')).toBe(true);
    expect(isShippableState('ny')).toBe(true);
  });

  it('block message names the state and states the reason', () => {
    expect(shipBlockMessage('UT')).toBe(
      "We're unable to ship wine to Utah due to that state's shipping laws — please choose a different destination.",
    );
    expect(shipBlockMessage('DE')).toContain('Delaware');
  });
});
