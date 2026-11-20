'use client';

/* ShippingWindowModal — the 15-minute free-shipping window UI.
   Renders one of three states from ShippingWindowContext:
     • active + expanded  → full window modal (countdown, 6-seg meter, CTAs)
     • active + minimized → small floating timer badge (timer keeps running)
     • finalized          → confirmation of what was charged / shipping outcome
   ESC minimizes (does not cancel); focus is trapped while the modal is open. */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShippingWindow } from '@/context/ShippingWindowContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { useUserState } from '@/context/UserStateContext';
import { useAgeGate } from '@/context/AgeGateContext';
import { FREE_SHIP_THRESHOLD } from '@/context/CartContext';

// Single source for the free-shipping threshold (display side).
const FREE_AT = FREE_SHIP_THRESHOLD;

// First-timers get the explainer auto-opened once; returning users just see the chip.
const EXPLAINER_SEEN_KEY = 'vinly:shipWindowExplainerSeen';

// Editable headlines for the under-6 progress states. The >= 6 (free) headline is
// left inline below and untouched. Plural/singular handled here; driven by the same
// cart bottle total the meter and counter use.
const SHIP_HL_ONE = 'One bottle’s in. Get to six.';
const shipHlLastOne = (bottles: number) => `${bottles} in. One bottle to go.`;
const shipHlMany = (bottles: number, remaining: number) => `${bottles} bottles in. ${remaining} to go.`;

function progressHeadline(bottles: number): string {
  const remaining = FREE_AT - bottles;
  if (bottles <= 1) return SHIP_HL_ONE;
  if (remaining === 1) return shipHlLastOne(bottles);
  return shipHlMany(bottles, remaining);
}

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function ShippingWindowModal() {
  const w = useShippingWindow();
  const { welcomeOpen } = useOnboarding();
  const { userState, hydrated: userHydrated } = useUserState();
  const { passed: agePassed } = useAgeGate();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  // Onboarding is on screen when: we haven't hydrated yet (suppress to avoid a
  // first-paint flash), the age gate is up (guest who hasn't affirmed — derived
  // render-side so there's no lag), or the welcome/explainer is open. The timer only
  // populates once the visitor is past all of it and actually on the floor.
  const onboarding = !userHydrated || (userState === 'guest' && !agePassed) || welcomeOpen;

  const modalOpen = (w.active && !w.minimized) || w.finalized !== null;

  // ESC → minimize (active) or dismiss (finalized); trap Tab within the card.
  useEffect(() => {
    if (!modalOpen) return;
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (w.finalized) w.dismiss();
        else w.minimize();
        return;
      }
      if (e.key === 'Tab' && cardRef.current) {
        const nodes = cardRef.current.querySelectorAll<HTMLElement>('button, a[href]');
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, w]);

  // Alerts when the cart crosses the free-shipping threshold (either direction).
  const [dropAlert, setDropAlert] = useState(false);
  const [unlockAlert, setUnlockAlert] = useState(false);
  const prevBottles = useRef(w.bottles);
  useEffect(() => {
    if (w.active && prevBottles.current >= FREE_AT && w.bottles < FREE_AT) { setDropAlert(true); setUnlockAlert(false); }
    if (w.active && prevBottles.current < FREE_AT && w.bottles >= FREE_AT) { setUnlockAlert(true); setDropAlert(false); }
    prevBottles.current = w.bottles;
  }, [w.bottles, w.active]);
  useEffect(() => {
    if (!dropAlert) return;
    const t = window.setTimeout(() => setDropAlert(false), 7000);
    return () => window.clearTimeout(t);
  }, [dropAlert]);
  useEffect(() => {
    if (!unlockAlert) return;
    const t = window.setTimeout(() => setUnlockAlert(false), 8000);
    return () => window.clearTimeout(t);
  }, [unlockAlert]);

  // Collapsed chip ⇄ explainer popover. `canHover` splits the interaction: hover
  // (desktop) peeks the explainer and a click opens the full window; on touch there's
  // no hover, so a tap toggles the explainer (which carries its own "Open window" CTA).
  const [explain, setExplain] = useState(false);
  const [canHover, setCanHover] = useState(false);
  const autoShown = useRef(false);
  useEffect(() => {
    setCanHover(window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false);
  }, []);
  // FIRST-TIME EDUCATION: auto-expand the explainer exactly once (ever, per browser)
  // when the always-on chip first appears, then collapse after a few seconds. Returning
  // users just get the compact chip.
  useEffect(() => {
    // Only once the chip is actually on the floor — never during onboarding.
    const chipVisible = !onboarding && !w.finalized && !(w.active && !w.minimized);
    if (!chipVisible || autoShown.current) return;
    autoShown.current = true;
    let seen = false;
    try { seen = window.localStorage.getItem(EXPLAINER_SEEN_KEY) === '1'; } catch { /* ignore */ }
    if (seen) return;
    try { window.localStorage.setItem(EXPLAINER_SEEN_KEY, '1'); } catch { /* ignore */ }
    setExplain(true);
    const t = window.setTimeout(() => setExplain(false), 6000);
    return () => window.clearTimeout(t);
  }, [onboarding, w.finalized, w.active, w.minimized]);

  // Suppress the entire widget (chip + auto-expanded popup) while onboarding is on
  // screen — the age gate or the "Here's how it works" explainer. The timer only
  // populates once the visitor is actually on the floor.
  if (onboarding) return null;

  // FINALIZED — SESH/Ticker settled. If shop wines are still in the cart, prompt to
  // complete them; otherwise just confirm the charge.
  if (w.finalized) {
    const f = w.finalized;
    const remaining = f.remainingShop ?? 0;
    const hasRemaining = remaining > 0;
    return (
      <div className="ship-overlay" role="dialog" aria-modal="true" aria-label={hasRemaining ? 'Finish your order' : 'Order confirmed'}>
        <div className="ship-card ship-card--done" tabIndex={-1} ref={cardRef}>
          <div className="ship-done-ic"><i className="fa-solid fa-circle-check" aria-hidden /></div>
          <h2 className="ship-hl">{hasRemaining ? 'SESH/Ticker settled.' : 'Window closed. Card ran.'}</h2>
          <p className="ship-mech">
            Order <b>{f.orderId}</b> — <b>${f.total.toFixed(2)}</b> charged to your card on file.{' '}
            {f.freeShip
              ? <b className="ship-free">Shipping waived — 6+ bottles.</b>
              : <>Flat <b>$35</b> shipping applied (under 6 bottles).</>}
          </p>
          {hasRemaining && (
            <p className="ship-mech ship-remaining">
              You still have <b>{remaining} wine{remaining === 1 ? '' : 's'}</b> in your cart that
              need checking out. The SESH/Ticker items above have settled — complete the rest to place them.
            </p>
          )}
          <div className="ship-ctas">
            {hasRemaining ? (
              <button
                type="button"
                className="ship-btn ship-btn-primary"
                onClick={() => { w.dismiss(); router.push('/checkout/billing'); }}
              >
                COMPLETE YOUR ORDER&nbsp;&nbsp;→
              </button>
            ) : (
              <button
                type="button"
                className="ship-btn ship-btn-primary"
                onClick={() => { w.dismiss(); router.push(`/checkout/summary?orderId=${f.orderId}`); }}
              >
                VIEW ORDER&nbsp;&nbsp;→
              </button>
            )}
            <button type="button" className="ship-btn ship-btn-ghost" onClick={w.dismiss}>Close</button>
          </div>
          <div className="ship-foot"><i>Instinct wins. Hesitation loses.</i></div>
        </div>
      </div>
    );
  }

  const filled = Math.min(FREE_AT, w.bottles);
  const free = w.bottles >= FREE_AT;
  const pct = Math.round((filled / FREE_AT) * 100);
  const danger = w.secondsLeft <= 120;

  // The chip's bottle count is ALWAYS live (cart.count — shop + spotlight + ticker +
  // sesh). The countdown display is phase-driven:
  //   • idle    → static, dimmed window length (no dynamic purchase has started it yet)
  //   • running → live countdown with staged urgency
  //   • done    → frozen at 0:00
  // Staged urgency (running only): steady > 2:00 · red ≤ 2:00 · soft breath ≤ 1:00 ·
  // per-second tick ≤ 0:30 · done at 0. Calm, not a strobe.
  const phase = w.phase;
  const sec = phase === 'running' ? w.secondsLeft : phase === 'idle' ? w.windowSeconds : 0;
  const stage =
    phase === 'idle' ? 'idle'
      : phase === 'done' ? 'done'
        : sec <= 0 ? 'done'
          : sec <= 30 ? 'tick'
            : sec <= 60 ? 'soft'
              : sec <= 120 ? 'red'
                : 'steady';
  const timeText =
    phase === 'idle' ? mmss(w.windowSeconds)
      : phase === 'done' ? mmss(0)
        : stage === 'done' ? 'Charging…'
          : mmss(sec);

  // ALWAYS-ON CHIP — rendered in every state (idle, running-minimized, done). The full
  // window modal only takes over when a running window is explicitly expanded.
  if (!w.active || w.minimized) {
    return (
      <>
        {unlockAlert && (
          <div className="ship-unlock" role="status">
            <button type="button" className="ship-drop-x" onClick={() => setUnlockAlert(false)} aria-label="Dismiss">
              <i className="fa-solid fa-xmark" aria-hidden />
            </button>
            <div className="ship-unlock-head">
              <i className="fa-solid fa-circle-check" aria-hidden /> Free shipping unlocked!
            </div>
            <p>You&apos;re past 6 bottles — shipping&apos;s on us. Add more or check out; the card runs when the window closes.</p>
          </div>
        )}
        {dropAlert && (
          <div className="ship-drop" role="alert">
            <button type="button" className="ship-drop-x" onClick={() => setDropAlert(false)} aria-label="Dismiss">
              <i className="fa-solid fa-xmark" aria-hidden />
            </button>
            <div className="ship-drop-title">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden /> Below 6 bottles
            </div>
            <p>You dropped under 6 — add more before the window closes, or it&apos;s a flat $35.</p>
          </div>
        )}
        <div
          className="ship-chipwrap"
          onMouseEnter={() => { if (canHover) setExplain(true); }}
          onMouseLeave={() => { if (canHover) setExplain(false); }}
          onFocus={() => setExplain(true)}
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setExplain(false); }}
        >
          {explain && (
            <div className="ship-explainer" role="status" id="ship-explainer">
              <button type="button" className="ship-explainer-x" onClick={() => setExplain(false)} aria-label="Close">
                <i className="fa-solid fa-xmark" aria-hidden />
              </button>
              <p className="ship-explainer-lead">
                A SESH or ticker purchase starts your 15 minute countdown. Reach <b>6 bottles</b> before the
                clock hits zero and shipping’s <b className="ship-free">free</b>. Stop short and we add a flat
                <b> $35</b>. Either way, the card runs when time’s up.
              </p>
              <div className="ship-explainer-sub">Mix &amp; match across the floor — SESH, Ticker, Market. They all count.</div>
              <div className="ship-explainer-prog">
                <span className="ship-explainer-track" aria-hidden>
                  <span className={`ship-explainer-fill${free ? ' free' : ''}`} style={{ width: `${pct}%` }} />
                </span>
                <span className="ship-explainer-count">{free ? `${w.bottles} in · free` : `${filled} / ${FREE_AT} bottles`}</span>
              </div>
              <button type="button" className="ship-explainer-cta" onClick={w.expand}>Open window&nbsp;&nbsp;→</button>
            </div>
          )}
          <button
            type="button"
            className={`ship-badge${free ? ' is-free' : ''} ship-stage-${stage}${explain ? ' is-open' : ''}`}
            onClick={() => { if (canHover) w.expand(); else setExplain((o) => !o); }}
            aria-expanded={explain}
            aria-label={`Free-ship window: ${phase === 'idle' ? 'countdown not started' : phase === 'done' ? 'window closed' : stage === 'done' ? 'charging now' : `${mmss(sec)} left`}, ${filled} of 6 bottles${free ? ' — free shipping unlocked' : ''}. ${canHover ? 'Click to open the window; hover for how it works.' : 'Tap for how it works.'}`}
          >
            <span className="ship-badge-dot" aria-hidden />
            <span className="ship-badge-main">
              {/* key remounts the digits each second in the tick stage so they pulse
                  once per tick (reads as time passing). */}
              <span className="ship-badge-time" key={stage === 'tick' ? sec : 'time'}>
                {timeText}
              </span>
              <span className="ship-badge-label">
                {phase === 'done' ? 'ORDER PLACED' : free ? 'FREE SHIPPING ✓' : `${filled} / ${FREE_AT} bottles`}
              </span>
              {stage !== 'done' && (
                <span className="ship-badge-track" aria-hidden>
                  <span className={`ship-badge-fill${free ? ' free' : ''}`} style={{ width: `${pct}%` }} />
                </span>
              )}
            </span>
            <i className="ship-badge-chev fa-solid fa-chevron-up" aria-hidden />
          </button>
        </div>
      </>
    );
  }

  // FULL WINDOW
  return (
    <div className="ship-overlay" role="dialog" aria-modal="true" aria-label="Free shipping window">
      <div className="ship-card" tabIndex={-1} ref={cardRef}>
        <div className="ship-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ship-logo" src="/vinly-logo.png" alt="Vinly" />
          <span className="ship-pill"><span className="ship-pill-dot" aria-hidden /> LOCKED IN</span>
        </div>

        <div className="ship-timer">
          <div className="ship-eyebrow">YOUR WINDOW IS OPEN</div>
          <div className={`ship-clock${danger ? ' is-danger' : ''}`} aria-live="polite">{mmss(w.secondsLeft)}</div>
          <div className="ship-subclock">until your card runs — automatically</div>
        </div>

        <div className="ship-body">
          <h2 className="ship-hl">{free ? 'Shipping’s on us.' : progressHeadline(w.bottles)}</h2>
          <p className="ship-mech">
            {free ? (
              <>You’ve got <b>{w.bottles} bottle{w.bottles === 1 ? '' : 's'}</b> — shipping’s <b className="ship-free">free</b>. The card still runs when time’s up.</>
            ) : (
              <>Reach <b>6 bottles</b> before the clock hits zero and shipping’s <b className="ship-free">free</b>. Stop short and we add a flat <b>$35</b>. Either way, the card runs when time’s up.</>
            )}
          </p>
        </div>

        <div className="ship-prog">
          <div className="ship-prog-top">
            <span className="ship-prog-label">CART</span>
            <span className="ship-prog-count">
              {free
                ? <><span className="n">{w.bottles}</span> <span className="of">bottles · free shipping</span></>
                : <><span className="n">{filled}</span> <span className="of">of 6 bottles</span></>}
            </span>
          </div>
          <div className="ship-bars">
            {Array.from({ length: FREE_AT }).map((_, i) => (
              <span key={i} className={`ship-seg${i < filled ? ' on' : ''}${free ? ' free' : ''}`} />
            ))}
          </div>
          <div className="ship-mixnote">Mix &amp; match across the floor — SESH, Ticker, Market. They all count.</div>
        </div>

        <div className="ship-ctas">
          <button type="button" className="ship-btn ship-btn-primary" onClick={w.minimize}>
            ADD MORE WINES&nbsp;&nbsp;→
          </button>
          <button
            type="button"
            className="ship-btn ship-btn-ghost"
            onClick={() => { w.endWindow(); router.push('/customer-cart'); }}
          >
            Skip It - View Cart
          </button>
        </div>

        <div className="ship-foot"><i>Instinct wins. Hesitation loses.</i></div>
      </div>
    </div>
  );
}

export default ShippingWindowModal;
