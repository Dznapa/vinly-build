'use client';

/* Welcome-to-Vinly — a single-screen onboarding for anonymous (not-known) users only.
   Shown automatically right after the age gate: a glanceable 3-step "How it works"
   screen. Its "Enter the floor" button (or the X / Esc) closes the overlay onto the
   blurred SESH floor + the existing sign-up gate (unchanged) — anyone who doesn't want
   to read just taps straight through, so there's no forced reading.

   Signed-in / SESH-qualified users never see it (they get WelcomeBackLine instead).
   Dismissal is REMEMBERED in localStorage so returning anonymous visitors aren't
   re-prompted. Lives in the persistent layout. */

import { useEffect, useState } from 'react';
import { useUserState } from '@/context/UserStateContext';
import { useAgeGate } from '@/context/AgeGateContext';
import { useOnboarding } from '@/context/OnboardingContext';

const STORAGE_KEY = 'vinly:welcomeSeen';

export function WelcomeModal() {
  const { userState, hydrated } = useUserState();
  // The age gate comes FIRST — the welcome only opens once the visitor has affirmed.
  const { passed: agePassed } = useAgeGate();
  const { setWelcomeOpen } = useOnboarding();
  const [open, setOpen] = useState(false);

  // Publish open-state so the always-on timer stays suppressed while the explainer is up.
  useEffect(() => { setWelcomeOpen(open); }, [open, setWelcomeOpen]);

  // Auto-open only for anonymous users who haven't dismissed it before, once state
  // has hydrated AND the age gate has been passed (so the order is age gate → welcome,
  // known/qualified users never see it, and there's no SSR/hydration flash).
  useEffect(() => {
    if (!hydrated || userState !== 'guest' || !agePassed) return;
    let dismissed = false;
    try { dismissed = window.localStorage.getItem(STORAGE_KEY) === '1'; } catch { /* ignore */ }
    if (!dismissed) setOpen(true);
  }, [hydrated, userState, agePassed]);

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

        {/* Glanceable 3-step "How it works" — auto-shown after the age gate as the
            single welcome screen. A ~3-second read that fits one mobile screen; reuses
            the welcome modal/CTA chrome. "Enter the floor" / X / Esc all exit. */}
        <>
            <div className="welcome-hiw-eyebrow">Here&apos;s how it works</div>
            <p className="welcome-lede welcome-hiw-hook">
              It&apos;s a <span className="welcome-hiw-accent">live wine market</span>.
            </p>
            <p className="welcome-sub welcome-hiw-sub">Three things, then you&apos;re in.</p>

            <div className="welcome-hiw-steps">
              <div className="welcome-hiw-step">
                <span className="welcome-hiw-ic"><i className="fa-solid fa-arrow-trend-up" aria-hidden /></span>
                <div className="welcome-hiw-body">
                  <div className="welcome-hiw-head">PRICES MOVE</div>
                  <p className="welcome-hiw-line">
                    Live, up and down with demand. The number you see is <span className="welcome-hiw-accent">real-time</span>.
                  </p>
                </div>
              </div>

              <div className="welcome-hiw-step">
                <span className="welcome-hiw-ic"><i className="fa-solid fa-stopwatch" aria-hidden /></span>
                <div className="welcome-hiw-body">
                  <div className="welcome-hiw-head">15-MIN WINDOW</div>
                  <p className="welcome-hiw-line">
                    Buy one bottle and a <span className="welcome-hiw-accent">15-minute clock</span> opens — keep stacking into the same order.
                  </p>
                </div>
              </div>

              <div className="welcome-hiw-step">
                <span className="welcome-hiw-ic"><i className="fa-solid fa-truck-fast" aria-hidden /></span>
                <div className="welcome-hiw-body">
                  <div className="welcome-hiw-head">6 BOTTLES = FREE SHIPPING</div>
                  <p className="welcome-hiw-line">
                    Beat the clock to six and <span className="welcome-hiw-green">shipping&apos;s free</span>. SESH, Ticker &amp; Shop all count.
                  </p>
                </div>
              </div>
            </div>

            <button type="button" className="welcome-cta welcome-hiw-cta" onClick={dismiss}>
              ENTER THE FLOOR&nbsp;&nbsp;→
            </button>
            <div className="welcome-hiw-foot">You&apos;ll see it all again as you go.</div>
        </>
      </div>
    </div>
  );
}

export default WelcomeModal;
