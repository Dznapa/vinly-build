'use client';

// NEEDS REVIEW: no screenshot in /spec/screenshots — built from spec only.
/* Winemaker collection detail — built from /spec/BUILD_PROMPT.md spec + the SESH
   page two-column grammar (.sesh-title + .sesh-grid + .panel .ipo-panel + .panel
   .detail-panel) defined in globals.css and /spec/prototype/sesh.html. Bio copy is
   placeholder; confirm against owner's eventual screenshot. */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageChrome } from '@/components/PageChrome';
import { useCart } from '@/context/CartContext';
import { getWinemaker, getWinesForMaker } from '@/data/winemaker';
import type { ShopWine } from '@/data/mock';
import BottlePlaceholder, { pickVariant } from '@/components/BottlePlaceholder';
import styles from '../winemaker.module.css';

function MiniWineCard({ wine }: { wine: ShopWine }) {
  const { addItem } = useCart();
  const countryLines = wine.country ? wine.country.split('\n') : [];
  const variant = wine.isPack ? 'pack' : pickVariant(wine.name, wine.maker);

  return (
    <div className={styles.miniCard}>
      <div className={styles.miniBottle}>
        {wine.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={wine.image} alt={wine.name} className={styles.miniBottleImg} loading="lazy" />
        ) : (
          <BottlePlaceholder name={wine.name} variant={variant} width={70} height={140} />
        )}
      </div>
      <h4 className={styles.miniName}>{wine.name}</h4>
      <div className={styles.miniMeta}>
        {wine.maker}
        {countryLines.length > 0 && '\n'}
        {countryLines.join('\n')}
        {'\n'}
        {wine.size}
      </div>
      <div className={styles.miniPrice}>${wine.price.toFixed(2)}</div>
      {wine.stock ? (
        <button
          type="button"
          className={`btn-cart ${styles.miniBtn}`}
          onClick={() => addItem({ wineId: wine.id, name: wine.name, unitPrice: wine.price, image: wine.image, msrp: wine.msrp, meta: wine.maker }, 1)}
        >
          ADD TO CART
        </button>
      ) : (
        <div className="out-of-stock">OUT OF STOCK</div>
      )}
    </div>
  );
}

export default function WinemakerDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const maker = getWinemaker(params.slug);
  if (!maker) notFound();

  const wines = getWinesForMaker(maker);

  return (
    <PageChrome>
      <main className="wrap">
        <div className="sesh-title">
          <span className="tag">COLLECTION</span> {maker.name.toUpperCase()}
        </div>

        <section className="sesh-grid">
          {/* LEFT: bio panel (navy) */}
          <div className="panel ipo-panel">
            <div className="ipo-head">
              <h2>{maker.name.toUpperCase()}</h2>
              <Link href="/winemaker-spotlight" className="btn-unlock">
                ALL COLLECTIONS
              </Link>
            </div>
            <div className={styles.bioMeta}>
              <div>
                <b>REGION</b> {maker.region}
              </div>
              <div>
                <b>FOUNDED</b> {maker.founded}
              </div>
            </div>
            <p className={styles.bio}>{maker.bio}</p>
            <button type="button" className="btn-unlock">
              READ MORE
            </button>
          </div>

          {/* RIGHT: wines panel (white) */}
          <div className="panel detail-panel">
            <div className={styles.detailGrid}>
              {wines.map((w) => (
                <MiniWineCard key={w.id} wine={w} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </PageChrome>
  );
}
