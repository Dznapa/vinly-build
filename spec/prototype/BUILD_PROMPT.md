# Build prompt — Vinly front-end clone (Next.js)

Paste this to your build agent/team. Goal: a **pixel-faithful, click-through clone of the Vinly
front end**, running on `localhost`, with **no real backend** — all data mocked, all state local.
This is a design/spec target the owners will screenshot to direct the production dev team. Match the
live site (`vinlywine.com`) exactly; do not redesign or "improve" anything.

## Stack & constraints
- Next.js (App Router) + TypeScript + plain CSS Modules or Tailwind — your call, but **match the
  exact look**. Font: **League Spartan** (Google Fonts).
- No database, no auth provider, no Stripe/Commerce7. Mock everything with local JSON + React state.
- User/qualification state (`anonymous | signed_in | sesh_qualified`) held in a React context/provider
  and switchable from a small dev-only toolbar so reviewers can screenshot each state.
- Runs with `npm run dev` on `localhost:3000`. Not deployed anywhere public.

## Design tokens (captured from production — use exactly)
```
--navy:        #14355F   /* page background */
--navy-deep:   #0E2647   /* panels, footer, timeframe buttons */
--navy-panel:  #1B4A7A   /* SESH IPO panel, ticker cards */
--orange:      #F26A35   /* primary buttons, accents, logo */
--green:       #0EAD25   /* prices, "off MSRP", FULL */
--cyan:        #39B0E5   /* ticker wine names, "Read more", Create Account btn */
--text-gray:   #4F4F4F   /* body text on white cards */
font-family:   "League Spartan"
button radius: 8px ; card radius: 14px
```

## Global chrome (every page)
- **Header** (navy): `vinly` orange wordmark (left) · center "NEW TO VINLY? START HERE" (START HERE
  orange) · right icon row in orange: SESH/chart-line, Shop/bottles, Winemaker/star-in-circle,
  Cart (with count badge), vertical divider, Account/person. The center bar hides once signed in.
- **Ticker** (below header): horizontally auto-scrolling row of cards, left/right green chevrons.
  Card = small bottle image · cyan wine name (truncated) · region + varietal/year · footer row
  "Bottles Left: N" (N in orange) and a circular white "+". Faint green sparkline behind each card.
  Sticky to top while scrolling on the pages where it appears (incl. cart). Must animate on mobile too.
- **Footer** (deep navy): `vinly` wordmark · three link columns (Log in, Customer Service / FAQ,
  Shipping & Returns, About Vinly / Privacy & Legal, ADA, Terms and Conditions) in underlined orange ·
  TikTok, Instagram, Facebook icons.

## Routes / screens
1. **`/shop`** (default landing for anonymous + non-qualified signed-in users)
   - Centered hero: "↑ MOVING FAST. WATCH THE TICKER. ↑" / "↓ FIXED PRICES. DEEP CUTS. ↓" (white).
   - Row: orange funnel "SORT" · rounded white search box ("Search wines…") · orange "SEARCH" ·
     "WINES : N" in orange (right).
   - Rounded `--navy-panel` container holding a 3-column grid of **white** wine cards:
     bottle image (left) · name · varietal / country / region / "Size (xxxml)" · green price ·
     "( x% Off MSRP )" green with red strikethrough MSRP · qty stepper (− n +) · orange ADD TO CART.
     Out-of-stock cards show red "OUT OF STOCK" instead of the stepper/button.
2. **`/current-offer/[id]`** (SESH page; default landing for SESH-qualified users)
   - Title row: "SESH M.D.YY {WINE NAME}" (date tag in orange).
   - **Left, IPO panel** (`--navy-panel`): "VINLY SESH IPO" + price block.
     - **Gated (anonymous / signed-in non-qualified):** price text rendered but **blurred**
       (`color:transparent; text-shadow:0 0 18px <green>`), plus orange button
       "Get SESH Qualified - Unlock to View". The price chart's **green live line is absent**;
       only the axes + dashed MSRP and Street Price lines render. **Gate server-side in real product**
       (here just don't put the value in the DOM).
     - **Qualified:** real live price (e.g. `$43.37`), `45.79% Off of MSRP`, green live line visible
       and streaming, BUY NOW (orange) available.
     - Price chart: y-axis $0–$99, dashed MSRP line labeled "$85 MSRP", dashed Street line labeled
       "$60 STREET PRICE", jagged green live-price line with a dot on the latest point, "Elapsed Time
       (HH:MM:SS)" caption, timeframe buttons [30 Sec][1 Min][5 Min][15 Min][30 Min][Hour][All]
       (active = light-blue fill), "Offer Duration: HH:MM:SS" in green (right).
   - **Right, detail card** (white): bottle image · name · "750mL" · rating chip ("WE" navy box +
     orange score box) · description with "Read more".
   - **Lower-left, Inventory panel** (`--navy-deep`): "INVENTORY" + green "Load Up" + half-circle
     gauge (red→yellow→green arc, blue needle, EMPTY / FULL labels).
   - **Lower-right:** gated → "LOGIN/SIGNUP TO EXPLORE" card + "Not your glass of wine? SKIP THIS SESH".
     qualified → BUY NOW + quick-buy flow.
3. **`/register_details`** (Sign up) — white centered card:
   - "Contact Information": underline-style inputs First Name, Last Name, Email Address, Phone Number.
   - "Password": Create Password, Verify Password.
   - "*Birth Date": Month / Day / Year selects in a row.
   - Checkboxes: "I am over 21 years of age", "Agree to terms and conditions" (link orange),
     "Yes - send me Vinly Ticker and New Drop alerts" (**defaults checked**).
   - Helper text about becoming a member vs. providing billing/shipping for SESH.
   - Two buttons: **CREATE ACCOUNT** (cyan/blue) and **ADD BILLING & SHIPPING** (orange).
4. **Still to capture & build** (ask owner for screenshots, then match): Winemaker Collections,
   Cart / Edit Cart, Billing & Shipping ("Consolidated Order Summary"), Order Summary (itemized
   subtotal / shipping / tax / total), SESH & Ticker **quick-buy popovers** (15-min lock timer,
   cancellation limits, "Locked In — 15 minutes left"), Profile (with SESH-qualification status),
   and the **Admin panel** (`/admin`).

## Key behaviors to mirror (from owner spec)
- Landing logic: anonymous + non-qualified → `/shop`; SESH-qualified → SESH page.
- SESH page is publicly viewable but **gated**: price + %off + live chart line hidden until qualified.
- "WANT IN? →" / "Get SESH Qualified" CTAs and any blurred element route to the qualification flow.
- Ticker/SESH purchases are quick-buy with a 15-minute lock window; Shop/Winemaker use a normal cart.
- Free ground shipping at 6+ bottles; flat shipping under 6.
- Sticky "NEW TO VINLY? START HERE" bar hides once signed in.

## Acceptance
- Side-by-side against the owner's screenshots, each screen matches in layout, color, type, spacing.
- All three user states are screenshot-able via the dev toolbar.
- Everything runs locally; nothing calls a real API or is deployed.
```
