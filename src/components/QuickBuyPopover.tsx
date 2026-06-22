'use client';

/* Quick-buy popover — ORDER-EXECUTION modal for SESH + Ticker (one shared component).

   TWO SEPARATE CLOCKS — this popup owns only the first:
   1. PRICE HOLD (15 seconds): the live price is captured the instant the user clicks
      "Place Order" and held for 15s to complete the transaction. There is NO pre-click
      countdown here — it's a static reassurance line.
   2. FREE-SHIP WINDOW (15 minutes): a SEPARATE post-purchase consolidation timer shown
      on the lower-right badge (ShippingWindowModal). It opens only AFTER the order is
      committed. It is NOT displayed in this popup and shares no state with it.

   Dismissing the popup ("Not now" / Esc / backdrop) is harmless — never a cancellation. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useShippingWindow } from '@/context/ShippingWindowContext';
import { useProfile } from '@/context/ProfileContext';
import { useBillingGate } from '@/context/BillingGateContext';
import { useCancellations } from '@/context/CancellationContext';
import { useToast } from '@/components/ToastProvider';

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

// Editable copy.
// SESH runs a 20s price lock where exits/expiry cost a cancellation; Ticker keeps
// the original 15s "re-lock" behavior (exits harmless).
const SESH_LOCK_SECONDS = 20;
const TICKER_LOCK_SECONDS = 15;
const priceLockLabelTicker = (s: number) => `Price locked · ${s}s to order`;
const priceLockLabelSesh = (s: number) => `Price locked · ${s}s to confirm`;
const PRICE_LOCK_EXPIRED = 'Price lock expired — re-lock to keep this price.'; // Ticker
const RELOCK_LABEL = `Re-lock price (${TICKER_LOCK_SECONDS}s)`; // Ticker
const ORDER_MICROCOPY = 'Card runs when the 15-minute window closes — no further confirmation.'; // Ticker
const EXIT_LABEL = 'Not now';
const NO_CARD_CTA = 'Add a card to order';
const placeOrderLabel = (last4: string) => `Place Order · Card ••${last4}`;

// SESH cancellation-aware status + messaging (driven by the single 2-per-SESH counter).
// After 2 cancellations the user is LOCKED OUT of buying this SESH (resets next drop).
export const SESH_LOCKED_COPY =
  "You've used both cancellations. Buying is locked for this SESH — back at the next drop.";
const SESH_STATUS_ACTIVE = (n: number) =>
  `Price locked · ${SESH_LOCK_SECONDS}s to confirm. Letting it expire or tapping "Not now" uses a cancellation · ${n} left`;
const SESH_STATUS_CAP = SESH_LOCKED_COPY;
const SESH_EXPIRED_REMAIN = (n: number) =>
  n <= 0 ? SESH_LOCKED_COPY : '1 cancellation left.';
const BTN_EXPIRED_PRIMARY = 'Price Lock Expired — Return to SESH';
const BTN_EXPIRED_SECONDARY = 'Not now — Return to SESH';
const seshCancelMsg = (after: number) =>
  after >= 1
    ? 'Cancelled. 1 cancellation left.'
    : "That's your second cancellation — buying is locked for the rest of this SESH. Back at the next drop.";

export function QuickBuyPopover({ wine, onClose, source }: QuickBuyPopoverProps) {
  const { addItem } = useCart();
  const shipWindow = useShippingWindow();
  const { cards } = useProfile();
  const { openGate } = useBillingGate();
  // Single SESH cancellation counter (2 per SESH). On SESH, "Not now"/Esc/backdrop and
  // timer-expiry each consume one (when remaining > 0); committed buys never do.
  const { cancel, remaining, capReached, hydrated } = useCancellations();
  const { push: toast } = useToast();

  const isSesh = source === 'sesh';
  const LOCK_SECONDS = isSesh ? SESH_LOCK_SECONDS : TICKER_LOCK_SECONDS;

  const [qty, setQty] = useState<number>(1);
  const [lockExpiresAt, setLockExpiresAt] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(LOCK_SECONDS);
  const [expired, setExpired] = useState<boolean>(false);

  const open = wine !== null;

  // Payment method on file — default card (last-4 only; full card data never exists here).
  const defaultCard = cards.find((c) => c.isDefault) ?? cards[0];
  const last4 = defaultCard?.last4 ?? '';
  const hasCard = !!defaultCard;

  // Reset quantity when a new wine opens.
  const lastWineIdRef = useRef<string | null>(null);
  const expiryCountedRef = useRef<boolean>(false); // SESH: expiry consumes one cancellation, once
  useEffect(() => {
    if (!wine) { lastWineIdRef.current = null; return; }
    if (lastWineIdRef.current !== wine.id) {
      lastWineIdRef.current = wine.id;
      setQty(1);
      // Capture the price + start the price-lock hold the moment the popup opens.
      setLockExpiresAt(Date.now() + LOCK_SECONDS * 1000);
      setSecondsLeft(LOCK_SECONDS);
      setExpired(false);
      expiryCountedRef.current = false;
    }
  }, [wine, LOCK_SECONDS]);

  // Price-lock countdown. At zero the lock expires.
  useEffect(() => {
    if (!open || expired || lockExpiresAt === 0) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((lockExpiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) setExpired(true);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [open, expired, lockExpiresAt]);

  // SESH only: letting the clock run out counts as a cancellation (rule #3) — exactly
  // like "Not now". Fires once when the lock expires; uncounted once at cap.
  useEffect(() => {
    if (!expired || !isSesh || expiryCountedRef.current) return;
    expiryCountedRef.current = true;
    if (!capReached) {
      const after = cancel();
      toast({ kind: 'info', message: seshCancelMsg(after) });
    }
  }, [expired, isSesh, capReached, cancel, toast]);

  // Ticker only: re-lock the price for another window (unchanged behavior).
  const handleRelock = useCallback(() => {
    setLockExpiresAt(Date.now() + TICKER_LOCK_SECONDS * 1000);
    setSecondsLeft(TICKER_LOCK_SECONDS);
    setExpired(false);
  }, []);

  // Cancellation-aware exit for "Not now" / Esc / backdrop.
  // SESH + active + below cap → consume a cancellation; SESH at cap or already expired
  // → exit uncounted; Ticker → always harmless. Always returns to the floor.
  const handleCancelExit = useCallback(() => {
    if (isSesh && !expired && !capReached) {
      const after = cancel();
      toast({ kind: 'info', message: seshCancelMsg(after) });
    }
    onClose();
  }, [isSesh, expired, capReached, cancel, toast, onClose]);

  // Esc dismisses — same as "Not now".
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCancelExit(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleCancelExit]);

  // EXECUTES THE ORDER — captures the held price, adds the locked line, and opens the
  // SEPARATE 15-min free-ship window. NOT a cancellation. Charge/order behavior unchanged.
  const addToCart = useCallback((quantity: number) => {
    if (!wine || expired) return; // lock must be live to capture the held price
    if (isSesh && capReached) return; // locked out of buying this SESH (2 cancellations)
    const added = addItem(
      { wineId: wine.id, name: wine.name, unitPrice: wine.price, image: wine.image, msrp: wine.msrp, meta: wine.region, locked: true, source },
      quantity,
    );
    onClose();
    if (!added) return;
    shipWindow.open();
  }, [wine, expired, isSesh, capReached, addItem, onClose, shipWindow, source]);

  // No card on file → send them to the qualification / add-card flow instead.
  const handleAddCard = useCallback(() => { onClose(); openGate(); }, [onClose, openGate]);

  // Backdrop click dismisses — same as "Not now".
  const handleBackdropClick = useCallback(() => { handleCancelExit(); }, [handleCancelExit]);

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

        {/* PRICE LOCK banner — live countdown. SESH: 20s, flashes the whole time, and
            expiry shows the remaining-cancellation count. Ticker: 15s, re-lockable. */}
        {expired ? (
          <div className="qbp-modal-banner qbp-modal-banner--expired" role="alert">
            <i className="fa-solid fa-triangle-exclamation" aria-hidden />
            <span>
              {isSesh
                ? (hydrated ? SESH_EXPIRED_REMAIN(remaining) : 'Price lock expired.')
                : PRICE_LOCK_EXPIRED}
            </span>
          </div>
        ) : (
          <div
            className={`qbp-modal-banner qbp-modal-banner--locked${secondsLeft <= 5 ? ' qbp-modal-banner--urgent' : ''}${isSesh ? ' qbp-modal-banner--flash' : ''}`}
            role="timer"
            aria-live="polite"
            aria-atomic="true"
          >
            <i className="fa-solid fa-lock" aria-hidden />
            <span>{isSesh ? priceLockLabelSesh(secondsLeft) : priceLockLabelTicker(secondsLeft)}</span>
          </div>
        )}

        {/* PRODUCT ROW */}
        <div className="qbp-modal-product">
          <div className="qbp-modal-bottle">
            {/* Some wines (esp. Ticker) ship without an image. Render the shared
                /bottle.svg placeholder instead of a broken <img>, whose alt text
                would otherwise overflow the box and collide with the wine name.
                SESH always supplies a real image, so its rendering is unchanged. */}
            {wine.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={wine.image}
                alt={wine.name}
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.src.endsWith('/bottle.svg')) {
                    img.src = '/bottle.svg';
                    img.classList.add('qbp-modal-bottle-fallback');
                  }
                }}
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src="/bottle.svg" alt="" className="qbp-modal-bottle-fallback" />
            )}
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

        {/* ORDER SUMMARY — real locked values; makes the charge feel official. */}
        {hasCard && !expired && (
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
          {expired && isSesh ? (
            // SESH expired: both buttons turn BLACK and just return to the SESH. The
            // cancellation was already consumed the moment the lock expired.
            <>
              <button
                type="button"
                className="qbp-modal-primary qbp-modal-primary--ended"
                onClick={onClose}
                aria-label={BTN_EXPIRED_PRIMARY}
              >
                {BTN_EXPIRED_PRIMARY}
              </button>
              <button
                type="button"
                className="qbp-modal-secondary qbp-modal-secondary--ended"
                onClick={onClose}
                aria-label={BTN_EXPIRED_SECONDARY}
              >
                {BTN_EXPIRED_SECONDARY}
              </button>
            </>
          ) : expired ? (
            // Ticker expired: re-lock (unchanged) + harmless exit.
            <>
              <button type="button" className="qbp-modal-primary" onClick={handleRelock}>
                <i className="fa-solid fa-rotate-right" aria-hidden /> {RELOCK_LABEL}
              </button>
              <button
                type="button"
                className="qbp-modal-secondary"
                onClick={handleCancelExit}
                aria-label="Close without ordering"
              >
                {EXIT_LABEL}
              </button>
            </>
          ) : (
            <>
              {hasCard ? (
                <>
                  <button
                    type="button"
                    className="qbp-modal-primary"
                    onClick={() => addToCart(qty)}
                    disabled={isSesh && capReached}
                    aria-label={`${placeOrderLabel(last4)} — total $${lineTotal.toFixed(2)}`}
                  >
                    <i className="fa-solid fa-credit-card" aria-hidden /> {placeOrderLabel(last4)}
                  </button>
                  {isSesh ? (
                    <p className="qbp-status" role="note">
                      {capReached ? SESH_STATUS_CAP : SESH_STATUS_ACTIVE(remaining)}
                    </p>
                  ) : (
                    <p className="qbp-microcopy">{ORDER_MICROCOPY}</p>
                  )}
                </>
              ) : (
                <button type="button" className="qbp-modal-primary" onClick={handleAddCard}>
                  <i className="fa-solid fa-credit-card" aria-hidden /> {NO_CARD_CTA}
                </button>
              )}

              {/* Explicit exit (no top-corner X). On SESH this consumes a cancellation. */}
              <button
                type="button"
                className="qbp-modal-secondary"
                onClick={handleCancelExit}
                aria-label="Close without ordering"
              >
                {EXIT_LABEL}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuickBuyPopover;
