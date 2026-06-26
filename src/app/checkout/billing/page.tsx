// NEEDS REVIEW: built from spec only — no screenshot or prototype HTML exists
// for this page. Layout, two-column structure, Consolidated Order Summary panel,
// tax rate, and ticker={false} assumption all need owner sign-off.
// PLACE ORDER is now wired end-to-end through ProfileContext.placeOrder + CartContext.clear.
'use client';

/* /checkout/billing — Billing & Shipping ("Consolidated Order Summary").
   Reuses .signup-card / .field / .check-row / .signup-help / .btn-billing
   from globals.css (signup-form pattern). Right column is a white
   .panel.detail-panel-styled order summary. */

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PageChrome } from '@/components/PageChrome';
import { useCart } from '@/context/CartContext';
import { splitOrderTotals, CHECKOUT_TAX_RATE } from '@/lib/cartTotals';
import { useShippingWindow } from '@/context/ShippingWindowContext';
import { useProfile, cardBrand as detectBrand } from '@/context/ProfileContext';
import styles from './billing.module.css';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const NEW_ADDR_ID = '__new__';
const NEW_CARD_ID = '__new__';

type AddressFields = {
  label: string;
  fullName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
};

const EMPTY_ADDRESS: AddressFields = {
  label: 'Home',
  fullName: '',
  address1: '',
  address2: '',
  city: '',
  state: US_STATES[0]!,
  zip: '',
  phone: '',
};

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

function defaultOrFirstId<T extends { id: string; isDefault: boolean }>(
  list: T[],
): string {
  if (list.length === 0) return NEW_ADDR_ID;
  return (list.find((x) => x.isDefault) ?? list[0]!).id;
}

export default function BillingPage() {
  const router = useRouter();
  const { items, removeItem, clear } = useCart();
  const { addresses, cards, addAddress, addCard, placeOrder } = useProfile();
  const { endWindow: endShipWindow } = useShippingWindow();

  // Split the cart into the two pools. STANDARD items are charged now by Place Order;
  // SESH/Ticker (locked) reservations are already paid and settle at window close, so
  // they are EXCLUDED from the charged amount (shown for information only).
  const standardItems = items.filter((i) => !i.locked);
  const seshItems = items.filter((i) => i.locked);
  const split = useMemo(() => splitOrderTotals(items, CHECKOUT_TAX_RATE), [items]);

  // ----- Saved address / card selection -----
  const [selectedAddressId, setSelectedAddressId] = useState<string>(() =>
    defaultOrFirstId(addresses),
  );
  const [selectedCardId, setSelectedCardId] = useState<string>(() =>
    defaultOrFirstId(cards),
  );

  // ----- New address form -----
  const [shippingAddr, setShippingAddr] = useState<AddressFields>(EMPTY_ADDRESS);

  // ----- New card form -----
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const usingNewAddress =
    addresses.length === 0 || selectedAddressId === NEW_ADDR_ID;
  const usingNewCard = cards.length === 0 || selectedCardId === NEW_CARD_ID;

  // Locked SESH/Ticker reservations auto-charge the default card when the window
  // closes — the payment method can't be changed while any are in the cart.
  const hasLocked = items.some((i) => i.locked);
  const lockedCardId = defaultOrFirstId(cards);
  const lockedCard = cards.find((c) => c.id === lockedCardId);

  const updateShipping =
    (k: keyof AddressFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setShippingAddr((prev) => ({ ...prev, [k]: e.target.value }));

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const onPlaceOrder = () => {
    // Place Order charges the STANDARD pool only. If there are no standard items
    // there is nothing to place (SESH reservations settle on their own at close).
    if (standardItems.length === 0) return;

    // 1) Resolve / create the shipping address.
    let shippingAddressId: string | undefined;
    if (usingNewAddress) {
      if (!shippingAddr.fullName || !shippingAddr.address1 || !shippingAddr.city || !shippingAddr.zip) {
        // form invalid — bail silently for now (NEEDS REVIEW: surface errors)
        return;
      }
      shippingAddressId = addAddress({
        label: shippingAddr.label || 'Home',
        fullName: shippingAddr.fullName,
        line1: shippingAddr.address1,
        line2: shippingAddr.address2 || undefined,
        city: shippingAddr.city,
        state: shippingAddr.state,
        zip: shippingAddr.zip,
        phone: shippingAddr.phone || undefined,
      });
    } else {
      shippingAddressId = selectedAddressId;
    }

    // 2) Resolve / create the payment card.
    let paymentCardId: string | undefined;
    if (hasLocked && lockedCardId) {
      // Reservations settle on the default card — never create/change it here.
      paymentCardId = lockedCardId;
    } else if (usingNewCard) {
      const digits = cardNumber.replace(/\s+/g, '');
      if (!digits || !cardName || !cardExp || !cardCvc) {
        return;
      }
      const last4 = digits.slice(-4);
      const expMatch = cardExp.match(/^(\d{1,2})\s*\/\s*(\d{2,4})$/);
      const expMonth = expMatch ? expMatch[1]!.padStart(2, '0') : '';
      const rawYear = expMatch ? expMatch[2]! : '';
      const expYear = rawYear.length === 4 ? rawYear.slice(2) : rawYear;
      paymentCardId = addCard({
        brand: detectBrand(digits),
        last4,
        expMonth,
        expYear,
        nameOnCard: cardName,
      });
    } else {
      paymentCardId = selectedCardId;
    }

    // 3) Build order lines from STANDARD items only (SESH/Ticker reservations are
    //    excluded — they're already paid and settle at window close).
    const lines = standardItems.map((i) => ({
      wineId: i.wineId,
      qty: i.qty,
      unitPrice: i.unitPrice,
      name: i.name,
    }));

    // 4) Place the order for the DUE-NOW (standard) totals only.
    const id = placeOrder({
      lines,
      subtotal: split.dueNow.subtotal,
      shipping: split.dueNow.shipping,
      tax: split.dueNow.tax,
      total: split.dueNow.total,
      shippingAddressId,
      paymentCardId,
    });

    // 5) Remove ONLY the standard items just charged. Any SESH/Ticker reservations
    //    stay in the cart so the shipping window keeps running and settles them at
    //    close. End the window only if nothing reserved remains.
    standardItems.forEach((i) => removeItem(i.lineId));
    if (seshItems.length === 0) {
      clear();
      endShipWindow();
    }
    router.push(`/checkout/summary?orderId=${id}`);
  };

  return (
    <PageChrome ticker={false}>
      <main className="wrap">
        <div className={styles.title}>Billing &amp; Shipping</div>

        <div className={styles.layout}>
          {/* LEFT: form card (signup-card pattern) */}
          <form
            className={`signup-card ${styles.formCard}`}
            onSubmit={onSubmit}
          >
            <h4>Shipping Address</h4>

            {addresses.length > 0 && (
              <>
                <label className="check-row" style={{ marginTop: 0 }}>
                  Use saved
                </label>
                <select
                  className="field"
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  aria-label="Saved address"
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} — {a.fullName}, {a.line1}, {a.city} {a.state}{' '}
                      {a.zip}
                    </option>
                  ))}
                  <option value={NEW_ADDR_ID}>Use a different address…</option>
                </select>
              </>
            )}

            {usingNewAddress && (
              <>
                <input
                  className="field"
                  placeholder="Full Name"
                  value={shippingAddr.fullName}
                  onChange={updateShipping('fullName')}
                />
                <input
                  className="field"
                  placeholder="Address 1"
                  value={shippingAddr.address1}
                  onChange={updateShipping('address1')}
                />
                <input
                  className="field"
                  placeholder="Address 2"
                  value={shippingAddr.address2}
                  onChange={updateShipping('address2')}
                />
                <input
                  className="field"
                  placeholder="City"
                  value={shippingAddr.city}
                  onChange={updateShipping('city')}
                />
                <div className={styles.fieldRow}>
                  <select
                    className="field"
                    value={shippingAddr.state}
                    onChange={updateShipping('state')}
                    aria-label="State"
                  >
                    {US_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <input
                    className="field"
                    placeholder="ZIP"
                    value={shippingAddr.zip}
                    onChange={updateShipping('zip')}
                  />
                </div>
                <input
                  className="field"
                  placeholder="Phone"
                  value={shippingAddr.phone}
                  onChange={updateShipping('phone')}
                />
              </>
            )}

            <h4 className="mt">Payment</h4>

            {hasLocked && lockedCard ? (
              <>
                <label className="check-row" style={{ marginTop: 0 }}>
                  Payment method
                </label>
                <div className={styles.lockedPay}>
                  <span>
                    {lockedCard.brand} •••• {lockedCard.last4} (exp {lockedCard.expMonth}/{lockedCard.expYear})
                  </span>
                  <span className={styles.lockedPayTag}>
                    <i className="fa-solid fa-lock" aria-hidden /> Default
                  </span>
                </div>
                <p className={styles.lockedPayNote}>
                  Your cart has locked SESH/Ticker reservations — they settle automatically
                  on your default card when the window closes, so the payment method can&apos;t
                  be changed here.
                </p>
              </>
            ) : cards.length > 0 ? (
              <>
                <label className="check-row" style={{ marginTop: 0 }}>
                  Use saved card
                </label>
                <select
                  className="field"
                  value={selectedCardId}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  aria-label="Saved card"
                >
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brand} •••• {c.last4} (exp {c.expMonth}/{c.expYear})
                    </option>
                  ))}
                  <option value={NEW_CARD_ID}>Use a different card…</option>
                </select>
              </>
            ) : null}

            {!hasLocked && usingNewCard && (
              <>
                <input
                  className="field"
                  placeholder="Card Number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  inputMode="numeric"
                  autoComplete="cc-number"
                />
                <input
                  className="field"
                  placeholder="Name on Card"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  autoComplete="cc-name"
                />
                <div className={styles.fieldRow}>
                  <input
                    className="field"
                    placeholder="MM/YY"
                    value={cardExp}
                    onChange={(e) => setCardExp(e.target.value)}
                    autoComplete="cc-exp"
                  />
                  <input
                    className="field"
                    placeholder="CVC"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    autoComplete="cc-csc"
                    inputMode="numeric"
                  />
                </div>
              </>
            )}

            <p className="signup-help">
              Free ground shipping at 6+ bottles. Otherwise standard shipping
              applies.
            </p>
          </form>

          {/* RIGHT: Consolidated Order Summary panel (white .panel .detail-panel) */}
          <aside className={`panel detail-panel ${styles.summaryCard}`}>
            <h3 className={styles.summaryTitle}>CONSOLIDATED ORDER SUMMARY</h3>

            {items.length === 0 ? (
              <div className={styles.itemList}>
                <div className={styles.item}>
                  <div className={styles.itemName}>Your cart is empty.</div>
                </div>
              </div>
            ) : (
              <>
                {/* DUE NOW — standard (Shop / Winemaker Spotlight) items, charged now. */}
                {split.hasStandard && (
                  <section className={styles.group}>
                    <div className={styles.groupHead}>Due now · Place Order</div>
                    <div className={styles.itemList}>
                      {standardItems.map((i) => (
                        <div key={i.lineId} className={styles.item}>
                          <div className={styles.itemName}>
                            {i.name}
                            <div className={styles.itemMeta}>
                              {i.meta ? `${i.meta} · ` : ''}Qty {i.qty}
                            </div>
                          </div>
                          <div className={styles.itemPrice}>{money(i.unitPrice * i.qty)}</div>
                        </div>
                      ))}
                    </div>
                    <div className={styles.rows}>
                      <div className={styles.row}>
                        <span>Subtotal ({split.dueNow.bottles} bottle{split.dueNow.bottles === 1 ? '' : 's'})</span>
                        <span>{money(split.dueNow.subtotal)}</span>
                      </div>
                      <div className={styles.row}>
                        <span>Shipping</span>
                        {split.dueNow.shipping === 0 ? (
                          <span className={styles.rowFree}>FREE</span>
                        ) : (
                          <span>{money(split.dueNow.shipping)}</span>
                        )}
                      </div>
                      <div className={styles.row}>
                        <span>Tax (8.25%)</span>
                        <span>{money(split.dueNow.tax)}</span>
                      </div>
                    </div>
                    <div className={styles.totalRow}>
                      <span>Due now</span>
                      <span>{money(split.dueNow.total)}</span>
                    </div>
                  </section>
                )}

                {/* SETTLES AT WINDOW CLOSE — SESH/Ticker reservations, info only. */}
                {split.hasReserved && (
                  <section className={styles.group}>
                    <div className={styles.groupHead}>Settles at window close · already reserved</div>
                    <div className={styles.itemList}>
                      {seshItems.map((i) => (
                        <div key={i.lineId} className={styles.item}>
                          <div className={styles.itemName}>
                            {i.name}
                            <div className={styles.itemMeta}>
                              {i.meta ? `${i.meta} · ` : ''}Qty {i.qty} ·{' '}
                              <span className={styles.reservedTag}>
                                <i className="fa-solid fa-lock" aria-hidden /> Locked in
                              </span>
                            </div>
                          </div>
                          <div className={styles.itemPrice}>{money(i.unitPrice * i.qty)}</div>
                        </div>
                      ))}
                    </div>
                    <div className={styles.rows}>
                      <div className={styles.row}>
                        <span>Reserved subtotal ({split.reserved.bottles} bottle{split.reserved.bottles === 1 ? '' : 's'})</span>
                        <span>{money(split.reserved.subtotal)}</span>
                      </div>
                    </div>
                    <p className={styles.reservedNote}>
                      Already reserved on your default card — tax &amp; shipping settle automatically
                      when the SESH window closes. Not part of this charge.
                    </p>
                  </section>
                )}

                {split.hasStandard ? (
                  <button
                    type="button"
                    className={`btn-billing ${styles.placeOrder}`}
                    onClick={onPlaceOrder}
                    disabled={standardItems.length === 0}
                  >
                    PLACE ORDER · {money(split.dueNow.total)}
                  </button>
                ) : (
                  <div className={styles.allReserved} role="status">
                    <i className="fa-solid fa-circle-check" aria-hidden /> Your reservations are set —
                    they settle automatically when the window closes. Nothing to place now.
                  </div>
                )}
              </>
            )}
          </aside>
        </div>
      </main>
    </PageChrome>
  );
}
