import { gsap } from 'gsap';
import { initMovoIntro } from './intro/intro.js';
import { initNav } from './nav.js';
import { initHero, preferMp4 } from './hero.js';

// intro.js expects GSAP on window
window.gsap = gsap;

const BASE = import.meta.env.BASE_URL;

// ?debug: on-screen diagnostics (loaded only when asked for)
if (new URLSearchParams(location.search).has('debug')) import('./debug.js').then(m => m.initDebug());

// Hero and nav subscribe first: movo:intro-done is the only start signal, and when the intro is
// skipped it fires synchronously inside initMovoIntro.
initNav();
initHero({ base: `${BASE}video/hero/` });

// Decided in the inline <head> script (see INTRO_ON_PHONE_PORTRAIT there).
const introState = document.documentElement.dataset.intro;

initMovoIntro({
  base: `${BASE}video/intro/`,
  logoBase: `${BASE}logo/`,
  mainSelector: 'main, .site-header',
  skip: introState === 'phone-portrait',
  forceMp4: preferMp4,
});
