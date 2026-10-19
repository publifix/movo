# MOVO — Motion Design Studio website

Static site built with Vite, deployed to GitHub Pages on the custom domain https://www.movomotiondesign.com/
(live and indexable since Oct 2026; publifix.github.io/movo and the bare domain redirect to it).

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
- Intro gate (desktop, before the video): the M in the ring stays (on Enter it contracts into the video's
  frame-0 dot); around it "MOVO — MOTION DESIGN STUDIO —" turns on an SVG textPath with timecode ticks
  (the wordmark is NOT shown: it is the payoff of the video); a loading timecode (the download fills the
  13.4 s) becomes "Intro · 13 s · Mejor con sonido" + audio wave; a link to the other language (a volt pill
  "View in English" when the browser speaks it; never an automatic redirect, for SEO). Strings: `intro.*`.
- The intro plays on DESKTOP ONLY: touch devices (phones and tablets, any orientation) skip it.
  Switch: `INTRO_ON_TOUCH` in the inline `<head>` script of `src/page.html`.

## Bilingual (ES + EN) — every new section/page must ship in both languages
- Pages are declared in `scripts/i18n/site.config.mjs` → `pages` (one template each; URL = locale path + page
  path): home `src/page.html` (`/`, `/en/`), services `src/services.html` (`/servicios/`, `/en/services/`),
  studio `src/studio.html` (`/estudio/`, `/en/studio/`), work `src/work.html` (`/trabajo/`, `/en/work/`),
  project `src/project.html` (`collection: 'reels'` → one page per reel slug: `/trabajo/<slug>/`,
  `/en/work/<slug>/`; their stubs are generated + git-ignored), contact `src/contact.html` (`/contacto/`,
  `/en/contact/`), privacy `src/privacy.html` (`/aviso-de-privacidad/`, `/en/privacy-notice/`).
  The nav links to the pages (Work, Services, Studio, Contact); the home keeps a teaser of each.
  The `index.html` files at those paths are stubs: the plugin `scripts/i18n/vite-plugin-i18n.mjs` renders one
  static HTML page per page × language (content in the HTML, indexable). Shared pieces live in `src/partials/`
  (`{{> header}}`, `{{> head-links}}`, `{{> page-head}}` (inner pages), `{{> timecode}}`, `{{> footer}}`;
  partials may include partials). A new page = template + stub + entry in `pages`.
- Strings live in `src/i18n/es.json` and `src/i18n/en.json` (same keys; a missing key fails the build).
  In the template use `{{key.path}}`; public files use `{{root}}` (e.g. `{{root}}favicon.ico`); scripts read the
  page root from `<html data-root>` and UI strings from `#movo-i18n`.
- Languages, URLs, indexing: `scripts/i18n/site.config.mjs` (`siteUrl`, `noindex`, `locales`). Spanish is the
  default (x-default) at `/`, English at `/en/`. Canonical, hreflang, Open Graph, Twitter, JSON-LD, robots.txt,
  sitemap.xml and a bilingual 404.html are generated from that config.
- Launched: `siteUrl` = https://www.movomotiondesign.com/, `noindex: false`, `public/CNAME`.
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
- Data: `src/data/reels.json`. `fullBaseUrl` = Bunny Stream CDN hostname (library 781096) — the ONE switch.
  Real reels: `bunny: { videoId, resolutions, desktop, mobile, width, height }` → URLs derived in
  `scripts/i18n/reel-media.mjs`: `play_{1080|720}p.mp4` (desktop | phones/tablets, chosen in player.js),
  `thumbnail.jpg` (poster), `preview_hq.mp4` (card loop). Order in the file = order on the site. Optional
  `description` {es,en} shows in the player ONLY on desktop/landscape (beside the video; phones show
  title, client and category so the video stays big). Optional `titleShort` {es,en} replaces the title on phones
  (feed card + player) when the full one takes more than 3 lines; titles are clamped to 3 lines there anyway. `pending: true` = title/client/category
  still unknown (category `pending`, tag PENDIENTE). Cards use the real proportion (`--ar` when not 9:16).
  Bunny hotlink protection: only the site's Referer is allowed; NEVER store a Bunny API key in the repo.
  The sandbox cannot reach the CDN: check it with the manual workflow `.github/workflows/bunny.yml`
  (CDN probe + `scripts/perf/work-check.mjs` in real Chrome/WebKit against production and localhost).
  The i18n plugin renders cards + category filters into the HTML (`{{workReels}}`, `{{workFilters}}`).
- All 10 reels are real (Bunny); there are no MOCK reels or local reel files any more. A new reel = upload to
  Bunny, probe it with `bunny.yml` (resolutions, size, audio) and add an entry to `reels.json` in display order.
- Code: `src/work/` is a LAZY chunk (index.js + work.css + media.js + player.js), imported by `src/main.js` on the
  first scroll intent after `movo:intro-done`. Nothing from Work (code, posters, previews) loads before that.
- Modes (rebuilt on resize/rotation): `html.work-strip` landscape (pinned scene: hero clip-path → 9:16 card →
  film strip, horizontal by vertical scroll, hover scrub + play cursor, filters with Flip); `html.work-feed`
  portrait (NO pin: hero → manifesto (inflates in flow, height reserved) → Work with a sticky header
  "TRABAJO · 03 / 10" + ‹ › arrows + filters, then a horizontal swipe CAROUSEL (scroll-snap, one card centered,
  neighbors peek; the section is ~one viewport tall whatever the number of reels); the centered reel plays,
  only the next one is preloaded); `html.work-grid` reduced motion (no pin, no scrub, poster grid).
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
  Never edit those generated parts by hand. Every `[CONFIRMAR …]` was validated by MOVO (Oct 2026) and the final
  ES/EN texts are in the document; a new marker would be styled `.confirm` until validated. No prices on the
  site (every project is quoted); the site-wide CTA stays "Empieza un proyecto". UI labels that are not copy live in `servicesUi`.
- Markup: `scripts/i18n/services-markup.mjs` (home tracks, page index, pillars/rows, process, formats, FAQ, JSON-LD).
- Pillar colors on ink: brand volt, content magenta, explain violet (`--pc`; violet text uses a lighter tint).
- Previews come from `src/data/reels.json`: pillar = first reel of its Work categories, row = n-th reel of its
  category, unless `src/data/services-previews.json` hand-picks one (`pillars`: home teaser tracks — brand =
  Blanco Nuclear, content = Tommy Hilfiger, explain = LABS; `services`: page rows). NO reel repeats across
  the Services page rows (owner's rule; services-markup.mjs enforces it while unused reels remain).
  The showreel (`showreel: true`) and pending reels are never previews. Real reels → previews update.
- Home section: lazy chunk `src/services/home.{js,css}`, requested with Work on the first scroll intent. One track
  open at a time (hover desktop / tap mobile), magenta playhead lights keyframes, < 900px stacked cards.
- Page: `src/services/page.{js,css}`. Max ONE preview playing; previews load on hover/open, posters when near.
- Work filters from links: `?cat=social,advertising#trabajo` (several categories pressed at once). A #hash on
  the home skips the intro (deep link).
- Reduced motion: no playheads, no cursor preview, no morphing formats; everything open and static.
- Build: `vite.config.js` puts GSAP core + nav + timecode in one shared `core` chunk; no modulepreload polyfill.

## Studio (Estudio) — type and motion only (no photos, no stock, no client logos)
- Copy: `src/i18n/*.json → studio` (owner's text, verbatim; manifesto p1–p4 + closing1–3), UI labels `studioUi`,
  footer title `footer`. Data: `src/data/clients.json` (marquee names, editable; order = order in the bands),
  `src/data/network.json` (Publifix Network: name, description ES/EN, URL). Markup: `scripts/i18n/studio-markup.mjs`.
- Page `src/studio/page.{js,css}`: kinetic two-line hero (letters change wdth/wght with the scroll) + page
  ruler; two client bands in opposite directions; manifesto revealed word by word + giant closing lines;
  network diagram (SVG lines drawn by ScrollTrigger, CSS pulses; the real white MOVO wordmark, inline from
  public/logo/movo-wordmark.svg, in the center) on >= 900px, connected list below;
  closing CTA = the site CTA (`hero.cta` → `nav.contact.href`). Nav "Estudio" links to the page.
- Marquee `src/studio/marquee.{js,css}`: list once in the HTML, cloned (aria-hidden) by JS; CSS transform
  loop shifted by exactly one list width (seamless); hover slows it (playbackRate); off screen pauses.
  No JS / reduced motion: static wrapped list.
- "Ideas en movimiento. Historias que mueven." read repetitive to the owner: the page hero is now
  "Ideas en / movimiento." (EN "Ideas / in motion.", intentional break, `studio.hero.line1/2`) and the
  home teaser heading is "Ideas en movimiento." (`studio.home.heading`) + `studio.hero.text`, one client band, link to the page.
  `src/studio/home.{js,css}`: lazy chunk with Work/Services on the first scroll intent (also
  carries the footer styles for the home). Footer `src/partials/footer.html` + `src/styles/footer.css`
  (imported by each page's CSS) on every page: Publifix Network links (new tab, rel=noopener).
- Production check: manual workflow `.github/workflows/site-check.yml` → `scripts/perf/studio-check.mjs`.

## Work page + project pages (portfolio, SEO) — `scripts/i18n/portfolio-markup.mjs`
- Everything comes from `src/data/reels.json`: a new reel (with a stable `slug`) = a new card on `/trabajo/`,
  a new project page, a sitemap entry and JSON-LD (ItemList on Work; VideoObject + BreadcrumbList on the
  project). `date` (YYYY-MM-DD, the day the video was published on the site) → `uploadDate` (rendered as YYYY-MM-DDT12:00:00-06:00: Google rejects a date without time zone), which Google needs
  for video results: set it on every new reel.
- Work page `src/portfolio/work.{js,css}`: kinetic title, filters with counts (`?cat=a,b`; Services links here),
  4/3/2-column grid with offset columns, real poster <img> (lazy after the first row), hover preview (fine
  pointers). Project page `src/portfolio/project.{js,css}`: whole vertical video (720p in the HTML, 1080p on
  desktop on play, sound on), facts (client, category, service → Services anchor, duration, format),
  description if any, prev/next (← → keys), 3 more projects, closing CTA. Home cards link to the project
  page (no-JS) and open the player; the player has "Ver proyecto".

## Contact — `src/contact.html`, `src/contact/page.{js,css}`, `src/data/contact.json`
- Form → Web3Forms (no server, no DB; messages arrive at labs.publifix@gmail.com). `web3formsKey` in
  `src/data/contact.json` (public by design); empty = the form says "coming soon" and points to WhatsApp.
  Validation under each field, honeypot `botcheck`, consent checkbox → privacy notice, success panel.
  WhatsApp (524421218565) is an option inside the form card — no floating button.
- Home teaser `.ctt` (styles lazy: `src/contact/home.css`). Every "Empieza un proyecto" CTA → the page.
- `social` (Instagram, TikTok) URLs in the same file: an icon shows in the footer only when its URL is set.

## Privacy notice — `src/data/privacy.json` (ES/EN), `scripts/i18n/privacy-markup.mjs`, `src/privacy/`
- Written for Publifix Network S.A.P.I. de C.V. (LFPDPPP) with their answers (Oct 2026): data is NOT shared with
  sister companies, NO promotional purpose, ARCO requests to labs.publifix@gmail.com or the address. Worth a
  review by their lawyer.
  Sticky index with the section being read; update `updated` when it changes.

## Footer (every page) — `src/partials/footer.html`, `src/styles/footer.css`, `scripts/i18n/site-markup.mjs`
- Social first: Instagram / TikTok as editor tracks (V1, V2): giant thin name; on hover a playhead wipes the
  lane with volt / magenta and the name opens to 900 / 125%. No URL in `src/data/contact.json → social` yet:
  the lane is not a link and shows REC + "Próximamente" with a slow scanning playhead. Then wordmark (a `<use>`
  of the navbar's `#movo-wordmark` path: no second copy), line, site nav, Publifix Network,
  © + "Servicio proporcionado por Publifix Network S.A.P.I. de C.V.", privacy link, ES/EN.
- Production checks: `site-check.yml` runs `studio-check.mjs` and `pages-check.mjs` (Work, all project pages,
  playback with sound, contact, privacy) in real Chrome/WebKit.

## SEO (technical + local: "estudio de animación / motion design en Querétaro")
- Titles ≤ ~62 chars and descriptions ≤ ~158 with the local terms (home, Work, Contact, Services via the .docx);
  project pages: "{title} · {client} · Proyecto MOVO" / "… · MOVO Project" (titleShort when long; long
  descriptions cut at a word). Hero eyebrow: "Motion Design Studio · Querétaro" (one line; "Motion design · Querétaro" when the copy column is < 380px: container query).
  Footer line `footer.based` ("Estamos en Querétaro, México · Trabajamos con marcas de todo el mundo.") on every page. City only (no street) by the owner's choice.
- JSON-LD: Organization + ProfessionalService (city address, phone, areaServed MX/US/worldwide, knowsAbout,
  parentOrganization Publifix Network, `sameAs` = social URLs from contact.json), WebSite, WebPage, ItemList
  (Work, Services), VideoObject + BreadcrumbList (projects). Sitemap with `lastmod` (build date) + hreflang.
- Launch on the custom domain (www.movomotiondesign.com): GitHub repo Settings → Pages → Custom domain + Enforce
  HTTPS; GoDaddy DNS: CNAME `www` → `publifix.github.io`, A records `@` → 185.199.108.153 / .109.153 /
  .110.153 / .111.153; Bunny hotlink protection: add movomotiondesign.com and www.movomotiondesign.com; then
  `siteUrl` → 'https://www.movomotiondesign.com/' and `noindex: false` in site.config.mjs, `public/CNAME`,
  build + push; Search Console + submit sitemap.xml. (Google Business Profile DISCARDED by the owner: Google asks
  for a video verification of the address that MOVO cannot provide. Do not propose it again.)
- LIVE since Oct 2026 on https://www.movomotiondesign.com/ (indexing on). Search Console: URL-prefix property,
  verified by `public/googledcccd2c664a9ab65.html` (keep it; `…ab651.html` is a copy); sitemap.xml submitted.
  "Request indexing" (URL Inspection) DONE for every page (ES + EN, all projects, privacy) by Oct 2026.
  New pages/reels: request indexing for their URLs after the deploy (sitemap.xml updates itself).
  "Enforce HTTPS" is ON (Oct 2026). Still to come from the owner: Instagram/TikTok URLs (→ contact.json `social`).
- Thumbnails: Bunny answers 403 without the site's Referer (Googlebot, WhatsApp/LinkedIn previews), so
  `.github/workflows/thumbs.yml` (manual) copies each reel's thumbnail to `public/thumbs/` (<slug>-{360,720,1080}.webp
  posters, <slug>.jpg for VideoObject, <slug>-og.jpg 1200x630 for the project og:image) + `src/data/thumbs.json`,
  commits and deploys. Run it after adding a reel or replacing its video (until then that reel uses Bunny's image).

## MOVO Stories — `/stories/`, `/en/stories/` (PUBLISHED 19 Oct 2026 with Story 01)
- Para crear o editar cualquier pieza de /stories, lee y sigue STORIES.md (playbook at the repo root; where it
  clashes with the code, the code wins: adapt and report). Owner/approver: Jerry. Prompt of phase 1:
  menu + index + home teaser → Story 01 brief/text/storyboard (STOP for approval) → scenes → validation.
- Switch: `scripts/i18n/site.config.mjs → stories.published` (true since 19 Oct 2026). Hidden = pages noindex + out of the
  sitemap; nav item (between Services and Studio), footer link and home teaser (between Services and Studio)
  ship inside `<template data-preview>` (inert). `src/preview.js` (called by initNav): `?preview` or opening a
  /stories/ page turns them on for the browser session; `?preview=off` turns them off. Approval = true.
  (Agreed with the owner instead of a separate branch: GitHub Pages can only preview one branch.)
- Data: `src/data/stories.json` (NEWEST FIRST: the first is featured on the index and in the home teaser;
  slug per language; `cover` = scene id; dates → Article JSON-LD). Markup: `scripts/i18n/stories-markup.mjs`
  (index: featured horizontal + titles list from 3 stories; CollectionPage/Article + BreadcrumbList).
  Pages: `src/stories.html`, `src/story.html` (collection 'stories', stubs git-ignored). Texts/storyboards:
  `content/stories/<nn-slug>/` (not under /stories/: root folders are URLs).
- Scenes (`src/stories/scenes/`, styles `src/stories/scene.css`): HyperFrames conventions (data-composition-id,
  design size 1920x1080, ONE paused GSAP timeline in window.__timelines[id]) driving CSS custom properties;
  the HTML/CSS defaults are the FINAL frame (no JS, reduced motion, index, OG). Size containers (cqw/cqh):
  the same composition re-composes for 16:9 and 4:5 (`--scn-ar`). mountScene() returns { tl } (a GSAP
  timeline is a thenable: never return it from an async function). Home teaser `src/stories/home.{js,css}`:
  lazy with Work/Services/Studio; frame 0 gray + 00:00:00:00, plays ONCE at 40 % visible, pauses off screen.
- Story text = Markdown `content/stories/<nn-slug>/story.{es,en}.md` (approved copy, source of truth) →
  `scripts/i18n/story-body.mjs` (## = one act <section>, timecode labels `storyUi.acts`; directives `::scene id`,
  `::quoter`, `::result`, `::cta`; `[PENDIENTE: …]` dropped + listed by the build). Scene/quoter markup:
  `scripts/i18n/story-scenes.mjs`. Page script `src/stories/story.js`: scenes `[data-scrub]` mounted near the
  screen and scrubbed by ScrollTrigger (top 88% → center 42%). OG image per language: `scripts/stories/og.mjs`
  (final frame of the cover scene) → `public/stories/og/<id>-<lang>.jpg`, `og` in stories.json.
- Story 01 quoter: NO money (owner, Oct 2026: no prices on the site). Points/levels in `src/stories/quote.js`
  (approved): Esencial ≤ 4 / Avanzado ≤ 7 / Premium; times "un par de días" / "alrededor de una semana" /
  "un par de semanas". "Cotiza tu proyecto" → /contacto/?story=01&duracion=…&estilo=…&guion=…&formatos=…&extras=…
  &urgencia=… → src/contact/page.js prefills the message (editable) + hidden field `story`.
  Still unconfirmed in the text (shown without the markers): whether original music / several voice languages
  or a rush change the quote.
