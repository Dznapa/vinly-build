'use client';

/* /profile/orders — Order history with collapsible rows.
   Reads useProfile().orders (already sorted newest first by ProfileContext).
   Each row collapses by default; expanded shows line items + the
   subtotal/shipping/tax/total breakdown. */

import { useState } from 'react';
import Link from 'next/link';
import { PageChrome } from '@/components/PageChrome';
import { useProfile, type Order } from '@/context/ProfileContext';
import styles from './orders.module.css';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const yy = String(d.getFullYear()).slice(-2);
  return `${m}.${day}.${yy}`;
}

function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`;
}

const STATUS_LABEL: Record<Order['status'], string> = {
  placed: 'Placed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_CLASS: Record<Order['status'], string> = {
  placed: styles.pillPlaced,
  shipped: styles.pillShipped,
  delivered: styles.pillDelivered,
  cancelled: styles.pillCancelled,
};

function OrderRow({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.row}>
      <button
        type="button"
        className={styles.rowHead}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={styles.rowId}>{order.id}</span>
        <span className={styles.rowDate}>{formatDate(order.date)}</span>
        <span className={`${styles.pill} ${STATUS_CLASS[order.status]}`}>
          <span className={styles.pillDot} aria-hidden />
          {STATUS_LABEL[order.status]}
        </span>
        <span className={styles.rowTotal}>{formatMoney(order.total)}</span>
        <span className={styles.chev} aria-hidden>
          <i className={`fa-solid ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
        </span>
      </button>

      {open && (
        <div className={styles.rowBody}>
          <div className={styles.lines}>
            {order.lines.map((line, i) => (
              <div key={`${line.wineId}-${i}`} className={styles.lineItem}>
                <span className={styles.lineQty}>{line.qty}</span>
                <span className={styles.lineName}>{line.name}</span>
                <span className={styles.lineUnit}>@ {formatMoney(line.unitPrice)}</span>
                <span className={styles.lineTotal}>
                  {formatMoney(line.qty * line.unitPrice)}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.breakdown}>
            <div className={styles.breakdownRow}>
              <span>Subtotal</span>
              <span>{formatMoney(order.subtotal)}</span>
            </div>
            <div className={styles.breakdownRow}>
              <span>Shipping</span>
              <span>{formatMoney(order.shipping)}</span>
            </div>
            <div className={styles.breakdownRow}>
              <span>Tax</span>
              <span>{formatMoney(order.tax)}</span>
            </div>
            <div className={`${styles.breakdownRow} ${styles.totalRow}`}>
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { orders } = useProfile();

  return (
    <PageChrome ticker={false}>
      <main className="wrap">
        <div className="sesh-title">
          <span className="tag">PROFILE</span> Orders
        </div>

        <section className={styles.list}>
          {orders.length === 0 ? (
            <div className={styles.empty}>
              <p>
                No orders yet.{' '}
                <Link href="/shop" className={styles.shopLink}>
                  Start shopping
                </Link>
              </p>
            </div>
          ) : (
            orders.map((o) => <OrderRow key={o.id} order={o} />)
          )}
        </section>
      </main>
    </PageChrome>
  );
}
