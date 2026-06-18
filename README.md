# Vinly — local UI/UX clone (Next.js)

A pixel-faithful, click-through clone of the Vinly front end, rebuilt from the
live site (`vinlywine.com`) for spec and iteration. **Not the production
codebase** — everything is mocked, no backend, nothing is deployed.

## Layout

```
vinly-build/
├── app/        # Next.js 14 App Router + TypeScript (the actual UI)
├── spec/       # Ground-truth docs and reference assets
│   ├── BUILD_PROMPT.md    # original brief
│   ├── SCREEN_NOTES.md    # per-screen notes captured from the live site
│   ├── ASSETS.md          # real asset manifest (logo, fonts, CDN images)
│   ├── CHANGE_PROMPT.md   # fidelity-pass update
│   ├── prototype/         # the original static HTML prototype (for reference)
│   └── screenshots/       # owner screenshots of the live site
└── README.md
```

## Get it running locally

Requires **Node 20 LTS** and **npm**.

```bash
cd app
npm install
npm run dev
# open http://localhost:3000
```

The dev toolbar at the bottom of every page flips between
`anonymous`, `signed_in`, and `sesh_qualified` user states so you can
screenshot each.

## What's mocked

- **User auth, cart, profile, orders, addresses, payment methods** — all stored
  in `localStorage` (see `src/context/`).
- **Inventory + live SESH price** — drift live in the browser only.
- **Wine catalog** — `src/data/mock.ts`, with real Commerce7 CDN image URLs
  pulled in by hand for the wines we have references for.

## Working as a team

Each developer gets their own working copy + Claude Code session:

```bash
git clone https://github.com/<owner>/vinly-build.git
cd vinly-build/app
npm install
npm run dev          # in one terminal
# in another terminal, at the repo root:
claude               # see https://docs.claude.com/en/docs/claude-code
```

Use branches + pull requests; don't push directly to `main`. The dev
server, mocked state and `localStorage` data are per-browser so multiple
people can run the app at the same time without stepping on each other.

## Key starting docs

Read these in order to get up to speed:

1. `spec/BUILD_PROMPT.md` — original goals + design tokens
2. `spec/SCREEN_NOTES.md` — per-screen notes captured from the live site
3. `spec/ASSETS.md` — real asset URLs (logo, fonts, CDN, etc.)
4. `spec/CHANGE_PROMPT.md` — fidelity-pass updates

## Deploying a preview (optional)

The fastest way to share with a non-dev reviewer is Vercel:

```bash
cd app
npx vercel              # first time: prompts for login + project setup
npx vercel --prod       # later: promote to the primary preview URL
```
