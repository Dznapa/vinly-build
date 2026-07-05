'use client';

/* Welcome-to-Vinly — a TWO-STAGE onboarding for anonymous (not-known) users only.
   Stage 1: a short warm welcome with a fork ("See how it works" vs "Take me to the
   floor"). Stage 2: the EXISTING dense explainer (THE SESH / THE TICKER / THE MARKET),
   reused as-is, shown only if the user opts in. Either exit just closes the overlay
   onto the blurred SESH floor + the existing sign-up gate (unchanged).

   Signed-in / SESH-qualified users never see it (they get WelcomeBackLine instead).
   Dismissal is REMEMBERED in localStorage so returning anonymous visitors aren't
   re-prompted. Lives in the persistent layout. */

import { useEffect, useState } from 'react';
import { useUserState } from '@/context/UserStateContext';

const STORAGE_KEY = 'vinly:welcomeSeen';

type Stage = 'welcome' | 'explainer';

export function WelcomeModal() {
  const { userState, hydrated } = useUserState();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>('welcome');

  // Auto-open only for anonymous users who haven't dismissed it before, and only
  // once state has hydrated (so known/qualified users never see it and there's no
  // SSR/hydration flash).
  useEffect(() => {
    if (!hydrated || userState !== 'anonymous') return;
    let dismissed = false;
    try { dismissed = window.localStorage.getItem(STORAGE_KEY) === '1'; } catch { /* ignore */ }
    if (!dismissed) { setStage('welcome'); setOpen(true); }
  }, [hydrated, userState]);

  // Close + remember the dismissal so it doesn't re-prompt next visit.
  const dismiss = () => {
    setOpen(false);
    try { window.localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="welcome-overlay" role="dialog" aria-modal="true" aria-label="Welcome to Vinly">
      <div className="welcome-modal">
        <button type="button" className="welcome-close" aria-label="Close" onClick={dismiss}>
          <i className="fa-solid fa-xmark" aria-hidden />
        </button>

        {stage === 'welcome' ? (
          /* ===== STAGE 1 — short warm welcome + fork (fits one mobile screen) ===== */
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="welcome-logo" src="/vinly-logo.png" alt="Vinly" />
            <p className="welcome-lede">Welcome to Vinly.</p>
            <p className="welcome-sub welcome-sub--lead">
              Forget everything you know about buying wine. This is a live market. Prices move
              with demand. Inventory is limited. The SESH is open.
            </p>
            <p className="welcome-sub welcome-sub--hint">
              First time? Take the 20-second tour. Been around the block? Head straight in.
            </p>
            <div className="welcome-actions">
              <button type="button" className="welcome-cta" onClick={() => setStage('explainer')}>
                See how it works&nbsp;&nbsp;→
              </button>
              <button type="button" className="welcome-cta welcome-cta--ghost" onClick={dismiss}>
                Take me to the floor&nbsp;&nbsp;→
              </button>
            </div>
          </>
        ) : (
          /* ===== STAGE 2 — the existing explainer, reused as-is ===== */
          <>
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

            <button type="button" className="welcome-cta" onClick={dismiss}>
              SHOW ME THE FLOOR
            </button>
            <button type="button" className="welcome-back" onClick={() => setStage('welcome')}>
              ← Back
            </button>
            <div className="welcome-foot-tagline">Instinct wins. Hesitation loses.</div>
          </>
        )}
      </div>
    </div>
  );
}

export default WelcomeModal;
