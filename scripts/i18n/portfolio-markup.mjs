// Portfolio markup: the Work page (/trabajo/, /en/work/) and one page per project (/trabajo/<slug>/),
// both generated from src/data/reels.json — a new reel there is a new card and a new indexable page.
// Text, poster images and links are in the HTML; the page scripts only add previews and playback.
import { reelMedia } from './reel-media.mjs';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fill = (tpl, v) => tpl.replace(/\{(\w+)\}/g, (m, k) => v[k] ?? m);
const loc = (o, lang) => (o ? o[lang] ?? o.es : '');
const pad = n => String(n).padStart(2, '0');
const clock = s => `${Math.floor(s / 60)}:${pad(Math.round(s % 60))}`;
const isoDuration = s => `PT${Math.floor(s / 60) ? `${Math.floor(s / 60)}M` : ''}${Math.round(s % 60)}S`;

const listed = reelsData => reelsData.reels.filter(r => r.slug && !r.pending);

// A search result shows ~60 characters of title and ~155 of description: long project titles use their
// short version (titleShort), long descriptions are cut at a word.
const cut = (text, max) => (text.length <= max ? text : `${text.slice(0, max - 1).replace(/[\s,;:.]+\S*$/, '')}…`);

export function projectMeta(t, r, lang) {
  const v = { title: loc(r.title, lang), client: r.client, category: t.work.categories[r.category] };
  let title = fill(t.project.metaTitle, v);
  if (title.length > 62 && r.titleShort) title = fill(t.project.metaTitle, { ...v, title: loc(r.titleShort, lang) });
  return {
    title,
    description: cut(loc(r.description, lang) || fill(t.project.metaDescription, { ...v, category: v.category.toLowerCase() }), 158),
  };
}

export function portfolioMarkup({ t, lang, root, item, url, orgId, homeUrl, workUrl, projectHref, absoluteProject, servicesHref, reelsData, servicesData }) {
  const reels = listed(reelsData);
  const media = r => reelMedia(r, { root, fullBaseUrl: reelsData.fullBaseUrl });
  const pillarOf = cat => servicesData.pillars.find(p => p.workFilter.includes(cat));
  const catLabel = c => t.work.categories[c];
  const total = reels.length;

  // a portfolio card (Work page grid, "more projects"): 2 / 3 / 4 columns (src/portfolio/portfolio.css)
  const sizes = '(min-width: 1280px) 25vw, (min-width: 900px) 33vw, 50vw';
  const card = (r, { heading = 'h2', lazy = true } = {}) => {
    const m = media(r);
    const i = reels.indexOf(r);
    const ar = m.width * 16 === m.height * 9 ? '' : ` style="--ar: ${m.width} / ${m.height}"`;
    const color = pillarOf(r.category)?.color || 'volt';
    return `<li class="pf__item" data-category="${r.category}">
          <a class="pf-card" href="${esc(projectHref(r))}" data-preview="${esc(m.previewMp4)}">
            <span class="pf-card__media"${ar}>
              <img class="pf-card__poster" src="${esc(m.poster)}"${m.posterSrcset ? ` srcset="${esc(m.posterSrcset)}" sizes="${sizes}"` : ''} alt="" width="${m.width}" height="${m.height}"${lazy ? ' loading="lazy"' : ''} decoding="async" />
              <video class="pf-card__video" muted loop playsinline preload="none" disablepictureinpicture tabindex="-1" aria-hidden="true"></video>
              <span class="pf-card__num" aria-hidden="true">${pad(i + 1)}</span>
            </span>
            <span class="pf-card__info">
              <span class="pf-card__client">${esc(r.client)}</span>
              <${heading} class="pf-card__title">${esc(loc(r.title, lang))}</${heading}>
              <span class="pf-card__cat" data-color="${color}">${esc(catLabel(r.category))}</span>
            </span>
          </a>
        </li>`;
  };

  const cats = [...new Set(reels.map(r => r.category))];
  const vars = {
    pfCount: `${total} ${total === 1 ? t.workPage.countOne : t.workPage.count}`,
    pfFilters: [`<button type="button" class="pf__filter" data-filter="all" aria-pressed="true">${esc(t.work.all)} <span>${total}</span></button>`]
      .concat(cats.map(c => {
        const n = reels.filter(r => r.category === c).length;
        return `<button type="button" class="pf__filter" data-filter="${c}" data-color="${pillarOf(c)?.color || 'volt'}" aria-pressed="false">${esc(catLabel(c))} <span>${n}</span></button>`;
      }))
      .join(''),
    // the first row loads right away (it is on screen); the rest when it gets near
    pfGrid: reels.map((r, i) => card(r, { lazy: i > 3 })).join('\n        '),
  };
  const jsonld = [];

  if (!item) {
    jsonld.push({
      '@type': 'ItemList',
      '@id': `${url}#projects`,
      name: t.workPage.h1,
      numberOfItems: total,
      itemListElement: reels.map((r, i) => ({ '@type': 'ListItem', position: i + 1, url: absoluteProject(r), name: `${loc(r.title, lang)} — ${r.client}` })),
    });
    return { vars, jsonld };
  }

  // ---------- project page ----------
  const r = reels.find(x => x.slug === item.slug) || item; // the same reel from this read of the data
  const m = media(r);
  const i = reels.indexOf(r);
  const prev = reels[(i - 1 + total) % total];
  const next = reels[(i + 1) % total];
  const pillar = pillarOf(r.category);
  const desc = loc(r.description, lang);
  // more projects: the same category first, then the following ones (never this one)
  const others = reels.filter(x => x !== r);
  const more = [...others.filter(x => x.category === r.category), ...others.slice(i).concat(others.slice(0, i)).filter(x => x.category !== r.category)].slice(0, 3);
  const meta = projectMeta(t, r, lang);
  const facts = [
    [t.project.client, esc(r.client)],
    [t.project.category, `<span class="pj-cat" data-color="${pillar?.color || 'volt'}">${esc(catLabel(r.category))}</span>`],
    pillar ? [t.project.service, `<a class="pj-link" href="${servicesHref}#${pillar.anchor[lang]}">${esc(t.services.pillars[pillar.id].title)}</a>`] : null,
    r.bunny?.duration ? [t.project.duration, clock(r.bunny.duration)] : null,
    m.width * 16 === m.height * 9 ? [t.project.format, esc(t.project.vertical)] : null,
  ].filter(Boolean);

  Object.assign(vars, {
    projTitle: esc(loc(r.title, lang)),
    projClient: esc(r.client),
    projNum: `${pad(i + 1)} / ${pad(total)}`,
    // the poster is the page's largest image (a <video> poster has no srcset): 1080 px, requested early
    projPoster: esc(m.posterSrcset ? m.poster.replace(/-720\.webp$/, '-1080.webp') : m.poster),
    projFull: esc(m.full),
    projFullMobile: esc(m.fullMobile),
    projW: String(m.width),
    projH: String(m.height),
    projAr: `${m.width} / ${m.height}`,
    projFacts: facts.map(([k, v]) => `<div class="pj-facts__row"><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join(''),
    projDesc: desc ? `<p class="pj-desc">${esc(desc)}</p>` : '',
    projPrev: `<a class="pj-step pj-step--prev" href="${esc(projectHref(prev))}" rel="prev"><span class="pj-step__label">${esc(t.project.prev)}</span><span class="pj-step__title">${esc(prev.client)} · ${esc(loc(prev.title, lang))}</span></a>`,
    projNext: `<a class="pj-step pj-step--next" href="${esc(projectHref(next))}" rel="next"><span class="pj-step__label">${esc(t.project.next)}</span><span class="pj-step__title">${esc(next.client)} · ${esc(loc(next.title, lang))}</span></a>`,
    projMore: more.map(x => card(x, { heading: 'h3' })).join('\n        '),
  });

  const video = {
    '@type': 'VideoObject',
    '@id': `${url}#video`,
    name: `${loc(r.title, lang)} — ${r.client}`,
    description: meta.description,
    thumbnailUrl: [new URL(m.thumbnail, url).href],
    contentUrl: m.full,
    inLanguage: lang,
    publisher: { '@id': orgId },
  };
  if (r.bunny?.duration) video.duration = isoDuration(r.bunny.duration);
  if (r.date) video.uploadDate = r.date; // needed by Google for video rich results: add `date` to the reel
  jsonld.push(video, {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'MOVO', item: homeUrl },
      { '@type': 'ListItem', position: 2, name: t.workPage.h1, item: workUrl },
      { '@type': 'ListItem', position: 3, name: `${loc(r.title, lang)} — ${r.client}`, item: url },
    ],
  });
  // link previews (WhatsApp, LinkedIn, X…) show this project's frame, self-hosted (crawlers get 403 from Bunny)
  const ogImage = m.ogImage ? { url: new URL(m.ogImage, url).href, width: 1200, height: 630, alt: `${loc(r.title, lang)} — ${r.client}` } : null;
  return { vars, jsonld, ogImage };
}
