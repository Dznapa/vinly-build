/* AUTHORITATIVE shippable-states allowlist — the ONE source of truth for
   "can we ship wine there?".

   This is policy/config data (not a UI component) so it's easy to update as state
   shipping laws change: edit SHIPPABLE_STATES here and every surface — profile
   address forms, the quick-buy destination dropdown, the cart/checkout selector,
   the server-side order-placement check, and the window-close settlement — follows.

   A destination is shippable ONLY if its 2-letter state/DC code is in the set below.
   Everything else — Delaware, Utah, other unlisted states, US territories (PR/GU/
   VI/AS/MP), and military APO/FPO (AA/AE/AP) — is NOT shippable. */

/** The allowlist. 43 states + DC. Codes are uppercase 2-letter. */
export const SHIPPABLE_STATES: ReadonlySet<string> = new Set([
  'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'FL', 'GA', 'HI', 'ID',
  'IL', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MN', 'MS',
  'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'ND', 'OH',
  'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'VT', 'VA', 'WA',
  'DC', 'WV', 'WI', 'WY',
]);

/** Display names for messaging — all states + DC + territories + military. */
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'Washington DC',
  // Territories & military — never shippable, named for clear messaging.
  PR: 'Puerto Rico', GU: 'Guam', VI: 'the U.S. Virgin Islands', AS: 'American Samoa',
  MP: 'the Northern Mariana Islands', AA: 'a military (APO/FPO) address',
  AE: 'a military (APO/FPO) address', AP: 'a military (APO/FPO) address',
};

function norm(state?: string | null): string {
  return (state ?? '').trim().toUpperCase();
}

/** True only if the destination state/DC code is on the allowlist. */
export function isShippableState(state?: string | null): boolean {
  const code = norm(state);
  return code.length > 0 && SHIPPABLE_STATES.has(code);
}

/** Human-readable destination name for messaging (falls back to the raw code). */
export function stateDisplayName(state?: string | null): string {
  const code = norm(state);
  return STATE_NAMES[code] ?? (code || 'that destination');
}

/** The standard block message shown wherever a disallowed destination is entered. */
export function shipBlockMessage(state?: string | null): string {
  return `We're unable to ship wine to ${stateDisplayName(state)} due to that state's shipping laws — please choose a different destination.`;
}
