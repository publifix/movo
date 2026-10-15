import { gsap } from 'gsap';
import { initMovoIntro } from './intro/intro.js';
import { initNav } from './nav.js';
import { initHero } from './hero.js';

// intro.js expects GSAP on window
window.gsap = gsap;

const BASE = import.meta.env.BASE_URL;

// Hero and nav subscribe first: movo:intro-done is the only start signal, and on repeat
// visits / reduced motion it fires synchronously inside initMovoIntro.
initNav();
initHero({ base: `${BASE}video/hero/` });

initMovoIntro({
  base: `${BASE}video/intro/`,
  logoBase: `${BASE}logo/`,
  mainSelector: 'main, .site-header',
});
