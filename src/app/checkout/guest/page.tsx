'use client';

/* /checkout/guest — GUEST CHECKOUT (mock, no account).
   Three sections (User info · Shipping · Billing) + three consent checkboxes.
   Confirm Order is enabled only when 21+ and terms are checked AND the form is valid
   (required fields + a shippable destination). On confirm we place a TRANSIENT mock
   order into GuestCheckoutContext (NOT the profile) and move to the confirmation screen,
   where the user may optionally turn it into an account. Reuses the shippable-states
   allowlist, splitOrderTotals, and the shared OrderSummaryBreakdown. */

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageChrome } from '@/components/PageChrome';
import { useCart } from '@/context/CartContext';
import { useGuestCheckout, type GuestDraft, type GuestOrderSnapshot } from '@/context/GuestCheckoutContext';
import { cardBrand } from '@/context/ProfileContext';
import { splitOrderTotals } from '@/lib/cartTotals';
import { taxRateForState } from '@/lib/tax';
import { isShippableState, shipBlockMessage } from '@/lib/shippableStates';
import { OrderSummaryBreakdown } from '@/components/OrderSummaryBreakdown';
import styles from './guest.module.css';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

// Mock-only order id (no server). Deterministic shape VIN-NNNNNN.
function genGuestOrderId() {
  return `VIN-${Math.floor(100000 + Math.random() * 900000)}`;
}

export default function GuestCheckoutPage() {
  const router = useRouter();
  const { items, hydrated, clear: clearCart } = useCart();
  const { place } = useGuestCheckout();

  // ---- User info ----
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // ---- Shipping ----
  const [shipName, setShipName] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('CA'); // default to a shippable state
  const [zip, setZip] = useState('');
  const [shipPhone, setShipPhone] = useState('');

  // ---- Billing ----
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [sameAsShip, setSameAsShip] = useState(true);
  const [billLine1, setBillLine1] = useState('');
  const [billCity, setBillCity] = useState('');
  const [billState, setBillState] = useState('CA');
  const [billZip, setBillZip] = useState('');

  // ---- Consent ----
  const [over21, setOver21] = useState(false);
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(true); // default CHECKED, optional

  const taxRate = taxRateForState(state);
  const split = useMemo(() => splitOrderTotals(items, taxRate), [items, taxRate]);
  const destAllowed = isShippableState(state);

  const money = (n: number) => `$${n.toFixed(2)}`;

  // Required-field validity (kept deliberately light for the prototype).
  const digits = cardNumber.replace(/\s+/g, '');
  const expOk = /^(\d{1,2})\s*\/\s*(\d{2,4})$/.test(cardExp);
  const formValid =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    /.+@.+\..+/.test(email.trim()) &&
    shipName.trim() !== '' &&
    line1.trim() !== '' &&
    city.trim() !== '' &&
    zip.trim() !== '' &&
    destAllowed &&
    digits.length >= 12 &&
    cardName.trim() !== '' &&
    expOk &&
    cardCvc.trim().length >= 3 &&
    (sameAsShip || (billLine1.trim() !== '' && billCity.trim() !== '' && billZip.trim() !== '' && isShippableState(billState)));

  // Confirm is gated on BOTH required checkboxes + a valid form.
  const canConfirm = over21 && terms && formValid && split.hasStandard;

  const onConfirm = () => {
    if (!canConfirm) return;
    const expMatch = cardExp.match(/^(\d{1,2})\s*\/\s*(\d{2,4})$/);
    const expMonth = expMatch ? expMatch[1]!.padStart(2, '0') : '';
    const rawYear = expMatch ? expMatch[2]! : '';
    const expYear = rawYear.length === 4 ? rawYear.slice(2) : rawYear;
    const last4 = digits.slice(-4);

    const draft: GuestDraft = {
      user: { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim(), phone: phone.trim() },
      shipping: {
        fullName: shipName.trim(),
        line1: line1.trim(),
        line2: line2.trim(),
        city: city.trim(),
        state,
        zip: zip.trim(),
        phone: shipPhone.trim(),
      },
      card: { brand: cardBrand(digits), last4, expMonth, expYear, nameOnCard: cardName.trim() },
      marketing,
    };

    const pool = split.dueNow;
    const order: GuestOrderSnapshot = {
      id: genGuestOrderId(),
      date: new Date().toISOString(),
      lines: items
        .filter((i) => !i.locked)
        .map((i) => ({ wineId: i.wineId, qty: i.qty, unitPrice: i.unitPrice, name: i.name })),
      subtotal: pool.subtotal,
      shipping: pool.shipping,
      tax: pool.tax,
      total: pool.total,
      shipCity: city.trim(),
      shipState: state,
      cardBrand: draft.card.brand,
      cardLast4: last4,
    };

    place(draft, order);
    clearCart();
    router.push('/checkout/order-confirmation');
  };

  if (hydrated && !split.hasStandard) {
    return (
      <PageChrome ticker={false}>
        <main className="wrap">
          <div className={styles.title}>Guest Checkout</div>
          <p className={styles.empty}>Your cart has nothing to check out. <a href="/shop">Keep shopping →</a></p>
        </main>
      </PageChrome>
    );
  }

  return (
    <PageChrome ticker={false}>
      <main className="wrap">
        <div className={styles.title}>Guest Checkout</div>

        <div className={styles.layout}>
          <div className={`signup-card ${styles.formCard}`}>
            {/* ===== User info ===== */}
            <h4>Your info</h4>
            <div className={styles.fieldRow}>
              <input className="field" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
              <input className="field" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
            </div>
            <input className="field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" autoComplete="email" />
            <input className="field" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" />

            {/* ===== Shipping ===== */}
            <h4 className="mt">Shipping address</h4>
            <input className="field" placeholder="Full Name" value={shipName} onChange={(e) => setShipName(e.target.value)} autoComplete="name" />
            <input className="field" placeholder="Address 1" value={line1} onChange={(e) => setLine1(e.target.value)} autoComplete="address-line1" />
            <input className="field" placeholder="Address 2" value={line2} onChange={(e) => setLine2(e.target.value)} autoComplete="address-line2" />
            <input className="field" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
            <div className={styles.fieldRow}>
              <select className="field" value={state} onChange={(e) => setState(e.target.value)} aria-label="State">
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input className="field" placeholder="ZIP" value={zip} onChange={(e) => setZip(e.target.value)} autoComplete="postal-code" />
            </div>
            <input className="field" placeholder="Phone (shipping)" value={shipPhone} onChange={(e) => setShipPhone(e.target.value)} inputMode="tel" />
            {!destAllowed && (
              <p className={styles.shipBlock} role="alert">{shipBlockMessage(state)}</p>
            )}

            {/* ===== Billing ===== */}
            <h4 className="mt">Payment</h4>
            <input className="field" placeholder="Card Number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} inputMode="numeric" autoComplete="cc-number" />
            <input className="field" placeholder="Name on Card" value={cardName} onChange={(e) => setCardName(e.target.value)} autoComplete="cc-name" />
            <div className={styles.fieldRow}>
              <input className="field" placeholder="MM/YY" value={cardExp} onChange={(e) => setCardExp(e.target.value)} autoComplete="cc-exp" />
              <input className="field" placeholder="CVC" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} inputMode="numeric" autoComplete="cc-csc" />
            </div>
            <label className="check-row">
              <input type="checkbox" checked={sameAsShip} onChange={(e) => setSameAsShip(e.target.checked)} />
              Billing address same as shipping
            </label>
            {!sameAsShip && (
              <>
                <input className="field" placeholder="Billing Address 1" value={billLine1} onChange={(e) => setBillLine1(e.target.value)} />
                <input className="field" placeholder="Billing City" value={billCity} onChange={(e) => setBillCity(e.target.value)} />
                <div className={styles.fieldRow}>
                  <select className="field" value={billState} onChange={(e) => setBillState(e.target.value)} aria-label="Billing State">
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input className="field" placeholder="Billing ZIP" value={billZip} onChange={(e) => setBillZip(e.target.value)} />
                </div>
              </>
            )}

            {/* ===== Consent ===== */}
            <div className={styles.consent}>
              <label className="check-row">
                <input type="checkbox" checked={over21} onChange={(e) => setOver21(e.target.checked)} />
                I am over 21 years of age <span className={styles.req}>(required)</span>
              </label>
              <label className="check-row">
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                Agree to terms and conditions <span className={styles.req}>(required)</span>
              </label>
              <label className="check-row">
                <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
                Marketing emails and new drop alerts
              </label>
            </div>
          </div>

          {/* ===== Order summary ===== */}
          <aside className={`panel detail-panel ${styles.summaryCard}`}>
            <h3 className={styles.summaryTitle}>ORDER SUMMARY</h3>
            <OrderSummaryBreakdown items={items} split={split} taxRate={taxRate} blockTax={!destAllowed} />
            <button
              type="button"
              className={`btn-billing ${styles.placeOrder}`}
              onClick={onConfirm}
              disabled={!canConfirm}
            >
              CONFIRM ORDER · {money(split.dueNow.total)}
            </button>
            {!canConfirm && (
              <p className={styles.confirmHint}>
                {(!over21 || !terms)
                  ? 'Check 21+ and terms to confirm.'
                  : !destAllowed
                    ? 'Choose a shippable destination.'
                    : 'Complete the required fields to confirm.'}
              </p>
            )}
          </aside>
        </div>
      </main>
    </PageChrome>
  );
}
