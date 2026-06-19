'use client';

/* Ticker — CSS marquee of rare, limited bottles with LIVE pricing. Each wine's
   price fluctuates between 30% and 70% off MSRP on a tick (as dynamic as the
   SESH), with a ▲/▼ direction caret and a brief flash on change. Cards anchor the
   live price to MSRP with a loud % OFF + Bottles Left, a labeled quick-add, and a
   dismissable first-visit line. The whole tile is clickable to buy. Duplicated for
   a seamless loop; hover pauses; chevrons nudge.

   PROTOTYPE: the fluctuation is simulated client-side (no server price feed). */

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { TICKER, TICKER_HINT, type TickerWine } from '@/data/mock';
import { useUserState } from '@/context/UserStateContext';
import { useBillingGate } from '@/context/BillingGateContext';
import { useQuickBuy } from './useQuickBuy';
import BottlePlaceholder, { pickVariant } from './BottlePlaceholder';

const HINT_KEY = 'vinly:tickerHint';
const LOW_STOCK = 3;
const LIVE_TICK_MS = 2800;
const OFF_MIN = 0.3; // 30% off → price ceiling
const OFF_MAX = 0.7; // 70% off → price floor
const priceBounds = (msrp: number) => ({ min: msrp * (1 - OFF_MAX), max: msrp * (1 - OFF_MIN) });

type LivePrice = { price: number; dir: number };

export function Ticker({ sticky = true }: { sticky?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [live, setLive] = useState<Record<string, LivePrice>>(() => {
    const m: Record<string, LivePrice> = {};
    for (const w of TICKER) {
      const { min, max } = priceBounds(w.msrp);
      m[w.id] = { price: Math.min(max, Math.max(min, w.price)), dir: 0 };
    }
    return m;
  });
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

  // Live price feed (mock): random-walk each wine within 30–70% off MSRP.
  useEffect(() => {
    const id = window.setInterval(() => {
      setLive((prev) => {
        const next: Record<string, LivePrice> = {};
        for (const w of TICKER) {
          const { min, max } = priceBounds(w.msrp);
          const cur = prev[w.id]?.price ?? w.price;
          const step = (Math.random() - 0.5) * (max - min) * 0.22;
          let np = cur + step;
          if (np < min) np = min;
          else if (np > max) np = max;
          next[w.id] = { price: np, dir: np > cur + 0.01 ? 1 : np < cur - 0.01 ? -1 : 0 };
        }
        return next;
      });
    }, LIVE_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  // Buy action — fired by clicking anywhere on the card OR the + button.
  const buy = (w: TickerWine) => {
    dismissHint();
    // Not billing-verified → billing gate popup, not the buy flow.
    if (userState !== 'sesh_qualified') { openGate(); return; }
    const price = Math.round(live[w.id]?.price ?? w.price);
    openQuickBuy({ id: w.id, name: w.name, region: w.region, price, image: w.image, msrp: w.msrp });
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
            const lp = live[w.id] ?? { price: w.price, dir: 0 };
            const price = Math.round(lp.price);
            const off = w.msrp > 0 ? Math.round(((w.msrp - lp.price) / w.msrp) * 100) : null;
            const low = w.left <= LOW_STOCK;
            return (
              <div className="slide ticker-card" key={`${w.id}-${i}`} onClick={() => buy(w)}>
                {w.image ? (
                  <Image src={w.image} alt="" width={54} height={76} unoptimized loading="lazy" />
                ) : (
                  <BottlePlaceholder name={w.name} variant={pickVariant(w.name, w.sub)} width={54} height={76} />
                )}
                <div className="tc-body">
                  <div className="tc-name">{w.name}</div>
                  <div className="tc-sub">{w.region} · {w.sub}</div>
                  <div className="tc-pricerow">
                    <span className="tc-price" key={price}>${price}</span>
                    {lp.dir !== 0 && (
                      <span className={`tc-caret ${lp.dir > 0 ? 'is-up' : 'is-down'}`} aria-hidden>
                        {lp.dir > 0 ? '▲' : '▼'}
                      </span>
                    )}
                    {w.msrp > price && <span className="tc-was">was ${w.msrp.toFixed(0)}</span>}
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
                      onClick={(e) => { e.stopPropagation(); buy(w); }}
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
