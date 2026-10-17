# solanaSIMD design system

## Overview

The site is a dark protocol showcase for the unofficial $SOLSIMD demo token. Its audience can inspect the AI-swarm build illustration, verify the contract, open real market/trading destinations, and download logo-based memes. The visual language comes from the creative brief: black, electric lime, precise grids, technical typography, and thin structural rules.

`site/styles.css` is the token and component source of truth. `site/index.html` contains the semantic composition and SVG primitives. `site/app.js` adds interaction without a component framework. All three are copied unchanged into `dist/`.

## Colors

The hex values below are the actual CSS custom properties in `site/styles.css:5`.

| Token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#030303` | Page background and foreground on lime |
| `--color-surface` | `#0c0c0c` | Market/token sections, illustrated panels, tooltips |
| `--color-surface-hover` | `#171912` | Neutral control hover and selected agent surface |
| `--color-text` | `#f5f5f5` | Primary text, secondary button labels |
| `--color-muted` | `#a3a69c` | Explanations, captions, field names |
| `--color-border` | `#2c2e27` | Structural separators and panel outlines |
| `--color-border-strong` | `#444444` | Secondary controls, tooltips, subdued allocation segment |
| `--color-accent` | `#ccff00` | Primary action, active agent, SVG electricity, chart line |
| `--color-accent-hover` | `#ddff55` | Primary-button hover fill |
| `--color-on-accent` | `#030303` | Primary action label and notice controls |
| `--color-focus` | `#ccff00` | Keyboard focus perimeter |
| `--color-art-glow` | `#ccff001c` | Decorative lime glow behind the agent board/scenes |

The sticky header uses `#030303f5` over the page and a 16px backdrop blur. SVG art also uses the specified black/lime/gray palette directly. State always has text or geometry in addition to color: `aria-pressed`, selected-tab borders, feed status messages, and copy feedback.

Measured rendered pairs include muted/page 8.34:1, muted/surface 7.91:1, primary action 17.55:1, and selected tab 16.65:1. See `artifacts/contrast.json` for selectors and exact foreground/background values. These solid-pair results do not certify every pixel of decorative glows or images. The theme is intentionally dark only.

## Typography

The brief's pairing is implemented locally with WOFF2 assets:

- Display: `Orbitron, Arial, sans-serif`, weight 600 for headings/brand. The bundled Latin variable font supports the display weights used in artwork too.
- Text, controls, numbers, and contracts: `'Fira Mono', 'Courier New', monospace`, weights 400 and 500. Both actual faces are included. Long copy uses the requested technical mono voice; this intentionally overrides the probe's generic ban on monospace prose.

There are six semantic size tokens. At a default 16px root they are caption 12px, small 14px, body 16px, title 20px, section 32px, display 64px. Below 900px display becomes 48px; below 620px section becomes 24px and display becomes 32px. Artwork lettering is separate from interface type.

Headings use balanced wrapping; descriptions use pretty wrapping. Main display line height is 1.25 desktop and 1.3 on mobile, while mobile section headings use 1.4. General body line height is 1.6; longer 14px hero copy uses 1.8 and an 840px measure. The compact 14px copy is deliberate for the protocol layout and Fira Mono's width, while the default root remains 16px. Labels are 12–14px. Heading tracking is −0.025em; the desktop hero uses −0.035em. Body text has natural tracking.

Numbers and addresses use tabular numerals. Contracts wrap anywhere and remain selectable, with the full final contract visible in both contract strips. No balance, supply, or price is truncated into an invented abbreviation. Font loading was confirmed with `document.fonts.check` in Chromium; no remote font request is needed.

## Layout

Spacing tokens are 4, 8, 12, 16, 24, 32, 48, 64, 96, and 128px at the default root (`--space-1` through `--space-32`). `.shell` shares edges across sections: maximum 1200px, with 48px minimum gutters on wide screens. It becomes a 1320px maximum above 1600px. Gutters reduce to 32px below 900px, 20px below 620px, and 16px below 360px.

The launch, buying, token, and community layouts use a twelve-column `minmax(0,1fr)` grid. Their column gap is constrained to `min(24px,3vw)` at the base size, preventing accumulated gaps from widening the page under text enlargement. The build row uses three equal columns. The meme wall uses three columns, then two below 900px, then one below 620px.

Desktop section spacing is 96px above and below, 128px above 1600px, and 64px below 900px. Section numbers sit beside headings and are decorative; they are not kicker labels above them. Sections retain their specified order.

The agent grid stays six columns by four rows at every supported width. Desktop has side annotations; below 900px these yield to a centered board and an adjacent mobile pause control. Below 620px its maximum width is 350px and the detail area reserves a minimum 72px, keeping the headline and trading actions stationary across all 24 selections at 320, 360, and 390px. The first two tooltip columns anchor to their leading tile edges; the last two anchor to trailing edges; the middle pair stays centered. All six columns were checked at 320, 360, 375, and 390px.

The nav becomes a disclosure menu below 900px. At 620px the split sections and market metrics become single-column layouts, contracts wrap into label/control and full-address rows, and secondary chart captions stack. Wider market layouts retain four columns only while every complete amount fits: `fitMarketStats()` applies `.is-stacked` when a value exceeds its column, checking feed changes, counter animation, font loading, and resizing. Extremely long amounts can wrap in that single column; their precision and type size remain intact. Flex rows may wrap as text grows. The final export was measured at 320–1920px and separately with 200% text enlargement; native browser zoom and RTL behavior were not established by those checks.

## Elevation & Depth

Surfaces are mostly flat. One-pixel borders define the structural grid, active controls, and section separators. The hero has a faint radial glow and slow SVG circuit traces; there is no text gradient or box-shadow card system. The header is sticky at z-index 30, its menu is 35, copy notices are 50, and the skip link is 100. Tooltips layer within the board and do not intercept pointer events.

## Shapes

`--radius-control:4px` is used for buttons, tooltip surfaces, notices, and most media edges. `--radius-panel:8px` is used for larger illustrated frames. Agent tiles use 4px on desktop and 3px on mobile; their cropped portraits use a corresponding smaller radius. Logos retain the source medallion; each section transforms it or adds SVG props rather than using an unrelated image.

## Components

| Pattern | Source | States and reuse |
| --- | --- | --- |
| `.button`, `.button-primary`, `.button-secondary` | `site/styles.css:129` | Lime primary Buy, outlined secondary actions; hover, visible focus, and 0.96 press scale. Magnetic movement is gated by mouse/hover support and motion preference. |
| `.nav`, `.nav-links`, `.menu-toggle` | `site/index.html:51`, `site/app.js:107` | Sticky navigation; mobile disclosure with expanded state, Escape dismissal/focus return, anchor and outside-click dismissal. It is nonmodal. |
| `.agent-grid`, `.agent`, `.agent-tooltip` | `site/app.js:15`, `site/styles.css:108` | 24 real native buttons in a roving tab order; hover, touch, focus and pressed selection; arrows move one cell or row, Home/End jump, Escape clears. A stable live region gives the build-step explanation. |
| `.motion-toggle` | `site/app.js:94`, `site/styles.css:269` | Pause/resume across the page; a system reduced-motion setting stops all animations/transitions and disables redundant toggles with an explanatory label. An active step-numeral fade settles immediately when motion is paused or reduced. |
| `.contract-strip` | `site/styles.css:136`, `site/app.js:138` | Full selectable address plus native copy action; Clipboard API, selection fallback, truthful success and persistent dismissible error notices. |
| `.market-stats`, `.price-chart` | `site/index.html:95`, `site/app.js:229`, `site/app.js:266` | Only present values render. Valid zeroes remain. Complete amounts reflow instead of clipping. Snapshot observations become an honest session SVG chart; unavailable, first-observation, populated, stale, retry, and timeout states have specific text. The line uses `pathLength="1"` and a normalized dash so every observation stays connected after drawing. |
| `.step-controls`, `.step-panel` | `site/app.js:158` | Three tabs with roving focus, ArrowLeft/Right, Home/End, next-step/cycle control, correct selected/hidden panels, and matching numeral art. Panels update immediately; ordinary motion fades the old numeral out for 150ms, replaces it, then fades the new numeral in for 150ms. Rapid selection cancels the prior fade; paused/reduced motion updates immediately. |
| `.token-data`, `.allocation` | `site/app.js:312` | Feed-derived fields; allocation appears only for valid percentages totaling 100; absent tokenomics replace supply with a chart link and hide the bar. |
| `.meme-item`, `.meme-image` | `site/index.html:129` | Lazy local WebP preview, descriptive alt text, real PNG download, and a separate labeled download control. Six compositions come from `scripts/artwork.mjs`. |
| `.share-intent`, `.copy-link` | `site/index.html:139` | Three distinct X intents plus canonical-link copying; nothing is posted automatically. |
| `.error-page` | `site/404.html` | Same fonts, palette, logo crop, and primary-button vocabulary; local link returns to the index. |

Focus uses a 2px solid perimeter with 5px offset; the lime primary button gets a white focus outline. Forced colors use the system Highlight color. Essential action labels remain native text. Repeated decorative SVGs are hidden from assistive technology; informative scene SVGs have an image role and a purpose-specific accessible name.

All authored animation runs only with `prefers-reduced-motion:no-preference`. Interactive transitions and each Web Animations step-numeral fade name their properties and use 150ms with `cubic-bezier(.2,0,0,1)`. Reveals use 600ms and an 80ms stagger; counters interpolate for 500ms. The chart draws over 700ms with its full path normalized to one unit. Slow background loops range from 3 to 16 seconds. Pausing also cancels transitions and settles the numeral immediately. No `transition:all` is used.

## Do's and Don'ts

- Start another page with the shared font declarations, `.shell`, heading scale, and button patterns. Reuse the error page's head/structure for a simple static route; export that route explicitly.
- Use lime fill for the main Buy action. Use secondary styles for peers and keep live status understandable in text.
- Keep required creator copy verbatim. The eight-word hero is an explicit brief exception to the review's six-word headline preference.
- Add live values through the validated feed renderer. Do not insert a snapshot into the export, invent chart history, or use missing values as zeroes.
- Derive new art from the bundled medallion and SVG props. Maintain the local fonts and font licenses when regenerating assets.
- Preserve keyboard, touch, pause, reduced-motion, null-data, and error states when changing a component. Rebuild and recheck the affected export; update this document to the final source.
