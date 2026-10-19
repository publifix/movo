// A MOVO Story page (/stories/<slug>/). The text is in the HTML; this adds the motion (STORIES.md §3–4):
// - scenes [data-scrub]: their paused timeline follows the scroll (smoothed scrub), mounted lazily when
//   they get near the screen; nothing runs off screen;
// - Story 01's quoter: the choices update the mini piece, the result (aria-live) and every CTA link
//   (/contacto/?story=01&…), and the act 4 scene shows them as clips.
// Reduced motion: no timelines (every scene stays on its final frame); the quoter still works, without
// transitions. Without JS: final frames + the result for the default choices.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initNav } from '../nav.js';
import { initTimecode } from '../timecode.js';
import { mountScene } from './scenes/index.js';
import { FORMATS, score, summary, toParams } from './quote.js';

gsap.registerPlugin(ScrollTrigger);

const UI = JSON.parse(document.getElementById('movo-i18n')?.textContent || '{}');
initNav({ labels: UI.a11y });
initTimecode();
ScrollTrigger.addEventListener('refresh', () => dispatchEvent(new CustomEvent('movo:clips')));

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- scenes scrubbed by the scroll ----------
if (!reduce) {
  const near = new IntersectionObserver(entries => {
    entries.forEach(async e => {
      if (!e.isIntersecting) return;
      near.unobserve(e.target);
      const { tl } = (await mountScene(e.target)) || {};
      if (!tl) return;
      // from when the scene enters the screen to when it is a little above the middle
      ScrollTrigger.create({ trigger: e.target, start: 'top 88%', end: 'center 42%', scrub: 0.6, animation: tl });
    });
  }, { rootMargin: '60% 0px' });
  document.querySelectorAll('.sp-body [data-composition-id][data-scrub]').forEach(el => near.observe(el));
}

// ---------- quoter ----------
const form = document.querySelector('[data-quoter-form]');
const Q = UI.story?.quoter;
if (form && Q) {
  const minis = [...document.querySelectorAll('[data-mini]')];
  const result = document.querySelector('[data-quoter-result]');
  const state = () => {
    const fd = new FormData(form);
    return {
      duracion: fd.get('duracion'),
      estilo: fd.get('estilo'),
      guion: fd.get('guion'),
      formatos: fd.getAll('formatos').filter(f => FORMATS.includes(f)),
      extras: fd.getAll('extras'),
      urgencia: fd.get('urgencia'),
    };
  };
  const pad = n => String(n).padStart(2, '0');
  const update = () => {
    const s = state();
    const { level } = score(s);
    minis.forEach(m => {
      Object.assign(m.dataset, { style: s.estilo, dur: s.duracion, formats: s.formatos.join(' '), extras: s.extras.join(' '), level, urgent: String(s.urgencia === 'urgente') });
      const tc = m.querySelector('[data-mini-tc]');
      if (tc) tc.textContent = `00:${pad(Math.floor(s.duracion / 60))}:${pad(s.duracion % 60)}:00`;
    });
    result.querySelector('[data-q-level]').textContent = Q.levels[level - 1];
    result.querySelector('[data-q-meter]').dataset.level = level;
    result.querySelector('[data-q-complexity]').textContent = Q.complexity[level - 1];
    result.querySelector('[data-q-time]').textContent = Q.times[level - 1];
    // act 4: the clips and the summary
    const val = {
      duracion: Q.duracion.options[s.duracion],
      estilo: Q.estilo.options[s.estilo],
      guion: Q.guion.short[s.guion],
      formatos: s.formatos.map(f => Q.formatos.short[f]).join(' · ') || Q.none,
      extras: s.extras.map(e => Q.extras.short[e]).join(' · ') || Q.none,
    };
    document.querySelectorAll('[data-r]').forEach(el => { el.textContent = val[el.dataset.r]; });
    document.querySelectorAll('[data-q-summary] [data-q-text]').forEach(el => { el.textContent = summary(s, Q); });
    document.querySelectorAll('[data-q-summary] [data-q-level]').forEach(el => { el.textContent = Q.levels[level - 1]; });
    document.querySelectorAll('[data-quote-cta]').forEach(a => {
      const u = new URL(a.href);
      u.search = toParams(s);
      a.href = u.href;
    });
  };
  form.addEventListener('change', update);
  form.addEventListener('submit', e => e.preventDefault());
  update(); // a reload keeps the browser's restored choices

  // the mini pieces loop only while they are on screen
  const vis = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-off', !e.isIntersecting)));
  minis.forEach(m => vis.observe(m));
}
