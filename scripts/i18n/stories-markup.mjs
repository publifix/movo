// MOVO Stories markup (STORIES.md): the index (/stories/), the story pages (/stories/<slug>/) and the home
// teaser, rendered into the static HTML of every language. Data: src/data/stories.json (newest first).
//
// Scenes are compositions (HyperFrames conventions: data-composition-id, fixed design size, one GSAP
// timeline registered paused in window.__timelines, see src/stories/scenes/). Their HTML is their FINAL
// frame: without JS, with reduced motion, on the index and in an OG capture they show the finished cover;
// the scripts rewind them to frame 0 and the page plays or scrubs the timeline.
import fs from 'node:fs';

const STORIES = new URL('../../src/data/stories.json', import.meta.url);
export const STORIES_DATA = STORIES.pathname;
export const storiesData = () => JSON.parse(fs.readFileSync(STORIES, 'utf8'));

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const loc = (o, lang) => (o ? o[lang] ?? o.es : '');
export const slugOf = (item, lang) => (typeof item.slug === 'string' ? item.slug : loc(item.slug, lang));

// <template data-preview>: in the HTML but inert and invisible (src/preview.js turns it on for review)
export const gated = (html, published) => (published ? html : `<template data-preview>${html}</template>`);

export function storyMeta(t, s, lang) {
  return { title: `${loc(s.title, lang)} · MOVO Stories`, description: loc(s.description, lang) };
}

// ---------- scenes ----------
// s01-cover: a price tag, frozen and gray, breaks into the four variables of the price (story 01).
// Design size 1920x1080 (16:9); in a portrait frame (4:5) the tag stands up and the slices stack (CSS).
const SCENES = {
  's01-cover': (t, lang) => {
    const L = t.stories.scenes.s01;
    const slices = [
      ['duration', 'volt', '<span class="s01-g s01-g--bar"><i></i></span>'],
      ['style', 'magenta', '<span class="s01-g s01-g--shapes"><i></i><i></i><i></i></span>'],
      ['formats', 'violet', '<span class="s01-g s01-g--formats"><i></i><i></i><i></i></span>'],
      ['extras', 'white', `<span class="s01-g s01-g--wave">${'<i></i>'.repeat(7)}</span>`],
    ];
    return `<div class="scn scn--s01" data-composition-id="s01-cover" data-width="1920" data-height="1080" data-duration="7" role="img" aria-label="${esc(L.label)}">
            <div class="scn__stage" aria-hidden="true">
              <div class="s01-tag">${slices
                .map(([k, color, glyph], i) => `<div class="s01-slice" data-k="${k}" data-color="${color}" style="--i: ${i}">
                  <span class="s01-q"><span>$?</span></span>${i === 0 ? '<span class="s01-hole"></span>' : ''}
                  ${glyph}
                  <span class="s01-label">${esc(L[k])}</span>
                </div>`)
                .join('')}
              </div>
              <div class="scn__ruler"><span class="scn__playhead"></span></div>
              <span class="scn__tc" data-scene-tc>00:00:07:00</span>
            </div>
          </div>`;
  },
};
const scene = (id, t, lang) => (SCENES[id] ? SCENES[id](t, lang) : '');

export function storiesMarkup({ t, lang, page, item, url, orgId, homeUrl, storiesUrl, storyHref, published }) {
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

  if (page.id === 'story' && item) {
    const s = stories.find(x => x.id === item.id) || item;
    Object.assign(vars, {
      storyNum: esc(n(s)),
      storyTitle: esc(loc(s.title, lang)),
      storyDek: esc(loc(s.dek, lang)),
      storyCover: scene(s.cover, t, lang),
      storyDraft: published && s.datePublished ? '' : `<p class="sp-draft">${esc(t.stories.draft)}</p>`,
    });
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
  return { vars, jsonld };
}
