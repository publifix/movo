// MOVO Stories markup (STORIES.md): the index (/stories/), the story pages (/stories/<slug>/) and the home
// teaser, rendered into the static HTML of every language. Data: src/data/stories.json (newest first).
//
// Scenes are compositions (HyperFrames conventions: data-composition-id, fixed design size, one GSAP
// timeline registered paused in window.__timelines, see src/stories/scenes/). Their HTML is their FINAL
// frame: without JS, with reduced motion, on the index and in an OG capture they show the finished cover;
// the scripts rewind them to frame 0 and the page plays or scrubs the timeline.
import fs from 'node:fs';
import path from 'node:path';
import { sceneMarkup, quoterMarkup, resultMarkup, ctaMarkup, logoMarkup } from './story-scenes.mjs';
import { storyBody, storyFile } from './story-body.mjs';

const STORIES = new URL('../../src/data/stories.json', import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
export const STORIES_DATA = STORIES.pathname;
// the texts of the stories (Markdown, approved copy): watched by the dev server
export const storyFiles = () => storiesData().stories.flatMap(s => (s.content ? ['es', 'en'].map(l => storyFile(ROOT, s, l)) : []));
export const storiesData = () => JSON.parse(fs.readFileSync(STORIES, 'utf8'));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const loc = (o, lang) => (o ? o[lang] ?? o.es : '');
export const slugOf = (item, lang) => (typeof item.slug === 'string' ? item.slug : loc(item.slug, lang));

// <template data-preview>: in the HTML but inert and invisible (src/preview.js turns it on for review)
export const gated = (html, published) => (published ? html : `<template data-preview>${html}</template>`);

export function storyMeta(t, s, lang) {
  return { title: loc(s.metaTitle, lang) || `${loc(s.title, lang)} · MOVO Stories`, description: loc(s.description, lang) };
}

const scene = (id, t, lang) => sceneMarkup(id, t, lang);

export function storiesMarkup({ t, lang, root, siteUrl, page, item, url, orgId, homeUrl, storiesUrl, storyHref, contactHref, published }) {
  const { stories } = storiesData();
  const latest = stories[0];
  const n = s => `${t.stories.num} ${s.id}`;

  const vars = {};
  // Home teaser (between Services and Studio): the newest story, one 16:9 frame (4:5 on phones).
  vars.storiesTeaser = latest
    ? gated(`<section class="sty" id="${t.nav.stories.id}" aria-labelledby="sty-title" data-stories-teaser data-clip="stories" data-clip-label="${esc(t.nav.stories.label)}">
        <div class="sty__frame">${scene(latest.cover, t, lang)}</div>
        <div class="sty__copy">
          <p class="sty__label">${esc(t.stories.label)}</p>
          <h2 class="sty__title" id="sty-title">${esc(t.stories.home.heading)}</h2>
          <p class="sty__story"><span class="sty__num">${esc(n(latest))}</span> ${esc(loc(latest.title, lang))}</p>
          <p class="sty__links">
            <a class="btn btn--volt" href="${esc(storyHref(latest))}">${esc(t.stories.home.cta)}</a>
            <a class="sty__all" href="${esc(storyHref(null))}">${esc(t.stories.home.all)} <span aria-hidden="true">→</span></a>
          </p>
        </div>
      </section>`, published)
    : '';

  const jsonld = [];
  if (page.id === 'stories') {
    // Featured (the newest, horizontal, its cover's final frame) + from 3 stories on, a plain list of titles.
    vars.storiesFeatured = latest
      ? `<article class="sx-feat" aria-labelledby="sx-feat-title">
          <a class="sx-feat__frame" href="${esc(storyHref(latest))}" tabindex="-1" aria-hidden="true">${scene(latest.cover, t, lang)}</a>
          <div class="sx-feat__copy">
            <p class="sx-feat__num">${esc(n(latest))} · ${esc(t.stories.featured)}</p>
            <h2 class="sx-feat__title" id="sx-feat-title"><a href="${esc(storyHref(latest))}">${esc(loc(latest.title, lang))}</a></h2>
            <p class="sx-feat__dek">${esc(loc(latest.dek, lang))}</p>
            <a class="btn btn--volt" href="${esc(storyHref(latest))}">${esc(t.stories.read)}</a>
          </div>
        </article>`
      : '';
    vars.storiesList = stories.length >= 3
      ? `<section class="sx-list" aria-labelledby="sx-list-title">
          <h2 class="sx-list__title" id="sx-list-title">${esc(t.stories.all)}</h2>
          <ol class="sx-list__items" role="list">${stories
            .slice(1)
            .map(s => `<li><a href="${esc(storyHref(s))}"><span class="sx-list__num">${esc(s.id)}</span> ${esc(loc(s.title, lang))}</a></li>`)
            .join('')}</ol>
        </section>`
      : '';
    jsonld.push(
      {
        '@type': 'CollectionPage',
        '@id': `${url}#collection`,
        url,
        name: t.stories.h1,
        description: t.stories.meta.description,
        inLanguage: lang,
        publisher: { '@id': orgId },
        hasPart: stories.map(s => ({ '@type': 'Article', headline: loc(s.title, lang), url: new URL(storyHref(s), url).href })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'MOVO', item: homeUrl },
          { '@type': 'ListItem', position: 2, name: t.stories.h1, item: url },
        ],
      },
    );
  }

  let ogImage = null;
  if (page.id === 'story' && item) {
    const s = stories.find(x => x.id === item.id) || item;
    // the acts: <section> per ## of the text, named by the timecode (01 Quieto, 02 Chispa…)
    const act = i => `<section class="sp-act" data-act="${i + 1}" data-clip="act-${i + 1}" data-clip-label="${esc(t.storyUi.acts[i] || '')}">`;
    const directive = (name, arg) =>
      name === 'scene' ? `<figure class="sp-scene">${scene(arg, t, lang).replace('data-duration=', 'data-scrub data-duration=')}</figure>`
      : name === 'quoter' ? quoterMarkup(t, lang)
      : name === 'result' ? resultMarkup(t, lang, contactHref)
      : name === 'cta' ? ctaMarkup(t, contactHref, s, lang)
      : name === 'logo' ? logoMarkup(t)
      : '';
    Object.assign(vars, {
      storyNum: esc(n(s)),
      storyTitle: esc(loc(s.title, lang)),
      storyDek: esc(loc(s.dek, lang)),
      storyBody: s.content ? storyBody(storyFile(ROOT, s, lang), { root, act, directive }) : '',
    });
    if (s.og) ogImage = { url: new URL(s.og.replace('{lang}', lang), siteUrl).href, width: 1200, height: 630, alt: loc(s.title, lang) };
    const article = {
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: loc(s.title, lang),
      description: loc(s.description, lang),
      inLanguage: lang,
      author: { '@id': orgId },
      publisher: { '@id': orgId },
      mainEntityOfPage: url,
    };
    if (ogImage) article.image = ogImage.url;
    if (s.datePublished) article.datePublished = `${s.datePublished}T12:00:00-06:00`;
    if (s.dateModified || s.datePublished) article.dateModified = `${s.dateModified || s.datePublished}T12:00:00-06:00`;
    jsonld.push(article, {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'MOVO', item: homeUrl },
        { '@type': 'ListItem', position: 2, name: t.stories.h1, item: storiesUrl },
        { '@type': 'ListItem', position: 3, name: loc(s.title, lang), item: url },
      ],
    });
  }
  return { vars, jsonld, ogImage };
}
