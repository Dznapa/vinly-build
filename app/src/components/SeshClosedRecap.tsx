'use client';

/* SESH "closing bell" recap — shown when a SESH drop is sold out / closed.
   Pure render of the precomputed SeshRecap (stats come from the data layer,
   getSeshRecap — no price math here). Gracefully omits any missing stat rather
   than showing $0/NaN. Focus trap, ESC closes, keyboard CTA, reduced-motion.

   ⚠️ The notify CTA is a MOCK opt-in (localStorage). Real opt-in must subscribe
   the profile server-side via Klaviyo. */

import { useEffect, useRef, useState } from 'react';
import type { SeshRecap } from '@/data/mock';

const NOTIFY_KEY = 'vinly:seshNotify';

const money = (n: number) => `$${Math.round(n)}`;
const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

export function SeshClosedRecap({ recap, onClose }: { recap: SeshRecap; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    try { if (window.localStorage.getItem(NOTIFY_KEY)) setSubscribed(true); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    cardRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && cardRef.current) {
        const nodes = cardRef.current.querySelectorAll<HTMLElement>('button, a[href]');
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const notify = () => {
    if (subscribed) return;
    // MOCK Klaviyo opt-in — real subscribe must run server-side via Klaviyo.
    try { window.localStorage.setItem(NOTIFY_KEY, '1'); } catch { /* ignore */ }
    setSubscribed(true);
  };

  type Cell = { k: string; v: string; sub?: string; cls: string };
  const cells: Cell[] = ([
    isNum(recap.opened) ? { k: 'OPENED', v: money(recap.opened), sub: 'first print', cls: 'high' } : null,
    isNum(recap.floor) ? { k: 'THE FLOOR', v: money(recap.floor), sub: 'lowest it touched', cls: 'low' } : null,
    recap.soldOutIn ? { k: 'SOLD OUT IN', v: recap.soldOutIn, sub: 'open to close', cls: '' } : null,
    isNum(recap.bottlesMoved)
      ? { k: 'BOTTLES MOVED', v: String(recap.bottlesMoved), sub: isNum(recap.buyers) ? `${recap.buyers} buyers` : undefined, cls: '' }
      : null,
  ] as (Cell | null)[]).filter((c): c is Cell => c !== null);

  return (
    <div className="recap-overlay" role="dialog" aria-modal="true" aria-label={`${recap.wineName} — SESH closed recap`}>
      <div className="recap-card" tabIndex={-1} ref={cardRef}>
        <button type="button" className="recap-x" onClick={onClose} aria-label="Close">
          <i className="fa-solid fa-xmark" aria-hidden />
        </button>

        <div className="recap-head">
          <div className="recap-head-l">
            <span className="recap-ticker">{recap.ticker}</span>
            <span className="recap-wine">{recap.wineName}</span>
          </div>
        </div>

        <div className="recap-hero">
          <div className="recap-status"><span className="recap-status-dot" aria-hidden /> SESH CLOSED</div>
          <div className="recap-eye">SETTLED AT</div>
          <div className="recap-settle">{money(recap.settled)}</div>
          {isNum(recap.msrpSavingsPct) && recap.msrpSavingsPct > 0 && (
            <div className="recap-save">▼ {recap.msrpSavingsPct}% under MSRP</div>
          )}
        </div>

        {cells.length > 0 && (
          <div className="recap-grid">
            {cells.map((c) => (
              <div className="recap-cell" key={c.k}>
                <div className="recap-k">{c.k}</div>
                <div className={`recap-v${c.cls ? ` ${c.cls}` : ''}`}>{c.v}</div>
                {c.sub && <div className="recap-csub">{c.sub}</div>}
              </div>
            ))}
          </div>
        )}

        <div className="recap-tape">
          <p>
            {isNum(recap.floor) && <><b>The floor hit {money(recap.floor)}.</b>{' '}</>}
            {isNum(recap.payingAttention) && (
              <><span className="recap-float">{recap.payingAttention} people</span> were paying attention.<br /></>
            )}
            The rest paid more. The tape doesn’t wait.
          </p>
        </div>

        <div className="recap-next">
          <div className="recap-next-eye">NEXT SESH</div>
          <div className="recap-when">{recap.nextSeshWhen}</div>
          {recap.nextSeshHint && <div className="recap-hint">{recap.nextSeshHint}</div>}
        </div>

        <div className="recap-ctas">
          <button
            type="button"
            className={`recap-btn${subscribed ? ' is-confirmed' : ''}`}
            onClick={notify}
            disabled={subscribed}
          >
            {subscribed
              ? <><i className="fa-solid fa-check" aria-hidden /> YOU’RE ON THE LIST</>
              : <>NOTIFY ME WHEN IT OPENS&nbsp;&nbsp;→</>}
          </button>
        </div>

        <div className="recap-foot">
          <i>Floor Report filed by the <span className="recap-byline">Hog Trapper</span>. Instinct wins. Hesitation loses.</i>
        </div>
      </div>
    </div>
  );
}

export default SeshClosedRecap;
