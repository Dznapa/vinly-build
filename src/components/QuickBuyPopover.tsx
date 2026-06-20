'use client';

/* Quick-buy popover — premium, brokerage-styled ORDER-EXECUTION modal for SESH +
   Ticker (one shared component). Opens already price-locked (single step). Shows a
   compact order summary and a "Place Order · Card ••XXXX" primary that executes the
   order (adds to cart + opens the 15-min free-ship window).

   Dismissing the popup ("Not now" / Esc / backdrop) is HARMLESS — closing a buy form
   you didn't place is NOT a cancellation and has no consequence. There is no
   cancellation cap here. (The price-lock concept + the cart "Locked in" state live
   elsewhere and are unchanged.) */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useShippingWindow } from '@/context/ShippingWindowContext';
import { useProfile } from '@/context/ProfileContext';
import { useBillingGate } from '@/context/BillingGateContext';

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

const LOCK_SECONDS = 15 * 60;

// Editable copy.
const ORDER_MICROCOPY = 'Card runs when the 15-minute window closes — no further confirmation.';
const EXIT_LABEL = 'Not now';
const NO_CARD_CTA = 'Add a card to order';
const placeOrderLabel = (last4: string) => `Place Order · Card ••${last4}`;

function formatMMSS(total: number): string {
  const s = Math.max(0, Math.floor(total));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function QuickBuyPopover({ wine, onClose, source }: QuickBuyPopoverProps) {
  const { addItem } = useCart();
  const shipWindow = useShippingWindow();
  const { cards } = useProfile();
  const { openGate } = useBillingGate();
  const [qty, setQty] = useState<number>(1);
  const [lockedAt, setLockedAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(LOCK_SECONDS);
  const [expired, setExpired] = useState<boolean>(false);

  const open = wine !== null;
  const isLocked = lockedAt !== null && !expired;

  // Payment method on file — default card (last-4 only; full card data never exists here).
  const defaultCard = cards.find((c) => c.isDefault) ?? cards[0];
  const last4 = defaultCard?.last4 ?? '';
  const hasCard = !!defaultCard;

  // When a free-ship window is already running, the popup timer mirrors that corner
  // countdown (the real deadline driving "load up more wines"). Red under 4 minutes.
  const shownSeconds = shipWindow.active ? shipWindow.secondsLeft : secondsLeft;
  const timerUrgent = shownSeconds < 240;

  const lastWineIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!wine) { lastWineIdRef.current = null; return; }
    if (lastWineIdRef.current !== wine.id) {
      lastWineIdRef.current = wine.id;
      // Single-step: open already price-locked (timer running), one click to order.
      setQty(1); setLockedAt(Date.now()); setSecondsLeft(LOCK_SECONDS); setExpired(false);
    }
  }, [wine]);

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

  // Esc dismisses (harmless — never a cancellation).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // EXECUTES THE ORDER — adds the locked line to the cart and opens the free-ship
  // window. Charge/order behavior unchanged; only the surrounding UI changed.
  const addToCart = useCallback((quantity: number) => {
    if (!wine) return;
    const added = addItem(
      { wineId: wine.id, name: wine.name, unitPrice: wine.price, image: wine.image, msrp: wine.msrp, meta: wine.region, locked: true },
      quantity,
    );
    onClose();
    if (added && (source === 'sesh' || source === 'ticker')) shipWindow.open();
  }, [wine, addItem, onClose, source, shipWindow]);

  const handleBuyNowExpired = useCallback(() => {
    if (!wine) return; addToCart(qty);
  }, [wine, qty, addToCart]);

  // No card on file → send them to the qualification / add-card flow instead.
  const handleAddCard = useCallback(() => { onClose(); openGate(); }, [onClose, openGate]);

  // Backdrop click dismisses (harmless).
  const handleBackdropClick = useCallback(() => { onClose(); }, [onClose]);

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
        {/* HEADER (no X — exit via the explicit "Not now" button below) */}
        <div className="qbp-modal-head">
          <div className="qbp-modal-kicker">
            <i className="fa-solid fa-bolt" aria-hidden /> {kicker}
          </div>
        </div>

        {/* LOCKED / EXPIRED banner */}
        {isLocked && !expired && (
          <div className={`qbp-modal-banner qbp-modal-banner--locked${timerUrgent ? ' qbp-modal-banner--urgent' : ''}`}>
            <i className="fa-solid fa-lock" aria-hidden />
            <span>Locked In — </span>
            <b>{formatMMSS(shownSeconds)}</b>
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
                disabled={qty <= 1}
              >−</button>
              <span>{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => Math.min(6, q + 1))}
                disabled={qty >= 6}
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

        {/* ORDER SUMMARY — makes the charge feel official (real locked values). */}
        {!expired && hasCard && (
          <div className="qbp-order-summary" role="group" aria-label="Order summary">
            <div className="qbp-os-row">
              <span className="qbp-os-name">{wine.name}</span>
              <span className="qbp-os-qty">Qty {qty}</span>
            </div>
            <div className="qbp-os-row">
              <span className="qbp-os-label">Locked price</span>
              <span className="qbp-os-val">${wine.price.toFixed(2)}{qty > 1 ? ` × ${qty}` : ''}</span>
            </div>
            <div className="qbp-os-row qbp-os-total">
              <span className="qbp-os-label">Order total</span>
              <span className="qbp-os-val">${lineTotal.toFixed(2)}</span>
            </div>
            <div className="qbp-os-row qbp-os-pay">
              <span className="qbp-os-label">Paying with</span>
              <span className="qbp-os-val">Card ••{last4}</span>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="qbp-modal-actions">
          {expired ? (
            <button type="button" className="qbp-modal-primary" onClick={handleBuyNowExpired} disabled={!hasCard}>
              {hasCard ? <>BUY NOW <span className="qbp-modal-primary-total">${lineTotal.toFixed(2)}</span></> : NO_CARD_CTA}
            </button>
          ) : hasCard ? (
            <>
              <button
                type="button"
                className="qbp-modal-primary"
                onClick={() => addToCart(qty)}
                aria-label={`${placeOrderLabel(last4)} — total $${lineTotal.toFixed(2)}`}
              >
                <i className="fa-solid fa-credit-card" aria-hidden /> {placeOrderLabel(last4)}
              </button>
              <p className="qbp-microcopy">{ORDER_MICROCOPY}</p>
            </>
          ) : (
            <button type="button" className="qbp-modal-primary" onClick={handleAddCard}>
              <i className="fa-solid fa-credit-card" aria-hidden /> {NO_CARD_CTA}
            </button>
          )}

          {/* Explicit, harmless exit (replaces the top-corner X). */}
          <button
            type="button"
            className="qbp-modal-secondary"
            onClick={onClose}
            aria-label="Close without ordering"
          >
            {EXIT_LABEL}
          </button>
        </div>

        {/* FOOTER */}
        <div className="qbp-modal-foot">
          <span>
            <i className="fa-solid fa-lock" aria-hidden /> 15-min price lock · no charge until you confirm
          </span>
        </div>
      </div>
    </div>
  );
}

export default QuickBuyPopover;
