'use client';

/* /customer-cart — 2-column layout when the cart has items (Items panel left,
   sticky Order Summary right). Empty state matches the live-site observation:
   centered "CART" white title, white panel with Item | Title | Quantity | Total
   header row, "Your cart is waiting — add some wines to fill it up!" copy,
   gray KEEP SHOPPING button bottom-right.
   Tax row (8.25%) included in Order Summary — flag NEEDS REVIEW for the rate. */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageChrome } from '@/components/PageChrome';
import { useCart, FREE_SHIP_THRESHOLD, SHIPPING_RATE } from '@/context/CartContext';
import { useCartShipping } from '@/context/CartShippingContext';
import { splitOrderTotals } from '@/lib/cartTotals';
import { SESH_COPY } from '@/lib/seshCopy';
import { SHOP, type ShopWine } from '@/data/mock';
import { useToast } from '@/components/ToastProvider';
import { WineCard } from '@/components/WineCard';
import BottlePlaceholder, { pickVariant } from '@/components/BottlePlaceholder';
import styles from './cart.module.css';

// Per-line source label. SESH/Ticker lines are already-purchased reservations (lead with
// "Already purchased", settlement as fine print — see SESH_COPY); adjustable Shop/Spotlight
// lines show their section. Falls back to "Shop purchase" for legacy items with no source.
const SOURCE_LABEL: Record<string, string> = {
  sesh: SESH_COPY.lineNote,
  ticker: SESH_COPY.lineNote,
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

// Editable heading + subline for the below-cart quick-add section (market voice).
const QUICK_ADD_HEADLINE = 'Buy the dip.';
const QUICK_ADD_SUBLINE = 'Three picks from the floor. Six bottles ship free.';

/* Pick up to n random in-stock shop wines, excluding anything already in the cart
   (excludeIds) and preferring not to repeat the currently shown set (avoidIds). */
function pickRandomWines(n: number, excludeIds: Set<string>, avoidIds: Set<string>): ShopWine[] {
  const pool = SHOP.filter((w) => w.stock && !excludeIds.has(w.id));
  const preferred = pool.filter((w) => !avoidIds.has(w.id));
  const base = preferred.length >= n ? preferred : pool;
  const arr = [...base];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

/* "Add more wines now" — three random shop wines below the cart, rendered with the
   SAME shop <WineCard> tile so they're visually identical. Excludes anything already
   in the cart; a Refresh button reshuffles (preferring a fresh set). Adding goes
   through WineCard's own addItem(source:'shop') path — no special-casing. The picks
   are seeded and backfilled from cart changes so three keep showing and a just-added
   wine drops out. */
function QuickAddSection() {
  const { items, hydrated } = useCart();
  const cartIds = useMemo(() => new Set(items.map((i) => i.wineId)), [items]);
  const [picks, setPicks] = useState<ShopWine[]>([]);
  const [reshuffling, setReshuffling] = useState(false);

  // Seed + backfill: after hydration, and whenever the cart changes (e.g. a tile was
  // added), drop any pick now in the cart and top back up to three eligible wines.
  // Seeding here (not at initial render) keeps SSR/client output matched and never
  // seeds an in-cart wine.
  useEffect(() => {
    if (!hydrated) return;
    setPicks((prev) => {
      const kept = prev.filter((p) => !cartIds.has(p.id));
      if (kept.length >= 3) return kept.length === prev.length ? prev : kept.slice(0, 3);
      const exclude = new Set<string>([...cartIds, ...kept.map((p) => p.id)]);
      const extra = pickRandomWines(3 - kept.length, exclude, new Set());
      return [...kept, ...extra];
    });
  }, [cartIds, hydrated]);

  const reshuffle = () => {
    setReshuffling(true);
    const avoid = new Set(picks.map((p) => p.id));
    window.setTimeout(() => {
      setPicks(pickRandomWines(3, cartIds, avoid));
      setReshuffling(false);
    }, 350);
  };

  // Never show a wine that's in the cart, even if state lags a tick.
  const shown = picks.filter((p) => !cartIds.has(p.id)).slice(0, 3);
  const anyEligible = SHOP.some((w) => w.stock && !cartIds.has(w.id));
  if (hydrated && !anyEligible) return null; // shop fully in cart → nothing to add

  return (
    <section className={styles.quickAdd} aria-label="Add more wines">
      <div className={styles.quickAddHead}>
        <div className={styles.quickAddTitles}>
          <h2 className={styles.quickAddTitle}>{QUICK_ADD_HEADLINE}</h2>
          <p className={styles.quickAddSub}>{QUICK_ADD_SUBLINE}</p>
        </div>
        <button
          type="button"
          className={styles.reshuffle}
          onClick={reshuffle}
          disabled={reshuffling}
          aria-label="Show a different set of wines"
        >
          <i className={`fa-solid fa-arrows-rotate${reshuffling ? ' fa-spin' : ''}`} aria-hidden /> Refresh
        </button>
      </div>
      {/* Same `.grid` (3-across) + `.wine-card` tiles as the Shop page. */}
      <div className="grid">
        {reshuffling
          ? [0, 1, 2].map((i) => <div key={i} className={styles.quickTileSkeleton} aria-hidden />)
          : shown.map((w) => <WineCard key={w.id} wine={w} />)}
      </div>
    </section>
  );
}

export default function CustomerCartPage() {
  const router = useRouter();
  const { items, setQty, removeItem, count } = useCart();
  const { address: shipAddr, locked: shipLocked } = useCartShipping();
  const { push: toast } = useToast();

  // The Order Summary shows only what's DUE NOW. SESH/Ticker quick-buys are already
  // purchased (locked) and settle at window close, so they're excluded from
  // subtotal / tax / total — same split the Billing & Shipping page uses. Free
  // shipping is still assessed against the WHOLE cart's bottle count (already-
  // purchased bottles help unlock it), which splitOrderTotals handles internally.
  const split = useMemo(() => splitOrderTotals(items), [items]);
  const { subtotal, shipping, tax, total: grandTotal } = split.dueNow;
  const freeShip = shipping === 0 && subtotal > 0;

  const hasItems = items.length > 0;
  // Adjustable = Shop/Winemaker Spotlight (not locked). Committed dynamic = SESH/Ticker
  // (locked, settle at window close). Only show the billing CTA when there's something
  // to actually check out; a cart of only committed wines reverts to "Keep Shopping".
  const hasAdjustable = split.hasStandard;

  // Savings vs MSRP — on the DUE-NOW (standard) items only, so it stays consistent
  // with the due-now total shown beside it.
  const savings = useMemo(
    () =>
      items
        .filter((i) => !i.locked)
        .reduce(
          (sum, item) => sum + (item.msrp ? Math.max(0, item.msrp - item.unitPrice) * item.qty : 0),
          0,
        ),
    [items],
  );

  const handleRemove = (lineId: string, name: string) => {
    removeItem(lineId);
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
                    <div className={styles.row} key={item.lineId}>
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
                              onClick={() => handleRemove(item.lineId, item.name)}
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
                              <i className="fa-solid fa-circle-check" aria-hidden /> {SESH_COPY.badge}
                            </span>
                          </div>
                        ) : (
                          <div className="stepper">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() => setQty(item.lineId, clampQty(item.qty - 1))}
                            >
                              &minus;
                            </button>
                            <span className="qty">{item.qty}</span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => setQty(item.lineId, clampQty(item.qty + 1))}
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
                <span>{split.hasReserved ? 'Due now' : 'Total'}</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
              {split.hasReserved && (
                <div className={styles.reservedNote}>
                  {split.reserved.bottles} already-purchased bottle{split.reserved.bottles === 1 ? '' : 's'} settle at window close — not part of this total.
                </div>
              )}
              {savings > 0 && (
                <div className={styles.savedRow}>
                  You&apos;re saving <b>${savings.toFixed(2)}</b> vs MSRP.
                </div>
              )}
              {/* Cart-wide shipping destination (single source of truth). Read-only
                  here; while locked the whole cart ships to this one address. */}
              {shipAddr && (
                <div className={styles.shipToRow}>
                  <i className="fa-solid fa-location-dot" aria-hidden />{' '}
                  Shipping to: {shipAddr.label} — {shipAddr.city}, {shipAddr.state} {shipAddr.zip}
                  {shipLocked && <span className={styles.shipToLock}> · <i className="fa-solid fa-lock" aria-hidden /> locked</span>}
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
              {hasAdjustable && (
                <div className={styles.freeShipNote}>
                  {freeShip
                    ? '🎉 You unlocked FREE ground shipping!'
                    : `Just ${FREE_SHIP_THRESHOLD - count} more bottle${FREE_SHIP_THRESHOLD - count === 1 ? '' : 's'} unlocks FREE shipping — otherwise it's a $${SHIPPING_RATE.toFixed(2)} flat rate.`}
                </div>
              )}
            </aside>
          )}
        </div>

        {/* Below the cart: quick-add three random shop wines without leaving the page. */}
        <QuickAddSection />
      </main>
    </PageChrome>
  );
}
