# Suzuki SellWise PWA — PRD

## Original problem statement
> Lets create a PWA. No backend. I will give you screen by screen. It should be pixel perfect. Same color and fonts.

User delivers screens one-by-one as image mockups. Frontend-only, installable PWA, mobile-first, looks good on desktop too.

## Brand & design system
- **Fonts** (custom, self-hosted from `src/fonts/`):
  - **SuzukiPro** — page titles ONLY (per user instruction)
  - **Maison Neue** (Light 300, Book 400, Bold 700) — body / everything else
  - **Maison Neue Mono** — code
- **4-pt grid** for spacing, typography, border-radius (8/12/16/20/24)
- **Colour palette** (CSS variables in `src/index.css`):
  - Primary: Suzuki Red `#DE0039`, Suzuki Blue `#023590`
  - Action: Blue-600 `#2563EA`, Blue-700 `#1E40AE`
  - Priority: High `#FE6464`, Medium `#FE9F4D`, Low `#B0B0B0`
  - Base: Error `#F71818`, Warning `#F5641D`, Success `#39C062`, Disabled `#CCCCCC`, Gray-100 `#CECECE`, Gray-200 `#5A5A5A`, Gray-300 `#161616`
  - Secondary: Blue-100..700, Red-100..600, Purple-100..600, Yellow-100..600, Green-100..600
- Languages: English + Bahasa Indonesia, persisted via `localStorage` key `sellwise.lang`
- Layout: mobile-first container `max-w-[440px]`, centred on desktop

## Architecture
- React 19 (CRA + craco), React Router v7
- Tailwind CSS + shadcn/ui (`dropdown-menu`)
- Lucide-react icons + custom SVG (Suzuki S, showroom, eligere, WhatsApp)
- Custom Context-based i18n
- Service worker `/service-worker.js` with cache-first strategy
- Web App Manifest `/manifest.json`

## Implemented screens
### Welcome (`/`) — Feb 2026
- Top language pill (EN/ID dropdown)
- SUZUKI / SellWise brand block
- Showroom illustration (SVG placeholder)
- "Convert More Leads. Sell Smarter." headline + description
- 3 feature cards: Leads, Smart Calling, Performance
- "Get Started" CTA → navigates to `/leads`
- "Powered by eligere" footer

### My Leads (`/leads`) — Feb 2026
- Shared `AppHeader` with brand + globe/search/profile icon buttons
- Page title "My Leads" (SuzukiPro)
- Pill tab toggle: "Human Follow-up (4)" / "AI Follow-up (4)" with URL query sync (`?tab=ai`)
- **Human Follow-up tab**: 4 lead cards (Marcus Thompson, Jennifer Ramirez, David Chen, Samantha Williams)
- **AI Follow-up tab**: "Schedule AI Follow-ups" expandable accordion + 4 AI lead cards (William Lucas, Carlos Gomez, Muhammad, Aisha Rahman) with "← Move to Human" footer
- LeadCard: name (blue underlined), priority badge, "Interested in: [model]", tag pills (Test drive done / Finance interested / Need callback / Price enquiry / WhatsApp replied / First-time buyer / Need follow-up), last contact, blue Phone + green WhatsApp action circles, green-bordered "Recomended" pill under recommended action
- Sticky `BottomNav` (Suzuki Blue): Leads / Perform / Guide / Analyze

## Test status
- Iter 1 (Welcome): 100% frontend pass
- Iter 2 (Leads): 14/15 (1 HIGH: ID overflow on tabs)
- Iter 3 (Leads fix verification): 100% pass — ID + EN no-overflow, all regressions clean

## Backlog (deferred / awaiting user)
- **P0**: Screens 3+ from user; routes for `/perform`, `/guide`, `/analyze`; lead detail page
- **P0**: Real assets (Suzuki S logo, showroom illustration, eligere logo, PWA icons icon-192.png / icon-512.png)
- **P1**: Schedule-AI-Followups content (currently placeholder)
- **P1**: Wire bottom-nav non-Leads tabs once their routes exist (BottomNav.jsx onClick currently no-ops for those)
- **P1**: Working call / WhatsApp / Move-to-Human handlers (currently visual)
- **P2**: PWA install prompt, offline lead cache, analytics

## Next tasks
1. Receive next screen mockup from user; build it as a new route
2. Replace SVG placeholders + ship real PWA icons when user delivers them
