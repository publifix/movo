// MOVO Stories teaser on the home (lazy, with Work / Services / Studio on the first scroll intent): the
// only horizontal frame of the home. The scene waits on its frame 0 (gray, frozen, 00:00:00:00); when 40 %
// of it is on screen it plays ONCE (6–8 s) and stays on the color cover. Off screen it pauses. No scroll
// control here (STORIES.md: never scroll-jacking on the home). Reduced motion: the final frame, static.
import './home.css';
import { mountScene } from './scenes/index.js';

export async function initStoriesHome() {
  const section = document.querySelector('[data-stories-teaser]');
  const root = section?.querySelector('[data-composition-id]');
  if (!root || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { tl } = (await mountScene(root)) || {};
  if (!tl) return;
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && e.intersectionRatio >= 0.4) tl.play();
    else tl.pause();
  }, { threshold: [0, 0.4] });
  tl.eventCallback('onComplete', () => io.disconnect());
  io.observe(root);
}
