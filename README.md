# solanaSIMD ($SOLSIMD)

A static community showcase for the unofficial demo token on Solana. The supplied medallion becomes an interactive 6×4 AI-agent grid, SVG scenes, and six downloadable memes. The final source is in `site/`; the ready-to-serve export is in `dist/`.

Contract: `GCqB4jMYPJ5fYNVAu2vrRA9qTBtzjSHtXqjVC1eQLBsU`.

## Install, check, and preview

Use Node.js 22 or later and npm. The website itself needs no packages, transpilation, or application server. Its optional development tools are pinned in `package-lock.json`.

```sh
npm ci
npx playwright install chromium webkit
npm run typecheck
npm run build
npm test
npm run test:revision
npm run preview
```

On Linux, Playwright may also require its documented system browser libraries (`npx playwright install-deps chromium webkit`). Preview listens on `http://127.0.0.1:4173/`; set `PORT` to choose another port. Stop it with Ctrl+C. The development preview proxies the real hosting feed at `/simd-coin.json`; it never serves invented market values.

`npm run build` copies the plain HTML, CSS, JavaScript, and assets from `site/` to `dist/`. No build is required to serve `site/` directly. Rebuild after source changes so the delivered export stays current. The publisher should serve `dist/` as static files; publication is outside this assignment.

## Files and maintenance

| Path | Purpose |
| --- | --- |
| `site/index.html` | Page content, metadata, accessible controls, and inline SVG compositions |
| `site/styles.css` | Design tokens, layouts, states, and reduced-motion rules |
| `site/app.js` | Agent board, menu, copy controls, buying-guide tabs, live data, and session chart |
| `site/data.js` | Assigned contract, feed validation, safe URLs, and number formatting |
| `site/404.html` | Matching static error page |
| `site/assets/` | Local logo, favicon, licensed fonts, and meme SVG/PNG/WebP assets |
| `site/dex-header.png` | Required 1500×500 DexScreener banner |
| `dist/` | Complete production export, included with the source |
| `scripts/artwork.mjs` | Reproducible SVG compositions and browser rasterization for memes/header |
| `tests/interactions.mjs` | Production-export interaction, layout, and accessibility checks |
| `tests/revision.mjs` | Regression checks for long amounts, chart continuity, stable agent details, and step fades |
| `DESIGN.md` | Implemented design system |
| `artifacts/validation.md` | Review coverage, fixes, evidence, and limitations |

To regenerate artwork from the bundled logo, run `npm run artwork`, then `npm run build`. This uses headless Chromium to rasterize the authored SVGs, then Sharp to compress PNGs and create WebP previews. It uses no canvas or image-generation service. Fonts and logo are embedded in the standalone artwork SVGs; each repeated medallion references a single SVG symbol.

## Live data and static hosting

The client requests **`/simd-coin.json` on the current origin**, immediately and every 30 seconds while the page is visible. It refreshes on return to the tab. The hosting service owns this endpoint; it is the sole runtime request beyond local static assets. A static-only offline server cannot provide live market data, and the page handles that with a retry control and working chart links.

The feed must identify the assigned contract and `chain: "solana"`. Its `buyUrl` and `chartUrl` replace every corresponding link. Before the first successful response, the exact pump.fun coin link and the brief's DexScreener link work as fallbacks. HTTPS links are validated before use.

- Null market values stay hidden; a real zero remains visible.
- Failed updates retain prior quotes with an explicit stale-data message. Initial failures show recovery instructions, never fabricated quotes.
- The SVG chart records at most 40 actual price observations in the current browser session. The endpoint supplies snapshots, not historical candles. The first observation explains that another update is needed; the full chart opens externally for earlier activity.
- Supply, decimals, fixed-supply status, allocation, team, and trading-fee text come only from `tokenomics`. When it is null, supply and holders link to “see the chart,” and the allocation bar disappears.
- The creator fee recipient is displayed only as the abbreviation supplied in the brief, `8HLm…7JqW`. It is not expanded, guessed, or presented as a full-address copy action.
- Telegram is hidden unless the feed supplies a link. No unavailable social channel is invented.

All local asset URLs are relative and were checked under `/preview/`. The root-relative live endpoint and absolute social/canonical metadata are deliberate exceptions. No wallet connection, transaction flow, data-collection form, tracker, third-party embed, or remote font request is included.

## Actual validation

The revision's production build and TypeScript's strict `checkJs` typecheck passed. An initial run of the existing interaction suite passed **20 checks, zero failures**, in Chromium. The final rerun passed its first **18 checks**, then stopped at the live screenshot-evidence setup because the hosting feed returned HTTP 404 (`DEPLOYMENT_NOT_FOUND`); this external-service failure is retained in `artifacts/interaction-results.json`. The completed checks cover real clipboard copying, all 24 agents, keyboard controls, the mobile menu, all buying-guide panels, 30-second refresh using a test clock, initial/service/timeout/malformed/wrong-token failures, stale data, null tokenomics, six genuine PNG downloads, three X intents, local links/assets, and the 404 page. WebKit was attempted in the initial run but could not launch because required system libraries are unavailable on this machine.

`npm run test:revision` passed **4 regression groups, zero failures**. Both reported long-market fixtures now have page widths equal to their 320/360px viewports, with complete amounts at the original 20px type size. Larger values also trigger stacking at 900/1440px, and smaller values restore the columns. All 24 agent selections preserve the hero positions at 320/360/390px in both motion modes. The chart remains continuous through 16 and 40 observations. The guide numeral fades out before replacement and in afterward; rapid selection, motion pause, and system reduced motion settle correctly. All four reviewer findings were reproduced before the fixes and answered in `.imd-responses.json`.

Responsive checks passed at 320, 360, 375, 390, 620, 900, 1440, and 1920 CSS pixels. A separate 200% text-enlargement check passed at 390px. The product and complete main Buy button fit within the 390×844 first screen. Both pages were rendered at mobile and desktop widths. Axe found zero automated WCAG 2 A/AA, 2.1 AA, or 2.2 AA violations in the checked page state. This does not establish full accessibility compliance.

The pinned `taste@1` probe was run on the export and on a preview while the real hosting feed was available. That live preview reports 13/16 raw passes; its flags are adjudicated in the validation record: required Fira Mono prose, required verbatim em dashes, and a market-data definition label mistaken for a heading kicker. The layout, render, measured contrast, motion, targets, and metadata checks pass. The static-only probe additionally reports the expected missing `/simd-coin.json` service. Both check summaries are retained in `artifacts/taste-results.json`.

Evidence is in `artifacts/screenshots/`, `artifacts/interaction-results.json`, `artifacts/revision-before.json`, `artifacts/revision-results.json`, and `artifacts/contrast.json`. The `home-*`, `agent-hover`, and 404 screenshots use the actual hosting feed. At validation the price, market cap, and liquidity fields were null; volume was a genuine zero. Screenshots prefixed `revision-` explicitly use synthetic reviewer/regression fixtures to exercise long amounts and populated chart history; those values never enter the production export.

The browser connector successfully rendered the export at 390/360px and showed no console errors; local Playwright Chromium supplied the automated checks and saved evidence. Optional tools and browser downloads were installed under `/tmp`, outside the repository. WebKit's dependency dry run could not resolve the required packages, so Safari behavior was not reverified. Native-device use, a screen-reader session, native browser zoom, RTL/localized layouts, and external trades were not performed. External trading/social destinations were not opened or certified in this revision; feed-derived destination handling and local asset/anchor links were tested.

## Submission budget

`npm run budget` checks the raw deliverable file size against **8,388,608 bytes**, with an additional 8 KiB allowance for its own report, and compares every source file byte-for-byte with its export. The result is in `artifacts/budget.json`.

The explicit path budget for `.gitignore` is **512 bytes** (implemented: 187 bytes). Its patterns exclude dependency and cache directories at every nesting level. `dist/` is deliberately included. No installed dependencies, package caches, dependency archives, or browser binaries belong in the submission.

## Provenance

The full creative brief was read from [the supplied site-brief endpoint](https://www.si-md.xyz/api/chat?op=site-brief&label=solanasimd). The supplied logo CID is `QmT6rkJP1bLemsv4c2iSaefqquyNbWN5vj1P35euVFM1Fp`; its identical IPFS object was retrieved through the Pinata gateway after ipfs.io returned HTTP 429. It is bundled locally and adapted only into the requested logo-based compositions.

The pinned Better Interface and design-critic references informed implementation and review. Their attribution and license notices are retained under `artifacts/licenses/`. Orbitron and Fira Mono are locally bundled Google Fonts; their SIL Open Font Licenses are in `site/assets/fonts/` and `dist/assets/fonts/`.
