/* Mock data — ported and extended from /spec/prototype/assets/app.js.
   Bottle images are real Commerce7 CDN URLs per /spec/ASSETS.md.
   No backend; values are literal so the click-through clone is deterministic. */

/* Real bottle imagery — public Commerce7 sandbox CDN (no auth). */
const C7 = 'https://images.commerce7.com/world-of-wine-sandbox/images/original';
export const BOTTLE_IMG = {
  domaine: `${C7}/domaine-des-perdrix-vosne-romane-2019_1000x3600-1775101074253.jpg`,
  sonomaCutrer: `${C7}/2021-sonoma-cutrer-les-pierres-sonoma-chard_1000x3600-1776222310552.jpg`,
  arkas: `${C7}/arkas-cabernet-sauvignon-north-coast-2020-750_1000x3600-1776221651240.jpg`,
  beauVigneCabby: `${C7}/beau-vigne-cabby--cabernet-sauvignon-napa-valley-2020-750_1000x3600-1776221538013.jpg`,
  beauVigneJuliet: `${C7}/beau-vigne-juliet-cabernet-sauvignon-napa-valley-2018-750_1000x3600-1776221566208.jpg`,
} as const;

/* Fallback for any wine without a real CDN image. */
export const FALLBACK_BOTTLE = '/bottle.svg';
export const FALLBACK_PACK = '/pack.svg';

export type TickerWine = {
  id: string;
  name: string;
  region: string;
  sub: string;
  left: number;
  image: string;
  price: number; // fixed sale price (Branch B — scarce, not live-moving)
  msrp: number; // anchor / reference price the discount is measured from
};

// Matches the live SESH ticker (vinlywine.com/current-offer). Bottle photos for
// EDICT / SHAFER / CLOUDY BAY / DAOU are placeholders until the owner supplies the
// real Commerce7 images (Domaine des Perdrix already has its real CDN photo).
export const TICKER: TickerWine[] = [
  { id: 'edict-pinot-noir', name: 'EDICT PINOT NOIR RUSSIAN RIVER VALLEY', region: 'California', sub: 'Pinot Noir 2018', left: 10, image: '', price: 42, msrp: 70 },
  { id: 'shafer-hillside-select', name: 'SHAFER HILLSIDE SELECT', region: 'California', sub: 'Cabernet Sauvignon', left: 6, image: '', price: 240, msrp: 360 },
  { id: 'cloudy-bay-sauv-blanc', name: 'CLOUDY BAY SAUVIGNON BLANC', region: 'Marlborough', sub: 'Sauvignon Blanc 2024', left: 9, image: '', price: 28, msrp: 40 },
  { id: 'daou-rose-paso-robles', name: 'DAOU ROSÉ PASO ROBLES', region: 'California', sub: 'Rose 2023', left: 16, image: '', price: 22, msrp: 30 },
  { id: 'domaine-des-perdrix', name: 'DOMAINE DES PERDRIX VOSNE-ROMANÉE', region: 'Burgundy', sub: 'Pinot Noir 2019', left: 7, image: BOTTLE_IMG.domaine, price: 110, msrp: 150 },
];

// % off the anchor (MSRP) — computed here in the data layer, not in the card.
// Returns null when there's no valid anchor, so the card hides the % OFF.
export function tickerOffPct(w: TickerWine): number | null {
  if (!w.msrp || w.msrp <= w.price) return null;
  return Math.round(((w.msrp - w.price) / w.msrp) * 100);
}

// Editable first-visit orientation line shown above the ticker for new visitors.
export const TICKER_HINT = "Rare bottles, deep cuts, limited stock. Grab one before it's gone.";

export type ShopWine = {
  id: string;
  name: string;
  maker: string;
  country: string; // newline-separated lines per prototype
  size: string;
  price: number;
  off: number;
  msrp: number;
  qty: number;
  stock: boolean;
  isPack?: boolean;
  image?: string; // real Commerce7 URL when available; falls back to /bottle.svg
};

export const SHOP: ShopWine[] = [
  {
    id: 'boatique-malbec',
    name: 'BOATIQUE MALBEC | 2016',
    maker: 'BOAT? | $BOAT…',
    country: 'Malbec\nUnited States\nCalifornia',
    size: 'Size (750ml)',
    price: 13.0,
    off: 56.67,
    msrp: 30.0,
    qty: 0,
    stock: false,
    image: BOTTLE_IMG.arkas,
  },
  {
    id: 'russian-river-royale',
    name: 'RUSSIAN RIVER ROYALE PANTOMI…',
    maker: 'Sit Down | $RRPM…',
    country: 'Pinot Noir\nUnited States\nCalifornia',
    size: 'Size (750ml)',
    price: 14.0,
    off: 74.55,
    msrp: 55.0,
    qty: 6,
    stock: true,
    image: BOTTLE_IMG.domaine,
  },
  {
    id: 'justin-isosceles',
    name: 'JUSTIN ISOSCELES | 2021',
    maker: 'Bordeaux Blend',
    country: 'United States\nCalifornia',
    size: 'Size (750ml)',
    price: 42.0,
    off: 50.59,
    msrp: 85.0,
    qty: 6,
    stock: true,
    image: BOTTLE_IMG.beauVigneCabby,
  },
  {
    id: 'sonoma-cutrer-chard',
    name: 'SONOMA-CUTRER LES PIERRES CHARDONNAY',
    maker: 'Chardonnay',
    country: 'United States\nCalifornia\nSonoma',
    size: 'Size (750ml)',
    price: 18.0,
    off: 40.0,
    msrp: 30.0,
    qty: 6,
    stock: true,
    image: BOTTLE_IMG.sonomaCutrer,
  },
  {
    id: 'beau-vigne-cabernet',
    name: 'BEAU VIGNE CABERNET',
    maker: 'Cabernet Sauvignon',
    country: 'United States\nCalifornia',
    size: 'Size (750ml)',
    price: 55.0,
    off: 31.25,
    msrp: 80.0,
    qty: 6,
    stock: true,
    image: BOTTLE_IMG.beauVigneCabby,
  },
  // --- Confirmed-live examples from /spec/SCREEN_NOTES.md ---
  {
    id: 'vina-vik-a-2021',
    name: 'VIÑA VIK "A" | 2021',
    maker: 'Bordeaux Blend',
    country: 'Chile\nColchagua',
    size: 'Size (750ml)',
    price: 22.95,
    off: 32.5,
    msrp: 34.0,
    qty: 0,
    stock: false,
    image: BOTTLE_IMG.beauVigneJuliet,
  },
  {
    id: 'flowers-rose',
    name: 'FLOWERS ROSÉ',
    maker: 'Pinot Noir',
    country: 'United States\nCalifornia\nSonoma Coast',
    size: 'Size (750ml)',
    price: 28.0,
    off: 30.0,
    msrp: 40.0,
    qty: 6,
    stock: true,
    image: BOTTLE_IMG.sonomaCutrer,
  },
  {
    id: 'belle-glos-dairyman-2022',
    name: 'BELLE GLOS DAIRYMAN | 2022',
    maker: 'Pinot Noir',
    country: 'United States\nCalifornia\nRussian River Valley',
    size: 'Size (750ml)',
    price: 29.48,
    off: 46.4,
    msrp: 55.0,
    qty: 6,
    stock: true,
    image: BOTTLE_IMG.domaine,
  },
  {
    id: 'walt-st-rita-hills',
    name: 'WALT ST. RITA HILLS',
    maker: 'Pinot Noir',
    country: 'United States\nCalifornia\nSta. Rita Hills',
    size: 'Size (750ml)',
    price: 34.99,
    off: 30.02,
    msrp: 50.0,
    qty: 6,
    stock: true,
    image: BOTTLE_IMG.domaine,
  },
  {
    id: 'belle-glos-clark-telephone',
    name: 'BELLE GLOS CLARK & TELEPHONE',
    maker: 'Pinot Noir',
    country: 'United States\nCalifornia\nSanta Maria Valley',
    size: 'Size (750ml)',
    price: 35.0,
    off: 36.36,
    msrp: 55.0,
    qty: 0,
    stock: false,
    image: BOTTLE_IMG.domaine,
  },
];

/* Winemaker Collections — confirmed examples from SCREEN_NOTES /winemaker-spotlight.
   Used by the horizontal carousel on that route. */
export const WINEMAKER_SPOTLIGHT: ShopWine[] = [
  {
    id: 'albert-joly-puligny-montrachet',
    name: 'ALBERT JOLY PULIGNY-MONTRACHET',
    maker: 'Chardonnay',
    country: 'France\nBurgundy\nPuligny-Montrachet',
    size: 'Size (750ml)',
    price: 128.0,
    off: 0.78,
    msrp: 129.0,
    qty: 6,
    stock: true,
    image: BOTTLE_IMG.sonomaCutrer,
  },
  {
    id: 'domaine-huber-verdereau-volnay-2021',
    name: 'DOMAINE HUBER-VERDEREAU VOLNAY | 2021',
    maker: 'Pinot Noir',
    country: 'France\nBurgundy\nVolnay',
    size: 'Size (750ml)',
    price: 97.0,
    off: 0,
    msrp: 97.0,
    qty: 6,
    stock: true,
    image: BOTTLE_IMG.domaine,
  },
  {
    id: 'patrice-rion-cote-nuits-villages',
    name: 'PATRICE RION CÔTE DE NUITS-VILLAGES',
    maker: 'Pinot Noir',
    country: 'France\nBurgundy\nCôte de Nuits',
    size: 'Size (750ml)',
    price: 58.0,
    off: 3.33,
    msrp: 60.0,
    qty: 6,
    stock: true,
    image: BOTTLE_IMG.domaine,
  },
  {
    id: 'arkas-cabernet-sauvignon-spotlight',
    name: 'ARKAS CABERNET SAUVIGNON',
    maker: 'Cabernet Sauvignon',
    country: 'USA\nCalifornia\nNorth Coast',
    size: 'Size (750ml)',
    price: 42.0,
    off: 30.0,
    msrp: 60.0,
    qty: 6,
    stock: true,
    image: BOTTLE_IMG.arkas,
  },
  {
    id: 'beau-vigne-cabby-spotlight',
    name: 'BEAU VIGNE "CABBY"',
    maker: 'Cabernet Sauvignon',
    country: 'USA\nCalifornia\nNapa Valley',
    size: 'Size (750ml)',
    price: 89.0,
    off: 10.1,
    msrp: 99.0,
    qty: 6,
    stock: true,
    image: BOTTLE_IMG.beauVigneCabby,
  },
  {
    id: 'beau-vigne-juliet-spotlight',
    name: 'BEAU VIGNE JULIET',
    maker: 'Cabernet Sauvignon',
    country: 'USA\nCalifornia\nNapa Valley',
    size: 'Size (750ml)',
    price: 110.0,
    off: 8.33,
    msrp: 120.0,
    qty: 6,
    stock: true,
    image: BOTTLE_IMG.beauVigneJuliet,
  },
  {
    id: 'sonoma-cutrer-les-pierres-spotlight',
    name: 'SONOMA-CUTRER LES PIERRES',
    maker: 'Chardonnay',
    country: 'USA\nCalifornia\nSonoma',
    size: 'Size (750ml)',
    price: 38.0,
    off: 5.0,
    msrp: 40.0,
    qty: 6,
    stock: true,
    image: BOTTLE_IMG.sonomaCutrer,
  },
  {
    id: 'domaine-des-perdrix-vosne-romanee-spotlight',
    name: 'DOMAINE DES PERDRIX VOSNE-ROMANÉE',
    maker: 'Pinot Noir',
    country: 'France\nBurgundy\nVosne-Romanée',
    size: 'Size (750ml)',
    price: 145.0,
    off: 3.33,
    msrp: 150.0,
    qty: 6,
    stock: true,
    image: BOTTLE_IMG.domaine,
  },
];

export const WINES_COUNT = 53; // shown in shop header, mirrors prototype copy

export type SeshOffer = {
  id: string;
  dateTag: string; // e.g. "SESH 6.17.26"
  title: string; // e.g. "JUSTIN ISOSCELES | 2021"
  ticker?: string; // e.g. "$CHBR" — the ticker symbol shown in the SESH title per ASSETS.md
  volume: string;
  livePrice: number;
  msrp: number;
  street: number;
  offMsrpPct: number;
  ratings: { src: string; score: number }[]; // e.g. [{src:'JS',score:95},{src:'WA',score:92}]
  image: string;
  description: string;
  offerDuration: string;
  inventoryPct: number;
  appellation?: string; // e.g. "Paso Robles"
  nextSeshHint?: string; // editable per-drop teaser for the closed-recap "next SESH" block
};

export const SESH_OFFERS: SeshOffer[] = [
  {
    id: 'justin-isosceles',
    dateTag: 'SESH 6.17.26',
    title: 'JUSTIN ISOSCELES | 2021',
    ticker: '$JUIS',
    volume: '750mL',
    appellation: 'Paso Robles',
    livePrice: 43.37,
    msrp: 85,
    street: 60,
    offMsrpPct: 45.79,
    ratings: [
      { src: 'JS', score: 95 },
      { src: 'WA', score: 93 },
      { src: 'WE', score: 92 },
    ],
    image: BOTTLE_IMG.beauVigneJuliet,
    description:
      "Paso's benchmark Bordeaux blend. Still nobody's caught it. Wound tight, built to age, and already dangerous. Buy it now. Justin didn't just put Paso on the map — they drew the whole map. Isosceles has been the standard since 1987 and the 2021 is not here to be friendly about it. Limestone Westside fruit, four years on lees, and a profile that says \"come back in a decade.\" Aged in 75% new French oak.",
    offerDuration: '00:36:50',
    inventoryPct: 0.5,
    nextSeshHint: "Howell Mountain. That's all we'll say.",
  },
];

export const getSeshOffer = (id: string) =>
  SESH_OFFERS.find((o) => o.id === id) ?? SESH_OFFERS[0];

/* ===== SESH closed "closing bell" recap =====
   ⚠️ PROTOTYPE: this clone has no order history or pricing-session store, so the
   recap is DERIVED deterministically from the drop's existing fields rather than
   computed from real settled prices. In production these MUST come server-side
   from the drop's actual pricing + order data (and `payingAttention` needs real
   per-order lock-price instrumentation). The modal only renders what's here. */

export type SeshRecap = {
  ticker: string;
  wineName: string;
  settled: number; // avg price paid across bottles sold
  msrpSavingsPct: number; // (msrp - settled) / msrp, whole %
  opened: number; // first print
  floor: number; // lowest the drop touched
  soldOutIn: string; // elapsed open -> sold out
  bottlesMoved: number;
  buyers: number;
  payingAttention?: number; // buyers who locked at/under the floor (optional)
  nextSeshWhen: string;
  nextSeshHint?: string;
};

// Mock campaign schedule — replace with the real next-SESH slot server-side.
export const NEXT_SESH_WHEN = 'Thursday · 12:00 PM PT';

export function getSeshRecap(offer: SeshOffer): SeshRecap {
  const settled = Math.round(offer.livePrice);
  const opened = Math.round(offer.livePrice * 1.18);
  const floor = Math.round(offer.livePrice * 0.84);
  const msrpSavingsPct = offer.msrp > 0 ? Math.round(((offer.msrp - settled) / offer.msrp) * 100) : 0;
  const bottlesMoved = 120 + (Math.round(offer.msrp) % 140);
  const buyers = Math.round(bottlesMoved * 0.7);
  const payingAttention = Math.max(0, Math.round(buyers * 0.18));
  return {
    ticker: offer.ticker ?? `$${offer.id.slice(0, 4).toUpperCase()}`,
    wineName: offer.title,
    settled,
    msrpSavingsPct,
    opened,
    floor,
    soldOutIn: offer.offerDuration,
    bottlesMoved,
    buyers,
    payingAttention,
    nextSeshWhen: NEXT_SESH_WHEN,
    nextSeshHint: offer.nextSeshHint,
  };
}
