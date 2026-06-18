# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A pixel-faithful, click-through **UI/UX clone** of the Vinly wine site (`vinlywine.com`), rebuilt for spec and iteration. It is **not** the production codebase: there is no backend, no real auth, no payments, nothing deployed. All "live" behavior (auth, cart, profile, orders, inventory, SESH price) is mocked in the browser via React Context + `localStorage`. Treat fidelity to the live site as the goal; the `spec/` docs are ground truth.

## Commands

All commands run from the `app/` directory (not the repo root):

```bash
cd app
npm install
npm run dev        # dev server on http://localhost:3000
npm run build      # next build
npm run start      # serve production build on :3000
npm run lint       # next lint
npm run typecheck  # tsc --noEmit (strict mode)
```

There is no test suite. Validate changes with `npm run typecheck` and `npm run lint`, then visually in the browser. Requires Node 20 LTS.

## Architecture

Next.js 14 **App Router** + TypeScript (strict). Import alias `@/*` → `app/src/*`.

**Two halves of the repo:**
- `app/` — the actual Next.js UI.
- `spec/` — ground-truth docs and reference. Read these before making UI changes: `BUILD_PROMPT.md` (brief + design tokens), `SCREEN_NOTES.md` (per-screen notes from the live site), `ASSETS.md` (real logo/font/CDN-image URLs), `CHANGE_PROMPT.md` (fidelity-pass updates). `spec/prototype/` is the original static HTML/CSS/JS prototype the React app was ported from — useful for exact behavior/styling reference.

**State lives in three React Contexts, all client-side and `localStorage`-persisted** (composed in `app/src/app/layout.tsx`, wrapping every page):
- `UserStateContext` (`vinly:userState`) — the global user state: `'anonymous' | 'signed_in' | 'sesh_qualified'`. This drives most conditional UI, especially SESH gating (non-qualified users see a blurred price + "Get SESH Qualified"; qualified users see the live price + BUY NOW).
- `CartContext` (`vinly:cart`) — cart items + derived subtotal/shipping/total. Free ground shipping at 6+ bottles (`FREE_SHIP_THRESHOLD`).
- `ProfileContext` (`vinly:profile`) — one blob for the signed-in account: profile, addresses, payment cards, orders, prefs.

All three follow the same pattern: `useState` seeded empty → hydrate from `localStorage` in a mount `useEffect` → expose a `hydrated` flag. **Gate any UI that depends on persisted state on `hydrated`** to avoid SSR/client hydration mismatches.

**Mock data** is centralized in `app/src/data/mock.ts` (shop catalog `SHOP`, `TICKER`, `WINEMAKER_SPOTLIGHT`, `SESH_OFFERS`) and `app/src/data/winemaker.ts`. Bottle images are real public Commerce7 sandbox CDN URLs (`BOTTLE_IMG`), with `/bottle.svg` / `/pack.svg` as fallbacks. Remote image hosts must be allowlisted in `app/next.config.js` (`images.remotePatterns`).

**Shared chrome:** wrap page content in `PageChrome` (renders `Header` + `Ticker` + `Footer`; pass `ticker={false}` for routes like signup/admin). The `DevToolbar` (bottom bar on every page) flips `userState` between the three values for screenshotting each state — it is prototype-only and does not exist on the live site.

**Styling:** global tokens and base styles in `app/src/styles/globals.css`; per-route styles use co-located CSS Modules (`*.module.css`). Captured design tokens — page navy `#14355F`, deep navy `#0E2647`, orange `#F26A35`, price green `#0EAD25`, body gray `#4F4F4F`; fonts League Spartan (headings) + Mulish (body) loaded via Google Fonts in `layout.tsx`; button radius 8px.

## Conventions

- Components/contexts that use hooks or browser APIs need `'use client'` at the top (App Router defaults to Server Components).
- Where a real value couldn't be confirmed from the live site, the code carries a `NEEDS REVIEW:` comment (e.g. the flat shipping rate in `CartContext`). Preserve these markers until the owner confirms the real value; don't silently invent numbers.
- Use branches + PRs; don't push directly to `main`.
