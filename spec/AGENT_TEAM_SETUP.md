# Vinly — tmux + Claude agent-team setup

This spins up a Claude orchestrator in tmux that builds a **pixel-faithful, editable Next.js
clone** of the Vinly front end on `localhost:3000`. It is a faithful rebuild from the spec +
screenshots, not the production source code (that lives on the dev team's server and can't be
pulled). You edit the replica exactly as if it were the live codebase.

## URLs
- Next.js app the agents build → **http://localhost:3000**
- Static reference prototype → **http://localhost:8080** (`cd vinly-clone && python3 -m http.server 8080`)

## Files to drop into the workspace (ground truth for the agents)
```
~/vinly-build/
  spec/
    BUILD_PROMPT.md         # the brief (from the vinly-clone folder)
    prototype/              # the whole vinly-clone folder (visual + exact tokens)
    screenshots/            # PNGs of the live site for each screen
  app/                      # the Next.js app the agents create
```

## Commands (copy-paste, in order)
```bash
# one-time: tmux
brew install tmux

# workspace
mkdir -p ~/vinly-build/spec/screenshots
cd ~/vinly-build

# drop in reference files (adjust source path to where you saved vinly-clone)
cp -R ~/Downloads/vinly-clone ~/vinly-build/spec/prototype
cp ~/vinly-build/spec/prototype/BUILD_PROMPT.md ~/vinly-build/spec/BUILD_PROMPT.md
# save your live-site screenshots into ~/vinly-build/spec/screenshots/

# start tmux + Claude orchestrator
tmux new -s vinly
cd ~/vinly-build
claude
```
Watch the dev server in a second pane: `Ctrl-b` then `"`, then `cd ~/vinly-build/app && npm run dev`.
Detach from tmux anytime with `Ctrl-b` then `d`; reattach with `tmux attach -t vinly`.

## Orchestrator prompt (paste into Claude once running)
```
You are the lead engineer and orchestrator for rebuilding the Vinly front end as a
local, editable Next.js app. GROUND TRUTH: /spec/BUILD_PROMPT.md and the reference
prototype in /spec/prototype (open its .html files and assets/styles.css for the exact
colors, fonts, layout, and behavior), plus any images in /spec/screenshots.

GOAL: a pixel-faithful, click-through clone running on http://localhost:3000 with NO
backend. Mock all data with local TypeScript/JSON. Hold user state
(anonymous | signed_in | sesh_qualified) in a React context, switchable from a dev-only
toolbar so each state can be screenshotted. Do NOT redesign or "improve" anything —
match the live site exactly.

WORK IN TWO PHASES.
Phase 1 (you do this yourself, first): scaffold Next.js (App Router, TypeScript, src dir)
in /app; create the global design tokens/CSS straight from /spec/prototype/assets/styles.css;
build the shared Header, Ticker, and Footer components and the user-state context + routing
(anonymous -> /shop, sesh_qualified -> SESH page).

Phase 2: spawn parallel subagents, one per area, each building its route to match the spec
and prototype and importing the shared components/tokens:
  1  Shop  /shop
  2  SESH page - gated (non-qualified) state  /current-offer/[id]
  3  SESH page - qualified (unlocked) state, same route, state-driven
  4  Sign up  /register_details
  5  Winemaker Collections
  6  Cart / Edit Cart
  7  Billing & Shipping ("Consolidated Order Summary")
  8  Order Summary (itemized subtotal/shipping/tax/total)
  9  SESH & Ticker quick-buy popovers (15-min lock timer, cancellation limits)
  10 Profile (with SESH-qualification status)
  11 Admin panel  /admin
  12 Price chart + inventory gauge components
  13 Dev-only state toolbar + final integration/QA

RULES: any screen without a screenshot in /spec/screenshots — build from the prototype/spec
and flag it "NEEDS REVIEW". Each subagent must verify its screen against the reference
(desktop ~1440px and mobile) before reporting done. When all subagents finish, integrate,
run `npm run dev`, fix every build/console error, and give me a checklist of what matches
exactly and what still needs my screenshots.
```

## Tips
- Keep `vinlywine.com` open in a browser logged in, so you and the agents can eyeball against it.
- Populate `/spec/screenshots` as fully as you can — the more real screens the agents see, the
  closer the match. Anything missing gets flagged "NEEDS REVIEW" rather than guessed.
- After it's running, you edit files in `~/vinly-build/app` directly — that's your "current codebase".
