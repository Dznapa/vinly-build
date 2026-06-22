'use client';

/* /customer-cart — 2-column layout when the cart has items (Items panel left,
   sticky Order Summary right). Empty state matches the live-site observation:
   centered "CART" white title, white panel with Item | Title | Quantity | Total
   header row, "Your cart is waiting — add some wines to fill it up!" copy,
   gray KEEP SHOPPING button bottom-right.
   Tax row (8.25%) included in Order Summary — flag NEEDS REVIEW for the rate. */

import Link from 'next/link';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageChrome } from '@/components/PageChrome';
import { useCart, FREE_SHIP_THRESHOLD, SHIPPING_RATE } from '@/context/CartContext';
import { useToast } from '@/components/ToastProvider';
import BottlePlaceholder, { pickVariant } from '@/components/BottlePlaceholder';
import styles from './cart.module.css';

const TAX_RATE = 0.0825;

// Per-line source label (editable). Committed SESH/Ticker lines are read-only and get
// the "— settles at window close." tail; adjustable Shop/Spotlight lines do not.
// Falls back to the adjustable "Shop purchase" for legacy items with no source.
const SOURCE_LABEL: Record<string, string> = {
  sesh: 'SESH purchase — settles at window close.',
  ticker: 'Ticker purchase — settles at window close.',
  shop: 'Shop purchase',
  spotlight: 'Winemaker Spotlight purchase',
};
const sourceLabel = (source?: string) => SOURCE_LABEL[source ?? 'shop'] ?? 'Shop purchase';

// Primary-CTA labels (editable). When the cart holds ONLY committed SESH/Ticker wines
// (locked, settle at window close) there's nothing to check out, so we swap the billing
// CTA for "Keep Shopping".
const CTA_PROCEED = 'PROCEED TO BILLING & SHIPPING';
const CTA_KEEP_SHOPPING = 'KEEP SHOPPING';

function clampQty(n: number) {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 99) return 99;
  return n;
}

export default function CustomerCartPage() {
  const router = useRouter();
  const { items, setQty, removeItem, count, subtotal, shipping } = useCart();
  const { push: toast } = useToast();
  const freeShip = count >= FREE_SHIP_THRESHOLD && count > 0;
  const tax = useMemo(() => Number((subtotal * TAX_RATE).toFixed(2)), [subtotal]);
  const grandTotal = useMemo(() => Number((subtotal + shipping + tax).toFixed(2)), [subtotal, shipping, tax]);

  const hasItems = items.length > 0;
  // Adjustable = Shop/Winemaker Spotlight (not locked). Committed dynamic = SESH/Ticker
  // (locked, settle at window close). Only show the billing CTA when there's something
  // to actually check out; a cart of only committed wines reverts to "Keep Shopping".
  const hasAdjustable = items.some((i) => !i.locked);

  // How much they're saving vs MSRP — computed across all cart items (snapshot).
  const savings = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.msrp ? Math.max(0, item.msrp - item.unitPrice) * item.qty : 0),
        0,
      ),
    [items],
  );

  const handleRemove = (wineId: string, name: string) => {
    removeItem(wineId);
    toast({ kind: 'info', message: `${name} removed from cart.` });
  };

  return (
    <PageChrome>
      <main className="wrap">
        <h1 className={styles.title}>CART</h1>

        <div className={hasItems ? styles.twoCol : undefined}>
          <section className={styles.cartPanel}>
            <div className={styles.tableHead}>
              <span className={styles.colItem}>Item</span>
              <span className={styles.colTitle}>Title</span>
              <span className={styles.colQty}>Quantity</span>
              <span className={styles.colTotal}>Total</span>
            </div>

            {!hasItems ? (
              <div className={styles.empty}>
                <i className="fa-solid fa-wine-bottle" aria-hidden style={{ fontSize: 36, color: 'var(--orange)', marginBottom: 14 }} />
                <div>Your cart is waiting — add some wines to fill it up!</div>
                <Link href="/shop" className={`btn-billing ${styles.emptyCta}`}>
                  EXPLORE WINES
                </Link>
              </div>
            ) : (
              <div className={styles.rows}>
                {items.map((item) => {
                  const lineTotal = item.unitPrice * item.qty;
                  const variant = pickVariant(item.name, item.meta ?? '');
                  return (
                    <div className={styles.row} key={item.wineId}>
                      <div className={styles.colItem}>
                        {item.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.image} alt={item.name} className={styles.bottleImg} loading="lazy" />
                        ) : (
                          <BottlePlaceholder name={item.name} variant={variant} width={56} height={120} />
                        )}
                      </div>
                      <div className={styles.colTitle}>
                        <div className={styles.itemName}>{item.name}</div>
                        <div className={styles.itemMeta}>
                          {item.meta && <>{item.meta}<br /></>}
                          750ml
                        </div>
                        {item.locked ? (
                          // Committed fill (SESH/Ticker) — read-only, settles at window close.
                          <span className={styles.lockedNote}>
                            <i className="fa-solid fa-circle-check" aria-hidden /> {sourceLabel(item.source)}
                          </span>
                        ) : (
                          // Adjustable (Shop/Winemaker Spotlight) — source label + Remove.
                          <>
                            <span className={styles.sourceNote}>{sourceLabel(item.source)}</span>
                            <button
                              type="button"
                              className={styles.removeBtn}
                              onClick={() => handleRemove(item.wineId, item.name)}
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                      <div className={styles.colQty}>
                        {item.locked ? (
                          <div className={styles.lockedQty}>
                            <span className={styles.lockedQtyNum}>{item.qty}</span>
                            <span className={styles.lockedTag}>
                              <i className="fa-solid fa-lock" aria-hidden /> Locked in
                            </span>
                          </div>
                        ) : (
                          <div className="stepper">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() => setQty(item.wineId, clampQty(item.qty - 1))}
                            >
                              &minus;
                            </button>
                            <span className="qty">{item.qty}</span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => setQty(item.wineId, clampQty(item.qty + 1))}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                      <div className={styles.colTotal}>${lineTotal.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className={styles.panelFoot}>
              <Link href="/shop" className={`btn-skip ${styles.keepShopping}`}>
                KEEP SHOPPING
              </Link>
            </div>
          </section>

          {hasItems && (
            <aside className={`panel detail-panel ${styles.summary}`}>
              <h2>Order Summary</h2>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                {freeShip ? (
                  <span className={styles.shipFree}>FREE</span>
                ) : (
                  <span>${shipping.toFixed(2)}</span>
                )}
              </div>
              <div className={styles.summaryRow}>
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
              {savings > 0 && (
                <div className={styles.savedRow}>
                  You&apos;re saving <b>${savings.toFixed(2)}</b> vs MSRP.
                </div>
              )}
              {hasAdjustable ? (
                <button
                  type="button"
                  className={`btn-billing ${styles.checkoutBtn}`}
                  onClick={() => router.push('/checkout/billing')}
                >
                  {CTA_PROCEED}
                </button>
              ) : (
                // Only committed SESH/Ticker wines → already purchased, no checkout step.
                <Link href="/shop" className={`btn-billing ${styles.checkoutBtn}`}>
                  {CTA_KEEP_SHOPPING}
                </Link>
              )}
              <div className={styles.freeShipNote}>
                {freeShip
                  ? '🎉 You unlocked FREE ground shipping!'
                  : `Just ${FREE_SHIP_THRESHOLD - count} more bottle${FREE_SHIP_THRESHOLD - count === 1 ? '' : 's'} unlocks FREE shipping — otherwise it's a $${SHIPPING_RATE.toFixed(2)} flat rate.`}
              </div>
            </aside>
          )}
        </div>
      </main>
    </PageChrome>
  );
}
