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
import { FREE_SHIP_THRESHOLD } from '@/context/CartContext';

// Single source for the free-shipping threshold (display side).
const FREE_AT = FREE_SHIP_THRESHOLD;

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
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

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

  if (!w.active) return null;

  const filled = Math.min(FREE_AT, w.bottles);
  const free = w.bottles >= FREE_AT;
  const danger = w.secondsLeft <= 120;
  // Staged urgency for the floating badge (PRESENTATION ONLY — same countdown):
  // steady > 2:00 · red ≤ 2:00 (matches the modal's red clock) · soft breath ≤ 1:00 ·
  // per-second tick ≤ 0:30 · done at 0. Calm, not a strobe.
  const sec = w.secondsLeft;
  const stage =
    sec <= 0 ? 'done'
      : sec <= 30 ? 'tick'
        : sec <= 60 ? 'soft'
          : sec <= 120 ? 'red'
            : 'steady';

  // MINIMIZED — floating timer badge, timer still running.
  if (w.minimized) {
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
        <button
          type="button"
          className={`ship-badge${free ? ' is-free' : ''} ship-stage-${stage}`}
          onClick={w.expand}
          aria-label={`Free-ship window: ${stage === 'done' ? 'charging now' : `${mmss(sec)} left`}, ${filled} of 6 bottles${free ? ' — free shipping unlocked' : ''}. Tap to expand.`}
        >
          <span className="ship-badge-dot" aria-hidden />
          <span className="ship-badge-main">
            {/* key remounts the digits each second in the tick stage so they pulse
                once per tick (reads as time passing). */}
            <span className="ship-badge-time" key={stage === 'tick' ? sec : 'time'}>
              {stage === 'done' ? 'Charging…' : mmss(sec)}
            </span>
            <span className="ship-badge-label">
              {stage === 'done' ? 'ORDER PLACED' : free ? 'FREE SHIPPING ✓' : `${filled}/6 · free-ship window`}
            </span>
          </span>
        </button>
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
