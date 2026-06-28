'use client';

/* SeshHero — value-proposition hero at the top of the SESH page.

   A fixed ANCHOR line plus a SUBLINE that rotates through several messages on a
   gentle fade (~4.5s, pausing on hover). Both the anchor and the rotating set
   change with the visitor's user state (anonymous / signed-in / SESH-qualified).

   Marketplace framing only — live pricing + limited inventory. No investment-
   return language. Reuses the SESH dark tokens and the .sesh-unlock-btn CTA.

   prefers-reduced-motion: shows only the first subline, no rotation. */

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useUserState } from '@/context/UserStateContext';

const ROTATE_MS = 4500; // dwell time per subline
const FADE_MS = 480; // matches the CSS opacity transition

type CTA =
  | { kind: 'link'; label: string; href: string }
  | { kind: 'qualify'; label: string }
  | { kind: 'scroll'; label: string; targetId: string }
  | null;

type HeroContent = { anchor: string; sublines: string[]; cta: CTA };

// Editable copy. One line each — keep sublines short so they don't wrap.
const HERO: Record<'anonymous' | 'signed_in' | 'sesh_qualified', HeroContent> = {
  anonymous: {
    anchor: 'Vinly — trade wine like stocks.',
    sublines: [
      'Live pricing. Limited inventory. Buy before the market moves.',
      'Real Napa allocations, priced in real time — when bottles run low, the price climbs.',
      'Lock a bottle at today’s price. Settle when your 15-minute cart closes.',
      'New here? Create an account to watch the board go live.',
    ],
    cta: { kind: 'link', label: 'Create your account', href: '/register_details' },
  },
  signed_in: {
    anchor: 'You’re in. Time to trade.',
    sublines: [
      'One step left — get SESH qualified to lock bottles at live prices.',
      'Add billing & shipping to trade before the market moves.',
      'The board’s live. Qualify now so you’re ready when your bottle drops.',
      'Watch prices climb as bottles sell — don’t get caught on the sidelines.',
    ],
    cta: { kind: 'qualify', label: 'Get SESH Qualified' },
  },
  sesh_qualified: {
    anchor: 'The market’s open.',
    sublines: [
      'Lock your bottle before the price moves.',
      'Live now. Limited inventory. Your move.',
      'Prices climb as bottles sell — grab yours at today’s number.',
      'You’re qualified. One tap locks the price.',
    ],
    cta: { kind: 'scroll', label: 'Jump to the board ↓', targetId: 'sesh-board' },
  },
};

export default function SeshHero({ onGetQualified }: { onGetQualified: () => void }) {
  const { userState, hydrated } = useUserState();

  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(true); // drives the opacity fade
  const [reduced, setReduced] = useState(false);
  const hoverRef = useRef(false);

  // Honor prefers-reduced-motion (no rotation, first line only).
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const content = HERO[userState];
  const sublines = content.sublines;

  // Reset to the first line whenever the state (and thus the set) changes.
  useEffect(() => {
    setIdx(0);
    setShown(true);
  }, [userState]);

  // Rotation: fade out, swap, fade in. Skips a tick while hovered. Timeout-based
  // (not transitionend) so an interrupted transition can't stall the cycle.
  useEffect(() => {
    if (!hydrated || reduced || sublines.length <= 1) return;
    let swap: number | undefined;
    const cycle = window.setInterval(() => {
      if (hoverRef.current) return; // paused on hover
      setShown(false);
      swap = window.setTimeout(() => {
        setIdx((i) => (i + 1) % sublines.length);
        setShown(true);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => {
      window.clearInterval(cycle);
      if (swap) window.clearTimeout(swap);
    };
  }, [hydrated, reduced, sublines.length]);

  // Render nothing until state is hydrated — avoids a flash of the wrong (default
  // anonymous) anchor/CTA for a signed-in or qualified visitor. The section keeps
  // a min-height (CSS) so this doesn't shift the board below it.
  return (
    <section
      className="sesh-vp"
      onMouseEnter={() => { hoverRef.current = true; }}
      onMouseLeave={() => { hoverRef.current = false; }}
      aria-label="What Vinly is"
    >
      {hydrated && (
        <div className="sesh-vp-inner">
          <h1 className="sesh-vp-anchor">{content.anchor}</h1>
          <div className="sesh-vp-subwrap">
            <p className={`sesh-vp-sub${shown ? ' is-shown' : ''}`} aria-live="polite">
              {sublines[idx]}
            </p>
          </div>

          {content.cta?.kind === 'link' && (
            <Link href={content.cta.href} className="sesh-unlock-btn sesh-vp-cta">
              {content.cta.label}
            </Link>
          )}
          {content.cta?.kind === 'qualify' && (
            <button
              type="button"
              className="sesh-unlock-btn sesh-vp-cta"
              onClick={onGetQualified}
              aria-label="Get SESH qualified — add billing and shipping"
            >
              {content.cta.label}
            </button>
          )}
          {content.cta?.kind === 'scroll' && (
            <a href={`#${content.cta.targetId}`} className="sesh-vp-jump">
              {content.cta.label}
            </a>
          )}
        </div>
      )}
    </section>
  );
}
