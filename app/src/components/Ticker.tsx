'use client';

/* Ticker — rebuilt per /spec/ASSETS.md as a CSS marquee:
     .slider > .slide-track > .slide
   .slide-track animates translateX(0 → -50%) over 40s linear infinite. Cards
   are duplicated so the loop is seamless. Hover pauses. iOS-safe (transform
   animation only). Chevrons nudge the offset via inline transform. */

import Image from 'next/image';
import { useRef, useState } from 'react';
import { TICKER } from '@/data/mock';
import { useQuickBuy } from './useQuickBuy';
import BottlePlaceholder, { pickVariant } from './BottlePlaceholder';

export function Ticker({ sticky = true }: { sticky?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const { open: openQuickBuy, popover } = useQuickBuy('ticker');

  // Chevrons nudge a CSS variable that offsets the animated track.
  const nudge = (dx: number) => {
    offsetRef.current += dx;
    if (trackRef.current) {
      trackRef.current.style.setProperty('--nudge', `${offsetRef.current}px`);
    }
  };

  const cards = [...TICKER, ...TICKER]; // duplicated for seamless loop

  return (
    <div
      className={`slider${sticky ? ' ticker-sticky' : ''}${paused ? ' is-paused' : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <button
        type="button"
        className="ticker-chevron left"
        onClick={() => nudge(300)}
        aria-label="Scroll ticker left"
      >
        <i className="fa-solid fa-angle-left" aria-hidden />
      </button>

      <div className="slide-track" ref={trackRef}>
        {cards.map((w, i) => (
          <div className="slide ticker-card" key={`${w.id}-${i}`}>
            {w.image ? (
              <Image
                src={w.image}
                alt=""
                width={46}
                height={64}
                unoptimized
                loading="lazy"
              />
            ) : (
              <BottlePlaceholder
                name={w.name}
                variant={pickVariant(w.name, w.sub)}
                width={46}
                height={64}
              />
            )}
            <div className="tc-body">
              <div className="tc-name">{w.name}</div>
              <div className="tc-sub">
                {w.region}
                <br />
                {w.sub}
              </div>
              <div className="tc-foot">
                <span className="tc-left">
                  Bottles Left: <b>{w.left}</b>
                </span>
                <button
                  type="button"
                  className="tc-add"
                  aria-label={`Quick add ${w.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openQuickBuy({
                      id: w.id,
                      name: w.name,
                      region: w.region,
                      price: 0,
                      image: w.image,
                    });
                  }}
                >
                  <i className="fa-solid fa-plus" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="ticker-chevron right"
        onClick={() => nudge(-300)}
        aria-label="Scroll ticker right"
      >
        <i className="fa-solid fa-angle-right" aria-hidden />
      </button>
      {popover}
    </div>
  );
}
