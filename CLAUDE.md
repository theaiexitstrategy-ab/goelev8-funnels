# CLAUDE.md — Konquered Kocktails funnel

> Persistent project context for Claude Code. Auto-loaded every session.
> Client: **Stephen Simmons** — Konquered Balance / Konquered Kocktails.
> This repo is the funnel/site, currently drafted at **goelev8.ai/kk**, moving to **konqueredkocktails.com** on completion.

## Brand essence
- North star / tagline: **"Intention is the experience."**
- Positioning: premium, sensory, craft-cocktail *experience* brand. St. Charles / St. Louis mobile bar built on handcrafted drinks, Uncle Nearest bourbon, and showmanship.
- Primary funnel goals: **event booking inquiries** and **brand awareness**. Booking flow takes a **$200 deposit** via Stripe. Licensed & insured.

## Brand color palette
| Name | Hex |
|------|-----|
| Deep Emerald | `#123D35` |
| Konquered Bronze | `#9A633A` |
| Royal Gold | `#C39A45` |
| Warm Black | `#151310` |
| Cream Highlight | `#E8D8B8` |
| Amethyst Accent | `#5C3B70` |
| Konquered Garnet | `#681F2B` |

Usage guidance: Warm Black / Deep Emerald for backgrounds, Cream Highlight for body text on dark, Royal Gold / Konquered Bronze for accents and CTAs, Garnet/Amethyst sparingly for depth.

## Site structure (as drafted at goelev8.ai/kk — Next.js)
1. Header nav: Experiences | Menu | About | Book an Event
2. Hero — "Handcrafted kocktail experiences, konquered." ($200 deposit, licensed & insured; CTAs: Book Your Event / See Experiences)
3. Experiences (#experiences): Kustom Mixology Experience / Spirits & Kocktail Tasting / Full-Service Mobile Bar
4. Signature Kocktails menu (#menu): Nearest to Happiness / Konquered Sour (house signature) / Uncle's Spiced Side Car
5. About (#about) + contact
6. Booking form (#book): info → date → $200 Stripe deposit → confirmation

## Stack
- Next.js, deployed on Vercel. Stripe (deposits). Supabase (data/auth) present.

## Asset source of truth
- Client Google Drive (READ-ONLY — never edit): https://drive.google.com/drive/folders/1X8WXmzLMo55YspnCYhjnbIMlLb6NIDVv
- Owner: stephen@konqueredbalance.com
- Folders: 00_CONTENT DASHBOARD, 01_BRAND ASSETS (Logos/Fonts/Brand Voice folders currently EMPTY — request from client), 02_FOOTAGE BANK, 03_ACTIVE CONTENT, 04_PUBLISHED CONTENT, 05_ARCHIVE.
- Naming convention: `YYYY-MM-DD_Feature_Shot-Version`.

## Video hosting decision
- Use **`next-video`** (Mux-backed) for all site video: adaptive HLS, auto poster, lazy-load, CDN. Never commit raw MP4 masters to the repo or serve them un-optimized from `public/`.
- Alternative if standardizing on Cloudflare: Cloudflare Stream.

## Current work log
- 2026-07-25: Adding two clips from Drive `04_PUBLISHED CONTENT/2026/07_July`:
  - `lv_0_20260716170429.mp4` (~30 MB) → hero ambient background loop (muted/autoplay/loop).
  - `lv_0_20260716200746.mp4` (~49 MB) → featured highlight after the Experiences section (click-to-play, sound on, poster).

## Open items / follow-ups
- Get logo files, fonts, and a written brand-voice guide from client (Drive folders are empty).
- Migrate site to konqueredkocktails.com when ready.
