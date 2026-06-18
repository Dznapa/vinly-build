# Vinly — observed screen notes (live site, captured 2026-06-17)

Written reference for the build agents, taken from the live `vinlywine.com` in the **anonymous**
(not-logged-in) state. Pair this with screenshots in `/spec/screenshots/`. Anything marked
"NEEDS LOGIN" was not observable without signing in and should be built from the spec/prototype
and flagged NEEDS REVIEW until the owner supplies a screenshot.

## Confirmed routes
| Route | Screen |
|---|---|
| `/shop` | Shop (default landing for anonymous / non-qualified) |
| `/winemaker-spotlight` | Winemaker Collections (horizontal carousel) |
| `/current-offer/[id]` | SESH page (gated vs qualified) |
| `/register_details` | Sign up |
| `/customer-cart` | Cart |
| `/admin` | Admin panel — NEEDS LOGIN (separate admin auth) |
| any unknown path | 404 page |

Account icon (top-right) when anonymous → dropdown with **Login** / **Signup**.
A site-wide password gate (`/site-access`) sits in front of everything in this pre-launch phase.

## Global chrome
- **Header** navy `#14355F`: `vinly` orange wordmark · center "NEW TO VINLY? START HERE"
  (START HERE orange) · right orange icons: chart-line (SESH), bottles (Shop), star-in-circle
  (Winemaker), cart w/ count badge, thin vertical divider, person (account). Active page icon
  appears filled/highlighted (e.g. star filled on Winemaker, cart filled on Cart).
- **Ticker** under header: auto-scrolling cards, green ‹ › chevrons. Card = bottle thumb · cyan
  name (truncated "…") · region line · varietal + year · "Bottles Left: N" (N orange) · white ⊕.
  Faint green sparkline behind each card.
- **Footer** deep navy `#0E2647`: `vinly` wordmark · 3 underlined-orange link columns
  [Log in / Customer Service] [FAQ / Shipping & Returns / About Vinly]
  [Privacy & Legal / ADA / Terms and Conditions] · TikTok, Instagram, Facebook icons.

## /shop
- Hero (white, centered): "↑ MOVING FAST. WATCH THE TICKER. ↑" / "↓ FIXED PRICES. DEEP CUTS. ↓"
- Controls row: orange funnel "SORT" · centered rounded white search ("Search wines…") ·
  orange "SEARCH" · "WINES : 53" orange (right).
- Rounded `#1B4A7A` panel with a 3-col grid of white wine cards. Card = bottle image (left) ·
  name (dark gray, ~22px) · maker tagline · varietal / country / region · "Size (xxxml)" ·
  green price (~30px) · "( x% Off MSRP )" green with red strikethrough MSRP · qty stepper (− n +)
  · orange ADD TO CART. **Out of stock** cards replace stepper+button with red "OUT OF STOCK".
- Real examples seen: Cool Pack $13.00 (0% off, qty 6); Boatique Malbec 2016 $13.00 (56.67% off,
  $30 MSRP, OOS); Russian River Royale $14.00 (74.55% off, $55); Viña Vik "A" 2021 $22.95
  (32.50% off, $34, OOS); Flowers Rosé $28.00 (30% off, $40); Belle Glos Dairyman 2022 $29.48
  (46.40% off, $55); Walt St. Rita Hills $34.99 (30.02% off, $50); Belle Glos Clark & Telephone
  $35.00 (36.36% off, $55, OOS). 53 wines total.

## /winemaker-spotlight
- Same header/ticker. Hero text **changes** to:
  "↑ LIVE MARKET ABOVE. DON'T BLINK. ↑" / "↓ HAND-PICKED BY THE MAKER. ↓"
- Content is a **horizontal-scroll carousel** of LARGER white tiles (not a 3-col grid):
  big bottle image on white (top) · name (dark, centered) · maker tagline · varietal · country ·
  region · green price · "( x% Off MSRP )" · red strikethrough MSRP · qty stepper + ADD TO CART.
- Examples: Albert Joly Puligny-Montrachet $128.00 (0.78% off, $129); Domaine Huber-Verdereau
  Volnay 2021 $97.00 (0% off, $97); Patrice Rion Côte de Nuits-Villages $58.00 (3.33% off, $60).

## /current-offer/[id]  (SESH page)
- Title row centered: "SESH M.D.YY  {WINE NAME}" with the SESH date tag in orange
  (seen: "SESH 6.17.26 JUSTIN ISOSCELES | 2021").
- **Left, "VINLY SESH IPO" panel** (`#1B4A7A`):
  - Gated (anonymous / non-qualified): price + "% Off of MSRP" rendered but **blurred**
    (transparent text + green glow), orange button "Get SESH Qualified - Unlock to View".
    Chart shows axes + dashed MSRP and Street lines only — **no green live line**.
  - Qualified (NEEDS LOGIN to confirm): real price (e.g. $43.37), "45.79% Off of MSRP",
    green live line streaming, BUY NOW available.
  - Chart: y-axis $0–$99; dashed line labeled "$85 MSRP"; dashed line labeled "$60 STREET PRICE";
    jagged green live-price line with dot on latest point; caption "Elapsed Time (HH:MM:SS)";
    timeframe buttons [30 Sec][1 Min][5 Min][15 Min][30 Min][Hour][All] (active = light-blue
    fill, dark text); "Offer Duration: 00:36:50" green, right-aligned.
- **Right, wine detail card** (white): bottle image · name · "750mL" · rating chip
  (navy "WE" box + orange score box, e.g. 93) · description paragraph · "Read more" (cyan).
- **Lower-left, Inventory panel** (`#0E2647`): "INVENTORY" + green "Load Up" + half-circle gauge
  (red→yellow→green arc, blue needle, "EMPTY" red left / "FULL" green right).
- **Lower-right** (white): gated → "LOGIN/SIGNUP TO EXPLORE" button + divider +
  "Not your glass of wine?  SKIP THIS SESH" (gray button). Qualified → BUY NOW + quick-buy flow.

## /register_details  (Sign up)
- "Sign up" white title, centered white card.
- "Contact Information": underline-style inputs First Name, Last Name, Email Address, Phone Number.
- "Password": Create Password, Verify Password (underline inputs).
- "*Birth Date": three inline selects Month (January) / Day (01) / Year (2005).
- Checkboxes: "I am over 21 years of age"; "Agree to terms and conditions" (link orange);
  "Yes - send me Vinly Ticker and New Drop alerts" (**defaults CHECKED**, orange check).
- Helper text: "Click SIGN UP to become a Vinly Member now. To purchase or participate in the
  SESH you will need to provide billing and shipping information."
- Buttons: **CREATE ACCOUNT** (cyan/blue) and **ADD BILLING & SHIPPING** (orange).

## /customer-cart  (Cart)
- Header + ticker + footer present (ticker sticky). Centered "CART" heading (white).
- White panel with table header row (light gray): **Item | Title | Quantity | Total**.
- Empty state message: "Your cart is waiting — add some wines to fill it up!"
- Gray "KEEP SHOPPING" button, bottom-right of the panel.

## 404 page
- Deep-navy full screen, centered: "**404** | NOT FOUND".

## NEEDS LOGIN / owner screenshots required
SESH **qualified** state, Profile (with SESH-qualification status + billing/card on file),
Billing & Shipping ("Consolidated Order Summary"), Order Summary (itemized), the SESH & Ticker
**quick-buy popovers** (15-min lock timer, "Locked In — 15 minutes left", cancellation limits),
and the **Admin panel** (`/admin`). Owner should sign in and screenshot these into
`/spec/screenshots/` so the agents can match them exactly.
