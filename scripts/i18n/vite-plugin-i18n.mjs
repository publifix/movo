// Bilingual static pages for Vite.
//
// Every page in site.config.mjs has one template. For every page × locale this plugin serves/builds a real
// HTML file (es → /index.html, /servicios/, /estudio/, /trabajo/, /contacto/…; en → /en/, /en/services/…)
// with the strings of src/i18n/<code>.json baked in, plus per-page SEO: canonical, hreflang alternates,
// Open Graph, Twitter card, JSON-LD and robots. A page with `collection: 'reels'` is rendered once per
// reel of src/data/reels.json (project pages: /trabajo/<slug>/, /en/work/<slug>/); their stub index.html
// files are created at startup. Templates can include shared pieces from src/partials/ with {{> name}}. At build time it also emits robots.txt,
// sitemap.xml and a bilingual 404.html. Content is in the HTML itself (not injected by JS).
import fs from 'node:fs';
import path from 'node:path';
import site from './site.config.mjs';
import { servicesMarkup } from './services-markup.mjs';
import { reelMedia, THUMBS_DATA } from './reel-media.mjs';
import { studioMarkup, STUDIO_DATA } from './studio-markup.mjs';
import { portfolioMarkup, projectMeta } from './portfolio-markup.mjs';
import { siteMarkup, SITE_DATA, contactData } from './site-markup.mjs';
import { privacyMarkup, PRIVACY_DATA } from './privacy-markup.mjs';
import { storiesMarkup, storyMeta, storiesData, slugOf, gated, STORIES_DATA, storyFiles } from './stories-markup.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const PARTIALS = path.join(ROOT, 'src/partials');
const SERVICES = path.join(ROOT, 'src/data/services.json');
const PREVIEWS = path.join(ROOT, 'src/data/services-previews.json');
const servicesData = () => JSON.parse(fs.readFileSync(SERVICES, 'utf8'));
const strings = code => JSON.parse(fs.readFileSync(path.join(ROOT, `src/i18n/${code}.json`), 'utf8'));
const REELS = path.join(ROOT, 'src/data/reels.json');
const socialUrls = () => Object.values(contactData().social || {}).filter(Boolean);
const reelsData = () => JSON.parse(fs.readFileSync(REELS, 'utf8'));

// Work cards, rendered into the HTML for every language (titles indexable). No media URL is in a src
// attribute: posters and previews load from data-* only after the visitor scrolls (src/work/).
function workMarkup(t, root, projectHref) {
  const { fullBaseUrl = '', reels } = reelsData();
  const cats = [...new Set(reels.map(r => r.category))];
  // Each category takes the color of its Services pillar (brand volt, content magenta, explain violet).
  const color = c => servicesData().pillars.find(p => p.workFilter.includes(c))?.color;
  const filters = [`<button type="button" class="work__filter" data-filter="all" aria-pressed="true">${esc(t.work.all)}</button>`]
    .concat(cats.map(c => `<button type="button" class="work__filter" data-filter="${c}"${color(c) ? ` data-color="${color(c)}"` : ''} aria-pressed="false">${esc(t.work.categories[c])}</button>`))
    .join('');
  const cards = reels.map((r, i) => {
    const title = r.title[t._lang] ?? r.title.es;
    // optional shorter title for phones (feed card + player), where a long one takes 4+ lines
    const short = r.titleShort ? (r.titleShort[t._lang] ?? r.titleShort.es) : '';
    const desc = r.description ? (r.description[t._lang] ?? r.description.es) : '';
    const cat = t.work.categories[r.category];
    const m = reelMedia(r, { root, fullBaseUrl });
    // the card takes the video's real proportion (9:16 unless the data says otherwise)
    const ar = m.width * 16 === m.height * 9 ? '' : ` style="--ar: ${m.width} / ${m.height}"`;
    const tag = r.pending ? t.work.pendingTag : r.mock ? 'MOCK' : '';
    return `<li class="work__item" data-category="${r.category}"${ar}>
          <a class="reel" href="${esc(projectHref(r))}" data-reel="${r.id}" data-index="${i}"
             data-poster="${esc(m.poster)}" data-preview-webm="${esc(m.previewWebm)}" data-preview-mp4="${esc(m.previewMp4)}"
             data-full="${esc(m.full)}" data-full-mobile="${esc(m.fullMobile)}" data-title="${esc(title)}"${short ? ` data-title-short="${esc(short)}"` : ''} data-client="${esc(r.client)}" data-category-label="${esc(cat)}"${desc ? ` data-desc="${esc(desc)}"` : ''}
             aria-label="${esc(t.work.open)}: ${esc(title)} — ${esc(r.client)}">
            <span class="reel__media">
              <img class="reel__poster" alt="" width="${m.width}" height="${m.height}" decoding="async" data-src="${esc(m.poster)}" />
              <video class="reel__video" muted loop playsinline preload="none" disablepictureinpicture tabindex="-1" aria-hidden="true"></video>
            </span>
            <span class="reel__info">
              <span class="reel__client">${esc(r.client)}</span>
              <span class="reel__title">${short ? `<span class="reel__t-full">${esc(title)}</span><span class="reel__t-short">${esc(short)}</span>` : esc(title)}</span>
              <span class="reel__cat">${esc(cat)}</span>
            </span>${tag ? `\n            <span class="reel__mock${r.pending ? ' reel__mock--pending' : ''}" aria-hidden="true">${esc(tag)}</span>` : ''}
          </a>
        </li>`;
  });
  return { filters, cards: cards.join('\n        ') };
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const get = (obj, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
const absolute = p => site.siteUrl + p;

// Collection pages are one per item with a slug (project pages: reels; story pages: stories, a slug per
// language); every other page has one item (null).
const itemsOf = page =>
  page.collection === 'reels' ? reelsData().reels.filter(r => r.slug)
  : page.collection === 'stories' ? storiesData().stories.filter(s => s.slug)
  : [null];
const urlPath = (page, locale, item = null) => locale.path + page.path[locale.code] + (item ? `${slugOf(item, locale.code)}/` : '');
// A gated page (MOVO Stories while stories.published is false) is built but hidden: noindex, no sitemap.
const hidden = page => page.gate === 'stories' && !site.stories.published;
const entries = () =>
  site.pages.flatMap(page => itemsOf(page).flatMap(item => site.locales.map(locale => ({ page, locale, item }))));

// Which page, locale (and item) an HTML entry belongs to (<root>/en/services/index.html → services, en)
function pageFor(filename) {
  const rel = path.relative(ROOT, filename).split(path.sep).join('/');
  return entries().find(e => rel === `${urlPath(e.page, e.locale, e.item)}index.html`) || { page: site.pages[0], locale: site.locales[0], item: null };
}

// partials can include partials (page-head → head-links)
const includePartials = (html, depth = 0) =>
  html.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (m, name) => {
    if (depth > 4) throw new Error(`[i18n] partials nested too deep at "${name}"`);
    return includePartials(fs.readFileSync(path.join(PARTIALS, `${name}.html`), 'utf8').trim(), depth + 1);
  });

function render(page, locale, item = null) {
  const t = { ...strings(locale.code), _lang: locale.code };
  const here = urlPath(page, locale, item);
  const root = here ? '../'.repeat(here.split('/').filter(Boolean).length) : './';
  const url = absolute(here);
  const meta = !item ? get(t, page.meta) : page.collection === 'stories' ? storyMeta(t, item, locale.code) : projectMeta(t, item, locale.code);
  if (!meta?.title || !meta?.description) throw new Error(`[i18n] Missing "${page.meta}.title/description" in src/i18n/${locale.code}.json`);
  const pageHref = (id, l = locale, it = null) => root + urlPath(site.pages.find(p => p.id === id), l, it);
  const homeHref = pageHref('home');
  const servicesHref = pageHref('services');
  const studioHref = pageHref('studio');
  const workHref = pageHref('work');
  const contactHref = pageHref('contact');
  const privacyHref = pageHref('privacy');
  const projectHref = r => pageHref('project', locale, r);
  const storiesHref = pageHref('stories');
  const storyHref = s => (s ? pageHref('story', locale, s) : storiesHref);
  const isHome = page.id === 'home';

  const alternates = site.locales
    .map(l => `<link rel="alternate" hreflang="${l.code}" href="${absolute(urlPath(page, l, item))}" />`)
    .concat(`<link rel="alternate" hreflang="x-default" href="${absolute(urlPath(page, site.locales[0], item))}" />`);
  const ogAlternates = site.locales
    .filter(l => l !== locale)
    .map(l => `<meta property="og:locale:alternate" content="${strings(l.code).meta.ogLocale}" />`);

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        // a motion design studio in Querétaro (ProfessionalService = a local business) that works worldwide
        '@type': ['Organization', 'ProfessionalService'],
        '@id': `${site.siteUrl}#org`,
        name: site.org.name,
        alternateName: site.org.alternateName,
        url: site.siteUrl,
        logo: absolute(site.org.logo),
        image: absolute(site.org.ogImage),
        description: strings(locale.code).meta.description,
        telephone: site.org.telephone,
        address: { '@type': 'PostalAddress', ...site.org.address },
        areaServed: site.org.areaServed.map(a => (a === 'Worldwide' ? { '@type': 'Place', name: a } : { '@type': 'Country', name: a })),
        knowsAbout: site.org.knowsAbout,
        parentOrganization: { '@type': 'Organization', name: site.org.parent },
        ...(socialUrls().length ? { sameAs: socialUrls() } : {}),
      },
      { '@type': 'WebSite', '@id': `${site.siteUrl}#website`, url: site.siteUrl, name: site.org.name, publisher: { '@id': `${site.siteUrl}#org` }, inLanguage: site.locales.map(l => l.code) },
      { '@type': 'WebPage', '@id': `${url}#webpage`, url, name: meta.title, description: meta.description, inLanguage: locale.code, isPartOf: { '@id': `${site.siteUrl}#website` } },
    ],
  };
  const svc = servicesMarkup({ t, lang: locale.code, root, homeHref, servicesHref, workHref, data: servicesData(), reelsData: reelsData() });
  const pageUrl = (id, it = null) => absolute(urlPath(site.pages.find(p => p.id === id), locale, it));
  const pf = portfolioMarkup({
    t, lang: locale.code, root, item: page.collection === 'reels' ? item : null, url, orgId: `${site.siteUrl}#org`, homeUrl: pageUrl('home'), workUrl: pageUrl('work'),
    projectHref, absoluteProject: r => pageUrl('project', r), servicesHref, reelsData: reelsData(), servicesData: servicesData(),
  });
  // the Work ItemList belongs to the Work page; VideoObject + breadcrumb to the project pages
  if (page.id === 'work' || page.id === 'project') jsonld['@graph'].push(...pf.jsonld);
  const st = storiesMarkup({
    t, lang: locale.code, root, siteUrl: site.siteUrl, page, item: page.collection === 'stories' ? item : null, url, orgId: `${site.siteUrl}#org`,
    homeUrl: pageUrl('home'), storiesUrl: pageUrl('stories'), storyHref, contactHref, published: site.stories.published,
  });
  jsonld['@graph'].push(...st.jsonld);
  if (page.id === 'services') {
    jsonld['@graph'].push({
      '@type': 'ItemList',
      '@id': `${url}#services`,
      name: t.services.page.h1,
      itemListElement: svc.jsonldServices.map(({ slug, ...s }, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { ...s, url: `${url}#${slug}`, provider: { '@id': `${site.siteUrl}#org` }, inLanguage: locale.code },
      })),
    });
  }

  // a project page shares its own frame (self-hosted, see reel-media.mjs); every other page the studio image
  const ogImage = pf.ogImage || st.ogImage || { url: absolute(site.org.ogImage), alt: site.org.name };
  const seo = [
    site.noindex || hidden(page) ? '<meta name="robots" content="noindex, nofollow" />' : '<meta name="robots" content="index, follow, max-image-preview:large" />',
    `<link rel="canonical" href="${url}" />`,
    ...alternates,
    `<meta property="og:type" content="${page.id === 'story' ? 'article' : 'website'}" />`,
    `<meta property="og:site_name" content="${esc(site.org.name)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.ogDescription || meta.description)}" />`,
    `<meta property="og:image" content="${ogImage.url}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${esc(ogImage.alt)}" />`,
    `<meta property="og:locale" content="${t.meta.ogLocale}" />`,
    ...ogAlternates,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.ogDescription || meta.description)}" />`,
    `<meta name="twitter:image" content="${ogImage.url}" />`,
    `<meta name="twitter:image:alt" content="${esc(ogImage.alt)}" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`,
  ].join('\n    ');

  const langSwitch = site.locales
    .map(l => {
      const href = root + urlPath(page, l, item);
      const current = l === locale ? ' aria-current="true"' : '';
      return `<a href="${href}" hreflang="${l.code}" lang="${l.code}"${current} title="${esc(l.name)}">${l.label}</a>`;
    })
    .join('<span aria-hidden="true">/</span>');

  // the other languages of this same page (the intro gate offers them: no automatic redirect, for SEO)
  const otherLangs = site.locales
    .filter(l => l !== locale)
    .map(l => ({ code: l.code, name: strings(l.code).intro.langName, offer: strings(l.code).intro.langOffer, href: root + urlPath(page, l, item) }));
  const ui = { intro: { ...t.intro, langs: otherLangs }, a11y: { menu: t.a11y.menu, closeMenu: t.a11y.closeMenu }, player: t.player, work: { scrubHint: t.work.scrubHint }, contact: t.contactUi, ...(['story', 'contact'].includes(page.id) ? { story: t.storyUi } : {}) };
  const work = workMarkup(t, root, projectHref);
  // Nav: every item is a page (Work, Services, Studio, Contact); the home keeps a teaser of each one.
  const current = (...ids) => (ids.includes(page.id) ? ' aria-current="page"' : '');
  const vars = {
    lang: locale.code,
    root,
    homeHref,
    servicesHref,
    studioHref,
    workHref,
    contactHref,
    privacyHref,
    seo,
    'page.title': esc(meta.title),
    'page.description': esc(meta.description),
    'nav.work.href': workHref,
    'nav.services.href': servicesHref,
    'nav.studio.href': studioHref,
    'nav.contact.href': contactHref,
    // Stories sits between Services and Studio; hidden (inert <template>) until stories.published
    navStories: gated(`<li><a href="${storiesHref}"${current('stories', 'story')}>${esc(t.nav.stories.label)}</a></li>`, site.stories.published),
    storiesHref,
    // a hidden page turns the preview on for this browser session (src/preview.js)
    htmlPreview: hidden(page) ? ' data-preview="on"' : '',
    'navCurrent.work': current('work', 'project'),
    'navCurrent.services': current('services'),
    'navCurrent.studio': current('studio'),
    'navCurrent.contact': current('contact'),
    langSwitch: `<span class="sr-only">${esc(t.a11y.language)}:</span> ${langSwitch}`,
    uiJson: JSON.stringify(ui).replace(/</g, '\\u003c'),
    workFilters: work.filters,
    workReels: work.cards,
    ...svc,
    ...studioMarkup({ t, lang: locale.code }),
    ...pf.vars,
    ...st.vars,
    ...(page.id === 'privacy' ? privacyMarkup({ lang: locale.code }) : {}),
    ...siteMarkup({ t, lang: locale.code, root, homeHref, workHref, servicesHref, studioHref, contactHref, privacyHref, storiesHref, storiesPublished: site.stories.published, langSwitch }),
  };

  const template = includePartials(fs.readFileSync(path.join(ROOT, page.template), 'utf8'));
  return template.replace(/\{\{([\w.]+)\}\}/g, (m, key) => {
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
      // collection pages (projects, stories): their stub index.html files are generated (git-ignored)
      for (const { page, locale, item } of entries()) {
        if (!item) continue;
        const file = path.join(ROOT, urlPath(page, locale, item), 'index.html');
        if (!fs.existsSync(file)) {
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, `<!-- Generated at dev/build time from ${page.template} (see scripts/i18n/vite-plugin-i18n.mjs). Do not edit. -->\n`);
        }
      }
      const input = Object.fromEntries(
        entries().map(({ page, locale, item }) => [[page.id, item && slugOf(item, locale.code), locale.code].filter(Boolean).join('-'), path.join(ROOT, urlPath(page, locale, item), 'index.html')]),
      );
      return { build: { rollupOptions: { input } } };
    },
    configureServer(server) {
      // Edits to the template or the strings reload every language page
      const watched = [...site.pages.map(p => path.join(ROOT, p.template)), REELS, THUMBS_DATA, STORIES_DATA, ...storyFiles(), SERVICES, PREVIEWS, ...STUDIO_DATA, ...SITE_DATA, ...PRIVACY_DATA, ...site.locales.map(l => path.join(ROOT, `src/i18n/${l.code}.json`))];
      server.watcher.add([...watched, PARTIALS]);
      server.watcher.on('change', file => {
        if (watched.includes(file) || file.startsWith(PARTIALS)) server.ws.send({ type: 'full-reload' });
      });
    },
    transformIndexHtml: {
      order: 'pre',
      handler(_html, ctx) {
        const { page, locale, item } = pageFor(ctx.filename);
        return render(page, locale, item);
      },
    },
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);
      const urls = entries().filter(({ page }) => !hidden(page)).map(({ page, locale: l, item }) => {
        const links = site.locales
          .map(a => `<xhtml:link rel="alternate" hreflang="${a.code}" href="${absolute(urlPath(page, a, item))}"/>`)
          .concat(`<xhtml:link rel="alternate" hreflang="x-default" href="${absolute(urlPath(page, site.locales[0], item))}"/>`)
          .join('');
        return `<url><loc>${absolute(urlPath(page, l, item))}</loc><lastmod>${today}</lastmod>${links}</url>`;
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
