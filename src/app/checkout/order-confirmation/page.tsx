'use client';

/* /checkout/order-confirmation — guest order confirmation + account-creation upsell.
   Renders the just-placed (transient) guest order from GuestCheckoutContext. Offers
   to turn the guest into an account: [x] Create an Account (default checked) + a
   password field + Create Account. Creating the account PERSISTS the guest's entered
   user/shipping/card into the profile and flips the user to sesh_qualified (reusing
   exactly what they typed — the profile seeding effect no-ops because the slots are
   filled). If they skip, nothing is persisted and the transient data is discarded. */

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageChrome } from '@/components/PageChrome';
import { useGuestCheckout } from '@/context/GuestCheckoutContext';
import { useProfile } from '@/context/ProfileContext';
import { useUserState } from '@/context/UserStateContext';
import styles from './order-confirmation.module.css';

export default function OrderConfirmationPage() {
  const router = useRouter();
  const { order, draft, hydrated, clear } = useGuestCheckout();
  const { updateBasics, addAddress, addCard, updatePrefs, placeOrder } = useProfile();
  const { setUserState } = useUserState();

  const [createAccount, setCreateAccount] = useState(true); // default CHECKED
  const [password, setPassword] = useState('');
  // While routing to /profile after account creation, hold render so the just-cleared
  // order can't flash the empty "no recent order" fallback below.
  const [navigating, setNavigating] = useState(false);

  const money = (n: number) => `$${n.toFixed(2)}`;

  if (navigating) return null; // leaving for the full Profile page

  // Direct hit with nothing placed (or already cleared) → gentle fallback.
  if (hydrated && !order) {
    return (
      <PageChrome ticker={false}>
        <main className="wrap">
          <div className={styles.head}><span className={styles.title}>No recent order</span></div>
          <p className={styles.sub}>Nothing to confirm here. <Link href="/shop">Keep shopping →</Link></p>
        </main>
      </PageChrome>
    );
  }
  if (!order) return null; // pre-hydration

  const canCreate = createAccount && password.trim().length >= 4;

  const onCreateAccount = () => {
    if (!canCreate || !draft) return;
    // Reuse exactly what the guest entered.
    updateBasics({
      firstName: draft.user.firstName,
      lastName: draft.user.lastName,
      email: draft.user.email,
      phone: draft.user.phone,
    });
    const addrId = addAddress({
      label: 'Home',
      fullName: draft.shipping.fullName,
      line1: draft.shipping.line1,
      line2: draft.shipping.line2 || undefined,
      city: draft.shipping.city,
      state: draft.shipping.state,
      zip: draft.shipping.zip,
      phone: draft.shipping.phone || undefined,
      isDefault: true,
    });
    const cardId = addCard({
      brand: draft.card.brand,
      last4: draft.card.last4,
      expMonth: draft.card.expMonth,
      expYear: draft.card.expYear,
      nameOnCard: draft.card.nameOnCard,
      isDefault: true,
    });
    updatePrefs({ marketingEmails: draft.marketing, newDropAlerts: draft.marketing });
    // Record the guest order into the new account's history (mock).
    placeOrder({
      lines: order.lines,
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      total: order.total,
      shippingAddressId: addrId || undefined,
      paymentCardId: cardId || undefined,
    });
    // Account == SESH qualified. Seeding effect no-ops (slots now filled).
    setUserState('sesh_qualified');
    clear(); // discard the transient guest draft now that it's persisted
    // Land on the standard, fully-rendered Profile/Account page as a qualified holder
    // (the recorded order appears under order history).
    setNavigating(true);
    router.push('/profile');
  };

  const onSkip = () => {
    clear(); // discard transient guest data — they stay a plain guest
    router.push('/shop');
  };

  return (
    <PageChrome ticker={false}>
      <main className="wrap">
        <div className={styles.head}>
          <div className={styles.check} aria-hidden>
            <i className="fa-solid fa-circle-check" />
          </div>
          <span className={styles.title}>Order confirmed</span>
          <span className={styles.sub}>Confirmation #{order.id}</span>
        </div>

        <section className={styles.grid}>
          {/* ---- Order summary (from the transient snapshot) ---- */}
          <div className={`signup-card ${styles.card}`}>
            <h2 className={styles.cardTitle}>Order summary</h2>
            <ul className={styles.itemList}>
              {order.lines.map((l, i) => (
                <li key={l.wineId + i} className={styles.itemRow}>
                  <span className={styles.itemName}>{l.name}</span>
                  <span className={styles.itemQty}>{l.qty} × {money(l.unitPrice)}</span>
                  <span className={styles.lineTotal}>{money(l.unitPrice * l.qty)}</span>
                </li>
              ))}
            </ul>
            <div className={styles.totals}>
              <div className={styles.row}><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
              <div className={styles.row}><span>Shipping</span><span>{order.shipping === 0 ? 'FREE' : money(order.shipping)}</span></div>
              <div className={styles.row}><span>Tax</span><span>{money(order.tax)}</span></div>
              <div className={styles.grand}><span>Total</span><span>{money(order.total)}</span></div>
            </div>
            <p className={styles.meta}>
              Shipping to {order.shipCity}, {order.shipState} · Charged to {order.cardBrand} •••• {order.cardLast4}
            </p>
          </div>

          {/* ---- Account-creation upsell ---- */}
          <aside className={`signup-card ${styles.card} ${styles.upsell}`}>
            <h2 className={styles.cardTitle}>Save your details</h2>
            <p className={styles.upsellSub}>
              Create an account from this order — we&apos;ll reuse the shipping and payment you
              just entered, and you&apos;ll be <b>SESH qualified</b> instantly.
            </p>
            <label className="check-row">
              <input type="checkbox" checked={createAccount} onChange={(e) => setCreateAccount(e.target.checked)} />
              Create an Account
            </label>
            <input
              className="field"
              type="password"
              placeholder="Choose your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!createAccount}
              autoComplete="new-password"
            />
            <button
              type="button"
              className={`btn-billing ${styles.cta}`}
              onClick={onCreateAccount}
              disabled={!canCreate}
            >
              CREATE ACCOUNT
            </button>
            {createAccount && password.trim().length > 0 && password.trim().length < 4 && (
              <p className={styles.hint}>Password must be at least 4 characters.</p>
            )}
            <button type="button" className={`btn-skip ${styles.cta}`} onClick={onSkip}>
              NO THANKS — KEEP SHOPPING
            </button>
          </aside>
        </section>
      </main>
    </PageChrome>
  );
}
