'use client';

/* Shop page — mirrors /spec/prototype/index.html + renderShop() in app.js.
   Uses class names already defined in globals.css; do not redefine. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { PageChrome } from '@/components/PageChrome';
import { IconFunnel, IconSearch } from '@/components/Icons';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ToastProvider';
import { SHOP, WINES_COUNT, type ShopWine } from '@/data/mock';
import BottlePlaceholder, { pickVariant } from '@/components/BottlePlaceholder';
import styles from './shop.module.css';

function clampQty(n: number) {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 99) return 99;
  return n;
}

type SortKey =
  | 'default'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'off-desc'
  | 'off-asc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'name-asc', label: 'Name: A → Z' },
  { key: 'off-desc', label: '% Off: Most' },
  { key: 'off-asc', label: '% Off: Least' },
  { key: 'default', label: 'Default' },
];

function WineCard({ wine }: { wine: ShopWine }) {
  const { addItem } = useCart();
  const { push: toast } = useToast();
  const [qty, setQty] = useState<number>(1);
  const [added, setAdded] = useState(false);

  const countryLines = wine.country ? wine.country.split('\n') : [];
  const variant = wine.isPack ? 'pack' : pickVariant(wine.name, wine.maker);

  const handleAdd = () => {
    // Blocked (not billing-verified) → the billing gate popup is shown; bail
    // out so we don't fake an "added" state or toast.
    if (!addItem({ wineId: wine.id, name: wine.name, unitPrice: wine.price, image: wine.image, msrp: wine.msrp, meta: wine.maker }, qty)) return;
    setAdded(true);
    const label = qty === 1 ? '1 bottle' : `${qty} bottles`;
    toast({
      kind: 'success',
      message: `${label} of ${wine.name} added to cart.`,
    });
    setQty(1);
    window.setTimeout(() => setAdded(false), 1100);
  };

  return (
    <div className="wine-card">
      <div className="bottle">
        {wine.image ? (
          /* Raw <img> + CSS bounds so Commerce7 photos (≈1:3.6 aspect) stay
             proportional instead of being squashed into a fixed 90×200 box. */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={wine.image} alt={wine.name} loading="lazy" />
        ) : (
          <BottlePlaceholder name={wine.name} variant={variant} width={90} height={200} />
        )}
      </div>
      <div className="info">
        <h3>{wine.name}</h3>
        <div className="meta">
          {wine.maker}
          <br />
          {countryLines.map((line, i) => (
            <span key={i}>
              {line}
              <br />
            </span>
          ))}
          {wine.size}
        </div>
        <div className="price">${wine.price.toFixed(2)}</div>
        <div className="msrp">
          ( {wine.off.toFixed(2)}% Off MSRP ) <s>${wine.msrp.toFixed(2)}</s>
        </div>
        {wine.stock ? (
          <div className="controls">
            <div className="stepper">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => clampQty(q - 1))}
              >
                &minus;
              </button>
              <span className="qty">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => clampQty(q + 1))}
              >
                +
              </button>
            </div>
            <button
              type="button"
              className={`btn-cart${added ? ' is-added' : ''}`}
              onClick={handleAdd}
              disabled={added}
            >
              {added ? 'ADDED ✓' : 'ADD TO CART'}
            </button>
          </div>
        ) : (
          <div className="out-of-stock">OUT OF STOCK</div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [sortOpen, setSortOpen] = useState(false);
  const sortWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: "/" focuses the search box (skip when typing in inputs).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== '/') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return;
      }
      e.preventDefault();
      searchInputRef.current?.focus();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close sort menu on outside click / Esc.
  useEffect(() => {
    if (!sortOpen) return;
    function onDocClick(e: MouseEvent) {
      if (
        sortWrapRef.current &&
        !sortWrapRef.current.contains(e.target as Node)
      ) {
        setSortOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSortOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [sortOpen]);

  // Filter then sort, so SEARCH and SORT compose.
  const filteredSorted = useMemo(() => {
    const q = (submittedQuery || query).trim().toLowerCase();
    const filtered = q
      ? SHOP.filter(
          (w) =>
            w.name.toLowerCase().includes(q) ||
            w.maker.toLowerCase().includes(q),
        )
      : SHOP;

    if (sortKey === 'default') return filtered;

    const arr = [...filtered];
    switch (sortKey) {
      case 'price-asc':
        arr.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        arr.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'off-desc':
        arr.sort((a, b) => b.off - a.off);
        break;
      case 'off-asc':
        arr.sort((a, b) => a.off - b.off);
        break;
    }
    return arr;
  }, [query, submittedQuery, sortKey]);

  const winesCount =
    query.trim() || submittedQuery.trim() ? filteredSorted.length : WINES_COUNT;

  const activeSortLabel =
    sortKey === 'default'
      ? null
      : SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? null;

  return (
    <PageChrome>
      <main className="wrap">
        <div className="shop-hero">
          {/* Branch B headline — scarcity, not price-movement. Editable copy (final TBD). */}
          <div className="l1">&uarr; DEEP CUTS. ALMOST GONE. &uarr;</div>
          <div className="l2">&darr; FIXED PRICES. DEEP CUTS. &darr;</div>
        </div>

        <div className="search-row">
          <div className={`sort-wrap ${styles.sortWrap}`} ref={sortWrapRef}>
            <button
              type="button"
              className="sort"
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              onClick={() => setSortOpen((o) => !o)}
            >
              <IconFunnel /> SORT
              {activeSortLabel && (
                <span className={styles.sortActive}>
                  &middot; {activeSortLabel}
                </span>
              )}
            </button>
            {sortOpen && (
              <div className={styles.sortMenu} role="listbox">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    role="option"
                    aria-selected={sortKey === opt.key}
                    className={`${styles.sortItem} ${
                      sortKey === opt.key ? styles.sortItemActive : ''
                    }`}
                    onClick={() => {
                      setSortKey(opt.key);
                      setSortOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="search-box">
            <IconSearch />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search wines…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setSubmittedQuery(query);
              }}
            />
          </div>
          <button
            type="button"
            className="btn-search"
            onClick={() => setSubmittedQuery(query)}
          >
            SEARCH
          </button>
          <span className="wines-count">WINES : {winesCount}</span>
        </div>

        <section className="shop-panel">
          <div className="grid">
            {filteredSorted.map((wine) => (
              <WineCard key={wine.id} wine={wine} />
            ))}
          </div>
        </section>
      </main>
    </PageChrome>
  );
}
