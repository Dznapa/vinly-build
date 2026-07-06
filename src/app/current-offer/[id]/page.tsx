'use client';

/* SESH current-offer page — 5 distinct layout variants, switchable via ?v=v1..v5.
   No countdown timer anywhere — replaced with a compact InventoryBar.
   Emphasis on the CHART and the WINE BOTTLE. Each variant arranges those two
   heroes differently, with the BUY NOW button always obvious. Columns are
   tuned so panels puzzle together at matching heights. */

import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { PageChrome } from '@/components/PageChrome';
import PriceChart, { type Timeframe } from '@/components/PriceChart';
import InventoryBar from '@/components/InventoryBar';
import SeshLiveCard from '@/components/SeshLiveCard';
import SeshHero from '@/components/SeshHero';
import BottlePlaceholder from '@/components/BottlePlaceholder';
import { useQuickBuy } from '@/components/useQuickBuy';
import { SESH_LOCKED_COPY } from '@/components/QuickBuyPopover';
import { useQuickBuyRegistry } from '@/context/QuickBuyContext';
import { useBillingGate } from '@/context/BillingGateContext';
import { useCancellations } from '@/context/CancellationContext';
import { getSeshOffer, getSeshRecap, type SeshOffer } from '@/data/mock';
import { SeshClosedRecap } from '@/components/SeshClosedRecap';
import { useUserState } from '@/context/UserStateContext';

const TIMEFRAMES: Timeframe[] = ['30 Sec', '1 Min', '5 Min', '15 Min', 'All'];
const DESC_PREVIEW = 220;

type VariantId = 'v1' | 'v2' | 'v3' | 'v4' | 'v5';
const VARIANTS: { id: VariantId; label: string; tag: string }[] = [
  { id: 'v1', label: 'Split',     tag: 'Equal-height chart + bottle' },
  { id: 'v2', label: 'Hero',      tag: 'Robinhood-style centered hero' },
  { id: 'v3', label: 'Ticket',    tag: 'Trade-ticket order calculator' },
  { id: 'v4', label: 'Terminal',  tag: 'Bloomberg 3-column terminal' },
  { id: 'v5', label: 'Stack',     tag: 'Coinbase mobile card stack' },
];

// Note beside the Buy Now button — warns that locking a price costs one of two chances.
const SESH_BUY_NOTE = 'Lock in your price wisely — you only get two chances.';
// Note under SOLD OUT — reassures there's another drop tomorrow.
const SESH_SOLDOUT_NOTE = "Gone in a flash — that's the SESH. The next drop lands tomorrow. Be prompt, be excited, be ready.";

// Editable unlock messaging — shown only to signed-in, not-yet-SESH-qualified users.
const SESH_ORIENT_COPY = "You're watching the floor. Get qualified to see live pricing and lock bottles.";
const UNLOCK_TITLE = 'Live pricing is locked';
const UNLOCK_SUB = 'Get SESH-qualified to watch it move.';
const UNLOCK_CTA = 'Unlock Live Pricing →';

// Editable unlock messaging — ANONYMOUS twin (no account yet → CTA routes through
// create-account → qualify, reusing the same billing-gate flow).
const SESH_ANON_ORIENT_COPY = "You're on the floor. Everyone here can see the price except you. Let's fix that.";
const ANON_UNLOCK_TITLE = 'Live pricing is locked';
const ANON_UNLOCK_SUB = "The whole floor can see this number. You're one quick signup away.";
const ANON_UNLOCK_CTA = 'Get SESH-Qualified →';

export default function CurrentOfferPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={null}>
      <CurrentOfferInner id={params.id} />
    </Suspense>
  );
}

function CurrentOfferInner({ id }: { id: string }) {
  const router = useRouter();
  // Terminal (v4) is the permanent, shipped SESH layout. The other variants and
  // the LAYOUT switcher were prototype-only A/B options.
  const variant = 'v4' as VariantId;
  const offer = getSeshOffer(id);
  const { userState } = useUserState();
  // Not SESH-qualified → can view everything but must add billing to buy.
  const isGated = userState !== 'sesh_qualified';
  // 2 cancellations this SESH → locked out of buying this drop (resets next SESH).
  const { capReached, hydrated: cancelHydrated } = useCancellations();
  const lockedOut = cancelHydrated && capReached;
  // Everyone now sees live prices + chart on the SESH (viewer mode); only the
  // buy action is gated, via the billing popup below.
  const stateClass = 'qualified';

  const [timeframe, setTimeframe] = useState<Timeframe>('30 Sec');
  const [readMore, setReadMore] = useState(false);
  const [livePrice, setLivePrice] = useState<number>(offer.livePrice);
  const handlePriceTick = useCallback((p: number) => setLivePrice(p), []);

  const offMsrpPct = Math.max(0, (1 - livePrice / offer.msrp) * 100);
  const offStreetPct = Math.max(0, (1 - livePrice / offer.street) * 100);
  const savings = Math.max(0, offer.msrp - livePrice);
  const totalBottles = 12;
  const initialBottles = Math.max(1, Math.round(offer.inventoryPct * totalBottles));
  // Page-owned inventory drift so we know when the floor closes (and can freeze
  // the chart). Drives the InventoryBar via percentRemaining.
  const [bottlesLeft, setBottlesLeft] = useState(initialBottles);
  useEffect(() => {
    const id = window.setInterval(() => {
      setBottlesLeft((n) => (n > 0 && Math.random() < 0.18 ? n - 1 : n));
    }, 6000);
    return () => window.clearInterval(id);
  }, []);
  const invPct = totalBottles > 0 ? Math.max(0, Math.min(100, (bottlesLeft / totalBottles) * 100)) : 0;
  const floorClosed = bottlesLeft <= 0;
  const [recapDismissed, setRecapDismissed] = useState(false);

  const { openGate: openBillingGate } = useBillingGate();

  const { open: openQuickBuy, popover } = useQuickBuy('sesh');
  // Hide the mobile floating Buy Now whenever ANY quick-buy popup is open
  // (this page's SESH popup OR the Ticker popup in the shared chrome).
  const { anyOpen: anyQuickBuyOpen } = useQuickBuyRegistry();
  const openBuy = () =>
    openQuickBuy({
      id: offer.id,
      name: offer.title,
      region: offer.volume,
      price: livePrice,
      image: offer.image,
      msrp: offer.msrp,
    });

  const handleGetQualified = () =>
    router.push(userState === 'anonymous' ? '/register_details' : '/profile');
  const handleLoginExplore = () => router.push('/login');
  const handleSkipSesh = () => {
    try {
      window.localStorage.setItem(`vinly:sesh-skipped:${offer.id}`, String(Date.now()));
    } catch { /* ignore */ }
    router.push('/shop');
  };

  const shared: SharedProps = {
    offer, isGated, signedInUnqualified: userState === 'signed_in', isAnonymous: userState === 'anonymous', lockedOut, timeframe, setTimeframe, readMore, setReadMore,
    livePrice, offMsrpPct, offStreetPct, savings,
    initialBottles, totalBottles, invPct, floorClosed,
    handlePriceTick, openBuy, openBillingGate,
    handleGetQualified, handleLoginExplore, handleSkipSesh,
  };

  return (
    <PageChrome>
      <main className={`wrap sesh-page sesh-${variant} ${stateClass}${userState === 'signed_in' ? ' sesh-solo-cta' : ''}`}>
        {variant === 'v1' && <LayoutSplit {...shared} />}
        {variant === 'v2' && <LayoutHero {...shared} />}
        {variant === 'v3' && <LayoutTicket {...shared} />}
        {variant === 'v4' && <LayoutTerminal {...shared} />}
        {variant === 'v5' && <LayoutStack {...shared} />}

        {/* Mobile-only sticky buy bar (hidden on desktop via CSS). While the
            quick-buy popup is open it owns the screen — drop the floating button
            entirely (not just visually) so it can't overlap the popup's "Not now"
            exit or sit in the tab/screen-reader order. Desktop is unaffected
            (the bar is CSS-hidden there regardless). */}
        {!anyQuickBuyOpen && <FloatingBuy {...shared} />}

        {popover}
        {floorClosed && !recapDismissed && (
          <SeshClosedRecap recap={getSeshRecap(offer)} onClose={() => setRecapDismissed(true)} />
        )}
      </main>
    </PageChrome>
  );
}

type SharedProps = {
  offer: SeshOffer;
  isGated: boolean;
  signedInUnqualified: boolean; // signed in but NOT SESH-qualified → show unlock messaging
  isAnonymous: boolean; // not signed in → anonymous unlock messaging (create-account → qualify)
  lockedOut: boolean; // 2 SESH cancellations used → buying locked for this drop
  timeframe: Timeframe;
  setTimeframe: (t: Timeframe) => void;
  readMore: boolean;
  setReadMore: (fn: (r: boolean) => boolean) => void;
  livePrice: number;
  offMsrpPct: number;
  offStreetPct: number;
  savings: number;
  initialBottles: number;
  totalBottles: number;
  invPct: number;
  floorClosed: boolean;
  handlePriceTick: (p: number) => void;
  openBuy: () => void;
  openBillingGate: () => void;
  handleGetQualified: () => void;
  handleLoginExplore: () => void;
  handleSkipSesh: () => void;
};

/* ----------------------------- shared bits ----------------------------- */

function Bottle({ offer, size = 'md' }: { offer: SeshOffer; size?: 'sm' | 'md' | 'lg' }) {
  const sz =
    size === 'lg' ? { maxW: 240, maxH: 460 }
    : size === 'sm' ? { maxW: 90,  maxH: 220 }
    : { maxW: 170, maxH: 340 };
  return offer.image ? (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={offer.image}
      alt={offer.title}
      style={{ maxWidth: sz.maxW, maxHeight: sz.maxH, width: 'auto', height: 'auto', objectFit: 'contain', display: 'block' }}
    />
  ) : (
    <BottlePlaceholder name={offer.title} width={sz.maxW} height={sz.maxH} />
  );
}

function TFs({ timeframe, setTimeframe }: Pick<SharedProps, 'timeframe' | 'setTimeframe'>) {
  return (
    <div className="sesh-tfs">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          type="button"
          className={`sesh-tf${tf === timeframe ? ' is-active' : ''}`}
          onClick={() => setTimeframe(tf)}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}

function PriceBadge({ livePrice, offMsrpPct }: { livePrice: number; offMsrpPct: number }) {
  return (
    <div className="sesh-pricebadge">
      <div className="sesh-pricebadge-num">${livePrice.toFixed(2)}</div>
      <div className="sesh-pricebadge-delta">
        <i className="fa-solid fa-caret-down" aria-hidden /> {offMsrpPct.toFixed(2)}% off MSRP
      </div>
    </div>
  );
}

function RatingChip({ offer }: { offer: SeshOffer }) {
  return (
    <div className="sesh-ratingchip">
      {offer.ratings.map((r, i) => (
        <span key={r.src}>
          {i > 0 && <span className="sesh-rating-dot"> · </span>}
          <b>{r.score}</b> {r.src}
        </span>
      ))}
    </div>
  );
}

function Desc({ offer, readMore, setReadMore }: Pick<SharedProps, 'offer' | 'readMore' | 'setReadMore'>) {
  const showFull = readMore || offer.description.length <= DESC_PREVIEW;
  const text = showFull ? offer.description : `${offer.description.slice(0, DESC_PREVIEW).trimEnd()}…`;
  return (
    <>
      <p className="sesh-desc">{text}</p>
      <button type="button" className="sesh-readmore" onClick={() => setReadMore((r) => !r)}>
        {readMore ? 'Read less' : 'Read more'}
      </button>
    </>
  );
}

function fmtHMS(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

// Live "how long this wine has been on offer" counter, shown under the chart.
// Counts up from a per-offer opened timestamp (seeded once, persisted). When the
// floor closes it freezes to offer.offerDuration — the exact value the recap's
// "SOLD OUT IN" shows — so the chart timer and the recap always agree.
function OfferDuration({ offer, floorClosed }: { offer: SharedProps['offer']; floorClosed: boolean }) {
  const [sec, setSec] = useState<number | null>(null);
  useEffect(() => {
    const key = `vinly:offerOpened:${offer.id}`;
    let opened: number;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) { opened = Number(raw); }
      else { opened = Date.now(); window.localStorage.setItem(key, String(opened)); }
    } catch { opened = Date.now(); }
    const tick = () => setSec(Math.max(0, Math.floor((Date.now() - opened) / 1000)));
    tick();
    if (floorClosed) return; // frozen once the floor closes
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [offer.id, floorClosed]);

  const text = floorClosed ? offer.offerDuration : sec === null ? '—:—:—' : fmtHMS(sec);
  return (
    <div className="sesh-offer-duration">
      Offer Duration: <b>{text}</b>
    </div>
  );
}

// Mobile-only sticky floating buy bar — mirrors BuyButton's three states.
// (CSS hides it on desktop; rendered only on the SESH offer page.)
function FloatingBuy(p: SharedProps) {
  const { isGated, livePrice, openBuy, openBillingGate, floorClosed, lockedOut } = p;
  if (floorClosed) {
    return (
      <div className="sesh-fab">
        <button type="button" className="sesh-fab-btn is-soldout" disabled>
          <i className="fa-solid fa-circle-xmark" aria-hidden /> <span>SOLD OUT</span>
        </button>
      </div>
    );
  }
  // Qualified buyer who used both cancellations → buying locked for this SESH.
  if (!isGated && lockedOut) {
    return (
      <div className="sesh-fab sesh-fab--locked">
        <div className="sesh-fab-lockwrap" role="status">
          <i className="fa-solid fa-lock" aria-hidden /> <span>{SESH_LOCKED_COPY}</span>
        </div>
      </div>
    );
  }
  if (isGated) {
    // Locked (anonymous or signed-in-not-qualified). The in-card button already says
    // "VIEW PRICING"; make the sticky one the distinct unlock ACTION instead of a
    // second identical CTA. Same qualification entry (billing gate → address + payment,
    // no false grant) the header/hero/Profile "Get SESH Qualified" uses.
    return (
      <div className="sesh-fab">
        <button
          type="button"
          className="sesh-fab-btn is-gated"
          onClick={openBillingGate}
          aria-label="Get SESH qualified — unlock live pricing"
        >
          <i className="fa-solid fa-lock" aria-hidden /> <span>GET SESH QUALIFIED</span>
        </button>
      </div>
    );
  }
  return (
    <div className="sesh-fab">
      <button type="button" className="sesh-fab-btn is-buy" onClick={openBuy}>
        <span>BUY NOW</span>
        <span className="sesh-fab-price">${livePrice.toFixed(2)}</span>
      </button>
    </div>
  );
}

function BuyButton(p: SharedProps & { full?: boolean }) {
  const { isGated, livePrice, openBuy, openBillingGate, floorClosed, lockedOut, full } = p;
  // Floor closed (sold out) → no price, no buy action.
  if (floorClosed) {
    return (
      <button type="button" className={`sesh-buy sesh-buy--soldout${full ? ' sesh-buy--full' : ''}`} disabled>
        <i className="fa-solid fa-circle-xmark" aria-hidden /> <span>SOLD OUT</span>
      </button>
    );
  }
  // Qualified buyer who used both cancellations → buying locked for this SESH.
  // Up-front locked state (disabled), not a buy action that then fails.
  if (!isGated && lockedOut) {
    return (
      <div className={`sesh-buy-locked${full ? ' sesh-buy-locked--full' : ''}`}>
        <button
          type="button"
          className={`sesh-buy sesh-buy--lockedout${full ? ' sesh-buy--full' : ''}`}
          disabled
          aria-label={SESH_LOCKED_COPY}
        >
          <i className="fa-solid fa-lock" aria-hidden /> <span>BUYING LOCKED</span>
        </button>
        <p className="sesh-buy-locked-msg">{SESH_LOCKED_COPY}</p>
      </div>
    );
  }
  // Non-qualified: pricing is locked, so the CTA invites them to unlock it and
  // routes to the billing wizard instead of showing a price / buy flow.
  if (isGated) {
    return (
      <button
        type="button"
        className={`sesh-buy sesh-buy--view${full ? ' sesh-buy--full' : ''}`}
        onClick={openBillingGate}
      >
        <i className="fa-solid fa-lock" aria-hidden /> <span>VIEW PRICING</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`sesh-buy${full ? ' sesh-buy--full' : ''}`}
      onClick={openBuy}
    >
      <span>BUY NOW</span>
      <span className="sesh-buy-price">${livePrice.toFixed(2)}</span>
    </button>
  );
}

function VariantPicker({ active, onPick }: { active: VariantId; onPick: (v: VariantId) => void }) {
  return (
    <div className="sesh-picker" role="tablist" aria-label="Layout">
      <span className="sesh-picker-label">LAYOUT</span>
      {VARIANTS.map((v) => (
        <button
          key={v.id}
          type="button"
          role="tab"
          aria-selected={active === v.id}
          className={`sesh-picker-chip${active === v.id ? ' is-active' : ''}`}
          onClick={() => onPick(v.id)}
          title={v.tag}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

function TitleStrip({ offer }: { offer: SeshOffer }) {
  return (
    <div className="sesh-crumb">
      <span>SESH</span>
      <i className="fa-solid fa-chevron-right" aria-hidden />
      <span>{offer.dateTag.replace('SESH ', '')}</span>
      <i className="fa-solid fa-chevron-right" aria-hidden />
      <span className="sesh-crumb-active">{offer.title}</span>
      {offer.ticker && <span className="sesh-crumb-ticker">{offer.ticker}</span>}
    </div>
  );
}

/* =============== V1 — SPLIT (chart + white wine-detail card) =============== */

function LayoutSplit(p: SharedProps) {
  const { offer, isGated, timeframe, setTimeframe, livePrice, offMsrpPct, savings,
    handlePriceTick, initialBottles, totalBottles, readMore, setReadMore } = p;
  return (
    <>
      <TitleStrip offer={offer} />
      <section className="sesh-split">
        <div className="sesh-split-chart panel">
          <PriceBadge livePrice={livePrice} offMsrpPct={offMsrpPct} />
          <div className="sesh-split-chartbox">
            <PriceChart gated={false} msrp={offer.msrp} street={offer.street}
                        timeframe={timeframe} onPriceChange={handlePriceTick} />
          </div>
          <TFs timeframe={timeframe} setTimeframe={setTimeframe} />
        </div>

        {/* Wine-detail card — bottle on the left, all wine info on the right.
            The card is WHITE so the JPG's white photo background blends in
            seamlessly, leaving only the bottle visible. Matches the live
            vinlywine.com SESH detail panel. */}
        <div className="sesh-winecard">
          <div className="sesh-winecard-bottle">
            <Bottle offer={offer} size="lg" />
          </div>
          <div className="sesh-winecard-info">
            <h2 className="sesh-winecard-title">{offer.title}</h2>
            <div className="sesh-winecard-vol">{offer.volume}</div>
            <div className="sesh-winecard-ratings">
              {offer.ratings.map((r, i) => (
                <span className="sesh-winecard-rchip" key={r.src + i}>
                  <span className="sesh-winecard-rchip-src">{r.src}</span>
                  <span className="sesh-winecard-rchip-num">{r.score}</span>
                </span>
              ))}
            </div>
            <Desc offer={offer} readMore={readMore} setReadMore={setReadMore} />
          </div>
        </div>
      </section>

      <section className="sesh-split-foot">
        <div className="panel sesh-split-stats">
          <StatPair label="MSRP" value={`$${offer.msrp.toFixed(2)}`} strike />
          <StatPair label="Street" value={`$${offer.street.toFixed(2)}`} strike />
          <StatPair label="You Save" value={`$${savings.toFixed(2)}`} good />
          <StatPair label="Off MSRP" value={`${offMsrpPct.toFixed(2)}%`} good />
          <div className="sesh-split-invwrap">
            <InventoryBar initial={initialBottles} total={totalBottles} variant="dark" />
          </div>
        </div>
        <div className="panel sesh-split-buycard">
          <BuyButton {...p} full />
          {!isGated && <div className="sesh-buyfoot"><i className="fa-solid fa-lock" /> 15-minute price lock once confirmed</div>}
        </div>
      </section>
    </>
  );
}

/* =============== V2 — HERO (Robinhood: centered, sticky bottom buy) =============== */

function LayoutHero(p: SharedProps) {
  const { offer, isGated, timeframe, setTimeframe, livePrice, offMsrpPct, savings,
    handlePriceTick, initialBottles, totalBottles, readMore, setReadMore } = p;
  return (
    <>
      <div className="sesh-hero-head">
        <div className="sesh-hero-name">{offer.title}{offer.ticker && <span> · {offer.ticker}</span>}</div>
        <div className="sesh-hero-price">${livePrice.toFixed(2)}</div>
        <div className="sesh-hero-delta">
          <i className="fa-solid fa-caret-down" aria-hidden /> {offMsrpPct.toFixed(2)}% off MSRP · Save ${savings.toFixed(2)}
        </div>
      </div>

      <div className="panel sesh-hero-chart">
        <div className="chart-wrap">
          <PriceChart gated={false} msrp={offer.msrp} street={offer.street}
                      timeframe={timeframe} onPriceChange={handlePriceTick} />
        </div>
        <TFs timeframe={timeframe} setTimeframe={setTimeframe} />
      </div>

      <section className="sesh-hero-row">
        <div className="panel sesh-hero-bottle">
          <Bottle offer={offer} size="md" />
        </div>
        <div className="panel sesh-hero-meta">
          <RatingChip offer={offer} />
          <h2 className="sesh-hero-meta-title">{offer.title}</h2>
          <div className="sesh-hero-meta-sub">{offer.volume}</div>
          <InventoryBar initial={initialBottles} total={totalBottles} variant="dark" />
          <Desc offer={offer} readMore={readMore} setReadMore={setReadMore} />
        </div>
      </section>

      <div className="sesh-hero-stickybar">
        <div className="sesh-hero-stickyprice">
          <span>${livePrice.toFixed(2)}</span>
          <span className="sesh-hero-stickysub">{offMsrpPct.toFixed(2)}% off MSRP</span>
        </div>
        <BuyButton {...p} full />
      </div>
    </>
  );
}

/* =============== V3 — TICKET (brokerage order calculator) =============== */

function LayoutTicket(p: SharedProps) {
  const { offer, isGated, timeframe, setTimeframe, livePrice, offMsrpPct, offStreetPct, savings,
    handlePriceTick, initialBottles, totalBottles, readMore, setReadMore } = p;
  const [qty, setQty] = useState<number>(1);
  const total = useMemo(() => Number((livePrice * qty).toFixed(2)), [livePrice, qty]);

  return (
    <div className="sesh-ticket-grid">
      <div className="sesh-ticket-main">
        <TitleStrip offer={offer} />
        <div className="panel sesh-ticket-chart">
          <div className="sesh-ticket-pricehead">
            <PriceBadge livePrice={livePrice} offMsrpPct={offMsrpPct} />
            <div className="sesh-ticket-msrp">
              <span>MSRP <s>${offer.msrp.toFixed(2)}</s></span>
              <span>Street <s>${offer.street.toFixed(2)}</s></span>
            </div>
          </div>
          <div className="chart-wrap">
            <PriceChart gated={false} msrp={offer.msrp} street={offer.street}
                        timeframe={timeframe} onPriceChange={handlePriceTick} />
          </div>
          <TFs timeframe={timeframe} setTimeframe={setTimeframe} />
        </div>

        <div className="panel sesh-ticket-wine">
          <div className="sesh-ticket-wine-left">
            <Bottle offer={offer} size="md" />
          </div>
          <div className="sesh-ticket-wine-right">
            <h2>{offer.title}</h2>
            <div className="sesh-ticket-wine-sub">{offer.volume}</div>
            <RatingChip offer={offer} />
            <Desc offer={offer} readMore={readMore} setReadMore={setReadMore} />
            <InventoryBar initial={initialBottles} total={totalBottles} variant="dark" />
          </div>
        </div>
      </div>

      <aside className="sesh-ticket-card">
        <div className="sesh-ticket-card-kicker">ORDER TICKET</div>
        <div className="sesh-ticket-card-name">{offer.title}</div>
        <div className="sesh-ticket-row">
          <span>Limit Price</span>
          <span className="sesh-ticket-num">${livePrice.toFixed(2)}</span>
        </div>
        <div className="sesh-ticket-row">
          <span>Bottles</span>
          <div className="sesh-ticket-step">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span>{qty}</span>
            <button type="button" onClick={() => setQty((q) => Math.min(6, q + 1))}>+</button>
          </div>
        </div>
        <div className="sesh-ticket-row">
          <span>You Save</span>
          <span className="sesh-ticket-num sesh-ticket-good">${(savings * qty).toFixed(2)}</span>
        </div>
        <div className="sesh-ticket-row">
          <span>vs Street</span>
          <span className="sesh-ticket-num sesh-ticket-good">{offStreetPct.toFixed(1)}%</span>
        </div>
        <div className="sesh-ticket-divider" />
        <div className="sesh-ticket-totalrow">
          <span>Estimated Total</span>
          <span className="sesh-ticket-total">${total.toFixed(2)}</span>
        </div>
        {isGated ? (
          <button type="button" className="sesh-ticket-cta sesh-buy--gated sesh-buy" onClick={p.handleLoginExplore}>
            <i className="fa-solid fa-lock" /> LOGIN / SIGNUP
          </button>
        ) : (
          <button type="button" className="sesh-ticket-cta sesh-buy sesh-buy--full" onClick={p.openBuy}>
            <span>REVIEW &amp; BUY</span>
            <span className="sesh-buy-price">${total.toFixed(2)}</span>
          </button>
        )}
        <InventoryBar initial={initialBottles} total={totalBottles} size="sm" variant="light" />
      </aside>
    </div>
  );
}

/* =============== V4 — TERMINAL (3-col Bloomberg) =============== */

function LayoutTerminal(p: SharedProps) {
  const { offer, isGated, signedInUnqualified, isAnonymous, openBillingGate, timeframe, setTimeframe, livePrice, offMsrpPct, offStreetPct, savings,
    handlePriceTick, initialBottles, totalBottles, readMore, setReadMore } = p;
  return (
    <>
      {/* Value-prop hero — what Vinly is, in the first few seconds. State-aware
          anchor + rotating subline. Additive; sits above the existing board. */}
      <SeshHero onGetQualified={openBillingGate} />

      <div className="sesh-term-headerbar">
        <div className="sesh-term-sym">{offer.ticker ?? offer.id.toUpperCase()}</div>
        <div className="sesh-term-title">{offer.title}</div>
      </div>
      {signedInUnqualified && (
        <p className="sesh-orient">{SESH_ORIENT_COPY}</p>
      )}
      {isAnonymous && (
        <p className="sesh-orient">{SESH_ANON_ORIENT_COPY}</p>
      )}

      <div className="sesh-term-grid" id="sesh-board">
        <aside className="panel sesh-term-left">
          <div className="sesh-term-left-head">
            <h3>KEY STATS</h3>
            {!p.floorClosed && (
              <span className="sesh-term-live"><span className="sesh-term-live-dot" aria-hidden /> LIVE</span>
            )}
          </div>
          {offer.msrp > 0 && <StatRow label="MSRP" value={`$${offer.msrp.toFixed(2)}`} strike />}
          {offer.street > 0 && <StatRow label="Street" value={`$${offer.street.toFixed(2)}`} strike />}
          {offer.msrp > 0 && <StatRow label="Off MSRP" value={`${offMsrpPct.toFixed(2)}%`} good keyRow flashKey={offMsrpPct.toFixed(2)} />}
          {offer.street > 0 && <StatRow label="Off Street" value={`${offStreetPct.toFixed(2)}%`} good flashKey={offStreetPct.toFixed(2)} />}
          {offer.msrp > 0 && <StatRow label="You Save" value={`$${savings.toFixed(2)}`} good keyRow flashKey={savings.toFixed(2)} />}
          <StatRow label="Highest Critic Rating" value={<>{topRating(offer.ratings)}<span className="sesh-statrow-pts">pts</span></>} />
        </aside>

        <div className="panel sesh-term-chart">
          <div className="sesh-term-livehero">
            <span className="sesh-term-livehero-label">LIVE SESH PRICE</span>
            <span className="sesh-term-livehero-price">${livePrice.toFixed(2)}</span>
            <span className="sesh-term-livehero-delta">▼ {offMsrpPct.toFixed(2)}% off MSRP</span>
            {signedInUnqualified && (
              <div className="sesh-unlock-overlay">
                <div className="sesh-unlock-card">
                  <div className="sesh-unlock-title"><i className="fa-solid fa-lock" aria-hidden /> {UNLOCK_TITLE}</div>
                  <div className="sesh-unlock-sub">{UNLOCK_SUB}</div>
                  <button
                    type="button"
                    className="sesh-unlock-btn"
                    onClick={openBillingGate}
                    aria-label="Unlock live pricing — get SESH-qualified"
                  >
                    {UNLOCK_CTA}
                  </button>
                </div>
              </div>
            )}
            {isAnonymous && (
              <div className="sesh-unlock-overlay">
                <div className="sesh-unlock-card">
                  <div className="sesh-unlock-title"><i className="fa-solid fa-lock" aria-hidden /> {ANON_UNLOCK_TITLE}</div>
                  <div className="sesh-unlock-sub">{ANON_UNLOCK_SUB}</div>
                  <button
                    type="button"
                    className="sesh-unlock-btn"
                    onClick={openBillingGate}
                    aria-label="Get SESH-qualified — create your account and unlock live pricing"
                  >
                    {ANON_UNLOCK_CTA}
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="chart-wrap">
            <PriceChart gated={false} blurAxis={p.isGated} frozen={p.floorClosed} msrp={offer.msrp} street={offer.street}
                        timeframe={timeframe} onPriceChange={handlePriceTick} />
          </div>
          <TFs timeframe={timeframe} setTimeframe={setTimeframe} />
          <OfferDuration offer={offer} floorClosed={p.floorClosed} />
          <InventoryBar percentRemaining={p.invPct} variant="dark" />
          {/* Stage-aware live promo card; replaces the gauge microline (hidden via CSS
              on .sesh-page) while live, and self-hides at close so the closing-bell
              card takes over. Reads the same invPct the gauge does. */}
          <SeshLiveCard pct={p.invPct} />
        </div>

        <aside className="panel sesh-term-right">
          <div className="sesh-term-right-stage">
            <div className="sesh-term-ratings-vert">
              {offer.ratings.map((r, i) => (
                <span className="sesh-term-rating" key={r.src + i}>
                  <b>{r.score}</b>
                  <span>{r.src}</span>
                </span>
              ))}
            </div>
            <Bottle offer={offer} size="lg" />
          </div>
          <h2 className="sesh-term-right-title">{offer.title}</h2>
          {offer.appellation && (
            <div className="sesh-term-right-appellation">
              <i className="fa-solid fa-location-dot" aria-hidden /> {offer.appellation}
            </div>
          )}
          <div className="sesh-term-right-sub">{offer.volume}</div>
          <BuyButton {...p} full />
          {!p.isGated && !p.floorClosed && !p.lockedOut && (
            <p className="sesh-buy-note">{SESH_BUY_NOTE}</p>
          )}
          {p.floorClosed && (
            <p className="sesh-buy-note sesh-buy-note--soldout">
              <i className="fa-solid fa-bolt" aria-hidden /> {SESH_SOLDOUT_NOTE}
            </p>
          )}
        </aside>
      </div>

      <section className="panel sesh-term-foot">
        <div className="sesh-term-foot-head">
          <span className="sesh-term-foot-kicker"><i className="fa-solid fa-wine-bottle" aria-hidden /> THE STORY</span>
          <h2>About this wine</h2>
        </div>
        <Desc offer={offer} readMore={readMore} setReadMore={setReadMore} />
      </section>
    </>
  );
}

/* =============== V5 — STACK (vertical card stack with floating buy) =============== */

function LayoutStack(p: SharedProps) {
  const { offer, isGated, timeframe, setTimeframe, livePrice, offMsrpPct, offStreetPct, savings,
    handlePriceTick, initialBottles, totalBottles, readMore, setReadMore } = p;
  return (
    <>
      <div className="panel sesh-stack-hero">
        <div className="sesh-stack-hero-left">
          <div className="sesh-stack-hero-name">{offer.title}{offer.ticker && <span> · {offer.ticker}</span>}</div>
          <div className="sesh-stack-hero-price">${livePrice.toFixed(2)}</div>
          <div className="sesh-stack-hero-delta">
            <i className="fa-solid fa-caret-down" /> {offMsrpPct.toFixed(2)}% off MSRP · Save ${savings.toFixed(2)}
          </div>
          <RatingChip offer={offer} />
          <InventoryBar initial={initialBottles} total={totalBottles} variant="dark" />
        </div>
        <div className="sesh-stack-hero-right">
          <Bottle offer={offer} size="lg" />
        </div>
      </div>

      <div className="panel sesh-stack-chart">
        <div className="chart-wrap">
          <PriceChart gated={false} msrp={offer.msrp} street={offer.street}
                      timeframe={timeframe} onPriceChange={handlePriceTick} />
        </div>
        <TFs timeframe={timeframe} setTimeframe={setTimeframe} />
      </div>

      <div className="panel sesh-stack-stats">
        <StatPair label="MSRP" value={`$${offer.msrp.toFixed(2)}`} strike />
        <StatPair label="Street" value={`$${offer.street.toFixed(2)}`} strike />
        <StatPair label="You Save" value={`$${savings.toFixed(2)}`} good />
        <StatPair label="Off MSRP" value={`${offMsrpPct.toFixed(2)}%`} good />
        <StatPair label="vs Street" value={`${offStreetPct.toFixed(1)}%`} good />
        <StatPair label="Highest Critic Rating" value={`${topRating(offer.ratings)}`} />
      </div>

      <div className="panel sesh-stack-about">
        <h2>About this wine</h2>
        <Desc offer={offer} readMore={readMore} setReadMore={setReadMore} />
      </div>

      <div className="sesh-stack-fab">
        <BuyButton {...p} full />
      </div>
    </>
  );
}

/* ----------------------------- atoms ----------------------------- */

function StatPair({ label, value, strike, good }: { label: string; value: string; strike?: boolean; good?: boolean }) {
  return (
    <div className="sesh-statpair">
      <div className="sesh-statpair-label">{label}</div>
      <div className={`sesh-statpair-value${strike ? ' is-strike' : ''}${good ? ' is-good' : ''}`}>{value}</div>
    </div>
  );
}
function StatRow({ label, value, strike, good, keyRow, flashKey }: {
  label: string; value: ReactNode; strike?: boolean; good?: boolean; keyRow?: boolean; flashKey?: string | number;
}) {
  return (
    <div className={`sesh-statrow${keyRow ? ' is-key' : ''}`}>
      <span>{label}</span>
      <span key={flashKey} className={`sesh-statrow-val${strike ? ' is-strike' : ''}${good ? ' is-good' : ''}`}>{value}</span>
    </div>
  );
}
function topRating(ratings: { src: string; score: number }[]) {
  if (!ratings.length) return '—';
  return Math.max(...ratings.map((r) => r.score)).toString();
}
