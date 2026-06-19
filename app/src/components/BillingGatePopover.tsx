'use client';

/* BillingGatePopover — "SESH ACCESS" gate shown when a non-qualified viewer tries
   to buy/see live SESH or Ticker pricing. Mirrors the quick-buy modal shell.

   REVEAL: clicking the CTA flips userState → 'sesh_qualified' (the mock of "billing
   added"), which instantly un-blurs SESH + Ticker pricing in place via <PriceLock>
   and lights up the live price + buy button — no reload, one gesture.

   ⚠️ PROTOTYPE: there's no real payment provider here. In production this CTA must
   open the existing billing provider's add-card flow and flip qualified on its
   success callback. Adding billing does NOT charge (only the bottle-lock does), so
   the trust line holds. */

import { useEffect, useRef } from 'react';
import { useUserState } from '@/context/UserStateContext';

// Editable copy — Direction 1 (active).
const COPY = {
  eyebrow: 'SESH ACCESS',
  headline: "There's a live price. You just can't see it yet.",
  body:
    'Shop and Spotlight prices are yours to browse. But the SESH and the Ticker run on ' +
    "live pricing — and that number stays behind the glass until you're SESH-qualified. " +
    'Add a billing method, the price goes live, and you can lock bottles the moment you like the number.',
  cta: 'UNLOCK LIVE PRICING',
  trust: "Adding billing costs nothing. You're only charged when you lock a bottle.",
  footer: 'Viewer mode · Shop & Spotlight visible · SESH & Ticker locked',
};

// Alternate copy — swap fields into COPY above to use.
// Direction 2 — Watchers vs buyers:
//   headline: "Right now you're watching. Buyers see the price."
//   cta: 'GET ON THE FLOOR'
//   trust: 'No charge to qualify. The card only runs when you lock a bottle.'
// Direction 3 — Short:
//   headline: "Qualified buyers see the number. You don't. Yet."
//   cta: 'SHOW ME THE PRICE'
//   trust: 'Free to qualify. Charged only when you buy.'

export function BillingGatePopover({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setUserState } = useUserState();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
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
  }, [open, onClose]);

  if (!open) return null;

  // Mock "add billing → SESH-qualified": instant, in-place reveal (see file header).
  const unlock = () => {
    setUserState('sesh_qualified');
    onClose();
  };

  return (
    <div
      className="qbp-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="SESH access — unlock live pricing"
      onClick={onClose}
    >
      <div className="qbp-modal qbp-modal--gate" tabIndex={-1} ref={cardRef} onClick={(e) => e.stopPropagation()}>
        <div className="qbp-modal-head">
          <div className="qbp-modal-kicker">
            <i className="fa-solid fa-lock" aria-hidden /> {COPY.eyebrow}
          </div>
          <button type="button" className="qbp-modal-close" aria-label="Close" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        </div>

        <div className="qbp-gate-body">
          <div className="qbp-gate-icon">
            <i className="fa-solid fa-credit-card" aria-hidden />
          </div>
          <h3 className="qbp-gate-title">{COPY.headline}</h3>
          <p className="qbp-gate-copy">{COPY.body}</p>
        </div>

        <div className="qbp-modal-actions">
          <button type="button" className="qbp-modal-primary" onClick={unlock}>
            <i className="fa-solid fa-credit-card" aria-hidden /> {COPY.cta}
          </button>
          <p className="qbp-gate-trust">{COPY.trust}</p>
        </div>

        <div className="qbp-modal-foot">
          <span>
            <i className="fa-solid fa-eye" aria-hidden /> {COPY.footer}
          </span>
        </div>
      </div>
    </div>
  );
}

export default BillingGatePopover;
