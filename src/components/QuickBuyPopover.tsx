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
import { useToast } from '@/components/ToastProvider';
import { useCancellations } from '@/context/CancellationContext';

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
const PRICE_HOLD_COPY = 'Your price is locked for 15 seconds.';
const ORDER_MICROCOPY = 'Card runs when the 15-minute window closes — no further confirmation.';
const EXIT_LABEL = 'Not now';
const NO_CARD_CTA = 'Add a card to order';
const placeOrderLabel = (last4: string) => `Place Order · Card ••${last4}`;
// Post-purchase (SESH) — celebration + a quiet, SEPARATE cancellation note.
const POST_BUY_PRIMARY = "You're in. That bottle's locked, the SESH is still open — keep trading.";
const postBuyNote = (remaining: number) =>
  remaining > 0
    ? `${remaining} price-lock cancellation${remaining === 1 ? '' : 's'} remaining if you change your mind.`
    : 'Price locks are final now — but buy all you want.';

export function QuickBuyPopover({ wine, onClose, source }: QuickBuyPopoverProps) {
  const { addItem } = useCart();
  const shipWindow = useShippingWindow();
  const { cards } = useProfile();
  const { openGate } = useBillingGate();
  const { push: toast } = useToast();
  const { remaining } = useCancellations();
  const [qty, setQty] = useState<number>(1);

  const open = wine !== null;

  // Payment method on file — default card (last-4 only; full card data never exists here).
  const defaultCard = cards.find((c) => c.isDefault) ?? cards[0];
  const last4 = defaultCard?.last4 ?? '';
  const hasCard = !!defaultCard;

  // Reset quantity when a new wine opens.
  const lastWineIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!wine) { lastWineIdRef.current = null; return; }
    if (lastWineIdRef.current !== wine.id) { lastWineIdRef.current = wine.id; setQty(1); }
  }, [wine]);

  // Esc dismisses (harmless — never a cancellation).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // EXECUTES THE ORDER — captures the held price, adds the locked line, and opens the
  // SEPARATE 15-min free-ship window. Charge/order behavior unchanged.
  const addToCart = useCallback((quantity: number) => {
    if (!wine) return;
    const added = addItem(
      { wineId: wine.id, name: wine.name, unitPrice: wine.price, image: wine.image, msrp: wine.msrp, meta: wine.region, locked: true, source },
      quantity,
    );
    onClose();
    if (!added) return;
    shipWindow.open();
    // Post-purchase: celebrate (buying stays open) + a quiet SESH cancellation note.
    if (source === 'sesh') {
      toast({ kind: 'success', message: POST_BUY_PRIMARY, sub: postBuyNote(remaining), duration: 5000 });
    }
  }, [wine, addItem, onClose, shipWindow, source, toast, remaining]);

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

        {/* PRICE-HOLD reassurance (static 15-second hold — NOT a countdown). */}
        <div className="qbp-modal-banner qbp-modal-banner--locked" role="note">
          <i className="fa-solid fa-lock" aria-hidden />
          <span>{PRICE_HOLD_COPY}</span>
        </div>

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

        {/* ORDER SUMMARY — real locked values; makes the charge feel official. */}
        {hasCard && (
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
          {hasCard ? (
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

          {/* Explicit, harmless exit (no top-corner X). */}
          <button
            type="button"
            className="qbp-modal-secondary"
            onClick={onClose}
            aria-label="Close without ordering"
          >
            {EXIT_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuickBuyPopover;
