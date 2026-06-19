'use client';

/* Ticker — CSS marquee of rare, limited bottles at FIXED prices (Branch B:
   scarcity-driven, not live-moving). Each card anchors its discounted price to
   MSRP with a loud % OFF + Bottles Left, a labeled quick-add, and a dismissable
   first-visit orientation line. Cards are duplicated for a seamless loop; hover
   pauses; chevrons nudge. */

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { TICKER, TICKER_HINT, tickerOffPct } from '@/data/mock';
import { useUserState } from '@/context/UserStateContext';
import { useBillingGate } from '@/context/BillingGateContext';
import { useQuickBuy } from './useQuickBuy';
import BottlePlaceholder, { pickVariant } from './BottlePlaceholder';

const HINT_KEY = 'vinly:tickerHint';
const LOW_STOCK = 3;

export function Ticker({ sticky = true }: { sticky?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const { userState } = useUserState();
  const { openGate } = useBillingGate();
  const { open: openQuickBuy, popover } = useQuickBuy('ticker');

  // First-visit orientation line — shown until first interaction / dismiss.
  useEffect(() => {
    try { if (!window.localStorage.getItem(HINT_KEY)) setHintShown(true); } catch { /* ignore */ }
  }, []);
  const dismissHint = () => {
    try { window.localStorage.setItem(HINT_KEY, '1'); } catch { /* ignore */ }
    setHintShown(false);
  };

  // Chevrons nudge a CSS variable that offsets the animated track.
  const nudge = (dx: number) => {
    offsetRef.current += dx;
    if (trackRef.current) {
      trackRef.current.style.setProperty('--nudge', `${offsetRef.current}px`);
    }
  };

  // Duplicate the list enough that the strip always overflows the viewport; an
  // even count keeps the -50% keyframe recycling seamlessly.
  const cards = [...TICKER, ...TICKER, ...TICKER, ...TICKER];

  return (
    <>
      {hintShown && (
        <div className="ticker-hint">
          <i className="fa-solid fa-circle-info" aria-hidden />
          <span>{TICKER_HINT}</span>
          <button type="button" className="ticker-hint-x" onClick={dismissHint} aria-label="Dismiss">
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        </div>
      )}
      <div
        className={`slider${sticky ? ' ticker-sticky' : ''}${paused ? ' is-paused' : ''}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <button type="button" className="ticker-chevron left" onClick={() => nudge(300)} aria-label="Scroll ticker left">
          <i className="fa-solid fa-angle-left" aria-hidden />
        </button>

        <div className="slide-track" ref={trackRef}>
          {cards.map((w, i) => {
            const off = tickerOffPct(w);
            const low = w.left <= LOW_STOCK;
            return (
              <div className="slide ticker-card" key={`${w.id}-${i}`}>
                {w.image ? (
                  <Image src={w.image} alt="" width={54} height={76} unoptimized loading="lazy" />
                ) : (
                  <BottlePlaceholder name={w.name} variant={pickVariant(w.name, w.sub)} width={54} height={76} />
                )}
                <div className="tc-body">
                  <div className="tc-name">{w.name}</div>
                  <div className="tc-sub">{w.region} · {w.sub}</div>
                  <div className="tc-pricerow">
                    <span className="tc-price">${w.price.toFixed(0)}</span>
                    {w.msrp > w.price && <span className="tc-was">was ${w.msrp.toFixed(0)}</span>}
                    {off !== null && <span className="tc-off">{off}% OFF</span>}
                  </div>
                  <div className="tc-foot">
                    <span className={`tc-left${low ? ' is-low' : ''}`}>
                      Bottles Left <b>{w.left}</b>
                    </span>
                    <button
                      type="button"
                      className="tc-add"
                      aria-label={`Add ${w.name} to cart — limited stock`}
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissHint();
                        // Not billing-verified → billing gate popup, not the buy flow.
                        if (userState !== 'sesh_qualified') { openGate(); return; }
                        openQuickBuy({
                          id: w.id,
                          name: w.name,
                          region: w.region,
                          price: w.price,
                          image: w.image,
                          msrp: w.msrp,
                        });
                      }}
                    >
                      <i className="fa-solid fa-plus" aria-hidden />
                      <span className="tc-add-tip" aria-hidden>Add to cart</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button type="button" className="ticker-chevron right" onClick={() => nudge(-300)} aria-label="Scroll ticker right">
          <i className="fa-solid fa-angle-right" aria-hidden />
        </button>
        {popover}
      </div>
    </>
  );
}
