import { gsap } from 'gsap';

// One file per orientation. Nothing is in the HTML: a single src is assigned here, and only on
// movo:intro-done, so the loop never competes with first paint and a device never fetches two cuts.
const FILES = {
  landscape: { webm: 'movo-hero-1920x1080.webm', mp4: 'movo-hero-1920x1080.mp4', poster: 'movo-hero-poster.jpg' },
  portrait: { webm: 'movo-hero-mobile-1080x1920.webm', mp4: 'movo-hero-mobile-1080x1920.mp4', poster: 'movo-hero-mobile-poster.jpg' },
};

// Orientation, not width: iOS "Request desktop website" and some in-app browsers report ~980 px.
const portraitQuery = matchMedia('(orientation: portrait)');
export const isPortrait = () => portraitQuery.matches || innerHeight > innerWidth;

// All iOS browsers are WebKit, and Safari's WebM support is unreliable: use H.264 there.
const ua = navigator.userAgent;
const isIOS = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
const isSafari = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|Edg|Android/.test(ua);
export const preferMp4 = isIOS || isSafari;

export function initHero({ base }) {
  const video = document.querySelector('[data-hero-video]');
  const reveal = document.querySelectorAll('[data-hero-reveal]');
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
    video.src = base + file;
    video.load();
    play();
  };

  video.addEventListener('error', () => {
    const e = video.error;
    state.errors.push(`video error ${e?.code ?? '?'}: ${e?.message || 'no message'} (${state.file})`);
  });

  select();
  portraitQuery.addEventListener('change', select);
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(select, 150); });

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
      gsap.fromTo(
        reveal,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.09, delay: 0.15, clearProps: 'transform' },
      );
    },
    { once: true },
  );
}
