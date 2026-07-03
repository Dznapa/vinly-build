'use client';

/* WineCard — the shared Shop product tile. Rendered on the Shop page AND the Cart's
   "Add more wines now" quick-add section so the two are visually identical. Uses the
   global `.wine-card` styles; self-contained add-to-cart (source:'shop'). */

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/components/ToastProvider';
import { type ShopWine } from '@/data/mock';
import BottlePlaceholder, { pickVariant } from '@/components/BottlePlaceholder';

function clampQty(n: number) {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 99) return 99;
  return n;
}

export function WineCard({ wine }: { wine: ShopWine }) {
  const { addItem } = useCart();
  const { push: toast } = useToast();
  const [qty, setQty] = useState<number>(1);
  const [added, setAdded] = useState(false);

  const countryLines = wine.country ? wine.country.split('\n') : [];
  const variant = wine.isPack ? 'pack' : pickVariant(wine.name, wine.maker);

  const handleAdd = () => {
    // Blocked (not billing-verified) → the billing gate popup is shown; bail
    // out so we don't fake an "added" state or toast.
    if (!addItem({ wineId: wine.id, name: wine.name, unitPrice: wine.price, image: wine.image, msrp: wine.msrp, meta: wine.maker, source: 'shop' }, qty)) return;
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

export default WineCard;
