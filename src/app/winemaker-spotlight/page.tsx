'use client';

/* /winemaker-spotlight — matches the live site (vinlywine.com/winemaker-spotlight):
   1. Hero copy "↑ LIVE MARKET ABOVE. DON'T BLINK. ↑ / ↓ HAND-PICKED BY THE MAKER. ↓"
   2. Horizontal carousel of LARGER spotlight tiles (Albert Joly / Domaine
      Huber-Verdereau / Patrice Rion).
   3. "WINEMAKER SPOTLIGHT" h1 + YouTube embed of the featured-maker interview.
   4. Two-column "VINLY'S FEATURED WINEMAKER" intro + multi-paragraph article. */

import { useState } from 'react';
import { PageChrome } from '@/components/PageChrome';
import { useCart } from '@/context/CartContext';
import { WINEMAKER_SPOTLIGHT, type ShopWine } from '@/data/mock';
import BottlePlaceholder, { pickVariant } from '@/components/BottlePlaceholder';
import { MarketDivider, type DividerVariant } from '@/components/MarketDivider';
import styles from './winemaker.module.css';

// Punchy divider pool for non-qualified users (original copy kept as the first
// variant). Rotates per load; SESH-qualified users get the compact label instead.
const SPOTLIGHT_DIVIDERS: DividerVariant[] = [
  { l1: '↑ LIVE MARKET ABOVE. DON’T BLINK. ↑', l2: '↓ HAND-PICKED BY THE MAKER. ↓' },
  { l1: '↑ THE SESH IS UPSTAIRS. ↑', l2: '↓ DOWN HERE, THE MAKER CHOSE. ↓' },
  { l1: '↑ NO TICKER. NO TIMER. ↑', l2: '↓ ONE MAKER. THEIR BEST BOTTLES. ↓' },
  { l1: '↑ CURATED, NOT AUCTIONED. ↑', l2: '↓ HAND-PICKED BY THE MAKER. ↓' },
];

function clampQty(n: number) {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 99) return 99;
  return n;
}

function SpotlightTile({ wine }: { wine: ShopWine }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState<number>(1);
  const [added, setAdded] = useState(false);
  const countryLines = wine.country ? wine.country.split('\n') : [];

  const handleAdd = () => {
    // Blocked (not billing-verified) → billing gate popup shown; bail out.
    if (!addItem({ wineId: wine.id, name: wine.name, unitPrice: wine.price, image: wine.image, msrp: wine.msrp, meta: wine.maker, source: 'spotlight' }, qty)) return;
    setAdded(true);
    setQty(1);
    window.setTimeout(() => setAdded(false), 1100);
  };

  return (
    <article className={`wine-card ${styles.spotlightTile}`}>
      <div className={styles.tileBottle}>
        {wine.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={wine.image} alt={wine.name} className={styles.tileBottleImg} loading="lazy" />
        ) : (
          <BottlePlaceholder
            name={wine.name}
            variant={wine.isPack ? 'pack' : pickVariant(wine.name, wine.maker)}
            width={140}
            height={320}
          />
        )}
      </div>
      <h3 className={styles.tileName}>{wine.name}</h3>
      <div className={styles.tileMeta}>
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
      <div className={styles.tilePrice}>${wine.price.toFixed(2)}</div>
      <div className={styles.tileMsrp}>
        ( {wine.off.toFixed(2)}% Off MSRP ) <s>${wine.msrp.toFixed(2)}</s>
      </div>
      {wine.stock ? (
        <div className={styles.tileControls}>
          <div className="stepper">
            <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => clampQty(q - 1))}>
              &minus;
            </button>
            <span className="qty">{qty}</span>
            <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => clampQty(q + 1))}>
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
    </article>
  );
}

export default function WinemakerSpotlightPage() {
  return (
    <PageChrome>
      <main className="wrap">
        {/* State-aware divider: punchy (rotating) for non-qualified, quiet label for qualified. */}
        <MarketDivider variants={SPOTLIGHT_DIVIDERS} compactLabel="Winemaker Spotlight" storageKey="vinly:spotlightDividerLast" />

        <section className={`shop-panel ${styles.spotlightPanel}`}>
          <div className={styles.spotlightCarousel}>
            {WINEMAKER_SPOTLIGHT.map((w) => (
              <SpotlightTile key={w.id} wine={w} />
            ))}
          </div>
        </section>

        {/* ---- Featured Winemaker ---- */}
        <h2 className={styles.featuredTitle}>WINEMAKER SPOTLIGHT</h2>

        <section className={styles.featuredPanel}>
          <div className={styles.videoFrame}>
            <iframe
              src="https://www.youtube.com/embed/1RyDH8xmehw?rel=0&modestbranding=1"
              title="Jonah Beer — Winemaker: Legacy Without the Lecture"
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div className={styles.featuredGrid}>
            <aside className={styles.featuredAside}>
              <div className={styles.featuredKicker}>VINLY&apos;S FEATURED WINEMAKER</div>
              <h3 className={styles.featuredName}>
                Jonah Beer
                <br />
                Glasswasher. VP. Obsessive.
              </h3>
              <p className={styles.featuredLede}>
                From Stag&apos;s Leap dishwasher to Napa insider — his cellar is the education you never got.
              </p>
            </aside>

            <div className={styles.featuredBody}>
              <p>
                Jonah Beer moved from Indiana to Napa Valley on the strength of one bottle and zero credentials.
                His first job: washing glasses at Stag&apos;s Leap. His next move: running the place. Then 18 years
                as VP at Frog&apos;s Leap. Then founding Pilcrow, buying Gabriel-Glas, and building one of the most
                quietly dangerous wine cellars in the Valley — 500 bottles of old Napa Cab, 500 Burgundy,
                500 Barolo, and one bottle of bubbles for his friend Nicole. This is his Collection.
              </p>
              <p>
                Pilcrow — the ¶ symbol, the oldest mark in written language, meaning <em>new chapter</em> — is the
                wine he and his wife Sara make from mountain vineyards on Mt. Veeder and Howell Mountain. The
                stated goal: make the best Napa Valley Cabernet Sauvignon of the 1950s. Not &quot;inspired by.&quot;
                Not &quot;a nod to.&quot; The actual thing. Lower alcohol, ripping acidity, no irrigation, no till,
                no hedging — do-less farming and do-even-less winemaking. The kind of Cab that makes your mouth
                water before you even lift the glass.
              </p>
              <p>
                But Pilcrow is only part of the story. Through True North Wine Merchants — the boutique import
                operation he and Sara run together — Jonah spends the rest of his time hunting Piedmont and
                Burgundy. Not the obvious stuff. The real stuff. The bottles that somms pass each other like
                contraband. When Jonah brings a collection to the SESH, he&apos;s not promoting. He&apos;s proving a point.
              </p>
              <p>
                Oh, and he owns Gabriel-Glas. The stemware you&apos;re probably already drinking from. Of course he does.
              </p>
            </div>
          </div>
        </section>
      </main>
    </PageChrome>
  );
}
