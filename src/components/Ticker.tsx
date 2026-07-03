'use client';

/* Ticker — horizontally-scrolling marquee of wine cards, matching the live site.
   Each card: bottle thumb · name (cyan, uppercase, truncated "…") / region /
   varietal+vintage · green price + green "(XX.XX)% OFF" · "Bottles Left: N"
   (orange) · orange "+" quick-add. Cards are duplicated for a seamless loop;
   hover pauses; chevrons nudge. Final per the live site — no motion cues, no
   "was" anchor, no whole-card click, no orientation banner. */

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { TICKER, type TickerWine } from '@/data/mock';
import { liveTickerPrice } from '@/lib/tickerPrice';
import { useUserState } from '@/context/UserStateContext';
import { useBillingGate } from '@/context/BillingGateContext';
import { useQuickBuy } from './useQuickBuy';
import BottlePlaceholder, { pickVariant } from './BottlePlaceholder';

export function Ticker({ sticky = true }: { sticky?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const { userState } = useUserState();
  const { openGate } = useBillingGate();
  const { open: openQuickBuy, popover } = useQuickBuy('ticker');

  // Live prices drift after mount. `now` is null during SSR / first paint so we
  // render the static base price (no hydration mismatch); a mount effect starts
  // the clock and re-samples every few seconds. The CSS marquee is a transform, so
  // re-rendering the numbers never disturbs the scroll.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 4000);
    return () => window.clearInterval(id);
  }, []);
  const priceOf = (w: TickerWine) => (now === null ? w.price : liveTickerPrice(w.price, w.id, now));

  // The "+" quick-buy action: billing gate for non-qualified users. Captures the
  // CURRENT live price (and carries the base) so a later re-lock can re-sample it.
  const buy = (w: TickerWine) => {
    if (userState !== 'sesh_qualified') { openGate(); return; }
    const live = liveTickerPrice(w.price, w.id, Date.now());
    openQuickBuy({ id: w.id, name: w.name, region: w.region, price: live, basePrice: w.price, image: w.image, msrp: w.msrp });
  };

  // Chevrons nudge a CSS variable that offsets the animated track.
  const nudge = (dx: number) => {
    offsetRef.current += dx;
    if (trackRef.current) {
      trackRef.current.style.setProperty('--nudge', `${offsetRef.current}px`);
    }
  };

  const cards = [...TICKER, ...TICKER, ...TICKER, ...TICKER];

  return (
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
          const live = priceOf(w);
          const pct = w.msrp > live ? ((w.msrp - live) / w.msrp) * 100 : null;
          return (
            <div className="slide ticker-card" key={`${w.id}-${i}`}>
              {w.image ? (
                <Image src={w.image} alt="" width={46} height={64} unoptimized loading="lazy" />
              ) : (
                <BottlePlaceholder name={w.name} variant={pickVariant(w.name, w.sub)} width={46} height={64} />
              )}
              <div className="tc-body">
                <div className="tc-main">
                  <div className="tc-name">{w.name}</div>
                  <div className="tc-region">{w.region}</div>
                  <div className="tc-var">{w.sub}</div>
                </div>
                <div className="tc-side">
                  <span className="tc-price">${live.toFixed(2)}</span>
                  {pct !== null && <span className="tc-off">({pct.toFixed(2)})% OFF</span>}
                  <span className="tc-foot">
                    <span className="tc-left">Bottles Left: <b>{w.left}</b></span>
                    <button
                      type="button"
                      className="tc-add"
                      aria-label={`Quick add ${w.name}`}
                      onClick={(e) => { e.stopPropagation(); buy(w); }}
                    >
                      <i className="fa-solid fa-plus" aria-hidden />
                    </button>
                  </span>
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
  );
}
