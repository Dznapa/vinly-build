# Vinly — local UI/UX prototype

A self-contained, **editable** local copy of the Vinly front end, rebuilt from the live site
(`vinlywine.com`) for spec and iteration. It is **not** the real product: there is no backend,
no real inventory, no payments, and nothing here is published. Use it to dial in exactly how you
want screens to look and behave, then screenshot it for the dev team.

> Note: a `node_modules/` folder may sit next to these files from a tooling step. Ignore/delete it —
> it is not part of the prototype. The prototype is only the files listed below.

## What's included
- `index.html` — Shop page (ticker, search/sort, wine grid, add-to-cart, out-of-stock)
- `sesh.html` — SESH page (IPO price panel, live price chart, MSRP/Street reference lines,
  timeframe buttons, offer-duration timer, inventory gauge, wine detail card)
- `signup.html` — Sign-up / registration (contact info, password, birth date, opt-ins,
  Create Account / Add Billing & Shipping)
- `assets/styles.css` — all styling + the captured design tokens
- `assets/app.js` — shared header / ticker / footer + chart, gauge, ticker motion, state toggle
- `assets/*.svg` — placeholder bottle / pack art

## How to run it on localhost
Open a terminal in this folder and run **one** of these:

    python3 -m http.server 8080
    # then open http://localhost:8080

or, if you have Node:

    npx serve .

(You can also just double-click `index.html`, but running a tiny server makes fonts and the
ticker/chart behave exactly like a hosted site.)

## The SESH gated ↔ qualified toggle
The SESH page has the single most-discussed behavior in your dev thread: what a **non-qualified**
user sees (blurred price + "Get SESH Qualified") vs. a **SESH-qualified** user (live price + BUY NOW).
A small dark control bar at the bottom of `sesh.html` lets you flip between the two states so you can
screenshot each one for the team. That bar is prototype-only — it does not exist on the real site.

## How to edit (no coding required for most changes)
- **Text, prices, wording, links:** open the `.html` files (or the data arrays at the top of
  `assets/app.js`) and change the words directly.
- **Colors, spacing, fonts, button shapes:** edit the variables at the top of `assets/styles.css`
  (e.g. `--orange`, `--navy`, `--radius`).
- **Header / ticker / footer** are generated once in `assets/app.js` so a single edit updates every page.

## Captured design tokens (from the live site)
| Token | Value |
|---|---|
| Page navy | `#14355F` |
| Deep navy (panels/footer) | `#0E2647` |
| Orange (buttons/accents) | `#F26A35` |
| Green (prices) | `#0EAD25` |
| Body text gray | `#4F4F4F` |
| Font | League Spartan |
| Button radius | 8px |

## Fidelity notes / next passes
- The bottle images and the exact `vinly` logo wordmark are placeholders — drop in the real assets
  to make it pixel-identical.
- Screens still to add for a full clone: Winemaker Collections, Cart / Edit Cart, Billing & Shipping,
  Order Summary, the SESH/Ticker quick-buy popovers, Profile, and the Admin panel.
- If you want the full, production-grade rebuild, hand `BUILD_PROMPT.md` to your Next.js agent team.
