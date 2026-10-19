// Markup of the MOVO Stories scenes (compositions) and of Story 01's quoter, per language. The HTML of a
// scene is its FINAL frame (see src/stories/scene.css): without JS, with reduced motion, on the index and
// for the OG image the scene is complete. Scripts: src/stories/scenes/*.js (timelines), src/stories/story.js.
import { DEFAULTS, FORMATS, score, summary, toParams } from '../../src/stories/quote.js';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = n => String(n).padStart(2, '0');
// 60 → 00:01:00:00 (the end of the video on the mini ruler)
export const tcOf = sec => `00:${pad(Math.floor(sec / 60))}:${pad(sec % 60)}:00`;

// The price tag of Story 01, in 4 pieces (duration, style, formats, extras). s01-cover shows it breaking
// into color; s01-still is the same tag, whole, gray and quiet (act 1).
function tag(t) {
  const L = t.stories.scenes.s01;
  const slices = [
    ['duration', 'volt', '<span class="s01-g s01-g--bar"><i></i></span>'],
    ['style', 'magenta', '<span class="s01-g s01-g--shapes"><i></i><i></i><i></i></span>'],
    ['formats', 'violet', '<span class="s01-g s01-g--formats"><i></i><i></i><i></i></span>'],
    ['extras', 'white', `<span class="s01-g s01-g--wave">${'<i></i>'.repeat(7)}</span>`],
  ];
  return `<div class="s01-tag">${slices
    .map(([k, color, glyph], i) => `<div class="s01-slice" data-k="${k}" data-color="${color}" style="--i: ${i}">
                  <span class="s01-q"><span>$?</span></span>${i === 0 ? '<span class="s01-hole"></span>' : ''}
                  ${glyph}
                  <span class="s01-label">${esc(L[k])}</span>
                </div>`)
    .join('')}
                <span class="s01-whole"><span>$?</span></span>
              </div>`;
}
const ruler = (tc, attr = 'data-scene-tc') => `<div class="scn__ruler"><span class="scn__playhead"></span></div>
              <span class="scn__tc" ${attr}>${tc}</span>`;

// the mini piece of the quoter: the video being "built" (style skin, format frames, extras, length)
function mini(t, s = DEFAULTS) {
  const U = t.storyUi;
  const word = [...U.scenes.word].map(ch => (ch === ' ' ? '<span class="mini__sp"></span>' : `<span>${esc(ch)}</span>`)).join('');
  return `<div class="scn scn--mini" data-mini data-style="${s.estilo}" data-dur="${s.duracion}" data-formats="${s.formatos.join(' ')}" data-extras="${s.extras.join(' ')}" data-level="${score(s).level}" data-urgent="${s.urgencia === 'urgente'}" role="img" aria-label="${esc(U.scenes.mini)}">
            <div class="scn__stage" aria-hidden="true">
              <div class="mini__skin mini__skin--tipografia">${word}</div>
              <div class="mini__skin mini__skin--ilustracion">${'<i></i>'.repeat(7)}</div>
              <div class="mini__skin mini__skin--personajes"><span class="mini__char"><span class="mini__head"><i></i><i></i></span><span class="mini__body"></span><span class="mini__arm"></span></span><span class="mini__char mini__char--b"><span class="mini__head"><i></i><i></i></span><span class="mini__body"></span></span></div>
              <div class="mini__skin mini__skin--3d"><span class="mini__cube">${'<i></i>'.repeat(6)}</span></div>
              <div class="mini__frames">${FORMATS.map(f => `<i data-f="${f}"></i>`).join('')}</div>
              <div class="mini__badges"><span data-x="cortes">AD 6·15·30</span><span data-x="idioma">ES / EN</span><span data-x="voz">VO</span></div>
              <span class="mini__wave">${'<i></i>'.repeat(9)}</span>
              ${ruler(tcOf(Number(s.duracion)), 'data-mini-tc')}
            </div>
          </div>`;
}

// the quoter: a real form (fieldsets, native radios/checkboxes), the mini piece and the result
export function quoterMarkup(t, lang) {
  const Q = t.storyUi.quoter;
  const s = DEFAULTS;
  const r = score(s);
  const group = (name, type) => `<fieldset class="qz__set">
              <legend class="qz__legend">${esc(Q[name].legend)}</legend>
              <div class="qz__opts">${Object.entries(Q[name].options)
                .map(([v, label]) => {
                  const on = type === 'radio' ? s[name] === v : s[name].includes(v);
                  return `<label class="qz__opt"><input type="${type}" name="${name}" value="${v}"${on ? ' checked' : ''} /><span>${esc(label)}</span></label>`;
                })
                .join('')}</div>
            </fieldset>`;
  return `<div class="qz" data-quoter>
          <form class="qz__form" data-quoter-form aria-label="${esc(Q.title)}">
            <p class="qz__help">${esc(Q.help)}</p>
            ${group('duracion', 'radio')}
            ${group('estilo', 'radio')}
            ${group('guion', 'radio')}
            ${group('formatos', 'checkbox')}
            ${group('extras', 'checkbox')}
            ${group('urgencia', 'radio')}
          </form>
          <div class="qz__out">
            <div class="qz__mini">${mini(t, s)}</div>
            <div class="qz__result" role="status" aria-live="polite" aria-atomic="true" data-quoter-result>
              <p class="qz__label">${esc(Q.levelLabel)}</p>
              <p class="qz__level" data-q-level>${esc(Q.levels[r.level - 1])}</p>
              <div class="qz__meter" data-q-meter data-level="${r.level}" aria-hidden="true"><i></i><i></i><i></i></div>
              <dl class="qz__facts">
                <div><dt>${esc(Q.complexityLabel)}</dt><dd data-q-complexity>${esc(Q.complexity[r.level - 1])}</dd></div>
                <div><dt>${esc(Q.timeLabel)}</dt><dd data-q-time>${esc(Q.times[r.level - 1])}</dd></div>
              </dl>
            </div>
          </div>
        </div>`;
}

// act 4: "your video, in motion" (the mini piece with the choices + the choices as clips) + summary + CTA
export function resultMarkup(t, lang, contactHref) {
  const U = t.storyUi;
  const Q = U.quoter;
  const s = DEFAULTS;
  const r = score(s);
  const val = {
    duracion: Q.duracion.options[s.duracion],
    estilo: Q.estilo.options[s.estilo],
    guion: Q.guion.short[s.guion],
    formatos: s.formatos.map(f => Q.formatos.short[f]).join(' · ') || Q.none,
    extras: s.extras.map(e => Q.extras.short[e]).join(' · ') || Q.none,
  };
  const colors = { duracion: 'volt', estilo: 'magenta', guion: 'white', formatos: 'violet', extras: 'volt' };
  return `<figure class="sp-scene sp-scene--result">
          <div class="scn scn--result" data-composition-id="s01-result" data-width="1920" data-height="1080" data-duration="3" data-scrub role="img" aria-label="${esc(U.scenes.s01Result)}">
            <div class="scn__stage" aria-hidden="true">
              <div class="res__mini">${mini(t, s)}</div>
              <div class="res__tracks">${Object.keys(val)
                .map((k, i) => `<div class="res__clip" data-color="${colors[k]}" style="--i: ${i}"><b>${esc(Q.clips[k])}</b><span data-r="${k}">${esc(val[k])}</span></div>`)
                .join('')}</div>
            </div>
          </div>
        </figure>
        <div class="sp-result">
          <p class="sp-summary" data-q-summary><span class="sp-summary__lead">${esc(U.summaryLead)}</span> <span data-q-text>${esc(summary(s, Q))}</span> → <strong data-q-level>${esc(Q.levels[r.level - 1])}</strong></p>
          <a class="btn btn--volt" href="${esc(`${contactHref}?${toParams(s)}`)}" data-quote-cta>${esc(U.cta)} <span aria-hidden="true">→</span></a>
        </div>`;
}

export function ctaMarkup(t, contactHref) {
  return `<p class="sp-cta"><a class="btn btn--volt" href="${esc(`${contactHref}?${toParams(DEFAULTS)}`)}" data-quote-cta>${esc(t.storyUi.cta)} <span aria-hidden="true">→</span></a></p>`;
}

// ---------- compositions ----------
const SCENES = {
  // the tag breaking into the variables of the price (Story 01 cover: home teaser, index, act 2)
  's01-cover': t => `<div class="scn scn--s01" data-composition-id="s01-cover" data-width="1920" data-height="1080" data-duration="7" role="img" aria-label="${esc(t.stories.scenes.s01.label)}">
            <div class="scn__stage" aria-hidden="true">
              ${tag(t)}
              ${ruler('00:00:07:00')}
            </div>
          </div>`,
  // act 1: the same tag, whole, gray and quiet; figures that don't help appear and fade; it never starts
  's01-still': t => `<div class="scn scn--s01 scn--still" data-composition-id="s01-still" data-width="1920" data-height="1080" data-duration="4" role="img" aria-label="${esc(t.storyUi.scenes.s01Still)}">
            <div class="scn__stage" aria-hidden="true">
              ${['$ ? ? ?', '$$$', '¿ ?', '$ / s', '? ? ?', '$ $', '¿$?', '???']
                .map((g, i) => `<span class="still__ghost${i % 3 === 1 ? ' is-crossed' : ''}" data-ghost style="--gx: ${[8, 70, 22, 82, 4, 60, 40, 88][i]}; --gy: ${[10, 8, 78, 70, 46, 86, 4, 38][i]}">${esc(g)}</span>`)
                .join('')}
              ${tag(t)}
              ${ruler('00:00:00:00')}
            </div>
          </div>`,
};

export const sceneMarkup = (id, t, lang) => (SCENES[id] ? SCENES[id](t, lang) : '');
