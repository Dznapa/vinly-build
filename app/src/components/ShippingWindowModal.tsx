'use client';

/* ShippingWindowModal — the 15-minute free-shipping window UI.
   Renders one of three states from ShippingWindowContext:
     • active + expanded  → full window modal (countdown, 6-seg meter, CTAs)
     • active + minimized → small floating timer badge (timer keeps running)
     • finalized          → confirmation of what was charged / shipping outcome
   ESC minimizes (does not cancel); focus is trapped while the modal is open. */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useShippingWindow } from '@/context/ShippingWindowContext';

const FREE_AT = 6;

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

  // FINALIZED — charge ran, show the outcome.
  if (w.finalized) {
    const f = w.finalized;
    return (
      <div className="ship-overlay" role="dialog" aria-modal="true" aria-label="Order confirmed">
        <div className="ship-card ship-card--done" tabIndex={-1} ref={cardRef}>
          <div className="ship-done-ic"><i className="fa-solid fa-circle-check" aria-hidden /></div>
          <h2 className="ship-hl">Window closed. Card ran.</h2>
          <p className="ship-mech">
            Order <b>{f.orderId}</b> — <b>${f.total.toFixed(2)}</b> charged to your card on file.{' '}
            {f.freeShip
              ? <b className="ship-free">Shipping waived — 6+ bottles.</b>
              : <>Flat <b>$35</b> shipping applied (under 6 bottles).</>}
          </p>
          <div className="ship-ctas">
            <button
              type="button"
              className="ship-btn ship-btn-primary"
              onClick={() => { w.dismiss(); router.push(`/checkout/summary?orderId=${f.orderId}`); }}
            >
              VIEW ORDER&nbsp;&nbsp;→
            </button>
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

  // MINIMIZED — floating timer badge, timer still running.
  if (w.minimized) {
    return (
      <button
        type="button"
        className={`ship-badge${danger ? ' is-danger' : ''}`}
        onClick={w.expand}
        aria-label={`Free shipping window: ${mmss(w.secondsLeft)} left, ${filled} of 6 bottles. Expand.`}
      >
        <span className="ship-badge-dot" aria-hidden />
        <span className="ship-badge-time">{mmss(w.secondsLeft)}</span>
        <span className="ship-badge-meta">{filled}/6</span>
      </button>
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
          <h2 className="ship-hl">{free ? 'Six in. Shipping’s on us.' : 'One bottle’s in. Get to six.'}</h2>
          <p className="ship-mech">
            {free ? (
              <>You hit <b>6 bottles</b> — shipping’s <b className="ship-free">free</b>. The card still runs when time’s up.</>
            ) : (
              <>Reach <b>6 bottles</b> before the clock hits zero and shipping’s <b className="ship-free">free</b>. Stop short and we add a flat <b>$35</b>. Either way, the card runs when time’s up.</>
            )}
          </p>
        </div>

        <div className="ship-prog">
          <div className="ship-prog-top">
            <span className="ship-prog-label">CART</span>
            <span className="ship-prog-count"><span className="n">{filled}</span> <span className="of">of 6 bottles</span></span>
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
            onClick={() => { w.endWindow(); router.push('/checkout/billing'); }}
          >
            Skip it — check out now
          </button>
        </div>

        <div className="ship-foot"><i>Instinct wins. Hesitation loses.</i></div>
      </div>
    </div>
  );
}

export default ShippingWindowModal;
