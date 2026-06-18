'use client';

/* Welcome-to-Vinly wizard — shows on every full page load / refresh (it lives in
   the persistent layout, so it re-appears on hard reload / URL refresh but not on
   in-app navigation). Lighter backdrop than the billing gate; explains Vinly, the
   SESH, and the site, with a single CTA into the experience. */

import { useEffect, useState } from 'react';

export function WelcomeModal() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="welcome-overlay" role="dialog" aria-modal="true" aria-label="Welcome to Vinly">
      <div className="welcome-modal">
        <div className="welcome-eyebrow">WELCOME TO</div>
        <div className="welcome-wordmark">vinly</div>
        <div className="welcome-tagline">Instinct wins. Hesitation loses.</div>

        <div className="welcome-body">
          <p>
            <b>Vinly</b> is a members-only wine marketplace where rare and allocated bottles trade
            like a live market — fixed retail is out, real-time pricing is in.
          </p>
          <p>
            <b>The SESH</b> is our daily live drop: one standout bottle whose price moves in real
            time. Watch it climb and dip on the chart, then lock yours in before the clock runs out.
          </p>
          <p>
            Beyond the SESH, the <b>Winemaker Spotlight</b> features hand-picked bottles with the
            story behind them, and the <b>Shop</b> keeps limited releases open around the clock.
          </p>
          <p className="welcome-note">
            Pricing unlocks once you&apos;re SESH-qualified — create an account and add billing to
            participate.
          </p>
        </div>

        <button type="button" className="welcome-cta" onClick={() => setOpen(false)}>
          EXPLORE THE SESH
        </button>
      </div>
    </div>
  );
}

export default WelcomeModal;
