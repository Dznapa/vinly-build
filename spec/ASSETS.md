# Vinly — real asset manifest (extracted from the live site)

Use these REAL assets instead of placeholders. Most load directly by URL.

## Logo (use the public one)
- **Public (recommended):** `https://vinly.wine/assets/images/logotop.png` — the orange "vinly"
  wordmark, served from the un-gated marketing site, fetches fine on localhost.
- App copy (may sit behind the site gate): `https://vinlywine.com/images/logo-update.png`.
  If either 404s on localhost, save it from the browser into `public/`.

## vinly.wine — public reference site (fetch it directly)
`https://vinly.wine/` is the PUBLIC marketing homepage ("Join the Wine Rebellion"). It is NOT
gated, so agents may fetch it directly (WebFetch/curl) to copy exact structure, markup, CSS, and
the motion/animation patterns. Pull its stylesheet and inspect its `assets/` folder for fonts,
icons, and imagery. Treat it as a second source of truth alongside the gated app.

## Product / bottle images — PUBLIC Commerce7 CDN (load directly, no auth)
Base: `https://images.commerce7.com/world-of-wine-sandbox/images/original/<slug>_1000x3600-<id>.jpg`
Real samples (use these in mock data so the actual labels render):
```
https://images.commerce7.com/world-of-wine-sandbox/images/original/domaine-des-perdrix-vosne-romane-2019_1000x3600-1775101074253.jpg
https://images.commerce7.com/world-of-wine-sandbox/images/original/2021-sonoma-cutrer-les-pierres-sonoma-chard_1000x3600-1776222310552.jpg
https://images.commerce7.com/world-of-wine-sandbox/images/original/arkas-cabernet-sauvignon-north-coast-2020-750_1000x3600-1776221651240.jpg
https://images.commerce7.com/world-of-wine-sandbox/images/original/beau-vigne-cabby--cabernet-sauvignon-napa-valley-2020-750_1000x3600-1776221538013.jpg
https://images.commerce7.com/world-of-wine-sandbox/images/original/beau-vigne-juliet-cabernet-sauvignon-napa-valley-2018-750_1000x3600-1776221566208.jpg
```
(To collect more: open the live site, DevTools ▸ Network ▸ filter "commerce7", copy the image URLs.)

## Fonts (the live site self-hosts these; load the equivalents from Google Fonts / CDN)
- Body/UI: **Muli** (bold / semibold / regular / light) → on Google Fonts as **"Mulish"**.
- Headings/accents: **League Spartan** (regular / semibold / medium / light) → Google Fonts "League Spartan".
- Icons: **FontAwesome** (the live site uses FA classes — see below).
```html
<link href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@300;400;500;600;700;800&family=Mulish:wght@300;400;600;700&display=swap" rel="stylesheet">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
```

## Icons (FontAwesome classes confirmed / recommended)
- Ticker chevrons: `fa fa-angle-left`, `fa fa-angle-right`
- Ticker "add": `fa fa-plus-circle`
- Header row (match by eye; closest FA): chart `fa-chart-line`, shop `fa-wine-bottle`,
  winemaker `fa-star`, cart `fa-cart-shopping`, account `fa-user`. (Inspect the live header to confirm exact glyphs.)

## Ticker = CSS marquee (this is why it "doesn't move" in the current build)
Live DOM structure: `.slider > .slide-track > .slide` (each `.slide` is one wine card).
It scrolls with a CSS keyframe animation translating the track, NOT JS. Rebuild it as:
```css
.slide-track{ display:flex; width:max-content; animation:scroll 40s linear infinite; }
.slider:hover .slide-track{ animation-play-state:paused; }
@keyframes scroll{ from{transform:translateX(0)} to{transform:translateX(-50%)} }
```
Duplicate the card list twice inside `.slide-track` so the loop is seamless. Chevrons nudge the
offset. Must run on mobile too (the live site had a bug where it froze on iOS Safari — don't repeat it;
use `transform` animation which is iOS-safe).

## Chart (SESH price chart)
Render with a real chart lib (Recharts or Chart.js). y-axis $0–$99. Two dashed horizontal
reference lines with dark pill labels: "$85 MSRP" and "$60 STREET PRICE". The green jagged
**live-price line** streams new points over time and is shown ONLY in the qualified state; in the
gated state render axes + the two dashed lines only (no green line). Timeframe buttons
[30 Sec][1 Min][5 Min][15 Min][30 Min][Hour][All] change the window (active = light-blue fill).

## Inventory gauge
Half-circle gauge, arc red→yellow→green, blue needle, "EMPTY" (red, left) / "FULL" (green, right),
heading "INVENTORY" + green status word ("Load Up").

## Colors (confirmed)
navy `#14355F` · deep navy `#0E2647` · panel `#1B4A7A` · orange `#F26A35` · green `#0EAD25` ·
cyan `#39B0E5` · body text `#4F4F4F`.
