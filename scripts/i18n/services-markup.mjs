// Services markup (home preview + internal page), rendered into the static HTML of every language.
// Structure: src/data/services.json · Copy: src/i18n/<lang>.json → services (both generated from the
// official document by scripts/services/import-doc.py) · Previews: src/data/reels.json.
//
// Previews come from the Work data: each pillar uses the first reel of its Work categories (or
// a hand-pick), each service row the n-th reel of its category (or a hand-pick). The showreel (huge file) is never used as a preview.
// No media URL is in a src attribute: everything loads from data-* when needed (src/services/).

import fs from 'node:fs';
import { reelMedia } from './reel-media.mjs';

// Hand-picked previews per pillar / service (src/data/services-previews.json), over the automatic pick.
const PICKS = new URL('../../src/data/services-previews.json', import.meta.url);
const loadPicks = () => (fs.existsSync(PICKS) ? JSON.parse(fs.readFileSync(PICKS, 'utf8')) : {});

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// [CONFIRMAR …] markers stay in the text (the owner validates them later); they are only styled.
const rich = s => esc(s).replace(/\[CONFIRMAR[^\]]*\]/g, m => `<span class="confirm">${m}</span>`);

const colorVar = c => `--pc: var(--c-${c})`;

// Keyframes (diamonds) of each pillar on the home timeline: the three tracks cascade like an edit.
const keyframes = (pillarIndex, n) => {
  const start = 0.1 + pillarIndex * 0.22;
  const span = 0.38;
  return Array.from({ length: n }, (_, i) => +(start + (n === 1 ? 0 : (span * i) / (n - 1))).toFixed(3));
};

export function servicesMarkup({ t, lang, root, homeHref, servicesHref, workHref: workPage, data, reelsData }) {
  const S = t.services;
  const need = (v, key) => {
    if (v == null || v === '') throw new Error(`[i18n] Missing string "services.${key}" in src/i18n/${lang}.json`);
    return v;
  };
  // pending reels (no category yet) and the showreel are never pillar previews
  const reels = reelsData.reels.filter(r => !r.showreel && !r.pending);
  const { services: picks = {}, pillars: pillarPicks = {} } = loadPicks();
  const media = r => {
    if (!r) return '';
    const m = reelMedia(r, { root, fullBaseUrl: reelsData.fullBaseUrl });
    return ` data-preview-webm="${esc(m.previewWebm)}" data-preview-mp4="${esc(m.previewMp4)}" data-poster="${esc(m.poster)}" data-reel="${r.id}"${r.mock ? ' data-mock' : ''}`;
  };
  const byCats = cats => reels.filter(r => cats.includes(r.category));
  const pick = id => id && reels.find(r => r.id === id);
  const pillarReel = p => pick(pillarPicks[p.id]) || pick(p.previewReel) || byCats(p.workFilter)[0];
  // Work filtered by the pillar's categories: the Work page (several categories pressed at once)
  const workHref = cats => `${workPage}?cat=${cats.join(',')}`;
  const mock = '<span class="svc-mock" aria-hidden="true">MOCK</span>';

  // ---------- home: three tracks on a timeline ----------
  const ruler = Array.from({ length: 7 }, (_, i) => `<span style="--x: ${(i / 6).toFixed(3)}">00:${String(i * 2).padStart(2, '0')}</span>`).join('');
  const tracks = data.pillars.map((p, pi) => {
    const P = need(S.pillars?.[p.id], `pillars.${p.id}`);
    const xs = keyframes(pi, p.services.length);
    const tags = need(P.tags, `pillars.${p.id}.tags`);
    const id = `track-${p.id}`;
    return `<li class="track" data-track data-pillar="${p.id}" data-color="${p.color}" style="${colorVar(p.color)}"${media(pillarReel(p))}>
            <h3 class="track__head">
              <button type="button" class="track__toggle" id="${id}" aria-expanded="false" aria-controls="${id}-panel">
                <span class="track__num">${p.number}</span>
                <span class="track__name">${esc(need(P.title, `pillars.${p.id}.title`))}</span>
                <span class="track__icon" aria-hidden="true"></span>
              </button>
            </h3>
            <div class="track__lane" aria-hidden="true" style="--a: ${xs[0]}; --b: ${xs.at(-1)}; --n: ${xs.length}">
              <span class="track__clip"><span class="track__fill"></span></span>
              ${xs.map((x, i) => `<span class="kf" style="--x: ${x}; --i: ${i}" data-kf="${x}" data-i="${i}"></span>`).join('')}
            </div>
            <div class="track__panel" id="${id}-panel" role="region" aria-labelledby="${id}">
              <div class="track__inner">
              <div class="track__thumb" aria-hidden="true"><video muted loop playsinline preload="none" disablepictureinpicture tabindex="-1"></video>${pillarReel(p)?.mock ? mock : ''}</div>
              <div class="track__body">
                <ul class="track__tags">${tags.map((tag, i) => `<li style="--x: ${xs[i] ?? xs.at(-1)}; --i: ${i}">${esc(tag)}</li>`).join('')}</ul>
                <p class="track__phrase">${rich(need(P.phrase, `pillars.${p.id}.phrase`))}</p>
                <a class="track__more" href="${servicesHref}#${p.anchor[lang]}">${esc(need(S.home.more, 'home.more'))}<span class="sr-only">: ${esc(P.title)}</span> <span aria-hidden="true">→</span></a>
              </div>
              </div>
            </div>
          </li>`;
  });
  const homeTimeline = `<div class="svc__timeline" data-svc-timeline>
          <div class="svc__ruler" aria-hidden="true">${ruler}</div>
          <ol class="svc__tracks" data-svc-tracks>
          ${tracks.join('\n          ')}
          </ol>
          <div class="svc__playhead" aria-hidden="true" data-svc-playhead><span class="svc__playhead-tc" data-svc-tc>00:00:00:00</span></div>
        </div>`;

  // ---------- page: sticky index (pillars as tracks) ----------
  const index = `<nav class="sp-index" aria-label="${esc(t.servicesUi.index)}" data-sp-index>
          <ol class="sp-index__list">
            ${data.pillars
              .map(
                p => `<li><a class="sp-index__track" href="#${p.anchor[lang]}" data-color="${p.color}" style="${colorVar(p.color)}" data-index-link="${p.id}">
              <span class="sp-index__num">${p.number}</span>
              <span class="sp-index__name">${esc(S.pillars[p.id].title)}</span>
              <span class="sp-index__line" aria-hidden="true"><span class="sp-index__fill"></span></span>
            </a></li>`,
              )
              .join('\n            ')}
          </ol>
          <span class="sp-index__playhead" aria-hidden="true" data-sp-playhead></span>
        </nav>`;

  // ---------- page: the three pillars with their service rows ----------
  // No reel repeats across the rows (the owner's rule): hand-picks first, then the first unused reel of
  // the service's category, then any unused reel; only when every reel is taken can one repeat.
  const taken = new Set(Object.values(picks));
  const usedRows = new Set();
  const rowReel = s => {
    const picked = pick(picks[s.id]);
    if (picked && !usedRows.has(picked.id)) return picked;
    const free = r => !usedRows.has(r.id) && !taken.has(r.id);
    return byCats([s.category]).find(free) || reels.find(free) || reels.find(r => !usedRows.has(r.id)) || byCats([s.category])[0] || null;
  };
  const pillars = data.pillars.map(p => {
    const P = S.pillars[p.id];
    const rows = p.services.map((s, si) => {
      const T = need(P.services?.[s.id], `pillars.${p.id}.services.${s.id}`);
      const r = rowReel(s);
      if (r) {
        if (usedRows.has(r.id)) console.warn(`[services] preview ${r.id} repeats on "${s.id}" (not enough reels)`);
        usedRows.add(r.id);
      }
      const slug = s.slug[lang];
      return `<li class="row" id="${slug}"${media(r)}>
              <h3 class="row__h">
                <button type="button" class="row__btn" id="${slug}-btn" aria-expanded="false" aria-controls="${slug}-panel">
                  <span class="row__kf" aria-hidden="true"></span>
                  <span class="row__n" aria-hidden="true">${p.number}.${si + 1}</span>
                  <span class="row__name">${esc(need(T.name, `${s.id}.name`))}</span>
                  <span class="row__icon" aria-hidden="true"></span>
                </button>
              </h3>
              <div class="row__panel" id="${slug}-panel" role="region" aria-labelledby="${slug}-btn">
                <div class="row__inner">
                  <div class="row__text">
                    <p class="row__desc">${rich(need(T.description, `${s.id}.description`))}</p>
                    <p class="row__deliv"><span class="row__deliv-label">${esc(t.servicesUi.deliverables)}</span> ${rich(need(T.deliverables, `${s.id}.deliverables`))}</p>
                  </div>
                  <div class="row__preview" aria-hidden="true"><img class="row__poster" alt="" width="480" height="854" decoding="async" /><video muted loop playsinline preload="none" disablepictureinpicture tabindex="-1"></video>${r?.mock ? mock : ''}</div>
                </div>
              </div>
            </li>`;
    });
    return `<section class="pillar" id="${p.anchor[lang]}" data-pillar="${p.id}" data-color="${p.color}" style="${colorVar(p.color)}" aria-labelledby="pillar-${p.id}" data-clip="${p.id}" data-clip-label="${esc(P.title)}">
          <header class="pillar__head">
            <span class="pillar__num" aria-hidden="true" data-pillar-num>${p.number}</span>
            <h2 class="pillar__title" id="pillar-${p.id}">${esc(P.title)}</h2>
            <p class="pillar__intro">${rich(need(P.intro, `pillars.${p.id}.intro`))}</p>
            <a class="pillar__link" href="${workHref(p.workFilter)}">${esc(need(P.link, `pillars.${p.id}.link`))} <span aria-hidden="true">→</span></a>
          </header>
          <ul class="rows">
            ${rows.join('\n            ')}
          </ul>
        </section>`;
  });

  // ---------- page: how we work (five keyframes on a ruler) ----------
  const steps = data.process.map((id, i, all) => {
    const st = need(S.process?.steps?.[id], `process.steps.${id}`);
    const x = (0.08 + (0.84 * i) / (all.length - 1)).toFixed(3);
    return `<li class="step" style="--x: ${x}" data-step data-x="${x}">
              <span class="step__kf" aria-hidden="true"></span>
              <span class="step__n">${esc(st.number)}</span>
              <h3 class="step__name">${esc(st.name)}</h3>
              <p class="step__text">${rich(st.text)}</p>
            </li>`;
  });
  const ticks = Array.from({ length: 6 }, (_, i) => `<span style="--x: ${(i / 5).toFixed(2)}">00:00:${String(i * 4).padStart(2, '0')}:00</span>`).join('');
  const process = `<section class="process" id="${lang === 'es' ? 'proceso' : 'process'}" aria-labelledby="process-title" data-clip="process" data-clip-label="${esc(t.servicesUi.process)}">
        <div class="process__pin" data-process>
          <div class="process__head sp-wrap">
            <p class="sp-label">${esc(t.servicesUi.process)}</p>
            <h2 class="sp-h2" id="process-title">${esc(need(S.process?.title, 'process.title'))}</h2>
            <p class="sp-lead">${rich(need(S.process.intro, 'process.intro'))}</p>
          </div>
          <div class="process__rail sp-wrap">
            <div class="process__ruler" aria-hidden="true">${ticks}</div>
            <ol class="process__steps">
            ${steps.join('\n            ')}
            </ol>
            <div class="process__playhead" aria-hidden="true" data-process-playhead><span data-process-tc>00:00:00:00</span></div>
          </div>
        </div>
      </section>`;

  // ---------- page: formats (one frame that morphs 9:16 → 1:1 → 4:5 → 16:9 → custom) ----------
  const F = need(S.formats, 'formats');
  const fmts = Object.keys(F.items).map(fid => {
    const first = data.formats.find(st => st.format === fid);
    const ratios = data.formats.filter(st => st.format === fid).map(st => st.ratio);
    return `<li class="fmt" data-format="${fid}" data-ratios="${ratios.join(' ')}" style="--w: ${first.w}; --h: ${first.h}">
              <span class="fmt__shape" aria-hidden="true"></span>
              <h3 class="fmt__name">${esc(F.items[fid].name)}</h3>
              <p class="fmt__use">${rich(F.items[fid].use)}</p>
            </li>`;
  });
  const formats = `<section class="formats" id="${lang === 'es' ? 'formatos' : 'formats'}" aria-labelledby="formats-title" data-clip="formats" data-clip-label="${esc(t.servicesUi.formats)}">
        <div class="formats__pin sp-wrap" data-formats data-stages='${JSON.stringify(data.formats)}'>
          <div class="formats__head">
            <p class="sp-label">${esc(t.servicesUi.formats)}</p>
            <h2 class="sp-h2" id="formats-title">${esc(F.title)}</h2>
          </div>
          <div class="formats__stage" aria-hidden="true">
            <div class="formats__frame" data-format-frame>
              <span class="formats__corner"></span><span class="formats__corner"></span><span class="formats__corner"></span><span class="formats__corner"></span>
              <span class="formats__ratio" data-format-ratio>${data.formats[0].ratio}</span>
            </div>
          </div>
          <ol class="formats__list">
            ${fmts.join('\n            ')}
          </ol>
          <p class="formats__note">${rich(F.note)}</p>
        </div>
      </section>`;

  // ---------- page: FAQ (sober accordion) ----------
  const faq = `<section class="faq sp-wrap" id="${lang === 'es' ? 'preguntas' : 'faq'}" aria-labelledby="faq-title" data-clip="faq" data-clip-label="${esc(t.servicesUi.faq)}">
        <h2 class="sp-h2" id="faq-title">${esc(t.servicesUi.faq)}</h2>
        <div class="faq__list">
          ${need(S.faq?.items, 'faq.items')
            .map(
              (it, i) => `<div class="faq__item">
            <h3 class="faq__q"><button type="button" id="faq-${i + 1}-btn" aria-expanded="false" aria-controls="faq-${i + 1}">${esc(it.q)}<span class="faq__icon" aria-hidden="true"></span></button></h3>
            <div class="faq__a" id="faq-${i + 1}" role="region" aria-labelledby="faq-${i + 1}-btn"><p>${rich(it.a)}</p></div>
          </div>`,
            )
            .join('\n          ')}
        </div>
      </section>`;

  // ---------- JSON-LD: the ten services ----------
  const jsonldServices = data.pillars.flatMap(p =>
    p.services.map(s => ({
      '@type': 'Service',
      name: S.pillars[p.id].services[s.id].name,
      description: S.pillars[p.id].services[s.id].description.replace(/\s*\[CONFIRMAR[^\]]*\]/g, ''),
      category: S.pillars[p.id].title,
      slug: s.slug[lang],
    })),
  );

  return {
    svcHomeTimeline: homeTimeline,
    svcIndex: index,
    svcPillars: pillars.join('\n        '),
    svcProcess: process,
    svcFormats: formats,
    svcFaq: faq,
    jsonldServices,
  };
}
