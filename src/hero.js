import { gsap } from 'gsap';

// One file set per layout. The source is chosen here by width (not with <source media>)
// so a device never downloads both.
const MOBILE_QUERY = '(max-width: 767px) and (orientation: portrait)'; // keep in sync with main.css
const FILES = {
  desktop: { webm: 'movo-hero-1920x1080.webm', mp4: 'movo-hero-1920x1080.mp4', poster: 'movo-hero-poster.jpg' },
  mobile: {
    webm: 'movo-hero-mobile-1080x1920.webm',
    mp4: 'movo-hero-mobile-1080x1920.mp4',
    poster: 'movo-hero-mobile-poster.jpg',
  },
};

export function initHero({ base }) {
  const video = document.querySelector('[data-hero-video]');
  const reveal = document.querySelectorAll('[data-hero-reveal]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!video) return;
  let started = false;

  const setSources = set => {
    video.replaceChildren(
      Object.assign(document.createElement('source'), { src: base + set.webm, type: 'video/webm' }),
      Object.assign(document.createElement('source'), { src: base + set.mp4, type: 'video/mp4' }),
    );
    video.poster = base + set.poster;
  };

  const isMobile = matchMedia(MOBILE_QUERY).matches;
  setSources(isMobile ? FILES.mobile : FILES.desktop);

  // Safety net: if the vertical cut ever fails to load, fall back to the 16:9 loop.
  // The poster probe hits the cache (it is preloaded in <head>) and also covers reduced motion,
  // where the video itself never loads.
  if (isMobile) {
    let fellBack = false;
    const fallback = () => {
      if (fellBack) return;
      fellBack = true;
      setSources(FILES.desktop);
      if (video.preload === 'auto') video.load();
      if (started && !reduce) play();
    };
    video.lastElementChild.addEventListener('error', fallback, { once: true });
    const probe = new Image();
    probe.onerror = fallback;
    probe.src = base + FILES.mobile.poster;
  }

  // Buffer the loop while the intro plays (after the intro file itself has finished downloading).
  const warm = () => {
    if (video.preload === 'auto') return;
    video.preload = 'auto';
    video.load();
  };
  window.addEventListener('movo:intro-start', warm, { once: true });

  const play = () => {
    const p = video.play();
    if (p) p.catch(() => {}); // e.g. iOS Low Power Mode: the poster stays
  };

  window.addEventListener(
    'movo:intro-done',
    () => {
      started = true;

      // Reduced motion: no autoplaying loop, the poster stands in for it.
      if (reduce) {
        gsap.set(video, { opacity: 1 });
        gsap.set(reveal, { opacity: 1 });
        return;
      }

      warm();
      play();

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
