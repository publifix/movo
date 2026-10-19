// Scene s02-cover (Story 02, act 2 "Chispa"; the story's cover): the overloaded screen empties — the blocks
// fall away — and one idea is left, in color; below it, the minute of an explainer is laid out: hook,
// problem, solution, close. 7 s. HyperFrames conventions: see s01-cover.js.
import { gsap } from 'gsap';

export const id = 's02-cover';
export const duration = 7;
const FPS = 24;
const pad = n => String(n).padStart(2, '0');

export function build(root) {
  const tc = root.querySelector('[data-scene-tc]');
  const blocks = root.querySelectorAll('[data-block]');
  const tl = gsap.timeline({ paused: true, onUpdate: () => { const f = Math.round(tl.time() * FPS); if (tc) tc.textContent = `00:00:${pad(Math.floor(f / FPS))}:${pad(f % FPS)}`; } });
  tl.fromTo(root, { '--t': 0 }, { '--t': 1, duration, ease: 'none' }, 0)
    .fromTo(blocks, { opacity: 1, y: 0 }, { opacity: 0, y: 40, duration: 0.7, stagger: { each: 0.07, from: 'random' }, ease: 'power2.in' }, 0.6)
    .fromTo(root, { '--idea': 0 }, { '--idea': 1, duration: 0.8, ease: 'back.out(1.8)' }, 2.4);
  ['--s0', '--s1', '--s2', '--s3'].forEach((v, i) => tl.fromTo(root, { [v]: 0 }, { [v]: 1, duration: 0.7, ease: 'power3.out' }, 3.5 + i * 0.4));
  tl.fromTo(root, { '--tk': 0 }, { '--tk': 1, duration: 0.6 }, 5.3);
  tl.set({}, {}, duration);
  (window.__timelines ||= {})[id] = tl;
  return tl;
}
