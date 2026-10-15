# MOVO — Motion Design Studio website

Static site built with Vite, deployed to GitHub Pages: https://publifix.github.io/movo/

## Stack
- Vite (vanilla JS/CSS) + GSAP 3. `npm run dev` / `npm run build` (output in `dist/`).
- `index.html` + `src/` for code, `public/` for files served as-is.
- `src/main.js` boots everything; `src/intro/` (intro + hand-off, from the reference implementation),
  `src/hero.js` (hero video + entrance), `src/nav.js` (navbar + mobile menu), `src/styles/` (tokens, layout, fonts).
- Spec for the intro: `docs/BRIEF-intro-movo.md`. Do not change intro timing or geometry without re-rendering the video.
- `movo:intro-done` (window) is the ONLY start signal for site animations; it also fires on repeat visits and reduced motion.
- The navbar wordmark `[data-movo-nav-logo]` must keep its final size/position from first render (the hand-off measures it).
- Assets: `public/video/intro/`, `public/video/hero/`, `public/logo/` (SVGs, `fill="currentColor"`), `public/brand/` (PNG logos).
- Palette: ink `#0B0B10` (exact video black), white `#F5F5F0`, volt `#D7FF3B`, magenta `#FF2D87`, violet `#6A3DFF`, gray `#2A2A33`.
  Volt and magenta only on dark backgrounds; text on volt is always ink.
- Type: Archivo variable, self-hosted in `src/fonts/` (wght 100–900, wdth 62–125%). Headlines 900 / 125%.
- Always honor `prefers-reduced-motion`. `?reset` in the URL replays the intro.

## Deploy workflow (agreed with the owner)
- Every push to `main` or any `claude/**` branch triggers `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages (production).
- At the end of every work round: run `npm run build` to verify, commit, and push. The push is the deploy — the owner reviews progress live at the URL above.
- The latest push from any of those branches wins, so keep work on one branch at a time.
