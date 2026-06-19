'use client';

/* Quick-buy popover — premium, brokerage-styled modal.
   Header: kicker + close. Body: bottle (on white card with radial-mask) +
   wine info (name / volume / live price / MSRP strike / savings chip). Qty
   stepper. Big orange action. Locked-in state: green countdown header,
   CONFIRM + CANCEL controls. Expired state: red banner + BUY NOW recovery. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useShippingWindow } from '@/context/ShippingWindowContext';

export type QuickBuyWine = {
  id: string;
  name: string;
  region?: string;
  price: number;
  image: string;
  msrp?: number;
};

export type QuickBuyPopoverProps = {
  wine: QuickBuyWine | null;
  onClose: () => void;
  source: 'ticker' | 'sesh';
};

const CANCEL_LIMIT = 2;
const LOCK_SECONDS = 15 * 60;

function formatMMSS(total: number): string {
  const s = Math.max(0, Math.floor(total));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function QuickBuyPopover({ wine, onClose, source }: QuickBuyPopoverProps) {
  const { addItem } = useCart();
  const shipWindow = useShippingWindow();
  const [qty, setQty] = useState<number>(1);
  const [lockedAt, setLockedAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(LOCK_SECONDS);
  const [cancelCount, setCancelCount] = useState<number>(0);
  const [expired, setExpired] = useState<boolean>(false);

  const open = wine !== null;
  const isLocked = lockedAt !== null && !expired;
  // Ticker reservations can be cancelled unlimited times; only SESH caps it at 2.
  const isTicker = source === 'ticker';
  const cancelLimitReached = !isTicker && cancelCount >= CANCEL_LIMIT;

  const lastWineIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!wine) { lastWineIdRef.current = null; return; }
    if (lastWineIdRef.current !== wine.id) {
      lastWineIdRef.current = wine.id;
      // Single-step flow for BOTH SESH and Ticker — open already "locked in"
      // (timer running) so it's one popup, one click to purchase. SESH still caps
      // cancellations at 2 (persisted per offer); Ticker is unlimited.
      let cc = 0;
      if (source === 'sesh') {
        try { cc = Number(window.sessionStorage.getItem(`vinly:seshCancels:${wine.id}`)) || 0; } catch { /* ignore */ }
      }
      setQty(1); setLockedAt(Date.now()); setSecondsLeft(LOCK_SECONDS);
      setCancelCount(cc); setExpired(false);
    }
  }, [wine, source]);

  useEffect(() => {
    if (!isLocked || lockedAt === null) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - lockedAt) / 1000);
      const left = LOCK_SECONDS - elapsed;
      if (left <= 0) { setSecondsLeft(0); setExpired(true); }
      else setSecondsLeft(left);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [isLocked, lockedAt]);

  useEffect(() => {
    if (!open) return;
    // Single-step popups can always be dismissed (Esc/backdrop just close the window;
    // they don't count as a formal "Cancel reservation").
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const addToCart = useCallback((quantity: number) => {
    if (!wine) return;
    // Carry a full price/name snapshot so the bottle is a real, visible, charged
    // cart line regardless of which catalog its id lives in.
    const added = addItem(
      { wineId: wine.id, name: wine.name, unitPrice: wine.price, image: wine.image, msrp: wine.msrp, meta: wine.region, locked: true },
      quantity,
    );
    onClose();
    // A SESH or Ticker commit opens (or extends) the free-shipping window.
    if (added && (source === 'sesh' || source === 'ticker')) shipWindow.open();
  }, [wine, addItem, onClose, source, shipWindow]);

  const handleLockIn = useCallback(() => {
    if (!wine) return;
    setLockedAt(Date.now()); setSecondsLeft(LOCK_SECONDS); setExpired(false);
  }, [wine]);

  const handleCancelReservation = useCallback(() => {
    if (cancelLimitReached) return;
    // SESH cancellations count toward the 2-cap (persisted per offer); Ticker is
    // unlimited. Either way, cancelling the reservation closes the popup.
    if (!isTicker && wine) {
      const next = cancelCount + 1;
      setCancelCount(next);
      try { window.sessionStorage.setItem(`vinly:seshCancels:${wine.id}`, String(next)); } catch { /* ignore */ }
    }
    onClose();
  }, [cancelLimitReached, isTicker, wine, cancelCount, onClose]);

  const handleBuyNowExpired = useCallback(() => {
    if (!wine) return; addToCart(qty);
  }, [wine, qty, addToCart]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const savings = useMemo(() => {
    if (!wine || wine.msrp === undefined) return 0;
    return Math.max(0, wine.msrp - wine.price);
  }, [wine]);
  const offMsrpPct = useMemo(() => {
    if (!wine || !wine.msrp) return 0;
    return Math.max(0, (1 - wine.price / wine.msrp) * 100);
  }, [wine]);
  const lineTotal = useMemo(() => (wine ? wine.price * qty : 0), [wine, qty]);

  if (!wine) return null;

  const kicker = source === 'sesh' ? 'SESH QUICK-BUY' : 'TICKER QUICK-BUY';

  return (
    <div
      className="qbp-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Quick buy ${wine.name}`}
      onClick={handleBackdropClick}
    >
      <div className="qbp-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="qbp-modal-head">
          <div className="qbp-modal-kicker">
            <i className="fa-solid fa-bolt" aria-hidden /> {kicker}
          </div>
          <button
            type="button"
            className="qbp-modal-close"
            aria-label="Close"
            onClick={onClose}
          >
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        </div>

        {/* LOCKED / EXPIRED banner */}
        {isLocked && !expired && (
          <div className="qbp-modal-banner qbp-modal-banner--locked">
            <i className="fa-solid fa-lock" aria-hidden />
            <span>Locked In — </span>
            <b>{formatMMSS(secondsLeft)}</b>
            <span>&nbsp;left to confirm</span>
          </div>
        )}
        {expired && (
          <div className="qbp-modal-banner qbp-modal-banner--expired">
            <i className="fa-solid fa-clock-rotate-left" aria-hidden />
            <span>Reservation expired — buy now while stock lasts</span>
          </div>
        )}

        {/* PRODUCT ROW */}
        <div className="qbp-modal-product">
          <div className="qbp-modal-bottle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={wine.image} alt={wine.name} />
          </div>
          <div className="qbp-modal-info">
            <div className="qbp-modal-name">{wine.name}</div>
            {wine.region && <div className="qbp-modal-region">{wine.region}</div>}
            <div className="qbp-modal-pricerow">
              <div className="qbp-modal-price">${wine.price.toFixed(2)}</div>
              {wine.msrp !== undefined && wine.msrp > 0 && (
                <div className="qbp-modal-msrp">
                  <s>${wine.msrp.toFixed(2)}</s>
                  <span>MSRP</span>
                </div>
              )}
            </div>
            {savings > 0 && (
              <div className="qbp-modal-savings">
                <i className="fa-solid fa-tag" aria-hidden /> Save ${savings.toFixed(2)} · {offMsrpPct.toFixed(1)}% off
              </div>
            )}
          </div>
        </div>

        {/* QTY + TOTAL */}
        <div className="qbp-modal-qtyrow">
          <div className="qbp-modal-qty-block">
            <span className="qbp-modal-meta">QUANTITY</span>
            <div className="qbp-modal-step">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={isLocked || qty <= 1}
              >−</button>
              <span>{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => Math.min(6, q + 1))}
                disabled={isLocked || qty >= 6}
              >+</button>
            </div>
            <span className="qbp-modal-qty-hint">Max 6 per reservation</span>
          </div>
          <div className="qbp-modal-total-block">
            <span className="qbp-modal-meta">ESTIMATED TOTAL</span>
            <div className="qbp-modal-total">${lineTotal.toFixed(2)}</div>
            {savings > 0 && (
              <span className="qbp-modal-total-save">You save ${(savings * qty).toFixed(2)}</span>
            )}
          </div>
        </div>

        {/* FREE SHIPPING / MIX & MATCH */}
        <div className="qbp-modal-ship">
          <i className="fa-solid fa-truck-fast" aria-hidden />
          <span>
            <b>Free shipping at 6 bottles.</b> Mix &amp; match across the floor — SESH, Ticker &amp;
            Market all count.
          </span>
        </div>

        {/* ACTIONS */}
        <div className="qbp-modal-actions">
          {!isLocked && !expired && (
            <button type="button" className="qbp-modal-primary" onClick={handleLockIn}>
              <i className="fa-solid fa-lock" aria-hidden /> LOCK IN PURCHASE
              <span className="qbp-modal-primary-total">${lineTotal.toFixed(2)}</span>
            </button>
          )}
          {isLocked && !expired && (
            <>
              <button
                type="button"
                className="qbp-modal-secondary"
                onClick={handleCancelReservation}
                disabled={cancelLimitReached}
              >
                Cancel reservation
              </button>
              <button
                type="button"
                className="qbp-modal-primary"
                onClick={() => addToCart(qty)}
              >
                <i className="fa-solid fa-check" aria-hidden /> LOCK IT IN & PURCHASE
                <span className="qbp-modal-primary-total">${lineTotal.toFixed(2)}</span>
              </button>
            </>
          )}
          {expired && (
            <button type="button" className="qbp-modal-primary" onClick={handleBuyNowExpired}>
              BUY NOW
              <span className="qbp-modal-primary-total">${lineTotal.toFixed(2)}</span>
            </button>
          )}
        </div>

        {/* FOOTER */}
        <div className="qbp-modal-foot">
          {cancelLimitReached ? (
            <span className="qbp-modal-foot-warn">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden /> Cancellation limit reached for this SESH
            </span>
          ) : (
            <span>
              <i className="fa-solid fa-lock" aria-hidden /> 15-min price lock · {isTicker ? '' : 'max 2 cancellations · '}no charge until you confirm
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuickBuyPopover;
