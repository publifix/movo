// Bilingual static pages for Vite.
//
// src/page.html is the only page template. For every locale in site.config.mjs this plugin
// serves/builds a real HTML file (es → /index.html, en → /en/index.html) with the strings of
// src/i18n/<code>.json baked in, plus per-page SEO: canonical, hreflang alternates, Open Graph,
// Twitter card, JSON-LD and robots. At build time it also emits robots.txt, sitemap.xml and a
// bilingual 404.html. Content is in the HTML itself (not injected by JS), so it is indexable.
import fs from 'node:fs';
import path from 'node:path';
import site from './site.config.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const TEMPLATE = path.join(ROOT, 'src/page.html');
const strings = code => JSON.parse(fs.readFileSync(path.join(ROOT, `src/i18n/${code}.json`), 'utf8'));
const REELS = path.join(ROOT, 'src/data/reels.json');
const reelsData = () => JSON.parse(fs.readFileSync(REELS, 'utf8'));

// Work cards, rendered into the HTML for every language (titles indexable). No media URL is in a src
// attribute: posters and previews load from data-* only after the visitor scrolls (src/work/).
function workMarkup(t, root) {
  const { fullBaseUrl = '', reels } = reelsData();
  const fullUrl = r => (/^https?:\/\//.test(r.full) ? r.full : fullBaseUrl ? fullBaseUrl + r.full : root + r.full);
  const cats = [...new Set(reels.map(r => r.category))];
  const filters = [`<button type="button" class="work__filter" data-filter="all" aria-pressed="true">${esc(t.work.all)}</button>`]
    .concat(cats.map(c => `<button type="button" class="work__filter" data-filter="${c}" aria-pressed="false">${esc(t.work.categories[c])}</button>`))
    .join('');
  const cards = reels.map((r, i) => {
    const title = r.title[t._lang] ?? r.title.es;
    const cat = t.work.categories[r.category];
    return `<li class="work__item" data-category="${r.category}">
          <a class="reel" href="${esc(fullUrl(r))}" data-reel="${r.id}" data-index="${i}"
             data-poster="${root}${r.poster}" data-preview-webm="${root}${r.preview.webm}" data-preview-mp4="${root}${r.preview.mp4}"
             data-full="${esc(fullUrl(r))}" data-title="${esc(title)}" data-client="${esc(r.client)}" data-category-label="${esc(cat)}"
             aria-label="${esc(t.work.open)}: ${esc(title)} — ${esc(r.client)}">
            <span class="reel__media">
              <img class="reel__poster" alt="" width="480" height="854" decoding="async" data-src="${root}${r.poster}" />
              <video class="reel__video" muted loop playsinline preload="none" disablepictureinpicture tabindex="-1" aria-hidden="true"></video>
            </span>
            <span class="reel__info">
              <span class="reel__client">${esc(r.client)}</span>
              <span class="reel__title">${esc(title)}</span>
              <span class="reel__cat">${esc(cat)}</span>
            </span>${r.mock ? '\n            <span class="reel__mock" aria-hidden="true">MOCK</span>' : ''}
          </a>
        </li>`;
  });
  return { filters, cards: cards.join('\n        ') };
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const get = (obj, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const absolute = p => site.siteUrl + p;

// Which locale an HTML entry belongs to: <root>/en/index.html → en, <root>/index.html → default
function localeFor(filename) {
  const rel = path.relative(ROOT, filename).split(path.sep).join('/');
  return site.locales.find(l => l.path && rel === `${l.path}index.html`) || site.locales[0];
}

function render(locale) {
  const t = { ...strings(locale.code), _lang: locale.code };
  const root = locale.path ? '../'.repeat(locale.path.split('/').filter(Boolean).length) : './';
  const url = absolute(locale.path);

  const alternates = site.locales
    .map(l => `<link rel="alternate" hreflang="${l.code}" href="${absolute(l.path)}" />`)
    .concat(`<link rel="alternate" hreflang="x-default" href="${absolute(site.locales[0].path)}" />`);
  const ogAlternates = site.locales
    .filter(l => l !== locale)
    .map(l => `<meta property="og:locale:alternate" content="${strings(l.code).meta.ogLocale}" />`);

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': `${site.siteUrl}#org`, name: site.org.name, url: site.siteUrl, logo: absolute(site.org.logo) },
      { '@type': 'WebSite', '@id': `${site.siteUrl}#website`, url: site.siteUrl, name: site.org.name, publisher: { '@id': `${site.siteUrl}#org` }, inLanguage: site.locales.map(l => l.code) },
      { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: t.meta.title, description: t.meta.description, inLanguage: locale.code, isPartOf: { '@id': `${site.siteUrl}#website` } },
    ],
  };

  const seo = [
    site.noindex ? '<meta name="robots" content="noindex, nofollow" />' : '<meta name="robots" content="index, follow, max-image-preview:large" />',
    `<link rel="canonical" href="${url}" />`,
    ...alternates,
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${esc(site.org.name)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(t.meta.title)}" />`,
    `<meta property="og:description" content="${esc(t.meta.ogDescription)}" />`,
    `<meta property="og:image" content="${absolute(site.org.ogImage)}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:locale" content="${t.meta.ogLocale}" />`,
    ...ogAlternates,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(t.meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(t.meta.ogDescription)}" />`,
    `<meta name="twitter:image" content="${absolute(site.org.ogImage)}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`,
  ].join('\n    ');

  const langSwitch = site.locales
    .map(l => {
      const href = root + l.path;
      const current = l === locale ? ' aria-current="true"' : '';
      return `<a href="${href}" hreflang="${l.code}" lang="${l.code}"${current} title="${esc(l.name)}">${l.label}</a>`;
    })
    .join('<span aria-hidden="true">/</span>');

  const ui = { intro: t.intro, a11y: { menu: t.a11y.menu, closeMenu: t.a11y.closeMenu }, player: t.player, work: { scrubHint: t.work.scrubHint } };
  const work = workMarkup(t, root);
  const vars = {
    lang: locale.code,
    root,
    homeHref: root + locale.path,
    seo,
    langSwitch: `<span class="sr-only">${esc(t.a11y.language)}:</span> ${langSwitch}`,
    uiJson: JSON.stringify(ui).replace(/</g, '\\u003c'),
    workFilters: work.filters,
    workReels: work.cards,
  };

  return fs.readFileSync(TEMPLATE, 'utf8').replace(/\{\{([\w.]+)\}\}/g, (m, key) => {
    if (key in vars) return vars[key];
    const v = get(t, key);
    if (v == null) throw new Error(`[i18n] Missing string "${key}" in src/i18n/${locale.code}.json`);
    return esc(v);
  });
}

function notFoundPage() {
  const blocks = site.locales.map(l => {
    const t = strings(l.code).notFound;
    return `<section lang="${l.code}"><h1>${esc(t.title)}</h1><p>${esc(t.text)}</p><a href="${site.siteUrl}${l.path}">${esc(t.back)}</a></section>`;
  });
  return `<!doctype html>
<html lang="${site.locales[0].code}">
<head>
<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>404 — MOVO</title>
<style>
  body { margin: 0; min-height: 100svh; display: grid; place-content: center; gap: 48px; padding: 24px;
         background: #0B0B10; color: #F5F5F0; font: 16px/1.5 system-ui, sans-serif; }
  h1 { margin: 0 0 8px; color: #D7FF3B; font-size: clamp(1.75rem, 6vw, 3rem); text-transform: uppercase; letter-spacing: -0.02em; }
  p { margin: 0 0 16px; color: rgb(245 245 240 / 0.72); }
  a { display: inline-block; padding: 12px 24px; border-radius: 999px; background: #D7FF3B; color: #0B0B10; font-weight: 700; text-decoration: none; }
  a:focus-visible { outline: 2px solid #F5F5F0; outline-offset: 4px; }
</style>
</head>
<body>
${blocks.join('\n')}
</body>
</html>
`;
}

export default function movoI18n() {
  return {
    name: 'movo-i18n',
    config() {
      const input = Object.fromEntries(site.locales.map(l => [l.code, path.join(ROOT, l.path, 'index.html')]));
      return { build: { rollupOptions: { input } } };
    },
    configureServer(server) {
      // Edits to the template or the strings reload every language page
      const watched = [TEMPLATE, REELS, ...site.locales.map(l => path.join(ROOT, `src/i18n/${l.code}.json`))];
      server.watcher.add(watched);
      server.watcher.on('change', file => {
        if (watched.includes(file)) server.ws.send({ type: 'full-reload' });
      });
    },
    transformIndexHtml: {
      order: 'pre',
      handler(_html, ctx) {
        return render(localeFor(ctx.filename));
      },
    },
    generateBundle() {
      const urls = site.locales.map(l => {
        const links = site.locales
          .map(a => `<xhtml:link rel="alternate" hreflang="${a.code}" href="${absolute(a.path)}"/>`)
          .concat(`<xhtml:link rel="alternate" hreflang="x-default" href="${absolute(site.locales[0].path)}"/>`)
          .join('');
        return `<url><loc>${absolute(l.path)}</loc>${links}</url>`;
      });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`,
      });
      // With noindex the pages must stay crawlable, otherwise the noindex is never seen.
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${absolute('sitemap.xml')}\n` });
      this.emitFile({ type: 'asset', fileName: '404.html', source: notFoundPage() });
    },
  };
}
