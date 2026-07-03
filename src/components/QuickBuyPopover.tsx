'use client';

/* Quick-buy popover — ORDER-EXECUTION modal for SESH + Ticker (one shared component).

   TWO SEPARATE CLOCKS — this popup owns only the first:
   1. PRICE LOCK (45 seconds — QUICK_BUY_LOCK_SECONDS): a live countdown to place the
      order; the captured price is held until it hits 0, then the lock expires. Shared
      by SESH and Ticker.
   2. FREE-SHIP WINDOW (15 minutes): a SEPARATE post-purchase consolidation timer shown
      on the lower-right badge (ShippingWindowModal). It opens only AFTER the order is
      committed. It is NOT displayed in this popup and shares no state with it.

   Dismissing the popup ("Not now" / Esc / backdrop) is harmless — never a cancellation. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { liveTickerPrice } from '@/lib/tickerPrice';
import { taxAmount } from '@/lib/cartTotals';
import { taxRateForState, formatTaxRate } from '@/lib/tax';
import { isShippableState, shipBlockMessage } from '@/lib/shippableStates';
import { useCart } from '@/context/CartContext';
import { useCartShipping } from '@/context/CartShippingContext';
import { useShippingWindow } from '@/context/ShippingWindowContext';
import { useProfile } from '@/context/ProfileContext';
import { useBillingGate } from '@/context/BillingGateContext';
import { useCancellations } from '@/context/CancellationContext';
import { useToast } from '@/components/ToastProvider';

export type QuickBuyWine = {
  id: string;
  name: string;
  region?: string;
  price: number; // live price captured the instant the popup opened
  basePrice?: number; // Ticker: the wine's base price, so re-lock can re-sample the live price
  image: string;
  msrp?: number;
};

export type QuickBuyPopoverProps = {
  wine: QuickBuyWine | null;
  onClose: () => void;
  source: 'ticker' | 'sesh';
};

// Editable copy.
// The per-popup "time to place the order" price-lock countdown, shared by SESH and
// Ticker (ONE value — not the separate 15-minute cart consolidation window). SESH's
// exits/expiry cost a cancellation; Ticker keeps its harmless "re-lock" behavior.
const QUICK_BUY_LOCK_SECONDS = 45;
const priceLockLabelTicker = (s: number) => `Price locked · ${s}s to order`;
const priceLockLabelSesh = (s: number) => `Price locked · ${s}s to confirm`;
const PRICE_LOCK_EXPIRED = 'Price lock expired — re-lock to keep this price.'; // Ticker
const RELOCK_LABEL = `Re-lock price (${QUICK_BUY_LOCK_SECONDS}s)`; // Ticker
const ORDER_MICROCOPY = 'Card runs when the 15-minute window closes — no further confirmation.'; // Ticker
const EXIT_LABEL = 'Not now'; // Ticker active-state exit
const SESH_EXIT_LABEL = 'Cancel / Return to Sesh'; // SESH active-state exit
const NO_CARD_CTA = 'Add a card to order';
const placeOrderLabel = (last4: string) => `Place Order · Card ••${last4}`;

// SESH cancellation-aware status + messaging (driven by the single 2-per-SESH counter).
// After 2 cancellations the user is LOCKED OUT of buying this SESH (resets next drop).
export const SESH_LOCKED_COPY =
  "You've used both cancellations. Buying is locked for this SESH — back at the next drop.";
const SESH_STATUS_ACTIVE = (n: number) =>
  `Price locked · ${QUICK_BUY_LOCK_SECONDS}s to confirm. Letting it expire or tapping "Cancel" uses a cancellation · ${n} left`;
const SESH_STATUS_CAP = SESH_LOCKED_COPY;
const SESH_EXPIRED_REMAIN = (n: number) =>
  n <= 0 ? SESH_LOCKED_COPY : '1 cancellation left.';
// Lock-rules summary line shown below "Not now" on the SESH popup (editable).
// The 15 min is the post-lock-in window to add more wines before the card is charged
// (NOT a price lock — the price lock is the 45s timer above).
const SESH_LOCK_RULES = 'Max 2 cancellations · after you lock in, 15 min to add more wines before your card is charged';
const BTN_EXPIRED_PRIMARY = 'Price Lock Expired — Return to SESH';
// Second action is a useful next step (browse more wine) rather than a duplicate return.
const BTN_EXPIRED_BROWSE = 'Browse the Shop →';
const seshCancelMsg = (after: number) =>
  after >= 1
    ? 'Cancelled. 1 cancellation left.'
    : "That's your second cancellation — buying is locked for the rest of this SESH. Back at the next drop.";

export function QuickBuyPopover({ wine, onClose, source }: QuickBuyPopoverProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const shipWindow = useShippingWindow();
  const { cards } = useProfile();
  // ONE cart-wide shipping address (the single source of truth). Editable until the
  // first SESH/Ticker quick-buy commits, then locked for the life of the cart.
  const { addresses, address: destAddress, locked: shipLocked, setAddress: setShipAddress, lock: lockShip } = useCartShipping();
  const { openGate } = useBillingGate();
  // Single SESH cancellation counter (2 per SESH). On SESH, "Not now"/Esc/backdrop and
  // timer-expiry each consume one (when remaining > 0); committed buys never do.
  const { cancel, remaining, capReached, hydrated } = useCancellations();
  const { push: toast } = useToast();

  const isSesh = source === 'sesh';
  const LOCK_SECONDS = QUICK_BUY_LOCK_SECONDS; // shared SESH + Ticker countdown

  const [qty, setQty] = useState<number>(1);
  const [lockExpiresAt, setLockExpiresAt] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(LOCK_SECONDS);
  const [expired, setExpired] = useState<boolean>(false);
  // The price actually held by the lock. Captured on open; on a Ticker re-lock it's
  // re-sampled from the live market so the new lock reflects the drifted tile price.
  const [lockedPrice, setLockedPrice] = useState<number>(wine?.price ?? 0);

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
      setLockedPrice(wine.price);
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

  // Ticker only: re-lock for another window AT THE CURRENT LIVE PRICE. The lock
  // froze the old price; re-locking re-samples the same live-price function the
  // ticker tile uses (by id + base + now), so it picks up wherever the market has
  // drifted — not the stale locked value.
  const handleRelock = useCallback(() => {
    if (wine) {
      const fresh = liveTickerPrice(wine.basePrice ?? wine.price, wine.id, Date.now());
      setLockedPrice(fresh);
      toast({ kind: 'info', message: `Re-locked at $${fresh.toFixed(2)}.` });
    }
    setLockExpiresAt(Date.now() + QUICK_BUY_LOCK_SECONDS * 1000);
    setSecondsLeft(QUICK_BUY_LOCK_SECONDS);
    setExpired(false);
  }, [wine, toast]);

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
    if (!destAddress || !isShippableState(destAddress.state)) return; // no / disallowed destination
    const added = addItem(
      { wineId: wine.id, name: wine.name, unitPrice: lockedPrice, image: wine.image, msrp: wine.msrp, meta: wine.region, locked: true, source },
      quantity,
    );
    onClose();
    if (!added) return;
    // FIRST committed SESH/Ticker quick-buy locks the cart shipping address to the
    // in-effect destination (idempotent — later commits don't change it).
    lockShip();
    shipWindow.open();
  }, [wine, expired, isSesh, capReached, destAddress, addItem, lockedPrice, onClose, lockShip, shipWindow, source]);

  // No card on file → send them to the qualification / add-card flow instead.
  const handleAddCard = useCallback(() => { onClose(); openGate(); }, [onClose, openGate]);

  // Expired-state "next step": close the popup and go browse more wine in the Shop.
  const handleBrowseShop = useCallback(() => { onClose(); router.push('/shop'); }, [onClose, router]);

  // Backdrop click dismisses — same as "Not now".
  const handleBackdropClick = useCallback(() => { handleCancelExit(); }, [handleCancelExit]);

  const savings = useMemo(() => {
    if (!wine || wine.msrp === undefined) return 0;
    return Math.max(0, wine.msrp - lockedPrice);
  }, [wine, lockedPrice]);
  const offMsrpPct = useMemo(() => {
    if (!wine || !wine.msrp) return 0;
    return Math.max(0, (1 - lockedPrice / wine.msrp) * 100);
  }, [wine, lockedPrice]);

  // Destination-based sales tax. The reservation ships to and settles against the
  // cart-wide shipping address (from CartShippingContext), so its state drives the
  // rate — the SAME resolver + calculation the standard checkout and the window-close
  // settlement use, so the preview here matches what actually gets charged. Recomputes
  // on qty / price / destination change. If no address is on file (shouldn't happen
  // for a qualified user), fall back to the default rate and FLAG it — never silently $0.
  const hasDestination = !!destAddress;
  // Whether the destination is deliverable per the authoritative allowlist — block
  // commit (and tax display) for disallowed states.
  const canShip = hasDestination && isShippableState(destAddress?.state);
  const taxRate = useMemo(() => taxRateForState(destAddress?.state), [destAddress]);
  // Short, recognizable preview of the destination (default shipping address) for
  // the "shipping to" helper line under Place Order — truncate the street line to
  // ~12 chars + ellipsis, then city/state/ZIP. Display-only; never the full line.
  const shipPreview = useMemo(() => {
    if (!destAddress) return null;
    const line1 = (destAddress.line1 ?? '').trim();
    const head = line1.length > 14 ? `${line1.slice(0, 12).trimEnd()}…` : line1;
    const cityState = [destAddress.city, destAddress.state].filter(Boolean).join(', ');
    const tail = [cityState, destAddress.zip].filter(Boolean).join(' ');
    return tail ? `${head} · ${tail}` : head;
  }, [destAddress]);
  const lineSubtotal = useMemo(() => Number((lockedPrice * qty).toFixed(2)), [lockedPrice, qty]);
  const taxDue = useMemo(() => taxAmount(lineSubtotal, taxRate), [lineSubtotal, taxRate]);
  // Estimated / order / Place Order amount is now tax-INCLUSIVE.
  const lineTotal = useMemo(() => Number((lineSubtotal + taxDue).toFixed(2)), [lineSubtotal, taxDue]);

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

        {/* PRICE LOCK banner — live 45s countdown. SESH flashes the whole time and
            expiry shows the remaining-cancellation count; Ticker is re-lockable. */}
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
              <div className="qbp-modal-price">${lockedPrice.toFixed(2)}</div>
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

        {/* ORDER SUMMARY — real locked values; makes the charge feel official. Hidden
            for a disallowed destination so NO tax figure is computed/shown (block
            before tax). */}
        {hasCard && !expired && canShip && (
          <div className="qbp-order-summary" role="group" aria-label="Order summary">
            <div className="qbp-os-row">
              <span className="qbp-os-name">{wine.name}</span>
              <span className="qbp-os-qty">Qty {qty}</span>
            </div>
            <div className="qbp-os-row">
              <span className="qbp-os-label">Locked price</span>
              <span className="qbp-os-val">${lockedPrice.toFixed(2)}{qty > 1 ? ` × ${qty}` : ''}</span>
            </div>
            <div className="qbp-os-row">
              <span className="qbp-os-label">Subtotal</span>
              <span className="qbp-os-val">${lineSubtotal.toFixed(2)}</span>
            </div>
            <div className="qbp-os-row">
              <span className="qbp-os-label">
                Tax ({formatTaxRate(taxRate)})
                {!hasDestination && <span className="qbp-os-flag"> · est.</span>}
              </span>
              <span className="qbp-os-val">${taxDue.toFixed(2)}</span>
            </div>
            <div className="qbp-os-row qbp-os-total">
              <span className="qbp-os-label">Order total</span>
              <span className="qbp-os-val">${lineTotal.toFixed(2)}</span>
            </div>
            {!hasDestination && (
              <div className="qbp-os-taxnote" role="note">
                <i className="fa-solid fa-triangle-exclamation" aria-hidden /> No shipping address on file — tax estimated at {formatTaxRate(taxRate)}. Add an address so the settled amount is exact.
              </div>
            )}
            <div className="qbp-os-row qbp-os-pay">
              <span className="qbp-os-label">Paying with</span>
              <span className="qbp-os-val">Card ••{last4}</span>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="qbp-modal-actions">
          {expired && isSesh ? (
            // SESH expired (cancellation already consumed at expiry): ONE clear return
            // to the SESH floor (primary, keeps the "Price Lock Expired" status), and a
            // useful next step to browse more wine in the Shop (secondary) — not a
            // duplicate return.
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
                onClick={handleBrowseShop}
                aria-label="Browse the Shop"
              >
                {BTN_EXPIRED_BROWSE}
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
                    disabled={(isSesh && capReached) || !canShip}
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
                  {/* Destination — ONE cart, ONE address. Editable dropdown until the
                      first quick-buy commits; read-only + locked afterward. */}
                  {!hasDestination ? (
                    <p className="qbp-microcopy qbp-shipto qbp-shipto--missing">
                      <i className="fa-solid fa-location-dot" aria-hidden /> Add a primary shipping address to set the destination.
                    </p>
                  ) : shipLocked ? (
                    <>
                      <p className="qbp-microcopy qbp-shipto">
                        <i className="fa-solid fa-lock" aria-hidden /> Shipping to your {destAddress?.label} address — locked for this cart · {shipPreview}
                      </p>
                      {!canShip && (
                        <p className="qbp-microcopy qbp-shipto qbp-shipto--missing">
                          <i className="fa-solid fa-triangle-exclamation" aria-hidden /> {shipBlockMessage(destAddress?.state)}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="qbp-shipto qbp-shipto--select">
                        <label className="qbp-shipto-label" htmlFor="qbp-ship-select">
                          <i className="fa-solid fa-location-dot" aria-hidden /> This wine is shipping to:
                        </label>
                        <div className="qbp-shipselect-wrap">
                          <select
                            id="qbp-ship-select"
                            className="qbp-shipselect"
                            value={destAddress?.id}
                            onChange={(e) => setShipAddress(e.target.value)}
                            aria-label="Cart shipping address"
                          >
                            {addresses.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.label} — {a.line1}, {a.city} {a.state}
                              </option>
                            ))}
                          </select>
                          <i className="fa-solid fa-chevron-down qbp-shipselect-chev" aria-hidden />
                        </div>
                      </div>
                      {!canShip && (
                        <p className="qbp-microcopy qbp-shipto qbp-shipto--missing">
                          <i className="fa-solid fa-triangle-exclamation" aria-hidden /> {shipBlockMessage(destAddress?.state)}
                        </p>
                      )}
                    </>
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
                {isSesh ? SESH_EXIT_LABEL : EXIT_LABEL}
              </button>
              {isSesh && (
                <p className="qbp-lockrules">
                  <i className="fa-solid fa-lock" aria-hidden /> {SESH_LOCK_RULES}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default QuickBuyPopover;
