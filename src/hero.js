import { gsap } from 'gsap';

// One file per orientation. Nothing is in the HTML: a single src is assigned here, and only on
// movo:intro-done, so the loop never competes with first paint and a device never fetches two cuts.
const FILES = {
  landscape: { webm: 'movo-hero-1920x1080.webm', mp4: 'movo-hero-1920x1080.mp4', poster: 'movo-hero-poster.jpg' },
  portrait: { webm: 'movo-hero-mobile-720x1280.webm', mp4: 'movo-hero-mobile-720x1280.mp4', poster: 'movo-hero-mobile-poster.jpg' },
};

// Orientation, not width: iOS "Request desktop website" and some in-app browsers report ~980 px.
const portraitQuery = matchMedia('(orientation: portrait)');
export const isPortrait = () => portraitQuery.matches || innerHeight > innerWidth;

// All iOS browsers are WebKit, and Safari's WebM support is unreliable: use H.264 there.
const ua = navigator.userAgent;
const isIOS = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|Edg|Android/.test(ua);
export const preferMp4 = isIOS || isSafari;

// Where the animation sits in each cut, as a fraction of the rendered video height: in the vertical
// cut the ring ends at 48.6 %; the copy must stay below it (portrait) or below the navbar (landscape).
const RING_BOTTOM = 0.486;

// Fit the copy to the free area for any text or language (never enlarges): first the headline's longest
// word to the column width, then the whole block (CSS `scale`) to the free height. Runs before the copy
// is revealed, so there is no visible jump and no layout shift.
function fitCopy(content) {
  // 1) Width: a headline word that doesn't fit the column (e.g. "MOVIMIENTO.") can't wrap and would
  //    spill into the animation or off-screen. Shrink the title just enough for its longest word.
  const title = content.querySelector('.hero__title');
  if (title) {
    title.style.fontSize = '';
    const overflow = title.scrollWidth / title.clientWidth;
    if (overflow > 1.001) title.style.fontSize = `${(parseFloat(getComputedStyle(title).fontSize) / overflow) * 0.99}px`;
  }

  // 2) Height: the whole block must fit the free area (below the ring / between navbar and bottom).
  const hero = content.closest('.hero').getBoundingClientRect();
  const navBottom = document.querySelector('[data-site-header]')?.getBoundingClientRect().bottom ?? 0;
  content.style.scale = '';
  const r = content.getBoundingClientRect();
  let avail;
  if (isPortrait()) {
    // bottom-anchored (scales from its bottom-left corner): room between the ring and its bottom edge
    const videoH = Math.max(hero.height, (hero.width * 1920) / 1080);
    avail = r.bottom - (hero.top + RING_BOTTOM * videoH + 16);
  } else {
    // vertically centered (scales around its center): room above and below, whichever is tighter
    const center = r.top + r.height / 2;
    avail = 2 * Math.min(center - (navBottom + 12), hero.bottom - 8 - center);
  }
  const s = r.height > avail ? Math.max(0.6, avail / r.height) : 1;
  content.style.scale = s < 1 ? String(s) : '';
}

export function initHero({ base }) {
  const video = document.querySelector('[data-hero-video]');
  const reveal = document.querySelectorAll('[data-hero-reveal]');
  const content = document.querySelector('.hero__content');
  const fit = () => content && fitCopy(content);
  // Fit with the real font: wait for it (it is preloaded), but never more than 800 ms.
  const fontsReady = Promise.race([document.fonts?.ready ?? Promise.resolve(), new Promise(r => setTimeout(r, 800))]).then(fit);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!video) return;

  const canWebm = !preferMp4 && video.canPlayType('video/webm; codecs="vp9"') !== '';
  const state = (window.__movoHero = { file: '', orientation: '', format: preferMp4 ? 'mp4 (iOS/Safari)' : canWebm ? 'webm' : 'mp4', errors: [] });
  let started = false;

  const play = () => {
    const p = video.play();
    if (p) p.catch(err => state.errors.push(`play(): ${err.name}: ${err.message}`)); // e.g. Low Power Mode: poster stays
  };

  // Poster always follows orientation; the video src only exists once the hero has started.
  const select = () => {
    const orientation = isPortrait() ? 'portrait' : 'landscape';
    const set = FILES[orientation];
    const file = canWebm ? set.webm : set.mp4;
    if (orientation !== state.orientation) {
      state.orientation = orientation;
      video.poster = base + set.poster;
    }
    if (!started || reduce || file === state.file) return;
    state.file = file;
    video.preload = 'auto';
    assign(base + file);
  };

  const assign = src => {
    video.src = src;
    video.load();
    play();
  };

  video.addEventListener('error', () => {
    const e = video.error;
    state.errors.push(`video error ${e?.code ?? '?'}: ${e?.message || 'no message'} (${state.file})`);
  });

  select();
  fit();
  portraitQuery.addEventListener('change', () => { select(); fit(); });
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { select(); fit(); }, 150); });

  window.addEventListener(
    'movo:intro-done',
    () => {
      started = true;
      state.introDoneAt = performance.now();
      state.introLayerSeen = !!document.querySelector('#movo-intro');

      // Reduced motion: no autoplaying loop, the poster stands in for it.
      if (reduce) {
        gsap.set(video, { opacity: 1 });
        gsap.set(reveal, { opacity: 1 });
        return;
      }

      // When the intro is skipped this fires during boot: let the poster, font and CSS finish first.
      if (document.readyState === 'complete') select();
      else addEventListener('load', select, { once: true });
      gsap.to(video, { opacity: 1, duration: 1.2, ease: 'power1.out' });
      // The copy enters once it has been fitted with the real font (no visible jump).
      fontsReady.then(() =>
        gsap.fromTo(
          reveal,
          { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.09, delay: 0.15, clearProps: 'transform' },
        ),
      );
    },
    { once: true },
  );
}
