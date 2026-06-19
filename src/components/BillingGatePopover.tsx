'use client';

/* BillingGatePopover — "SESH ACCESS" gate + a 2-step Get-SESH-Qualified flow
   (shipping → payment) for viewers/anonymous users. Classic e-commerce shape,
   stylized to Vinly.

   REVEAL: completing payment flips userState → 'sesh_qualified' (the mock of
   "billing added"), which instantly un-blurs SESH + Ticker pricing in place via
   <PriceLock> and lights up the live price + buy button — no reload, one gesture.

   ⚠️ PROTOTYPE: there's no real payment provider here. In production the payment
   step must hand card entry to the existing billing provider and flip qualified on
   its success callback. Adding billing does NOT charge (only the bottle-lock does),
   so the trust lines hold. No card data is stored here. */

import { useEffect, useRef, useState } from 'react';
import { useUserState } from '@/context/UserStateContext';

// ---- Editable copy — Direction 1 (active) ----
const COPY = {
  eyebrow: 'SESH ACCESS',
  headline: "There's a live price. You just can't see it yet.",
  body: "Drop in a card and the number goes live. Then lock bottles the second it's right.",
  cta: 'UNLOCK LIVE PRICING',
  trust: "Costs nothing to unlock. You're only charged when you lock a bottle.",
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

// ---- Editable step copy ----
const SHIP_COPY = {
  kicker: 'STEP 1 OF 2',
  title: 'Where do the bottles go?',
  sub: "We ship to most of the country. A couple of states still think it's 1920 — we'll flag it if yours is one.",
  cta: 'ADD A CARD',
  trust: "No charge here. You're just getting on the floor.",
};
const PAY_COPY = {
  kicker: 'STEP 2 OF 2',
  title: 'Put a card on the floor.',
  sub: 'This is what unlocks live pricing. Stored, not charged — the card only runs when you lock a bottle.',
  cta: COPY.cta,
  trust: 'Adding billing costs nothing. You’re only charged when you lock a bottle.',
  secure: 'Encrypted and handled by our payment processor. Vinly never sees your card.',
};

// Mock shipping eligibility — real list comes from the carrier/compliance service.
const STATES: { name: string; ok: boolean }[] = [
  { name: 'California', ok: true },
  { name: 'New York', ok: true },
  { name: 'Texas', ok: true },
  { name: 'Florida', ok: true },
  { name: 'Oregon', ok: true },
  { name: 'Washington', ok: true },
  { name: 'Utah', ok: false },
  { name: 'Mississippi', ok: false },
];

type View = 'intro' | 'shipping' | 'payment';

export function BillingGatePopover({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setUserState } = useUserState();
  const cardRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>('intro');
  const [stateIdx, setStateIdx] = useState('');
  const [sameAddr, setSameAddr] = useState(true);

  // Start fresh at the intro each time the gate opens.
  useEffect(() => { if (open) { setView('intro'); setStateIdx(''); setSameAddr(true); } }, [open]);

  useEffect(() => {
    if (!open) return;
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && cardRef.current) {
        const nodes = cardRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input, select, [tabindex]:not([tabindex="-1"])',
        );
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

  // Mock "billing added → SESH-qualified": instant, in-place reveal (see header).
  const unlock = () => {
    setUserState('sesh_qualified');
    onClose();
  };

  const sel = stateIdx === '' ? null : STATES[Number(stateIdx)];

  return (
    <div
      className="qbp-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="SESH access — get SESH-qualified"
      onClick={onClose}
    >
      <div className="qbp-modal qbp-modal--gate qbp-modal--qualify" tabIndex={-1} ref={cardRef} onClick={(e) => e.stopPropagation()}>
        <div className="qbp-modal-head">
          <div className="qbp-modal-kicker">
            <i className="fa-solid fa-lock" aria-hidden /> {COPY.eyebrow}
          </div>
          <button type="button" className="qbp-modal-close" aria-label="Close" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        </div>

        {/* ===== INTRO GATE ===== */}
        {view === 'intro' && (
          <>
            <div className="qbp-gate-body">
              <div className="qbp-gate-icon"><i className="fa-solid fa-credit-card" aria-hidden /></div>
              <h3 className="qbp-gate-title">{COPY.headline}</h3>
              <p className="qbp-gate-copy">{COPY.body}</p>
            </div>
            <div className="qbp-modal-actions">
              <button type="button" className="qbp-modal-primary" onClick={() => setView('shipping')}>
                <i className="fa-solid fa-credit-card" aria-hidden /> {COPY.cta}
              </button>
              <p className="qbp-gate-trust">{COPY.trust}</p>
            </div>
            <div className="qbp-modal-foot">
              <span><i className="fa-solid fa-eye" aria-hidden /> {COPY.footer}</span>
            </div>
          </>
        )}

        {/* ===== QUALIFY FLOW (shipping / payment) ===== */}
        {view !== 'intro' && (
          <>
            <div className="sqf-prog" aria-hidden>
              <div className={`sqf-step${view === 'payment' ? ' is-done' : ' is-on'}`}>
                <span className="sqf-num">{view === 'payment' ? <i className="fa-solid fa-check" /> : '1'}</span>
                <span className="sqf-step-lbl">SHIP IT</span>
              </div>
              <span className="sqf-bar" />
              <div className={`sqf-step${view === 'payment' ? ' is-on' : ''}`}>
                <span className="sqf-num">2</span>
                <span className="sqf-step-lbl">SETTLE UP</span>
              </div>
            </div>

            {view === 'shipping' && (
              <>
                <div className="sqf-titles">
                  <div className="sqf-kicker">{SHIP_COPY.kicker}</div>
                  <h3 className="sqf-title">{SHIP_COPY.title}</h3>
                  <p className="sqf-sub">{SHIP_COPY.sub}</p>
                </div>
                <form className="sqf-form" onSubmit={(e) => { e.preventDefault(); setView('payment'); }}>
                  <label className="sqf-fld"><span className="sqf-lbl">Email</span>
                    <input className="sqf-input" type="email" placeholder="you@email.com" autoComplete="email" /></label>
                  <div className="sqf-row">
                    <label className="sqf-fld"><span className="sqf-lbl">First name</span><input className="sqf-input" placeholder="First" autoComplete="given-name" /></label>
                    <label className="sqf-fld"><span className="sqf-lbl">Last name</span><input className="sqf-input" placeholder="Last" autoComplete="family-name" /></label>
                  </div>
                  <label className="sqf-fld"><span className="sqf-lbl">Address</span><input className="sqf-input" placeholder="Street address" autoComplete="address-line1" /></label>
                  <label className="sqf-fld"><span className="sqf-lbl">Apt / Unit <em>(optional)</em></span><input className="sqf-input" placeholder="Apt, suite, etc." autoComplete="address-line2" /></label>
                  <div className="sqf-row">
                    <label className="sqf-fld sqf-grow"><span className="sqf-lbl">City</span><input className="sqf-input" placeholder="City" autoComplete="address-level2" /></label>
                    <label className="sqf-fld"><span className="sqf-lbl">State</span>
                      <select className="sqf-input sqf-select" value={stateIdx} onChange={(e) => setStateIdx(e.target.value)}>
                        <option value="">—</option>
                        {STATES.map((s, i) => <option key={s.name} value={i}>{s.name}</option>)}
                      </select>
                    </label>
                    <label className="sqf-fld sqf-narrow"><span className="sqf-lbl">ZIP</span><input className="sqf-input" placeholder="ZIP" inputMode="numeric" autoComplete="postal-code" /></label>
                  </div>
                  <div className={`sqf-elig${sel ? (sel.ok ? ' is-ok' : ' is-no') : ''}`} role="status">
                    {sel == null
                      ? <><i className="fa-solid fa-location-dot" aria-hidden /> We&apos;ll confirm we can ship to your state.</>
                      : sel.ok
                        ? <><i className="fa-solid fa-check" aria-hidden /> We ship there. You&apos;re good.</>
                        : <><i className="fa-solid fa-xmark" aria-hidden /> Can&apos;t ship wine to this state yet. Blame the lawmakers, not us.</>}
                  </div>
                  <label className="sqf-fld"><span className="sqf-lbl">Date of birth</span><input className="sqf-input" placeholder="MM / DD / YYYY" inputMode="numeric" autoComplete="bday" /></label>
                  <div className="sqf-elig"><i className="fa-solid fa-wine-bottle" aria-hidden /> Wine&apos;s a 21+ game. We verify, the carrier checks ID at the door.</div>

                  <p className="qbp-gate-trust">{SHIP_COPY.trust}</p>
                  <div className="qbp-modal-actions sqf-actions">
                    <button type="button" className="sqf-back" onClick={() => setView('intro')}>← Back</button>
                    <button type="submit" className="qbp-modal-primary">{SHIP_COPY.cta}&nbsp;&nbsp;→</button>
                  </div>
                </form>
              </>
            )}

            {view === 'payment' && (
              <>
                <div className="sqf-titles">
                  <div className="sqf-kicker">{PAY_COPY.kicker}</div>
                  <h3 className="sqf-title">{PAY_COPY.title}</h3>
                  <p className="sqf-sub">{PAY_COPY.sub}</p>
                </div>
                <form className="sqf-form" onSubmit={(e) => { e.preventDefault(); unlock(); }}>
                  <label className="sqf-fld"><span className="sqf-lbl">Card number</span><input className="sqf-input sqf-mono" placeholder="1234 1234 1234 1234" inputMode="numeric" autoComplete="cc-number" /></label>
                  <div className="sqf-row">
                    <label className="sqf-fld"><span className="sqf-lbl">Expiry</span><input className="sqf-input sqf-mono" placeholder="MM / YY" inputMode="numeric" autoComplete="cc-exp" /></label>
                    <label className="sqf-fld"><span className="sqf-lbl">CVC</span><input className="sqf-input sqf-mono" placeholder="CVC" inputMode="numeric" autoComplete="cc-csc" /></label>
                  </div>

                  <button type="button" className={`sqf-toggle${sameAddr ? ' is-on' : ''}`} onClick={() => setSameAddr((v) => !v)} aria-pressed={sameAddr}>
                    <span className="sqf-tk" aria-hidden />
                    <span>Billing address same as shipping</span>
                  </button>

                  {!sameAddr && (
                    <>
                      <label className="sqf-fld"><span className="sqf-lbl">Billing address</span><input className="sqf-input" placeholder="Street address" /></label>
                      <div className="sqf-row">
                        <label className="sqf-fld sqf-grow"><span className="sqf-lbl">City</span><input className="sqf-input" placeholder="City" /></label>
                        <label className="sqf-fld"><span className="sqf-lbl">State</span><input className="sqf-input" placeholder="State" /></label>
                        <label className="sqf-fld sqf-narrow"><span className="sqf-lbl">ZIP</span><input className="sqf-input" placeholder="ZIP" inputMode="numeric" /></label>
                      </div>
                    </>
                  )}

                  <div className="sqf-secure"><i className="fa-solid fa-lock" aria-hidden /> {PAY_COPY.secure}</div>

                  <p className="qbp-gate-trust"><b>Adding billing costs nothing.</b> You&apos;re only charged when you lock a bottle.</p>
                  <div className="qbp-modal-actions sqf-actions">
                    <button type="button" className="sqf-back" onClick={() => setView('shipping')}>← Back</button>
                    <button type="submit" className="qbp-modal-primary"><i className="fa-solid fa-credit-card" aria-hidden /> {PAY_COPY.cta}</button>
                  </div>
                </form>
              </>
            )}

            <div className="qbp-modal-foot">
              <span><i>Instinct wins. Hesitation loses.</i></span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default BillingGatePopover;
