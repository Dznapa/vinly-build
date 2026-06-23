'use client';

/* /checkout/summary — Order Summary (itemized) page.
   NEEDS REVIEW: built from spec only — no screenshot/prototype HTML exists.
   Consumes ?orderId=… and renders the placed order from ProfileContext. */

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageChrome } from '@/components/PageChrome';
import { useProfile } from '@/context/ProfileContext';
import { SHOP, FALLBACK_BOTTLE } from '@/data/mock';
import styles from './summary.module.css';

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

export default function OrderSummaryPage() {
  return (
    <Suspense
      fallback={
        <PageChrome ticker={false}>
          <main className="wrap">
            <div className={styles.confirmHead}>
              <div className={styles.confirmSub}>Loading…</div>
            </div>
          </main>
        </PageChrome>
      }
    >
      <OrderSummaryInner />
    </Suspense>
  );
}

function OrderSummaryInner() {
  const params = useSearchParams();
  const orderId = params.get('orderId') ?? '';
  const { getOrder, addresses, cards, hydrated } = useProfile();

  const order = orderId ? getOrder(orderId) : undefined;

  // Wait for ProfileContext to hydrate before deciding the order is missing
  // (otherwise refresh-on-summary briefly shows the empty state).
  if (!hydrated) {
    return (
      <PageChrome ticker={false}>
        <main className="wrap">
          <div className={styles.confirmHead}>
            <div className={styles.confirmSub}>Loading…</div>
          </div>
        </main>
      </PageChrome>
    );
  }

  if (!order) {
    return (
      <PageChrome ticker={false}>
        <main className="wrap">
          <div className={styles.confirmHead}>
            <div className={styles.confirmTitle}>
              <span>No order to display.</span>
            </div>
            <div className={styles.confirmSub}>
              {orderId
                ? `We couldn't find an order with id ${orderId}.`
                : 'Place an order from your cart to see it here.'}
            </div>
          </div>
          <section className="shop-panel">
            <div className={styles.actions}>
              <Link href="/shop" className="btn-billing">
                GO TO SHOP
              </Link>
            </div>
          </section>
        </main>
      </PageChrome>
    );
  }

  const shippingAddress = order.shippingAddressId
    ? addresses.find((a) => a.id === order.shippingAddressId)
    : undefined;
  const paymentCard = order.paymentCardId
    ? cards.find((c) => c.id === order.paymentCardId)
    : undefined;

  return (
    <PageChrome ticker={false}>
      <main className="wrap">
        <div className={styles.confirmHead}>
          <div className={styles.confirmTitle}>
            <svg
              className={styles.check}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="11" fill="#0EAD25" />
              <path
                d="M7 12.5 L10.5 16 L17 9"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Order Confirmed</span>
          </div>
          <div className={styles.confirmSub}>
            Confirmation #{order.id}
          </div>
        </div>

        <section className="shop-panel">
          <div className={styles.summaryCard}>
            <h2 className={styles.cardTitle}>Order Summary</h2>

            <ul className={styles.itemList}>
              {order.lines.map((line, i) => {
                const wine = SHOP.find((w) => w.id === line.wineId);
                const img = wine?.image ?? FALLBACK_BOTTLE;
                const lineTotal = line.unitPrice * line.qty;
                return (
                  <li key={`${line.wineId}-${i}`} className={styles.itemRow}>
                    <div className={styles.thumb}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className={styles.thumbImg} loading="lazy" />
                    </div>
                    <div className={styles.itemBody}>
                      <div className={styles.itemName}>{line.name}</div>
                      <div className={styles.itemQty}>
                        {line.qty} &times; {money(line.unitPrice)}
                      </div>
                    </div>
                    <div className={styles.lineTotal}>{money(lineTotal)}</div>
                  </li>
                );
              })}
            </ul>

            <div className={styles.totals}>
              <div className={styles.totalsRow}>
                <span>Subtotal</span>
                <span>{money(order.subtotal)}</span>
              </div>
              <div className={styles.totalsRow}>
                <span>Shipping</span>
                {order.shipping === 0 ? (
                  <span className={styles.freeShip}>FREE</span>
                ) : (
                  <span>{money(order.shipping)}</span>
                )}
              </div>
              <div className={styles.totalsRow}>
                <span>Tax (8.25%)</span>
                <span>{money(order.tax)}</span>
              </div>
              <div className={`${styles.totalsRow} ${styles.totalsGrand}`}>
                <span>Total</span>
                <span>{money(order.total)}</span>
              </div>
            </div>

            {(shippingAddress || paymentCard) && (
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 14,
                  borderTop: '1px solid #f0f1f3',
                  color: '#666',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {shippingAddress && (
                  <div>Shipping to {shippingAddress.line1}</div>
                )}
                {paymentCard && (
                  <div>
                    Charged to {paymentCard.brand} •••• {paymentCard.last4}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <Link href="/shop" className="btn-skip">
              KEEP SHOPPING
            </Link>
            <Link href="/profile/orders" className="btn-billing">
              VIEW ORDER HISTORY
            </Link>
          </div>
        </section>
      </main>
    </PageChrome>
  );
}
