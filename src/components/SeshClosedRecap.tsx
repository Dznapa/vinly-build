'use client';

/* SESH "closing bell" recap — shown when a SESH drop is sold out / closed.
   Pure render of the precomputed SeshRecap (stats come from the data layer,
   getSeshRecap — no price math here). Gracefully omits any missing stat rather
   than showing $0/NaN. Focus trap, ESC closes, keyboard CTA, reduced-motion.

   ⚠️ The notify CTA is a MOCK opt-in (localStorage). Real opt-in must subscribe
   the profile server-side via Klaviyo. */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserState } from '@/context/UserStateContext';
import type { SeshRecap } from '@/data/mock';

const NOTIFY_KEY = 'vinly:seshNotify';

const money = (n: number) => `$${Math.round(n)}`;
const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

// Editable — generic, brand-voice teasers for the next drop. Must NEVER name a
// specific wine, region, varietal, or producer (offerings change on the fly).
const NEXT_SESH_HINTS: string[] = [
  `If we told you, it wouldn't be a SESH.`,
  `We know what's dropping. You'll find out at noon.`,
  `The kind of bottle people lie about getting in on.`,
  `Set an alarm. Thank us later.`,
  `Big enough that we're staying quiet about it.`,
  `No hints. Just be at the screen when it opens.`,
  `The watchers will eat well. The hesitators will read about it.`,
  `We could tell you. We'd rather watch you find out.`,
  `Something good. Something fast. Something gone by 12:30.`,
  `The kind of drop that makes the group chat go quiet.`,
  `No tasting notes. No scores. Just a number that moves.`,
  `Show up early. The good stuff doesn't announce itself twice.`,
  `One bottle. One window. Don't blink.`,
  `Somebody's going to brag about this one. Might as well be you.`,
  `Worth rearranging your Thursday for.`,
  `The sommeliers will pretend they saw it coming. You'll have the bottle.`,
  `We don't hype. We open the floor and let it speak.`,
  `Loaded and waiting. The rest is up to your reflexes.`,
  `Miss it and you'll hear about it for a week.`,
  `The floor opens at noon. Bring your nerve.`,
];

// One random teaser per recap load; avoids the immediately-previous (sessionStorage).
function NextSeshHint() {
  const [hint, setHint] = useState<string | null>(null);
  useEffect(() => {
    let last = -1;
    try {
      const s = window.sessionStorage.getItem('vinly:nextSeshHint');
      if (s != null) last = Number(s);
    } catch { /* ignore */ }
    let idx = Math.floor(Math.random() * NEXT_SESH_HINTS.length);
    if (NEXT_SESH_HINTS.length > 1) {
      while (idx === last) idx = Math.floor(Math.random() * NEXT_SESH_HINTS.length);
    }
    try { window.sessionStorage.setItem('vinly:nextSeshHint', String(idx)); } catch { /* ignore */ }
    setHint(NEXT_SESH_HINTS[idx]);
  }, []);
  if (!hint) return null;
  return <div className="recap-hint">{hint}</div>;
}

export function SeshClosedRecap({ recap, onClose }: { recap: SeshRecap; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [subscribed, setSubscribed] = useState(false);
  const { userState } = useUserState();
  const router = useRouter();
  // Anonymous visitors can't be "notified" — there's no account to notify. Send
  // them through sign-up first; signed-in users get the (mock) notify opt-in.
  const needsSignup = userState === 'anonymous';

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

  const handleCta = () => {
    if (needsSignup) {
      // No account yet → route into the sign-up flow instead of opting in.
      onClose();
      router.push('/register_details');
      return;
    }
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
          <NextSeshHint />
        </div>

        <div className="recap-ctas">
          <button
            type="button"
            className={`recap-btn${subscribed && !needsSignup ? ' is-confirmed' : ''}`}
            onClick={handleCta}
            disabled={subscribed && !needsSignup}
          >
            {needsSignup
              ? <><i className="fa-solid fa-user-plus" aria-hidden /> SIGN UP TO GET NOTIFIED&nbsp;&nbsp;→</>
              : subscribed
                ? <><i className="fa-solid fa-check" aria-hidden /> YOU’RE ON THE LIST</>
                : <>NOTIFY ME WHEN IT OPENS&nbsp;&nbsp;→</>}
          </button>
          {needsSignup && (
            <p className="recap-cta-note">Create your account to get the next-drop alert.</p>
          )}
        </div>

        <div className="recap-foot">
          <i>Floor Report filed by the <span className="recap-byline">Hog Trapper</span>. Instinct wins. Hesitation loses.</i>
        </div>
      </div>
    </div>
  );
}

export default SeshClosedRecap;
