'use client';

/* Billing-gate popover — shown when a non-qualified viewer taps BUY NOW on the
   SESH. Mirrors the quick-buy modal shell (qbp-* classes) so it feels native.
   Viewers can see all live prices; to actually buy they must add billing and
   become SESH-qualified. CTA routes to signup (anonymous) or profile (signed in). */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserState } from '@/context/UserStateContext';

export function BillingGatePopover({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { userState } = useUserState();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isAnon = userState === 'anonymous';
  const addBillingHref = isAnon ? '/register_details' : '/profile';
  const cta = isAnon ? 'CREATE ACCOUNT & ADD BILLING' : 'ADD BILLING INFO';

  return (
    <div
      className="qbp-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Add billing to participate"
      onClick={onClose}
    >
      <div className="qbp-modal qbp-modal--gate" onClick={(e) => e.stopPropagation()}>
        <div className="qbp-modal-head">
          <div className="qbp-modal-kicker">
            <i className="fa-solid fa-lock" aria-hidden /> SESH ACCESS
          </div>
          <button type="button" className="qbp-modal-close" aria-label="Close" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        </div>

        <div className="qbp-gate-body">
          <div className="qbp-gate-icon">
            <i className="fa-solid fa-credit-card" aria-hidden />
          </div>
          <h3 className="qbp-gate-title">Add billing to participate</h3>
          <p className="qbp-gate-copy">
            You can watch live SESH prices as a viewer. To lock in a bottle, add your billing
            information and get SESH-qualified.
          </p>
        </div>

        <div className="qbp-modal-actions">
          <button
            type="button"
            className="qbp-modal-primary"
            onClick={() => { onClose(); router.push(addBillingHref); }}
          >
            <i className="fa-solid fa-credit-card" aria-hidden /> {cta}
          </button>
        </div>

        <div className="qbp-modal-foot">
          <span>
            <i className="fa-solid fa-eye" aria-hidden /> Viewer mode · prices visible · no purchases until billing is added
          </span>
        </div>
      </div>
    </div>
  );
}

export default BillingGatePopover;
