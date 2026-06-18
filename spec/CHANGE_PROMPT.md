# Change prompt — fidelity pass (paste into the orchestrator)

The first build is close but using placeholder assets and mocked motion. Fix it to match the live
site exactly. NEW source of truth: `/spec/ASSETS.md` (real asset URLs, fonts, icons, ticker +
chart behavior) and `/spec/SCREEN_NOTES.md`. Paste this whole block:

```
Fidelity pass on the Vinly clone. Read /spec/ASSETS.md and /spec/SCREEN_NOTES.md first — they
have the REAL asset URLs and exact behavior. Also fetch the PUBLIC marketing site
https://vinly.wine/ directly (it is not gated) and copy its real structure, CSS, fonts, icons,
imagery, and motion/animation patterns wherever they apply. Make these changes:

1) LOGO: replace the placeholder wordmark with the real logo
   https://vinly.wine/assets/images/logotop.png (fallback https://vinlywine.com/images/logo-update.png).
   If remote load is flaky, download it into /public and reference locally.

2) BOTTLE IMAGES: replace the placeholder SVG bottles with the real Commerce7 CDN images
   (public, base https://images.commerce7.com/world-of-wine-sandbox/images/original/...). Use the
   real sample URLs in ASSETS.md in the mock data so actual labels render. Fetch more from the live
   shop/ticker if needed.

3) FONTS: load League Spartan + Mulish (the site's "Muli") from Google Fonts and FontAwesome from
   CDN (links in ASSETS.md). Use League Spartan for headings/accents, Mulish for body, FontAwesome
   for all icons (ticker chevrons fa-angle-left/right, ticker add fa-plus-circle, header row icons).

4) TICKER (currently static — must scroll): rebuild as a CSS marquee using the live structure
   .slider > .slide-track > .slide. Duplicate the card list twice and animate the track with
   @keyframes scroll { to { transform: translateX(-50%) } } at ~40s linear infinite; pause on hover;
   chevrons nudge the offset. Must animate on mobile too (use transform, iOS-safe). Each card =
   real bottle thumb · cyan name · region · varietal/year · "Bottles Left: N" (N orange) · ⊕.

5) CHART: render with Recharts or Chart.js. y-axis $0–$99. Two dashed reference lines with dark pill
   labels "$XX MSRP" and "$XX STREET PRICE". A green jagged live-price line that streams new points
   and ends in a dot — shown ONLY in the qualified state; in the gated state show axes + the two
   dashed lines only (no green line). Timeframe buttons [30 Sec][1 Min][5 Min][15 Min][30 Min][Hour]
   [All] switch the window (active = light-blue fill). "Offer Duration: HH:MM:SS" in green, bottom-right.
   CHART MOVEMENT — make it clean and stock-market-like (think a modern trading/Nutmeg-style UI),
   NOT the current jittery look: use a smooth line (monotone/curved), a subtle area gradient fill
   under it, light gridlines, and animate only the newest point sliding in from the right while the
   history stays STABLE (do not re-randomize past points on every tick — that's the current bug).
   Each timeframe (30 Sec / 1 / 5 / 15 / 30 Min / Hour / All) shows its own pre-generated, stable
   series at the right density (more points = longer window) and updates smoothly. Fake/synthetic
   data is fine for now — it just needs to look real, move cleanly, and never jump its history.

6) SESH QUALIFIED STATE (reference: live screenshot): title "SESH M.D.YY {NAME} | {YEAR}" with the
   ticker symbol in the name (e.g. "$CHBR"). IPO panel shows real price (e.g. $11.25) and
   "(82.69%) Off of MSRP" in green, green live line visible. Wine card shows real bottle, "750mL",
   multi-source ratings line (e.g. "95 JS · 92 WA · 92 WE"), description + "Read more" (cyan).
   GATED STATE: price + %off blurred, "Get SESH Qualified - Unlock to View" button, no green line,
   and the lower-right card shows "LOGIN/SIGNUP TO EXPLORE" + "Not your glass of wine? SKIP THIS SESH".

7) INVENTORY gauge: half-circle, red→yellow→green arc, blue needle, EMPTY/FULL labels, "INVENTORY"
   + green status ("Load Up").

8) HERO copy differs by page: Shop = "↑ MOVING FAST. WATCH THE TICKER. ↑ / ↓ FIXED PRICES. DEEP
   CUTS. ↓"; Winemaker (/winemaker-spotlight, a horizontal carousel of large tiles) = "↑ LIVE
   MARKET ABOVE. DON'T BLINK. ↑ / ↓ HAND-PICKED BY THE MAKER. ↓".

9) Keep the dev-only user-state toolbar (anonymous | signed_in | sesh_qualified).

WHERE A REAL SCREENSHOT/REFERENCE IS MISSING (Profile, Billing & Shipping, Order Summary, quick-buy
popovers, Admin): build your best-match from the spec, make it look and behave the way it should,
and flag it "NEEDS REVIEW" so the owner can confirm. Prioritize getting the live look exact for the
screens we have references for. When done, run npm run dev, fix all console/build errors, and give
me a short checklist of what now matches the live site and what is still NEEDS REVIEW.
```
