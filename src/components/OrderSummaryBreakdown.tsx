'use client';

/* OrderSummaryBreakdown — the SHARED two-group order-summary breakdown rendered by
   BOTH the Cart Order Summary panel and the checkout "Consolidated Order Summary",
   so the two are visually identical and stay in sync.

   - "Due now" group: standard (Shop / Winemaker Spotlight) line items, then
     Subtotal (N bottles) / Shipping / Tax (rate) / bold "Due now" total.
   - "Already purchased" group: SESH/Ticker line items with the "Already purchased"
     tag, then the "Already purchased (N bottles)" subtotal + a short note.

   Presentation only — all figures come from the caller's splitOrderTotals result. */

import { type OrderSplit } from '@/lib/cartTotals';
import { type CartItem } from '@/context/CartContext';
import { formatTaxRate } from '@/lib/tax';
import { SESH_COPY } from '@/lib/seshCopy';
import styles from './OrderSummaryBreakdown.module.css';

const money = (n: number) => `$${n.toFixed(2)}`;

export function OrderSummaryBreakdown({
  items,
  split,
  taxRate,
  blockTax = false,
}: {
  items: CartItem[];
  split: OrderSplit;
  taxRate: number;
  /** Billing only: hide Tax + Due-now total for a disallowed destination (block
      before tax). The cart never blocks (its address is always allowlisted). */
  blockTax?: boolean;
}) {
  const standardItems = items.filter((i) => !i.locked);
  const seshItems = items.filter((i) => i.locked);

  return (
    <>
      {/* DUE NOW — standard (Shop / Winemaker Spotlight) items, charged now. */}
      {split.hasStandard && (
        <section className={styles.group}>
          <div className={styles.groupHead}>Due now</div>
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
            {!blockTax && (
              <div className={styles.row}>
                <span>Tax ({formatTaxRate(taxRate)})</span>
                <span>{money(split.dueNow.tax)}</span>
              </div>
            )}
          </div>
          {!blockTax && (
            <div className={styles.totalRow}>
              <span>Due now</span>
              <span>{money(split.dueNow.total)}</span>
            </div>
          )}
        </section>
      )}

      {/* ALREADY PURCHASED — SESH/Ticker reservations, info only. */}
      {split.hasReserved && (
        <section className={styles.group}>
          <div className={styles.groupHead}>{SESH_COPY.groupHead}</div>
          <div className={styles.itemList}>
            {seshItems.map((i) => (
              <div key={i.lineId} className={styles.item}>
                <div className={styles.itemName}>
                  {i.name}
                  <div className={styles.itemMeta}>
                    {i.meta ? `${i.meta} · ` : ''}Qty {i.qty} ·{' '}
                    <span className={styles.reservedTag}>
                      <i className="fa-solid fa-circle-check" aria-hidden /> {SESH_COPY.badge}
                    </span>
                  </div>
                </div>
                <div className={styles.itemPrice}>{money(i.unitPrice * i.qty)}</div>
              </div>
            ))}
          </div>
          <div className={styles.rows}>
            <div className={styles.row}>
              <span>{SESH_COPY.subtotalLabel} ({split.reserved.bottles} bottle{split.reserved.bottles === 1 ? '' : 's'})</span>
              <span>{money(split.reserved.subtotal)}</span>
            </div>
          </div>
          <p className={styles.reservedNote}>
            {split.reserved.bottles} already-purchased bottle{split.reserved.bottles === 1 ? '' : 's'} — not part of this total.
          </p>
        </section>
      )}
    </>
  );
}

export default OrderSummaryBreakdown;
