/* Live ticker price — a small, deterministic drift around each wine's base price so
   the "trade wine like stocks" board actually moves.

   PURE function of (base, id, now): every consumer computes the same value at the
   same instant, so the price shown on the ticker tile and the price a quick-buy
   re-lock captures are guaranteed to match. No stored state, no randomness — safe
   to call from the tile render and from the popover's re-lock at any time.

   The lock itself FREEZES a captured price; re-lock re-samples this function at the
   current time, which is why re-locking picks up wherever the market has drifted. */

const DRIFT_PCT = 0.06; // ± band around the base price (~6%)
const PERIOD_MS = 45_000; // one full oscillation ≈ 45s

// Deterministic per-id phase so wines don't all move in lockstep.
function phaseFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return (h / 997) * Math.PI * 2;
}

/* Current live price for a ticker wine. `now` is passed in (typically Date.now())
   so callers control timing and SSR can pin a stable value to avoid hydration
   mismatches. Rounded to cents. */
export function liveTickerPrice(base: number, id: string, now: number): number {
  const phase = phaseFor(id);
  const t = (now / PERIOD_MS) * Math.PI * 2;
  // Two summed sine waves → a less regular, more market-ish wiggle.
  const wiggle = Math.sin(t + phase) * 0.7 + Math.sin(t * 0.37 + phase * 1.9) * 0.3;
  const price = base * (1 + DRIFT_PCT * wiggle);
  return Math.round(price * 100) / 100;
}
