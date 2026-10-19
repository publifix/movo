// Markup of the scenes of Story 02 (explainer video) and Story 03 (animated logo), and Story 03's logo
// playground. Same conventions as story-scenes.mjs: the HTML/CSS is the FINAL frame; the timelines live in
// src/stories/scenes/s02-*.js / s03-*.js; styles in src/stories/scene-2.css.
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ruler = tc => `<div class="scn__ruler"><span class="scn__playhead"></span></div>
              <span class="scn__tc" data-scene-tc>${tc}</span>`;
const scn = (id, cls, dur, label, inner, tc) => `<div class="scn ${cls}" data-composition-id="${id}" data-width="1920" data-height="1080" data-duration="${dur}" role="img" aria-label="${esc(label)}">
            <div class="scn__stage" aria-hidden="true">
              ${inner}
              ${ruler(tc)}
            </div>
          </div>`;

// ---------- Story 02 ----------
// The overloaded video screen: blocks of "everything we want to say" (x, y, w, h in % of the screen; kind)
const BLOCKS = [
  [6, 8, 40, 7, 'bar'], [6, 19, 30, 4, 'bar'], [6, 26, 34, 4, 'bar'], [52, 8, 18, 18, 'icon'], [74, 8, 20, 30, 'table'],
  [6, 36, 22, 22, 'icon'], [32, 36, 36, 5, 'bar'], [32, 44, 28, 4, 'bar'], [32, 51, 32, 4, 'bar'], [70, 44, 24, 6, 'arrow'],
  [6, 64, 42, 6, 'bar'], [6, 74, 26, 4, 'bar'], [52, 62, 16, 16, 'icon'], [72, 58, 22, 22, 'table'], [36, 82, 30, 6, 'bar'],
  [18, 46, 26, 14, 'arrow'], [58, 30, 30, 5, 'bar'], [44, 18, 20, 10, 'logo'],
];
const screen = (t, extra = '') => `<div class="s02-screen">${BLOCKS.map(([x, y, w, h, k], i) => `<span class="s02-b s02-b--${k}" data-block style="--x: ${x}; --y: ${y}; --w: ${w}; --h: ${h}; --i: ${i}">${k === 'logo' ? esc(t.storyUi.s02.product) : ''}</span>`).join('')}${extra}</div>`;
// the minute of an explainer: hook 0–5 s, problem 5–20, solution 20–50, close 50–60
const SEG = [5, 15, 30, 10];
const minute = t => `<div class="s02-minute">${t.storyUi.s02.segments
  .map((s, i) => `<span class="s02-seg" style="--w: ${SEG[i]}; --i: ${i}"><b>${esc(s)}</b></span>`)
  .join('')}<span class="s02-ticks"><i>0 s</i><i>5</i><i>20</i><i>50</i><i>60 s</i></span></div>`;
// the scene of the explainer itself (a person, a phone with a message, a check), drawn per layer
const sketch = () => `<span class="s02-person"><i></i></span><span class="s02-phone"><i></i></span><span class="s02-check"></span>`;

const S02 = {
  's02-still': t => scn('s02-still', 'scn--s02 scn--s02still', 4, t.storyUi.s02.still, screen(t), '00:00:00:00'),
  's02-cover': t => scn('s02-cover', 'scn--s02 scn--s02cover', 7, t.storyUi.s02.cover,
    `${screen(t, `<span class="s02-idea"><span>${esc(t.storyUi.s02.idea)}</span></span>`)}
              ${minute(t)}`, '00:00:07:00'),
  's02-layers': t => scn('s02-layers', 'scn--s02 scn--s02layers', 6, t.storyUi.s02.layers,
    `<div class="s02-sheets">${t.storyUi.s02.layers_
      .map((l, i) => `<div class="s02-sheet s02-sheet--${i}" style="--i: ${i}">
                <div class="s02-sheet__card">${i === 0 ? '<span class="s02-script"><i></i><i></i><i></i><i></i><i></i></span>' : sketch()}${i === 1 ? '<span class="s02-frame-n">01</span>' : ''}</div>
                <span class="s02-sheet__label">${esc(l)}</span>
              </div>`)
      .join('')}</div>`, '00:00:06:00'),
  's02-result': t => scn('s02-result', 'scn--s02 scn--s02result', 3, t.storyUi.s02.result,
    `<div class="s02-final"><div class="s02-sheet__card s02-final__card">${sketch()}<span class="s02-final__idea"></span></div></div>
              ${minute(t)}
              <span class="s02-ok"><i></i>${esc(t.storyUi.s02.ok)}</span>`, '00:01:00:00'),
};

// ---------- Story 03 ----------
// The demo logo is the visitor's brand name (default "TU MARCA"), in the site's type: never a client's logo.
export const letters = word => [...word].map((ch, i) => (ch === ' ' ? `<span class="lg-sp" style="--i: ${i}"></span>` : `<span class="lg-l" style="--i: ${i}">${esc(ch)}</span>`)).join('');
const wordmark = (word, attrs = '') => `<span class="lg-word" data-lg-word${attrs} style="--n: ${word.length}">${letters(word)}</span>`;

const S03 = {
  's03-still': t => scn('s03-still', 'scn--s03 scn--s03still', 4, t.storyUi.s03.still,
    `<div class="s03-feed" data-feed>${Array.from({ length: 3 }, (_, c) => `<div class="s03-col" style="--c: ${c}">${'<span class="s03-post"><i></i><i></i></span>'.repeat(6)}</div>`).join('')}</div>
              <div class="s03-card">${wordmark(t.storyUi.s03.brand)}</div>`, '00:00:00:00'),
  's03-cover': t => scn('s03-cover', 'scn--s03 scn--s03cover', 7, t.storyUi.s03.cover,
    `<div class="s03-logo">${wordmark(t.storyUi.s03.brand)}</div>
              <div class="s03-tracks">${[0, 1, 2, 3].map(r => `<span class="s03-track" style="--r: ${r}">${[0, 1, 2].map(k => `<i style="--k: ${k}"></i>`).join('')}</span>`).join('')}</div>`, '00:00:07:00'),
  's03-result': t => scn('s03-result', 'scn--s03 scn--s03result', 3, t.storyUi.s03.result,
    `<div class="s03-formats">${['9x16', '1x1', '16x9']
      .map((f, i) => `<div class="s03-fmt s03-fmt--${f}" style="--i: ${i}"><div class="s03-fmt__box">${wordmark(t.storyUi.s03.brand, ' data-lg-sync')}</div><span class="s03-fmt__tag">${f.replace('x', ':')}</span></div>`)
      .join('')}</div>
              <div class="s03-chips">${t.storyUi.s03.chips.map((c, i) => `<span style="--i: ${i}">${esc(c)}</span>`).join('')}</div>`, '00:00:06:00'),
};

export const SCENES_2 = { ...S02, ...S03 };

// Story 03 act 3: type your brand, choose a personality, watch it move (a real form; replays on change)
export function logoMarkup(t) {
  const L = t.storyUi.s03.logo;
  const word = t.storyUi.s03.brand;
  return `<div class="lg" data-logo>
          <form class="lg__form" data-logo-form aria-label="${esc(L.title)}">
            <label class="lg__field"><span class="qz__legend">${esc(L.name)}</span>
              <input class="lg__input" type="text" name="marca" maxlength="16" autocomplete="organization" placeholder="${esc(word)}" spellcheck="false" />
            </label>
            <fieldset class="qz__set">
              <legend class="qz__legend">${esc(L.personality)}</legend>
              <div class="qz__opts">${Object.entries(L.options)
                .map(([v, label], i) => `<label class="qz__opt"><input type="radio" name="personalidad" value="${v}"${i === 0 ? ' checked' : ''} /><span>${esc(label)}</span></label>`)
                .join('')}</div>
            </fieldset>
            <button class="lg__replay" type="button" data-logo-replay>${esc(L.replay)} <span aria-hidden="true">↻</span></button>
          </form>
          <div class="lg__out">
            <div class="scn scn--lg lg__stage" data-p="preciso" role="img" aria-label="${esc(L.stage)}">
              <div class="scn__stage" aria-hidden="true"><div class="lg__center">${wordmark(word, ' data-lg-sync')}<span class="lg__rule"></span></div></div>
            </div>
            <div class="lg__formats" data-p="preciso" role="img" aria-label="${esc(L.formats)}">${['9x16', '1x1', '16x9']
              .map(f => `<div class="lg__fmt lg__fmt--${f}"><div class="scn scn--lg">${'<div class="scn__stage" aria-hidden="true"><div class="lg__center">'}${wordmark(word, ' data-lg-sync')}</div></div></div><span>${f.replace('x', ':')}</span></div>`)
              .join('')}</div>
          </div>
        </div>`;
}
