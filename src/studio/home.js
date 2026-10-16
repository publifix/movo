// Studio teaser on the home: the headline takes its shape when it enters the screen (CSS transition of
// the variable font) and the client band starts its loop. Loaded on the first scroll intent.
import './home.css';
import { initMarquees } from './marquee.js';

export function initStudioHome() {
  const sec = document.querySelector('[data-studio-teaser]');
  if (!sec) return;
  initMarquees(sec);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = sec.getBoundingClientRect();
  if (r.top < innerHeight) return; // already on screen (deep link): no entrance
  sec.classList.add('is-waiting');
  const io = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    sec.classList.remove('is-waiting');
    io.disconnect();
  }, { rootMargin: '0px 0px -25% 0px' });
  io.observe(sec.querySelector('.stt__title'));
}
