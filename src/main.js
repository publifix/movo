import { gsap } from 'gsap';
import { initMovoIntro } from './intro/intro.js';
import { initNav } from './nav.js';
import { initHero, preferMp4 } from './hero.js';
import { initTimecode } from './timecode.js';

// intro.js expects GSAP on window
window.gsap = gsap;

// Path back to the site root from this page ('./' at /, '../' at /en/), set by the page template.
const ROOT = document.documentElement.dataset.root || './';
// UI strings for the current language (intro buttons, menu labels), baked into the page.
const UI = JSON.parse(document.getElementById('movo-i18n')?.textContent || '{}');

// ?debug: on-screen diagnostics (loaded only when asked for)
if (new URLSearchParams(location.search).has('debug')) import('./debug.js').then(m => m.initDebug());

// Hero and nav subscribe first: movo:intro-done is the only start signal, and when the intro is
// skipped it fires synchronously inside initMovoIntro.
initNav({ labels: UI.a11y });
initHero({ base: `${ROOT}video/hero/` });
initTimecode();

// Work (scene, strip/feed, player, ScrollTrigger), Services (tracks, playhead) and Studio (teaser, client
// band, footer styles) are separate chunks
// with their own CSS. Nothing of them — code, styles, posters, previews — loads before the visitor
// shows intent to scroll (or arrives scrolled / with a #hash), and never during the intro.
let workRequested = false;
const loadWork = () => {
  if (workRequested) return;
  workRequested = true;
  removeEventListener('scroll', onIntent);
  removeEventListener('wheel', onIntent);
  removeEventListener('touchmove', onIntent);
  removeEventListener('keydown', onKey);
  // Services and Studio (home previews) are their own small chunks, requested at the same moment.
  Promise.all([
    import('./work/index.js').then(m => m.initWork({ root: ROOT, ui: UI, preferMp4 })),
    import('./services/home.js').then(m => m.initServicesHome()),
    import('./studio/home.js').then(m => m.initStudioHome()),
  ]).then(() => {
    // A #hash to a section below the pinned scene: its position is only final now.
    const target = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && !target.matches('[data-work]')) target.scrollIntoView({ behavior: 'instant' });
  });
};
const onIntent = () => loadWork();
const onKey = e => { if (['ArrowDown', 'PageDown', ' ', 'End', 'Tab'].includes(e.key)) loadWork(); };
addEventListener('movo:intro-done', () => {
  if (scrollY > 0 || location.hash) return loadWork();
  addEventListener('scroll', onIntent, { passive: true });
  addEventListener('wheel', onIntent, { passive: true });
  addEventListener('touchmove', onIntent, { passive: true });
  addEventListener('keydown', onKey);
  document.querySelectorAll('.nav__links a[href^="#"]').forEach(a => a.addEventListener('click', loadWork));
}, { once: true });

// Decided in the inline <head> script (see INTRO_ON_TOUCH there).
const introState = document.documentElement.dataset.intro;

initMovoIntro({
  base: `${ROOT}video/intro/`,
  logoBase: `${ROOT}logo/`,
  mainSelector: 'main, .site-header',
  // not 'play': touch device, already seen, reduced motion or a deep link to a section (#hash)
  skip: introState !== 'play',
  labels: UI.intro,
  forceMp4: preferMp4,
});
