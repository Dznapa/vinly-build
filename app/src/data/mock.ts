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
};

export const TICKER: TickerWine[] = [
  { id: 'domaine', name: 'DOMAINE DES PERDRIX VOSNE-ROMANÉE', region: 'Burgundy', sub: 'Pinot Noir 2019', left: 6, image: BOTTLE_IMG.domaine },
  { id: 'sonoma-cutrer', name: 'SONOMA-CUTRER LES PIERRES', region: 'California · Sonoma', sub: 'Chardonnay 2021', left: 4, image: BOTTLE_IMG.sonomaCutrer },
  { id: 'arkas', name: 'ARKAS CABERNET SAUVIGNON', region: 'California · North Coast', sub: 'Cabernet Sauvignon 2020', left: 6, image: BOTTLE_IMG.arkas },
  { id: 'beau-vigne-cab', name: 'BEAU VIGNE "CABBY"', region: 'California · Napa Valley', sub: 'Cabernet Sauvignon 2020', left: 3, image: BOTTLE_IMG.beauVigneCabby },
  { id: 'beau-vigne-julie', name: 'BEAU VIGNE JULIET', region: 'California · Napa Valley', sub: 'Cabernet Sauvignon 2018', left: 5, image: BOTTLE_IMG.beauVigneJuliet },
  { id: 'napa-cabby', name: 'BEAU VIGNE "CABBY" RESERVE', region: 'California · Napa Valley', sub: 'Cabernet Sauvignon', left: 2, image: BOTTLE_IMG.beauVigneCabby },
];

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
};

export const SESH_OFFERS: SeshOffer[] = [
  {
    id: 'justin-isosceles',
    dateTag: 'SESH 6.17.26',
    title: 'JUSTIN ISOSCELES | 2021',
    ticker: '$JUIS',
    volume: '750mL',
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
  },
];

export const getSeshOffer = (id: string) =>
  SESH_OFFERS.find((o) => o.id === id) ?? SESH_OFFERS[0];
