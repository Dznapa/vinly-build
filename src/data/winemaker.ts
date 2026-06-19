// NEEDS REVIEW: no screenshot in /spec/screenshots — built from spec only.
// Mock winemaker collections. Wine IDs reference SHOP entries in @/data/mock.
// Do not edit mock.ts; this file is the single source for the winemaker section.

import { SHOP, type ShopWine } from './mock';

export type Winemaker = {
  slug: string;
  name: string;
  region: string;
  founded: string;
  tagline: string;
  bio: string;
  wineIds: string[];
};

export const WINEMAKERS: Winemaker[] = [
  {
    slug: 'justin',
    name: 'Justin Vineyards',
    region: 'Paso Robles, California',
    founded: '1981',
    tagline: 'Limestone Westside. Bordeaux discipline.',
    bio: "Justin didn't just put Paso on the map — they drew the whole map. Built on limestone Westside soils, the house has been a benchmark for Bordeaux-style blends in California for four decades. Isosceles has been the standard since 1987, and every vintage since has been wound tight, built to age, and quietly ruthless.",
    wineIds: ['justin-isosceles'],
  },
  {
    slug: 'beau-vigne',
    name: 'Beau Vigne',
    region: 'Napa Valley, California',
    founded: '2002',
    tagline: 'Small-lot Napa Cab with attitude.',
    bio: 'Beau Vigne built its reputation on micro-production Cabernet sourced from a handful of Napa hillside blocks. Concentrated, polished, and unapologetic — the kind of bottle that makes a steakhouse list look small.',
    wineIds: ['beau-vigne-cabernet'],
  },
  {
    slug: 'sonoma-cutrer',
    name: 'Sonoma-Cutrer',
    region: 'Russian River Valley, California',
    founded: '1973',
    tagline: 'California Chardonnay, defined.',
    bio: 'Few houses have shaped American Chardonnay like Sonoma-Cutrer. Cool-climate Russian River fruit, sur-lie aging, and a fifty-year stretch of dialing in the same wine until it stopped being a wine and started being a category.',
    wineIds: ['sonoma-cutrer-chard'],
  },
  {
    slug: 'boatique',
    name: 'Boatique Winery',
    region: 'Lake County, California',
    founded: '2014',
    tagline: 'High-elevation Malbec. Off the beaten map.',
    bio: 'Boatique works volcanic, high-elevation Lake County sites that almost nobody plants seriously. The Malbec drinks like it was airlifted out of Mendoza and dropped into a glass — dark fruit, mountain grip, and zero apology for the price.',
    wineIds: ['boatique-malbec'],
  },
  {
    slug: 'russian-river-royale',
    name: 'Russian River Royale',
    region: 'Russian River Valley, California',
    founded: '1998',
    tagline: 'Cult Pinot. Tiny allocations.',
    bio: 'Pantomime-tier allocations from a producer that refuses to scale. Whole-cluster Pinot Noir from a half-dozen Russian River blocks, picked early, aged long, and shipped only to people who already know.',
    wineIds: ['russian-river-royale'],
  },
  {
    slug: 'vinly-house',
    name: 'Vinly House Cellars',
    region: 'Curated, Multi-Region',
    founded: '2024',
    tagline: 'House picks. The shortcuts we share.',
    bio: 'Our in-house buyers go deep on producers who never make it to a national distributor. The House collection is a rotating set of those drops — pulled together as a starter pack so you can taste a region in a single shipment.',
    wineIds: ['cool-pack'],
  },
];

export function getWinemaker(slug: string): Winemaker | undefined {
  return WINEMAKERS.find((w) => w.slug === slug);
}

export function getWinesForMaker(maker: Winemaker): ShopWine[] {
  return maker.wineIds
    .map((id) => SHOP.find((w) => w.id === id))
    .filter((w): w is ShopWine => Boolean(w));
}
