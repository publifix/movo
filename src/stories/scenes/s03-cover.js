// Scene s03-cover (Story 03, act 2 "Chispa"; the story's cover): the gray logo turns into outlines and its
// letters spread; then they come back one by one, filled with color, and keyframes appear on the tracks of
// an editing timeline below: the logo learned a behavior. 7 s. HyperFrames conventions: see s01-cover.js.
import { gsap } from 'gsap';

export const id = 's03-cover';
export const duration = 7;
const FPS = 24;
const pad = n => String(n).padStart(2, '0');

export function build(root) {
  const tc = root.querySelector('[data-scene-tc]');
  const letters = root.querySelectorAll('.s03-logo .lg-l');
  const tl = gsap.timeline({ paused: true, onUpdate: () => { const f = Math.round(tl.time() * FPS); if (tc) tc.textContent = `00:00:${pad(Math.floor(f / FPS))}:${pad(f % FPS)}`; } });
  tl.fromTo(root, { '--t': 0 }, { '--t': 1, duration, ease: 'none' }, 0)
    .fromTo(root, { '--fill': 1, '--spread': 0 }, { '--fill': 0, '--spread': 1, duration: 1.1, ease: 'power2.inOut' }, 0.5)
    .fromTo(letters, { yPercent: -70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, stagger: 0.11, ease: 'back.out(2)', immediateRender: false }, 1.8)
    .fromTo(root, { '--g': 1 }, { '--g': 0, duration: 1.2, ease: 'power1.inOut' }, 1.9)
    .to(root, { '--fill': 1, duration: 1, ease: 'power2.out' }, 2.6)
    .to(root, { '--spread': 0, duration: 1, ease: 'power3.inOut' }, 2.9)
    .fromTo(root, { '--kf': 0 }, { '--kf': 1, duration: 1.6, ease: 'power2.out' }, 3.9);
  tl.set({}, {}, duration);
  (window.__timelines ||= {})[id] = tl;
  return tl;
}
