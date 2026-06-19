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

// NEEDS REVIEW: TAX_RATE = 8.25% is a placeholder until owner confirms.
const TAX_RATE = 0.0825;

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
  const { items, subtotal, shipping, count, clear } = useCart();
  const { addresses, cards, addAddress, addCard, placeOrder } = useProfile();
  const { endWindow: endShipWindow } = useShippingWindow();

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

  // ----- Totals -----
  const { tax, total } = useMemo(() => {
    const t = subtotal * TAX_RATE;
    return {
      tax: t,
      total: subtotal + shipping + t,
    };
  }, [subtotal, shipping]);

  const updateShipping =
    (k: keyof AddressFields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setShippingAddr((prev) => ({ ...prev, [k]: e.target.value }));

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const onPlaceOrder = () => {
    if (items.length === 0) return;

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

    // 3) Build order lines from the cart's own price/name snapshot.
    const lines = items.map((i) => ({
      wineId: i.wineId,
      qty: i.qty,
      unitPrice: i.unitPrice,
      name: i.name,
    }));

    // 4) Place the order, clear the cart, route to summary.
    const id = placeOrder({
      lines,
      subtotal,
      shipping,
      tax,
      total,
      shippingAddressId,
      paymentCardId,
    });

    clear();
    // Checking out fulfills the order, so the free-shipping window is over —
    // terminate the timer/badge so it doesn't keep running post-checkout.
    endShipWindow();
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

            <div className={styles.itemList}>
              {items.length === 0 ? (
                <div className={styles.item}>
                  <div className={styles.itemName}>Your cart is empty.</div>
                </div>
              ) : (
                items.map((i) => (
                  <div key={i.wineId} className={styles.item}>
                    <div className={styles.itemName}>
                      {i.name}
                      <div className={styles.itemMeta}>
                        {i.meta ? `${i.meta} · ` : ''}Qty {i.qty}
                      </div>
                    </div>
                    <div className={styles.itemPrice}>
                      {money(i.unitPrice * i.qty)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={styles.rows}>
              <div className={styles.row}>
                <span>Subtotal ({count} bottles)</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className={styles.row}>
                <span>Shipping</span>
                {shipping === 0 && count > 0 ? (
                  <span className={styles.rowFree}>FREE</span>
                ) : (
                  <span>{money(shipping)}</span>
                )}
              </div>
              <div className={styles.row}>
                <span>Tax (8.25%)</span>
                <span>{money(tax)}</span>
              </div>
            </div>

            <div className={styles.totalRow}>
              <span>Total</span>
              <span>{money(total)}</span>
            </div>

            <button
              type="button"
              className={`btn-billing ${styles.placeOrder}`}
              onClick={onPlaceOrder}
              disabled={items.length === 0}
            >
              PLACE ORDER
            </button>
          </aside>
        </div>
      </main>
    </PageChrome>
  );
}
