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
- `src/page.html` is the ONLY page template. `index.html` (es, root) and `en/index.html` are stubs: the plugin
  `scripts/i18n/vite-plugin-i18n.mjs` renders one static HTML page per language (content in the HTML, indexable).
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

## Deploy workflow (agreed with the owner)
- Every push to `main` or any `claude/**` branch triggers `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages (production).
- At the end of every work round: run `npm run build` to verify, commit, and push. The push is the deploy — the owner reviews progress live at the URL above.
- The latest push from any of those branches wins, so keep work on one branch at a time.
