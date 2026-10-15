# MOVO — Motion Design Studio website

Static site built with Vite, deployed to GitHub Pages: https://publifix.github.io/movo/

## Stack
- Vite (vanilla JS/CSS). `npm run dev` / `npm run build` (output in `dist/`).
- `index.html` + `src/` for code, `public/` for files served as-is (favicons, manifest).
- Brand assets: `public/brand/` (logo variants: volt, blanco, negro; completo = with "Motion Design Studio").
- Video: `public/video/` (`movo-intro-v2-1920x1080` mp4/webm + last-frame jpg poster).
- Brand colors: volt `#D7FF3B`, ink `#0B0B10`. Display type: Archivo (wide/black).
- Heavy video and motion graphics planned (HyperFrames compositions, GSAP). Always honor `prefers-reduced-motion`.

## Deploy workflow (agreed with the owner)
- Every push to `main` or any `claude/**` branch triggers `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages (production).
- At the end of every work round: run `npm run build` to verify, commit, and push. The push is the deploy — the owner reviews progress live at the URL above.
- The latest push from any of those branches wins, so keep work on one branch at a time.
