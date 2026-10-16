# MOVO — Motion Design Studio website

Static site built with Vite, deployed to GitHub Pages: https://publifix.github.io/movo/

## Stack
- Vite (vanilla JS/CSS) + GSAP 3. `npm run dev` / `npm run build` (output in `dist/`).
- `src/page.html` (template) + `src/` for code, `public/` for files served as-is.
- `src/main.js` boots everything; `src/intro/` (intro + hand-off, from the reference implementation),
  `src/hero.js` (hero video + entrance), `src/nav.js` (navbar + mobile menu), `src/styles/` (tokens, layout, fonts).
- Spec for the intro: `docs/BRIEF-intro-movo.md`. Do not change intro timing or geometry without re-rendering the video.
- `movo:intro-done` (window) is the ONLY start signal for site animations; it also fires on repeat visits and reduced motion.
- The navbar wordmark `[data-movo-nav-logo]` must keep its final size/position from first render (the hand-off measures it).
- Assets: `public/video/intro/`, `public/video/hero/`, `public/logo/` (SVGs, `fill="currentColor"`), `public/brand/` (PNG logos).
- Palette: ink `#0B0B10` (exact video black), white `#F5F5F0`, volt `#D7FF3B`, magenta `#FF2D87`, violet `#6A3DFF`, gray `#2A2A33`.
  Volt and magenta only on dark backgrounds; text on volt is always ink.
- Type: Archivo variable, self-hosted in `src/fonts/` (wght 100–900, wdth 62–125%). Headlines 900 / 125%.
- Always honor `prefers-reduced-motion`. `?reset` in the URL replays the intro; `?debug` shows on-screen diagnostics.
- Hero video: chosen by ORIENTATION (not width) and browser in `src/hero.js` (MP4 on iOS/Safari, else WebM);
  a single `src` is assigned only on `movo:intro-done`. Portrait layout CSS uses `(orientation: portrait)` only.
  Vertical cut is 720x1280 (~1 MB). Hero copy auto-fits (CSS `scale`) to the area the animation leaves free.
- The intro plays on DESKTOP ONLY: touch devices (phones and tablets, any orientation) skip it.
  Switch: `INTRO_ON_TOUCH` in the inline `<head>` script of `src/page.html`.

## Bilingual (ES + EN) — every new section/page must ship in both languages
- Pages are declared in `scripts/i18n/site.config.mjs` → `pages` (one template each: home `src/page.html`,
  services `src/services.html`; URL = locale path + page path: `/`, `/en/`, `/servicios/`, `/en/services/`).
  The `index.html` files at those paths are stubs: the plugin `scripts/i18n/vite-plugin-i18n.mjs` renders one
  static HTML page per page × language (content in the HTML, indexable). Shared pieces live in `src/partials/`
  (`{{> header}}`, `{{> head-links}}`, `{{> timecode}}`). A new page = template + stub + entry in `pages`.
- Strings live in `src/i18n/es.json` and `src/i18n/en.json` (same keys; a missing key fails the build).
  In the template use `{{key.path}}`; public files use `{{root}}` (e.g. `{{root}}favicon.ico`); scripts read the
  page root from `<html data-root>` and UI strings from `#movo-i18n`.
- Languages, URLs, indexing: `scripts/i18n/site.config.mjs` (`siteUrl`, `noindex`, `locales`). Spanish is the
  default (x-default) at `/`, English at `/en/`. Canonical, hreflang, Open Graph, Twitter, JSON-LD, robots.txt,
  sitemap.xml and a bilingual 404.html are generated from that config.
- Launch checklist: set `siteUrl` to the real domain, set `noindex: false`, replace provisional copy in both JSONs.
- Measuring: `node scripts/perf/measure.mjs <url> --device pixel7|iphone14|desktop [--landscape] [--enter]`;
  production is measured by the manual workflow `.github/workflows/measure.yml` (the sandbox cannot reach github.io).
- Hosting (GitHub Pages) serves everything with `cache-control: max-age=600`; headers cannot be configured there.
  Because a browser may hold the previous HTML for 10 min, `deploy.yml` also ships the hashed assets of the
  previous 3 builds (otherwise a deploy that changes CSS/JS leaves those visitors with an unstyled page).

## Deploy workflow (agreed with the owner)
- Every push to `main` or any `claude/**` branch triggers `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages (production).
- At the end of every work round: run `npm run build` to verify, commit, and push. The push is the deploy — the owner reviews progress live at the URL above.
- The latest push from any of those branches wins, so keep work on one branch at a time.

## Work section (Trabajo) + "the scroll is the timeline"
- Data: `src/data/reels.json` (id, title es/en, client, category, poster, preview webm/mp4, full). `fullBaseUrl`
  is the ONE switch for full videos (empty = files in `public/video/work/`; set to the Bunny Stream/CDN base later).
  The i18n plugin renders cards + category filters into the HTML (`{{workReels}}`, `{{workFilters}}`).
- Mock reels (marked MOCK): `python3 scripts/mocks/make-reels.py` → `public/video/work/<id>/` (full 540x960 with
  audio, preview 3.5 s 480p ~35 KB webm/mp4, poster). reel-01 reuses the hero vertical loop. Replace with real work.
- Code: `src/work/` is a LAZY chunk (index.js + work.css + media.js + player.js), imported by `src/main.js` on the
  first scroll intent after `movo:intro-done`. Nothing from Work (code, posters, previews) loads before that.
- Modes (rebuilt on resize/rotation): `html.work-strip` landscape (pinned scene: hero clip-path → 9:16 card →
  film strip, horizontal by vertical scroll, hover scrub + play cursor, filters with Flip); `html.work-feed`
  portrait (pinned transition → full-screen Reels-style feed, nested scroll-snap, preloads only the next reel);
  `html.work-grid` reduced motion (no pin, no scrub, poster grid).
- Playback is driven by the TIMELINE's onUpdate (smoothed scrub), not the trigger's. Video budget: max 3 playing
  (global guard in `media.js`). Full videos download only when the player opens (src removed on close).
- Player: dialog + aria-modal, page `inert`, focus trap, Esc / ← → / swipe (down closes), focus returns to the card.
- Timecode (`src/timecode.js`): 24 fps, 4 s per viewport; clips are `[data-clip]` (`data-clip-start` overrides
  the measured start — needed for anything inside the pinned scene); nested scrollers with
  `[data-timecode-scroll]` (the feed) add their scroll; `movo:clips` re-measures.

## Services (Servicios) — "the services are the tracks of a video editor"
- SOURCE OF TRUTH: `docs/MOVO-Servicios-textos-ES-EN-y-direccion-de-diseno.docx` (owner's document; `.md` copy next
  to it for reading). Texts are used verbatim. `python3 scripts/services/import-doc.py` regenerates
  `src/i18n/*.json → services` and `src/data/services.json` (pillars, slugs, anchors, colors, Work filters) from it.
  Never edit those generated parts by hand. `[CONFIRMAR …]` markers stay in the text (styled `.confirm`) until
  MOVO validates them. UI labels that are not copy live in `servicesUi`.
- Markup: `scripts/i18n/services-markup.mjs` (home tracks, page index, pillars/rows, process, formats, FAQ, JSON-LD).
- Pillar colors on ink: brand volt, content magenta, explain violet (`--pc`; violet text uses a lighter tint).
- Previews come from `src/data/reels.json`: pillar = first reel of its Work categories (or `previewReel`), row =
  n-th reel of its category; the showreel (`showreel: true`) is never a preview. Real reels → previews update.
- Home section: lazy chunk `src/services/home.{js,css}`, requested with Work on the first scroll intent. One track
  open at a time (hover desktop / tap mobile), magenta playhead lights keyframes, < 900px stacked cards.
- Page: `src/services/page.{js,css}`. Max ONE preview playing; previews load on hover/open, posters when near.
- Work filters from links: `?cat=social,advertising#trabajo` (several categories pressed at once). A #hash on
  the home skips the intro (deep link).
- Reduced motion: no playheads, no cursor preview, no morphing formats; everything open and static.
- Build: `vite.config.js` puts GSAP core + nav + timecode in one shared `core` chunk; no modulepreload polyfill.
