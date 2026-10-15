import { gsap } from 'gsap';
import { initMovoIntro } from './intro/intro.js';
import { initNav } from './nav.js';
import { initHero, preferMp4 } from './hero.js';

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

// Decided in the inline <head> script (see INTRO_ON_TOUCH there).
const introState = document.documentElement.dataset.intro;

initMovoIntro({
  base: `${ROOT}video/intro/`,
  logoBase: `${ROOT}logo/`,
  mainSelector: 'main, .site-header',
  skip: introState === 'touch',
  labels: UI.intro,
  forceMp4: preferMp4,
});
