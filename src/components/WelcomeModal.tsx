'use client';

/* Welcome-to-Vinly wizard — the first-time onboarding explainer. It auto-shows on
   full page load / refresh ONLY for anonymous (not-known) users; known/signed-in/
   SESH-qualified users skip it and get the rotating welcome-back line instead
   (WelcomeBackLine). It lives in the persistent layout, so it re-appears on hard
   reload / URL refresh but not on in-app navigation. The same explainer stays
   re-openable on demand via the existing learn-more entry point. */

import { useEffect, useState } from 'react';
import { useUserState } from '@/context/UserStateContext';

export function WelcomeModal() {
  const { userState, hydrated } = useUserState();
  const [open, setOpen] = useState(false);

  // Auto-open only for anonymous (not-known) users, and only once state has
  // hydrated from storage — so known/qualified users never see the onboarding
  // wall, and we avoid an SSR/hydration flash.
  useEffect(() => {
    if (hydrated && userState === 'anonymous') setOpen(true);
  }, [hydrated, userState]);

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="welcome-logo" src="/vinly-logo.png" alt="Vinly" />

        <p className="welcome-lede">Wine has a price.<br />We made it interesting.</p>
        <p className="welcome-sub">
          Three ways onto the floor. One of them is closed until you prove you&apos;re serious.
        </p>

        <div className="welcome-manifesto">
          <h3>THIS ISN&apos;T A STORE.</h3>
          <p>
            Stores have shelves and patience. We have a market. Three ways to buy, all of them
            moving faster than you&apos;d like.
          </p>
        </div>

        <ul className="welcome-feats">
          <li>
            <span className="welcome-feat-ic"><i className="fa-solid fa-arrow-trend-up" aria-hidden /></span>
            <p>
              <b>THE SESH. THE MAIN EVENT.</b> One bottle. One day. Live pricing that moves in real
              time. Watch the number, read the room, decide if you&apos;re a buyer. The whole floor
              is watching the same number you are. Most of them blink.
            </p>
          </li>
          <li>
            <span className="welcome-feat-ic"><i className="fa-solid fa-gem" aria-hidden /></span>
            <p>
              <b>THE TICKER. THE RARE STUFF.</b> Limited, hard-to-find, the bottles that don&apos;t
              come back. Live pricing, scrolling all day. If you see something you recognize,
              you&apos;re already late.
            </p>
          </li>
          <li>
            <span className="welcome-feat-ic"><i className="fa-solid fa-store" aria-hidden /></span>
            <p>
              <b>THE MARKET. NO DRAMA.</b> Fixed prices. Your favorites. Superb numbers, no clock,
              no countdown. The bottles you reach for when you&apos;ve stopped trying to impress
              anyone.
            </p>
          </li>
          <li>
            <span className="welcome-feat-ic welcome-feat-ic--lock"><i className="fa-solid fa-lock" aria-hidden /></span>
            <p>
              <b>THE FLOOR OPENS WHEN YOU DO.</b> Live pricing is behind the glass. Get
              SESH-qualified — account, billing method, done — and the number goes live. No card, no
              price. That&apos;s the deal.
            </p>
          </li>
        </ul>

        <button type="button" className="welcome-cta" onClick={() => setOpen(false)}>
          SHOW ME THE FLOOR
        </button>
        <div className="welcome-foot-tagline">Instinct wins. Hesitation loses.</div>
      </div>
    </div>
  );
}

export default WelcomeModal;
