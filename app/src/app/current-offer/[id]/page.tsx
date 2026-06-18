'use client';

/* SESH current-offer page — 5 distinct layout variants, switchable via ?v=v1..v5.
   No countdown timer anywhere — replaced with a compact InventoryBar.
   Emphasis on the CHART and the WINE BOTTLE. Each variant arranges those two
   heroes differently, with the BUY NOW button always obvious. Columns are
   tuned so panels puzzle together at matching heights. */

import { useRouter } from 'next/navigation';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { PageChrome } from '@/components/PageChrome';
import PriceChart, { type Timeframe } from '@/components/PriceChart';
import InventoryBar from '@/components/InventoryBar';
import BottlePlaceholder from '@/components/BottlePlaceholder';
import { useQuickBuy } from '@/components/useQuickBuy';
import { useBillingGate } from '@/context/BillingGateContext';
import { getSeshOffer, type SeshOffer } from '@/data/mock';
import { useUserState } from '@/context/UserStateContext';

const TIMEFRAMES: Timeframe[] = ['30 Sec', '1 Min', '5 Min', '15 Min', '30 Min', 'Hour', 'All'];
const DESC_PREVIEW = 220;

type VariantId = 'v1' | 'v2' | 'v3' | 'v4' | 'v5';
const VARIANTS: { id: VariantId; label: string; tag: string }[] = [
  { id: 'v1', label: 'Split',     tag: 'Equal-height chart + bottle' },
  { id: 'v2', label: 'Hero',      tag: 'Robinhood-style centered hero' },
  { id: 'v3', label: 'Ticket',    tag: 'Trade-ticket order calculator' },
  { id: 'v4', label: 'Terminal',  tag: 'Bloomberg 3-column terminal' },
  { id: 'v5', label: 'Stack',     tag: 'Coinbase mobile card stack' },
];

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

  const { openGate: openBillingGate } = useBillingGate();

  const { open: openQuickBuy, popover } = useQuickBuy('sesh');
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
    offer, isGated, timeframe, setTimeframe, readMore, setReadMore,
    livePrice, offMsrpPct, offStreetPct, savings,
    initialBottles, totalBottles,
    handlePriceTick, openBuy, openBillingGate,
    handleGetQualified, handleLoginExplore, handleSkipSesh,
  };

  return (
    <PageChrome>
      <main className={`wrap sesh-page sesh-${variant} ${stateClass}`}>
        {variant === 'v1' && <LayoutSplit {...shared} />}
        {variant === 'v2' && <LayoutHero {...shared} />}
        {variant === 'v3' && <LayoutTicket {...shared} />}
        {variant === 'v4' && <LayoutTerminal {...shared} />}
        {variant === 'v5' && <LayoutStack {...shared} />}

        {popover}
      </main>
    </PageChrome>
  );
}

type SharedProps = {
  offer: SeshOffer;
  isGated: boolean;
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

function BuyButton(p: SharedProps & { full?: boolean }) {
  const { isGated, livePrice, openBuy, openBillingGate, full } = p;
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
            <PriceChart gated={isGated} msrp={offer.msrp} street={offer.street}
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
          <PriceChart gated={isGated} msrp={offer.msrp} street={offer.street}
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
            <PriceChart gated={isGated} msrp={offer.msrp} street={offer.street}
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
  const { offer, isGated, timeframe, setTimeframe, livePrice, offMsrpPct, offStreetPct, savings,
    handlePriceTick, initialBottles, totalBottles, readMore, setReadMore } = p;
  return (
    <>
      <div className="sesh-term-headerbar">
        <div className="sesh-term-sym">{offer.ticker ?? offer.id.toUpperCase()}</div>
        <div className="sesh-term-title">{offer.title}</div>
        <div className="sesh-term-headerprice">
          <span>${livePrice.toFixed(2)}</span>
          <span className="sesh-term-delta">▼ {offMsrpPct.toFixed(2)}%</span>
        </div>
      </div>

      <div className="sesh-term-grid">
        <aside className="panel sesh-term-left">
          <h3>KEY STATS</h3>
          <StatRow label="MSRP" value={`$${offer.msrp.toFixed(2)}`} strike />
          <StatRow label="Street" value={`$${offer.street.toFixed(2)}`} strike />
          <StatRow label="Off MSRP" value={`${offMsrpPct.toFixed(2)}%`} good />
          <StatRow label="Off Street" value={`${offStreetPct.toFixed(2)}%`} good />
          <StatRow label="You Save" value={`$${savings.toFixed(2)}`} good />
          <StatRow label="Rating Avg" value={`${avgRating(offer.ratings)} pts`} />
        </aside>

        <div className="panel sesh-term-chart">
          <div className="chart-wrap">
            <PriceChart gated={isGated} msrp={offer.msrp} street={offer.street}
                        timeframe={timeframe} onPriceChange={handlePriceTick} />
          </div>
          <TFs timeframe={timeframe} setTimeframe={setTimeframe} />
          <InventoryBar initial={initialBottles} total={totalBottles} variant="dark" />
        </div>

        <aside className="panel sesh-term-right">
          <div className="sesh-term-right-stage">
            <Bottle offer={offer} size="md" />
          </div>
          <RatingChip offer={offer} />
          <h2 className="sesh-term-right-title">{offer.title}</h2>
          <div className="sesh-term-right-sub">{offer.volume}</div>
          <BuyButton {...p} full />
        </aside>
      </div>

      <section className="panel sesh-term-foot">
        <h2>About this wine</h2>
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
          <PriceChart gated={isGated} msrp={offer.msrp} street={offer.street}
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
        <StatPair label="Rating" value={`${avgRating(offer.ratings)}`} />
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
function StatRow({ label, value, strike, good }: { label: string; value: string; strike?: boolean; good?: boolean }) {
  return (
    <div className="sesh-statrow">
      <span>{label}</span>
      <span className={`sesh-statrow-val${strike ? ' is-strike' : ''}${good ? ' is-good' : ''}`}>{value}</span>
    </div>
  );
}
function avgRating(ratings: { src: string; score: number }[]) {
  if (!ratings.length) return '—';
  const sum = ratings.reduce((a, r) => a + r.score, 0);
  return (sum / ratings.length).toFixed(1);
}
