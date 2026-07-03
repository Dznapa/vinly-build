'use client';

/* Shop page — mirrors /spec/prototype/index.html + renderShop() in app.js.
   Uses class names already defined in globals.css; do not redefine. */

import { useEffect, useMemo, useRef, useState } from 'react';
import { PageChrome } from '@/components/PageChrome';
import { IconFunnel, IconSearch } from '@/components/Icons';
import { WineCard } from '@/components/WineCard';
import { SHOP, WINES_COUNT } from '@/data/mock';
import styles from './shop.module.css';

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
