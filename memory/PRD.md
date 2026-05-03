# Suzuki SellWise PWA — PRD

## Original problem statement
> Lets create a PWA. No backend. I will give you screen by screen. It should be pixel perfect. Same color and fonts. here is the first screen.

User is delivering screens one-by-one (mockups attached as images). The app must be:
- A PWA (installable, manifest, service worker, offline-capable)
- Frontend-only (no backend)
- Pixel-perfect to the supplied mockups (matching colours, fonts, spacing)
- Mobile-first but also "good on desktop"

## User explicit choices
- Full PWA setup from screen 1
- Languages: English + Bahasa
- "Get Started" → goes to next screen (will be supplied later)
- Looks good on desktop too
- Real assets (Suzuki logo, showroom illustration, eligere logo) will be provided by user later

## Architecture
- React 19 (CRA + craco) frontend, no backend
- React Router v7 for screen-by-screen flow
- Tailwind CSS + shadcn/ui (`dropdown-menu`)
- Lucide-react icons
- Custom Context-based i18n (en, id) with localStorage persistence (`sellwise.lang`)
- Service worker at `/service-worker.js` (cache-first with network-update)
- Web App Manifest at `/manifest.json`
- Manrope as the primary font (Google Fonts)

## Implemented (Feb 2026)
- **Welcome screen** (`/app/frontend/src/pages/Welcome.jsx`) — pixel-mapped to mockup
  - Top bar with English/Bahasa language pill (shadcn dropdown)
  - SUZUKI / SellWise brand block (SVG placeholder for the S-mark)
  - Showroom illustration (SVG placeholder — banners SPEED/BIKE/FUTURE, 5 bikes, salesman)
  - Headline "Convert More Leads. Sell Smarter." (Manrope ExtraBold, suzuki-blue)
  - Description copy
  - Three feature cards: Leads, Smart Calling, Performance (Lucide icons in soft-blue tiles)
  - Solid blue rounded-pill "Get Started" CTA
  - "Powered by eligere" footer
  - Full Bahasa translations
- **PWA** — manifest, service worker (registered on load), theme color, apple touch metadata
- **Routing** — single route `/` for now; ready for next screens

## Test status
- Iteration 1 (testing_agent_v3): **100% frontend pass**, zero console errors, manifest + SW served, language switch + persistence work, all data-testids present.

## Backlog (deferred / awaiting input)
- **P0 — next screens**: user will supply additional screens; implement each pixel-perfect and wire `Get Started` and other CTAs to them.
- **P0 — final assets**: replace SVG placeholders with the official Suzuki S logo, official showroom illustration, and official eligere logo (user will provide files).
- **P1 — PWA polish**: add real `icon-192.png` / `icon-512.png` (currently referenced but file not yet shipped), splash screens, expanded precache list once route map is known.
- **P1 — i18n expansion**: add language detection from browser/OS on first visit; add more languages if needed.
- **P2 — analytics / event tracking**: hook `Get Started` click and language change to PostHog.

## Next tasks
1. Wait for user-supplied screen 2 mockup; build it as a new route and link from `Get Started`.
2. Swap placeholder SVGs for official assets when user uploads them.
3. Generate / supply real PWA icons (icon-192.png, icon-512.png).
